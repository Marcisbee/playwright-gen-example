.PHONY: prepare install test test-ci gen

VERSION := 1.49.1
PLAYWRIGHT := ./node_modules/.bin/playwright

prepare:
	HOMEBREW_NO_AUTO_UPDATE=1 brew install fnm
	fnm install 22
	fnm use 22
	node -v
	npm -v

install:prepare
	npm install playwright@$(VERSION) @playwright/test@$(VERSION)
	npx playwright install chromium

test:
	$(PLAYWRIGHT) test $(filter-out $@,$(MAKECMDGOALS))

gen:
	$(PLAYWRIGHT) codegen --target="playwright-test" $(filter-out $@,$(MAKECMDGOALS))

%:
	@: