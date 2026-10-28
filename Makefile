.PHONY: install dev doctor build test android
install:
	python3 -m venv .venv
	.venv/bin/python -m pip install -r requirements.txt
	cd app && npm ci --no-audit --no-fund
dev:
	.venv/bin/python tools/dev.py
doctor:
	.venv/bin/python tools/doctor.py
build:
	cd app && npm run build
test:
	.venv/bin/python tools/verify.py
android:
	cd app && npm run build:android
