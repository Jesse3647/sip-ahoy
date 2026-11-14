"""Refresh the official fleet artwork recorded in src/data/ship-artwork.json."""
import concurrent.futures
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "ships"
DEST.mkdir(exist_ok=True)
artwork = json.loads((ROOT / "src/data/ship-artwork.json").read_text())

def download(item):
    name, art = item
    url = art["source"].split("?")[0] + "?wid=800&hei=600&fit=crop,1&fmt=webp&qlt=78"
    path = DEST / art["file"]
    subprocess.run(["curl", "-sS", "-L", "--fail", "--retry", "2", "--max-time", "40", url, "-o", str(path)], check=True)
    content = path.read_bytes()
    if content[:4] != b"RIFF" or content[8:12] != b"WEBP":
        raise ValueError(f"Unexpected image format: {name}")
    return f"{name}: {len(content):,} bytes"

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    for result in pool.map(download, artwork.items()):
        print(result)
