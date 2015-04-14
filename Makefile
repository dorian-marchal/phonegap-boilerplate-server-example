# Prepare the repo to start developing
install-dev:
	./dev-scripts/install-dev

install:
	cd core
	npm install
	cd ..

.PHONY: install-dev install
