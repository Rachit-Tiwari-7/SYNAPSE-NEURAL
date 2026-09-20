# ==============================================================================
# Synapse-OS Automated Test Suite Runner (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Continue"
$OverallExitCode = 0

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          SYNAPSE-OS CLINICAL AGENT SWARM TEST RUNNER (POWERSHELL)    " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Step 1: Syntax Compilation Audit
Write-Host "`n[1/4] Running Python Syntax & Bytecode Compilation Check..." -ForegroundColor Yellow
python -m compileall backend whatsapp_service -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] All backend and service Python modules compiled successfully." -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Python syntax errors detected." -ForegroundColor Red
    $OverallExitCode = 1
}

# Step 2: Full Clinical Pytest Suite
Write-Host "`n[2/4] Executing Full Pytest Suite (190+ Tests)..." -ForegroundColor Yellow
pytest backend/tests -v --tb=short
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] All backend and clinical test cases passed." -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Pytest suite reported failures." -ForegroundColor Red
    $OverallExitCode = 1
}

# Step 3: Life-Safety Invariant Regressions
Write-Host "`n[3/4] Verifying Clinical Life-Safety Invariants..." -ForegroundColor Yellow
pytest backend/tests/test_pediatric_and_clinical_safety.py backend/tests/test_whatsapp_service.py -k "safety or pediatric or emergency or bypass" -v --tb=short
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] Life-safety emergency bypass and pediatric safeguards intact." -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Critical safety invariant failed!" -ForegroundColor Red
    $OverallExitCode = 1
}

# Step 4: Docker Compose Configuration Validation
Write-Host "`n[4/4] Validating Docker Compose Orchestration Config..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    $tempEnv = $false
    if (-not (Test-Path .env) -and (Test-Path .env.example)) {
        Copy-Item .env.example .env
        $tempEnv = $true
    }

    docker compose config | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] docker-compose.yml configuration is valid." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] docker compose config validation encountered issues." -ForegroundColor Yellow
    }

    if ($tempEnv -and (Test-Path .env)) {
        Remove-Item .env -Force
    }
} else {
    Write-Host "  [SKIP] Docker command not found in PATH; skipping compose verification." -ForegroundColor Gray
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
if ($OverallExitCode -eq 0) {
    Write-Host "  [RESULT] ALL TEST SUITES PASSED SUCCESSFULLY (READY FOR CI/CD)" -ForegroundColor Green
} else {
    Write-Host "  [RESULT] TEST RUNNER REPORTED FAILURES (DO NOT DEPLOY)" -ForegroundColor Red
}
Write-Host "======================================================================" -ForegroundColor Cyan

exit $OverallExitCode
