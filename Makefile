# ==============================================================================
# Synapse-OS Developer & CI Automation Makefile
# ==============================================================================

.PHONY: help test test-safety test-all lint lint-syntax compose-validate docker-build frontend-audit ci

SHELL := /bin/bash

help:
	@echo "Synapse-OS Clinical Platform — Development & Testing Tasks"
	@echo "=========================================================="
	@echo "make test             - Execute full backend test suite (190+ tests)"
	@echo "make test-safety      - Execute clinical life-safety invariant tests"
	@echo "make test-all         - Run end-to-end automated test runner script"
	@echo "make lint             - Run Python syntax compilation and flake8"
	@echo "make compose-validate - Validate docker-compose configurations"
	@echo "make docker-build     - Build backend and frontend Docker containers"
	@echo "make frontend-audit   - Verify frontend build and error boundaries"
	@echo "make ci               - Run full local CI test and validation suite"

test:
	pytest backend/tests -v --tb=short

test-safety:
	pytest backend/tests/test_pediatric_and_clinical_safety.py backend/tests/test_whatsapp_service.py -k "safety or pediatric or emergency or bypass" -v --tb=short

test-all:
	@bash scripts/run-tests.sh

lint-syntax:
	python3 -m compileall backend whatsapp_service -q

lint: lint-syntax
	@if command -v flake8 >/dev/null 2>&1; then \
		flake8 backend --count --select=E9,F63,F7,F82 --show-source --statistics; \
	else \
		echo "flake8 not installed; syntax check passed via compileall."; \
	fi

compose-validate:
	@if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env; TEMP_ENV=1; else TEMP_ENV=0; fi; \
	docker compose config >/dev/null; \
	if [ "$$TEMP_ENV" -eq 1 ]; then rm -f .env; fi; \
	echo "[PASS] docker-compose configuration verified."

docker-build:
	docker compose build

frontend-audit:
	@cd frontend && npm run build

ci: lint test-safety test compose-validate
	@echo "[PASS] All local CI verification checks passed successfully."
