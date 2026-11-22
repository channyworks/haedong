"""Validate and optionally stage the public HAEDONG Pages files."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
from shutil import copyfile
from urllib.parse import urljoin, urlsplit


ROOT = Path(__file__).resolve().parents[1] / "scenario-preview"
PUBLIC_FILES = ("index.html", "style.css", "data.js", "coastline.js", "simulation.js", "app.js")
BASE = "https://example.invalid/haedong/"


class PreviewDocument(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = set()
        self.has_viewport = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name") == "viewport":
            self.has_viewport = True
        if tag == "base":
            raise ValueError("A base element can change project Pages URL resolution")
        for attribute in ("src", "href", "poster"):
            value = attrs.get(attribute)
            if not value or value.startswith("#"):
                continue
            ref = urlsplit(value)
            if tag == "a" and ref.scheme == "https" and ref.netloc:
                continue
            if ref.scheme or ref.netloc or value.startswith("/"):
                raise ValueError(f"Expected a relative asset reference: {value}")
            path = urlsplit(urljoin(BASE, value)).path
            if not path.startswith("/haedong/"):
                raise ValueError(f"Asset escapes the Pages project prefix: {value}")
            self.assets.add(path.removeprefix("/haedong/"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="New directory for the Pages artifact")
    args = parser.parse_args()

    document = PreviewDocument()
    document.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    if not document.has_viewport or document.assets != set(PUBLIC_FILES) - {"index.html"}:
        raise SystemExit("Unexpected entry-page dependencies or missing viewport")
    for name in PUBLIC_FILES:
        path = ROOT / name
        if not path.is_file() or path.is_symlink() or path.stat().st_size == 0:
            raise SystemExit(f"Missing or invalid public file: {name}")
    if args.output:
        args.output.mkdir(parents=True)
        for name in PUBLIC_FILES:
            copyfile(ROOT / name, args.output / name)
    print("Verified " + ", ".join(PUBLIC_FILES))


if __name__ == "__main__":
    main()
