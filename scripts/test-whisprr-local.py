#!/usr/bin/env python3
"""End-to-end smoke tests for local WHISPRR Supabase services."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request

REPO = Path(__file__).resolve().parents[1]


def request(
    url: str,
    *,
    method: str = "GET",
    key: str,
    bearer: str | None = None,
    payload: dict | None = None,
):
    body = json.dumps(payload).encode() if payload is not None else None
    call = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {bearer or key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(call, timeout=30) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        raw = error.read()
        return error.code, json.loads(raw or b"{}")


def main() -> None:
    status = json.loads(
        subprocess.check_output(["supabase", "status", "-o", "json"], cwd=REPO, text=True)
    )
    api = status["API_URL"]
    if api != "http://127.0.0.1:54321":
        raise SystemExit(f"Refusing non-local API: {api}")

    migration_count = subprocess.check_output(
        [
            "docker", "exec", "supabase_db_whisprr-local", "psql", "-U", "postgres",
            "-d", "postgres", "-Atc", "select count(*) from supabase_migrations.schema_migrations",
        ], text=True,
    ).strip()
    if int(migration_count) < 81:
        raise RuntimeError(f"Expected at least 81 migrations, found {migration_count}")

    code, profiles = request(
        f"{api}/rest/v1/profiles?select=id&limit=1", key=status["SERVICE_ROLE_KEY"]
    )
    if code != 200 or not isinstance(profiles, list):
        raise RuntimeError(f"REST/database test failed: {code} {profiles}")

    email = f"local-smoke-{int(time.time())}@example.test"
    password = "Local-only-test-42!"
    code, signup = request(
        f"{api}/auth/v1/signup", method="POST", key=status["ANON_KEY"],
        payload={"email": email, "password": password},
    )
    if code not in (200, 201) or not signup.get("user", {}).get("id"):
        raise RuntimeError(f"Auth signup test failed: {code} {signup}")
    user_id = signup["user"]["id"]
    code, login = request(
        f"{api}/auth/v1/token?grant_type=password", method="POST", key=status["ANON_KEY"],
        payload={"email": email, "password": password},
    )
    if code != 200 or not login.get("access_token"):
        raise RuntimeError(f"Auth login test failed: {code} {login}")

    code, feed = request(
        (
            f"{api}/rest/v1/whispers"
            "?select=*,profiles:user_id(id,user_id,display_name,username,photo_url,bio,badges),"
            "reactions(id,whisper_id,user_id,type,created_at)"
            "&parent_id=is.null&order=created_at.desc&limit=20"
        ),
        key=status["ANON_KEY"],
        bearer=login["access_token"],
    )
    if code != 200 or not isinstance(feed, list):
        raise RuntimeError(f"Authenticated WHISPRR feed test failed: {code} {feed}")

    code, buckets = request(
        f"{api}/storage/v1/bucket", key=status["SERVICE_ROLE_KEY"]
    )
    if code != 200 or len(buckets) < 6:
        raise RuntimeError(f"Storage test failed: {code} {buckets}")

    code, function_result = request(
        f"{api}/functions/v1/summarize-thread", method="POST", key=status["ANON_KEY"],
        payload={"threadId": "local-smoke", "messages": [{"body": "hello"}]},
    )
    if code != 500 or function_result.get("error") != "OPENAI_API_KEY is required":
        raise RuntimeError(f"Edge Function routing test failed: {code} {function_result}")

    code, _ = request(
        f"{api}/auth/v1/admin/users/{user_id}", method="DELETE", key=status["SERVICE_ROLE_KEY"]
    )
    if code == 500:
        # Existing WHISPRR wallet/ledger FKs block Auth's deletion order. Clean
        # only this disposable local smoke user, then retry the public Auth path.
        if not all(character in "0123456789abcdef-" for character in user_id.lower()):
            raise RuntimeError("Auth returned an invalid local test user id")
        cleanup_sql = (
            f"delete from public.shards_ledger where wallet_user_id = '{user_id}'::uuid;"
            f"delete from public.vellum_ledger where wallet_user_id = '{user_id}'::uuid;"
        )
        subprocess.run(
            [
                "docker", "exec", "-e", "PGPASSWORD=postgres",
                "supabase_db_whisprr-local", "psql", "-h", "127.0.0.1",
                "-v", "ON_ERROR_STOP=1", "-U", "supabase_admin", "-d", "postgres",
                "-c", cleanup_sql,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        code, _ = request(
            f"{api}/auth/v1/admin/users/{user_id}",
            method="DELETE",
            key=status["SERVICE_ROLE_KEY"],
        )
    if code not in (200, 204):
        raise RuntimeError(f"Local test-user cleanup failed: HTTP {code}")

    print("PASS database/rest")
    print("PASS auth signup and login")
    print("PASS authenticated WHISPRR feed query")
    print("PASS storage service and restored buckets")
    print("PASS edge function routing (secret intentionally absent)")
    print("PASS production-link safety guard")


if __name__ == "__main__":
    main()
