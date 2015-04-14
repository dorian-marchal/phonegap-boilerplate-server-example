# Prepare the repo to start developing
install-dev:
	./dev-scripts/install-dev

install:
	cd core && npm install

.PHONY: install-dev install
