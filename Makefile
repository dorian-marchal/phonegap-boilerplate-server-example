# Prepare the repo to start developing
install-dev: install
	npm install
	./dev-scripts/install-dev

install:
	cd core && npm install
	@echo "Don't forget to create the config file :"
	@echo "- cp config.js.default config.js"

.PHONY: install-dev install
