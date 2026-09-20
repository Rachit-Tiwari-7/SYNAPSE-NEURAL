#!/usr/bin/env bash
# ==============================================================================
# Synapse-OS Automated Test Suite Runner (POSIX / Linux / macOS)
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "          SYNAPSE-OS CLINICAL AGENT SWARM TEST RUNNER                 "
echo "======================================================================"

EXIT_CODE=0

# Step 1: Syntax Compilation Audit
echo -e "\n[1/4] Running Python Syntax & Bytecode Compilation Check..."
if python3 -m compileall backend whatsapp_service -q; then
    echo "  [PASS] All backend and service Python modules compiled successfully."
else
    echo "  [FAIL] Python syntax errors detected."
    EXIT_CODE=1
fi

# Step 2: Full Clinical Pytest Suite
echo -e "\n[2/4] Executing Full Pytest Suite (190+ Tests)..."
if pytest backend/tests -v --tb=short; then
    echo "  [PASS] All backend and clinical test cases passed."
else
    echo "  [FAIL] Pytest suite reported failures."
    EXIT_CODE=1
fi

# Step 3: Life-Safety Invariant Regressions
echo -e "\n[3/4] Verifying Clinical Life-Safety Invariants..."
if pytest backend/tests/test_pediatric_and_clinical_safety.py backend/tests/test_whatsapp_service.py -k "safety or pediatric or emergency or bypass" -v --tb=short; then
    echo "  [PASS] Life-safety emergency bypass and pediatric safeguards intact."
else
    echo "  [FAIL] Critical safety invariant failed!"
    EXIT_CODE=1
fi

# Step 4: Docker Compose Configuration Validation
echo -e "\n[4/4] Validating Docker Compose Orchestration Config..."
if command -v docker >/dev/null 2>&1; then
    if [ ! -f .env ] && [ -f .env.example ]; then
        cp .env.example .env
        TEMP_ENV=1
    else
        TEMP_ENV=0
    fi

    if docker compose config >/dev/null 2>&1; then
        echo "  [PASS] docker-compose.yml configuration is valid."
    else
        echo "  [WARN] docker compose config validation encountered issues."
    fi

    if [ "${TEMP_ENV}" -eq 1 ]; then
        rm -f .env
    fi
else
    echo "  [SKIP] Docker command not found in PATH; skipping compose verification."
fi

echo -e "\n======================================================================"
if [ "${EXIT_CODE}" -eq 0 ]; then
    echo "  [RESULT] ALL TEST SUITES PASSED SUCCESSFULLY (READY FOR CI/CD)"
else
    echo "  [RESULT] TEST RUNNER REPORTED FAILURES (DO NOT DEPLOY)"
fi
echo "======================================================================"

exit ${EXIT_CODE}
