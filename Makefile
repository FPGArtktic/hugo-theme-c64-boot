# Everything here is optional. `hugo` on its own builds the site; this file is
# for running the same checks locally that CI runs, so working offline never
# means working unverified.

HUGO ?= hugo
SITE := exampleSite
PUBLIC := $(SITE)/public

.POSIX:
.PHONY: all serve build check guard contrast links lint axe shots clean

all: check

serve:
	$(HUGO) server --source $(SITE) --themesDir ../.. --buildDrafts

build:
	$(HUGO) --source $(SITE) --themesDir ../.. --gc --minify --panicOnWarning

# Font integrity, and the promise that nothing is fetched from off-origin.
guard: build
	sha256sum -c fonts.sha256
	@echo "checking for external requests"
	@! grep -rEoh 'https?://[^"'"'"' )]+' $(PUBLIC) \
		| grep -vE 'www\.w3\.org|www\.sitemaps\.org|purl\.org' \
		| grep -vFf external-allowlist.txt \
		| sort -u | grep . || \
		{ echo "unexpected external reference above"; exit 1; }

contrast:
	python3 scripts/contrast.py

# Offline, and no dependency: a theme that promises to make no external
# request has no business shipping a link checker that makes one.
links: build
	python3 scripts/links.py $(PUBLIC)

# Dev tooling only: fetched on demand, never installed into the repository.
lint: build
	npx --yes stylelint "assets/css/*.css"
	npx --yes eslint assets/js scripts --no-warn-ignored
	npx --yes prettier --check "assets/js/**/*.js" "scripts/*.mjs" "assets/css/*.css" "*.json" "*.mjs"
	npx --yes html-validate "$(PUBLIC)/**/*.html"

# Needs a browser, so it is not in `make check`. Install the tools anywhere:
#   npm install --prefix /tmp/axe playwright @axe-core/playwright
#   npx --prefix /tmp/axe playwright install chromium
#   AXE_MODULES=/tmp/axe/node_modules make axe
axe: build
	node scripts/axe.mjs $(PUBLIC)
	node scripts/axe.mjs $(PUBLIC) --reduced-motion

check: guard contrast links lint
	@echo "all checks passed"

shots:
	sh scripts/screenshots.sh

clean:
	rm -rf $(PUBLIC) $(SITE)/resources public resources
