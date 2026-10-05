# Everything here is optional. `hugo` on its own builds the site; this file is
# for running the same checks locally that CI runs, so working offline never
# means working unverified.

HUGO ?= hugo
SITE := exampleSite
PUBLIC := $(SITE)/public

.POSIX:
.PHONY: all serve build check guard contrast lint shots clean

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

# Dev tooling only: fetched on demand, never installed into the repository.
lint: build
	npx --yes stylelint "assets/css/*.css"
	npx --yes eslint assets/js --no-warn-ignored
	npx --yes prettier --check "assets/js/**/*.js" "assets/css/*.css" "*.json" "*.mjs"
	npx --yes html-validate "$(PUBLIC)/**/*.html"

check: guard contrast lint
	@echo "all checks passed"

shots:
	sh scripts/screenshots.sh

clean:
	rm -rf $(PUBLIC) $(SITE)/resources public resources
