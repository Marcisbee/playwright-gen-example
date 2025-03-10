.PHONY: prepare install test test-ci gen

VERSION := 1.49.1
PLAYWRIGHT := ./node_modules/.bin/playwright

prepare:
	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	eval "$(/opt/homebrew/bin/brew shellenv)"
	curl -o- https://fnm.vercel.app/install | bash
	eval "$(fnm env --use-on-cd --shell zsh)"
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
