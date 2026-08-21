#!/usr/bin/env python3
"""Restore the verified WHISPRR backup into local Supabase only."""

from __future__ import annotations

import json
import mimetypes
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.parse
import urllib.request

REPO = Path(__file__).resolve().parents[1]
DEFAULT_BACKUP = (
    Path.home()
    / "Documents/WHISPRR-BACKUP/2026-08-21-gcknzlnumcryvqjvjnyg"
)
LOCAL_DATA = REPO / "supabase/.local/backup/data.local.sql"
DB_CONTAINER = "supabase_db_whisprr-local"


def run(command: list[str], *, stdin: Path | None = None) -> None:
    with stdin.open("rb") if stdin else open(os.devnull, "rb") as source:
        subprocess.run(command, cwd=REPO, stdin=source if stdin else None, check=True)


def local_status() -> dict[str, str]:
    raw = subprocess.check_output(
        ["supabase", "status", "-o", "json"], cwd=REPO, text=True
    )
    status = json.loads(raw)
    if not re.fullmatch(r"http://(?:127\.0\.0\.1|localhost):54321", status["API_URL"]):
        raise SystemExit(f"Refusing non-local Supabase URL: {status['API_URL']}")
    return status


def normalize_data(source: Path, target: Path) -> None:
    # Managed Storage columns differ between hosted and current local versions.
    remove = {
        ("storage", "buckets"): {"versioning_status"},
        ("storage", "objects"): {"archived_at", "is_delete_marker", "is_versioned"},
    }
    lines = source.read_text().splitlines(keepends=True)
    output: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        match = re.match(
            r'^COPY "([^"]+)"\."([^"]+)" \((.*)\) FROM stdin;\n?$', line
        )
        if match and (match.group(1), match.group(2)) in remove:
            schema, table, raw_columns = match.groups()
            columns = re.findall(r'"([^"]+)"', raw_columns)
            keep = [
                position
                for position, column in enumerate(columns)
                if column not in remove[(schema, table)]
            ]
            kept_columns = [columns[position] for position in keep]
            output.append(
                f'COPY "{schema}"."{table}" ('
                + ", ".join(f'"{column}"' for column in kept_columns)
                + ") FROM stdin;\n"
            )
            index += 1
            while index < len(lines) and lines[index].rstrip("\n") != r"\.":
                values = lines[index].rstrip("\n").split("\t")
                if len(values) != len(columns):
                    raise RuntimeError(f"Unexpected field count in {schema}.{table}")
                output.append("\t".join(values[position] for position in keep) + "\n")
                index += 1
            output.append(lines[index])
            index += 1
            continue
        output.append(line)
        index += 1
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("".join(output))
    target.chmod(0o600)


def copy_targets(data_file: Path) -> list[str]:
    return re.findall(
        r'^COPY ("[^"]+"\."[^"]+") ', data_file.read_text(), re.MULTILINE
    )


def restore_database(data_file: Path) -> None:
    run(["supabase", "db", "reset", "--local", "--no-seed"])
    targets = copy_targets(data_file)
    truncate_sql = "BEGIN;\nTRUNCATE TABLE " + ",\n".join(targets) + " CASCADE;\nCOMMIT;\n"
    subprocess.run(
        [
            "docker", "exec", "-e", "PGPASSWORD=postgres", "-i", DB_CONTAINER,
            "psql", "-h", "127.0.0.1", "-v", "ON_ERROR_STOP=1",
            "-U", "supabase_admin", "-d", "postgres",
        ],
        cwd=REPO,
        input=truncate_sql.encode(),
        check=True,
    )
    run(
        [
            "docker", "exec", "-e", "PGPASSWORD=postgres", "-i", DB_CONTAINER,
            "psql", "-h", "127.0.0.1", "-v", "ON_ERROR_STOP=1",
            "-U", "supabase_admin", "-d", "postgres",
        ],
        stdin=data_file,
    )


def restore_storage(storage_root: Path, status: dict[str, str]) -> int:
    api_url = status["API_URL"].rstrip("/")
    service_key = status["SERVICE_ROLE_KEY"]
    count = 0
    for path in sorted(item for item in storage_root.rglob("*") if item.is_file()):
        relative = path.relative_to(storage_root)
        bucket = relative.parts[0]
        object_name = "/".join(relative.parts[1:])
        url = (
            f"{api_url}/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/"
            f"{urllib.parse.quote(object_name, safe='/')}"
        )
        request = urllib.request.Request(
            url,
            data=path.read_bytes(),
            method="POST",
            headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "x-upsert": "true",
                "Content-Type": mimetypes.guess_type(path.name)[0]
                or "application/octet-stream",
            },
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status not in (200, 201):
                raise RuntimeError(f"Storage upload failed for {relative}")
        count += 1
    return count


def main() -> None:
    if (REPO / "supabase/.temp/project-ref").exists():
        raise SystemExit("Refusing restore: checkout is linked to a hosted project.")
    supplied = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    backup = Path(supplied).expanduser().resolve() if supplied else DEFAULT_BACKUP
    required = [backup / "data.sql", backup / "storage-objects", backup / "CHECKSUMS.sha256"]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise SystemExit("Backup is incomplete: " + ", ".join(missing))

    normalize_data(backup / "data.sql", LOCAL_DATA)
    local_status()
    restore_database(LOCAL_DATA)
    status = local_status()
    uploaded = restore_storage(backup / "storage-objects", status)
    print(f"Local WHISPRR backup restored; uploaded {uploaded} Storage objects.")


if __name__ == "__main__":
    # Check checksums from inside the backup directory without changing repository state.
    original_cwd = Path.cwd()
    try:
        supplied = sys.argv[1].strip() if len(sys.argv) > 1 else ""
        checksum_root = Path(supplied).expanduser().resolve() if supplied else DEFAULT_BACKUP
        os.chdir(checksum_root)
        subprocess.run(["shasum", "-a", "256", "-c", "CHECKSUMS.sha256"], check=True)
    finally:
        os.chdir(original_cwd)
    main()
