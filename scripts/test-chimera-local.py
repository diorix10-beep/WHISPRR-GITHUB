#!/usr/bin/env python3
"""End-to-end smoke tests for CHIMERA against local Supabase only."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = Path(__file__).resolve().parents[1]


def request(url: str, *, method: str = "GET", key: str, bearer: str | None = None, payload: dict | None = None):
    body = json.dumps(payload).encode() if payload is not None else None
    call = urllib.request.Request(url, data=body, method=method, headers={
        "apikey": key,
        "Authorization": f"Bearer {bearer or key}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(call, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw or b"{}")
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b"{}")


def cleanup_user(api: str, service_key: str, user_id: str) -> None:
    code, _ = request(f"{api}/auth/v1/admin/users/{user_id}", method="DELETE", key=service_key)
    if code == 500:
        if not all(character in "0123456789abcdef-" for character in user_id.lower()):
            raise RuntimeError("Auth returned an invalid local test user id")
        sql = (
            f"delete from public.shards_ledger where wallet_user_id = '{user_id}'::uuid;"
            f"delete from public.vellum_ledger where wallet_user_id = '{user_id}'::uuid;"
        )
        subprocess.run([
            "docker", "exec", "-e", "PGPASSWORD=postgres", "supabase_db_whisprr-local",
            "psql", "-h", "127.0.0.1", "-v", "ON_ERROR_STOP=1", "-U", "supabase_admin",
            "-d", "postgres", "-c", sql,
        ], check=True, stdout=subprocess.DEVNULL)
        code, _ = request(f"{api}/auth/v1/admin/users/{user_id}", method="DELETE", key=service_key)
    if code not in (200, 204):
        raise RuntimeError(f"Local test-user cleanup failed: HTTP {code}")


def main() -> None:
    status = json.loads(subprocess.check_output(["supabase", "status", "-o", "json"], cwd=REPO, text=True))
    api = status["API_URL"]
    if api != "http://127.0.0.1:54321":
        raise SystemExit(f"Refusing non-local API: {api}")

    email = f"chimera-local-smoke-{int(time.time())}@example.test"
    password = "Local-only-test-42!"
    code, signup = request(f"{api}/auth/v1/signup", method="POST", key=status["ANON_KEY"], payload={
        "email": email,
        "password": password,
        "data": {"access_level": "ecosystem", "legal_accepted_version": "2026-07-09-v1"},
    })
    if code not in (200, 201) or not signup.get("user", {}).get("id"):
        raise RuntimeError(f"Auth signup test failed: {code} {signup}")
    user_id = signup["user"]["id"]

    try:
        code, login = request(
            f"{api}/auth/v1/token?grant_type=password", method="POST", key=status["ANON_KEY"],
            payload={"email": email, "password": password},
        )
        if code != 200 or not login.get("access_token"):
            raise RuntimeError(f"Auth login test failed: {code} {login}")
        token = login["access_token"]

        queries = {
            "profile": f"profiles?select=user_id,display_name,username&user_id=eq.{user_id}",
            "preferences": f"chimera_user_preferences?select=user_id,default_ai_model,chimera_onboarding_complete&user_id=eq.{user_id}",
            "characters": "ai_characters?select=id,creator_id&limit=5",
            "stories": "stories?select=id,user_id&limit=5",
            "worlds": "worlds?select=id,user_id&limit=5",
            "personas": f"personas?select=id,user_id&user_id=eq.{user_id}&limit=5",
            "lorebooks": f"lorebooks?select=id,user_id&user_id=eq.{user_id}&limit=5",
        }
        for name, query in queries.items():
            code, data = request(f"{api}/rest/v1/{query}", key=status["ANON_KEY"], bearer=token)
            if code != 200 or not isinstance(data, list):
                raise RuntimeError(f"CHIMERA {name} query failed: {code} {data}")

        for function in ("get_my_shards_wallet", "get_my_vellum_wallet"):
            code, data = request(
                f"{api}/rest/v1/rpc/{function}", method="POST", key=status["ANON_KEY"], bearer=token, payload={},
            )
            if code != 200 or not isinstance(data, list):
                raise RuntimeError(f"CHIMERA RPC {function} failed: {code} {data}")

        code, buckets = request(f"{api}/storage/v1/bucket", key=status["SERVICE_ROLE_KEY"])
        if code != 200 or not isinstance(buckets, list) or len(buckets) < 6:
            raise RuntimeError(f"Storage test failed: {code} {buckets}")
    finally:
        cleanup_user(api, status["SERVICE_ROLE_KEY"], user_id)

    print("PASS local CHIMERA Auth signup and login")
    print("PASS startup profile and preferences queries")
    print("PASS character, story, world, persona, and lorebook queries")
    print("PASS local SHARDS and VELLUM wallet RPCs")
    print("PASS restored local Storage buckets")
    print("PASS production-link safety guard")


if __name__ == "__main__":
    main()
