#!/usr/bin/env python3
"""Check every internal link in the built site, without a network.

    python3 scripts/links.py exampleSite/public

A theme that promises to make no external request has no business shipping a
link checker that does. External links are listed and left alone; internal
ones must resolve to a file that was actually published, and every fragment
must match an id on the page it points at.

No dependencies: it is the same check in CI and on a laptop with no network,
which is the point of `make check`.
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urldefrag, urljoin

# Attributes that address another document or asset.
ATTRS = {"href", "src", "poster", "data"}
EXTERNAL = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//)", re.IGNORECASE)
SKIP_SCHEMES = ("mailto:", "tel:", "data:", "javascript:")


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        got = dict(attrs)
        if got.get("id"):
            self.ids.add(got["id"])
        if tag == "a" and got.get("name"):
            self.ids.add(got["name"])
        for attr in ATTRS:
            value = got.get(attr)
            if value:
                self.links.append(value.strip())
        # srcset holds several URLs with descriptors.
        for candidate in (got.get("srcset") or "").split(","):
            url = candidate.strip().split(" ")[0]
            if url:
                self.links.append(url)


def load(root: Path) -> dict[Path, Page]:
    pages = {}
    for path in sorted(root.rglob("*.html")):
        page = Page()
        page.feed(path.read_text(encoding="utf-8", errors="replace"))
        pages[path] = page
    return pages


def target(root: Path, path: Path, url: str) -> Path | None:
    """Resolve a site-relative or document-relative URL to a published file."""
    if url.startswith("/"):
        local = root / unquote(url).lstrip("/")
    else:
        base = f"/{path.parent.relative_to(root).as_posix()}/".replace("//", "/")
        local = root / unquote(urljoin(base, url)).lstrip("/")
    if local.is_dir():
        local = local / "index.html"
    return local


def main(argv: list[str]) -> int:
    root = Path(argv[1] if len(argv) > 1 else "exampleSite/public").resolve()
    if not root.is_dir():
        print(f"links: {root} is not a directory", file=sys.stderr)
        return 2

    pages = load(root)
    ids = {path: page.ids for path, page in pages.items()}
    external: set[str] = set()
    broken: list[str] = []

    for path, page in pages.items():
        where = path.relative_to(root)
        for url in page.links:
            if url.startswith("#"):
                fragment = unquote(url[1:])
                if fragment and fragment not in page.ids:
                    broken.append(f"{where}: no id {url}")
                continue
            if url.lower().startswith(SKIP_SCHEMES):
                continue
            if EXTERNAL.match(url):
                external.add(url.split("?")[0])
                continue
            bare, fragment = urldefrag(url)
            if not bare:
                continue
            local = target(root, path, bare)
            if local is None or not local.is_file():
                broken.append(f"{where}: {url}")
                continue
            if fragment and fragment not in ids.get(local, set()):
                broken.append(f"{where}: {url} (no id on target)")

    print(f"{len(pages)} pages, {len(external)} distinct external links, left alone")
    for url in sorted(external):
        print(f"  external  {url}")
    if broken:
        print(f"\n{len(broken)} broken internal link(s):", file=sys.stderr)
        for item in broken:
            print(f"  {item}", file=sys.stderr)
        return 1
    print("no broken internal links")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
