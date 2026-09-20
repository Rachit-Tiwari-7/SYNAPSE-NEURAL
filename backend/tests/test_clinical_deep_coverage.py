"""
SynapseOS — backend/tests/test_clinical_deep_coverage.py
Deep Clinical Coverage, Quantitative Disease Modeling, and Agentic Safety Suite.
Adds exhaustive testing for ML diagnostics, Digital Twin organ vitality, FHIR R4 compliance,
MoHFW clinical guidelines retrieval, and emergency edge cases.
"""

import math
import re
import pytest
from backend.app.ml.diagnostics import DiagnosticRiskRequest, calculate_clinical_risks
from backend.app.ml.digital_twin import (
    DigitalTwinInput,
    compute_baseline_organ_scores,
    simulate_10_year_trajectory,
    get_organ_health_color
)
from backend.app.core.safety_router import evaluate_safety, is_pediatric_query
from backend.app.agents.retrieval_agent import hybrid_retrieve_clinical_context, CURATED_GUIDELINES_INDEX
from backend.app.agents.appointment_agent import find_doctors_by_specialty, book_appointment_slot
from backend.app.services.abdm_service import generate_abha_id, check_ayushman_bharat_schemes
from backend.app.services.fhir_service import build_fhir_r4_bundle


# ==============================================================================
# 1. Quantitative Diagnostics & Disease Risk Scoring Tests (diagnostics.py)
# ==============================================================================

def test_cvd_risk_framingham_stratification():
    """Verifies 10-year CVD risk stratification across age, SBP, cholesterol, and smoking."""
    # Low risk healthy individual
    low_req = DiagnosticRiskRequest(
        age=25, gender="male", systolic_bp=115, total_cholesterol=160,
        hdl_cholesterol=55, is_smoker=False, is_diabetic=False
    )
    low_res = calculate_clinical_risks(low_req)
    assert low_res["cardiovascular_risk"]["ten_year_probability_percent"] < 15.0
    assert low_res["cardiovascular_risk"]["category"] in ("Low", "Moderate")

    # High risk individual (Elderly, hypertensive smoker with diabetes)
    high_req = DiagnosticRiskRequest(
        age=68, gender="male", systolic_bp=165, total_cholesterol=260,
        hdl_cholesterol=32, is_smoker=True, is_diabetic=True
    )
    high_res = calculate_clinical_risks(high_req)
    assert high_res["cardiovascular_risk"]["ten_year_probability_percent"] >= 20.0
    assert "Elevated" in high_res["cardiovascular_risk"]["category"] or "High" in high_res["cardiovascular_risk"]["category"]


def test_ada_type2_diabetes_score_tiers():
    """Verifies Type 2 Diabetes risk categorization against ADA guidelines."""
    # Normoglycemic
    normal_req = DiagnosticRiskRequest(age=30, fasting_glucose=85, hba1c=5.1, systolic_bp=118)
    normal_res = calculate_clinical_risks(normal_req)
    assert normal_res["diabetes_risk"]["status"] == "Normal Glycemic"

    # Prediabetes (score = 6: glucose 105 (+3), hba1c 5.8 (+3))
    pre_req = DiagnosticRiskRequest(age=35, fasting_glucose=105, hba1c=5.8, systolic_bp=120)
    pre_res = calculate_clinical_risks(pre_req)
    assert pre_res["diabetes_risk"]["status"] == "Prediabetes Warning"

    # Frank Diabetes
    dm_req = DiagnosticRiskRequest(age=55, fasting_glucose=155, hba1c=8.2, systolic_bp=145)
    dm_res = calculate_clinical_risks(dm_req)
    assert "Diabetes" in dm_res["diabetes_risk"]["status"]


def test_ckd_epi_egfr_male_vs_female_computation():
    """Verifies CKD-EPI eGFR calculation with gender-specific coefficients."""
    # Normal male vs normal female with creatinine 1.0
    m_req = DiagnosticRiskRequest(age=40, gender="male", creatinine=1.0)
    f_req = DiagnosticRiskRequest(age=40, gender="female", creatinine=1.0)
    
    m_res = calculate_clinical_risks(m_req)
    f_res = calculate_clinical_risks(f_req)
    
    # Both should have valid numeric eGFR
    assert m_res["renal_health"]["estimated_gfr"] > 50
    assert f_res["renal_health"]["estimated_gfr"] > 50

    # Severe renal impairment: creatinine = 4.5
    severe_req = DiagnosticRiskRequest(age=65, gender="male", creatinine=4.5)
    severe_res = calculate_clinical_risks(severe_req)
    assert severe_res["renal_health"]["estimated_gfr"] < 25.0
    assert "Severe" in severe_res["renal_health"]["kdigo_stage"] or "Stage 4" in severe_res["renal_health"]["kdigo_stage"]


def test_fib4_liver_fibrosis_scoring():
    """Verifies FIB-4 index calculation and risk thresholding."""
    # Normal liver markers
    normal_req = DiagnosticRiskRequest(age=35, ast=22, alt=24, platelet_count=260)
    res_norm = calculate_clinical_risks(normal_req)
    assert res_norm["hepatic_index"]["fib4_score"] < 1.45
    assert "Low" in res_norm["hepatic_index"]["interpretation"]

    # Advanced fibrosis indication (high AST/ALT, thrombocytopenia)
    cirr_req = DiagnosticRiskRequest(age=62, ast=95, alt=60, platelet_count=90)
    res_cirr = calculate_clinical_risks(cirr_req)
    assert res_cirr["hepatic_index"]["fib4_score"] > 3.0
    assert "High" in res_cirr["hepatic_index"]["interpretation"] or "Advanced" in res_cirr["hepatic_index"]["interpretation"]


# ==============================================================================
# 2. Digital Twin Organ Health & Vitality Tests (digital_twin.py)
# ==============================================================================

def test_digital_twin_organ_health_color_mapping():
    """Verifies color coding matches UI vitality tiers."""
    assert get_organ_health_color(92.0) == "#10B981"  # Optimal
    assert get_organ_health_color(75.0) == "#06B6D4"  # Good
    assert get_organ_health_color(58.0) == "#F59E0B"  # Moderate
    assert get_organ_health_color(35.0) == "#EF4444"  # Critical


def test_digital_twin_multi_organ_baseline_penalties():
    """Verifies baseline organ degradation under clinical stressors."""
    healthy_input = DigitalTwinInput(
        age=28, systolic_bp=118, diastolic_bp=78, ldl_cholesterol=90,
        smoking_status="never", hba1c=5.2, egfr=105, bmi=22.0
    )
    baseline_healthy = compute_baseline_organ_scores(healthy_input)
    assert baseline_healthy["overall_health_score"] >= 88.0
    assert baseline_healthy["organs"]["heart"]["color"] == "#10B981"

    # High stress profile: smoker, hypertensive, pre-diabetic
    stressed_input = DigitalTwinInput(
        age=56, systolic_bp=155, diastolic_bp=95, ldl_cholesterol=165,
        smoking_status="current", hba1c=7.2, egfr=65, bmi=31.5
    )
    baseline_stressed = compute_baseline_organ_scores(stressed_input)
    assert baseline_stressed["overall_health_score"] < 65.0
    assert len(baseline_stressed["organs"]["heart"]["risk_factors"]) > 0
    assert baseline_stressed["organs"]["lungs"]["score"] < 75.0


def test_digital_twin_10year_trajectory_interventions():
    """Verifies positive delta when healthy lifestyle interventions are applied."""
    base_input = DigitalTwinInput(
        age=50, systolic_bp=145, diastolic_bp=90, ldl_cholesterol=140,
        smoking_status="current", hba1c=6.5, egfr=80, bmi=28.5,
        proposed_interventions=["smoking cessation", "aerobic exercise", "mediterranean diet"]
    )
    traj = simulate_10_year_trajectory(base_input)
    assert "ten_year_projections" in traj
    assert "heart" in traj["ten_year_projections"]
    
    heart_proj = traj["ten_year_projections"]["heart"]
    assert len(heart_proj["years"]) == 11
    # Interventions should yield improved vitality vs baseline unmanaged decay at Year 10
    assert heart_proj["optimized_trajectory"][-1] >= heart_proj["baseline_trajectory"][-1]
    assert len(traj["recommendations"]) > 0


# ==============================================================================
# 3. MoHFW Clinical Guidelines & Retrieval Tests (retrieval_agent.py)
# ==============================================================================

@pytest.mark.asyncio
async def test_retrieval_agent_guidelines_index():
    """Verifies curated WHO/ICMR clinical guidelines corpus."""
    assert len(CURATED_GUIDELINES_INDEX) >= 5
    assert "hypertension" in CURATED_GUIDELINES_INDEX
    assert "diabetes" in CURATED_GUIDELINES_INDEX
    assert "asthma" in CURATED_GUIDELINES_INDEX


@pytest.mark.asyncio
async def test_retrieval_agent_hybrid_retrieval_matching():
    """Verifies hybrid RAG retrieval for clinical conditions."""
    res = await hybrid_retrieve_clinical_context("Patient with uncontrolled diabetes and high blood sugar")
    assert res is not None
    assert "who_icmr_guidelines" in res
    assert len(res["who_icmr_guidelines"]) > 0
    assert "Metformin" in str(res["who_icmr_guidelines"])


# ==============================================================================
# 4. Pediatric & Acute Clinical Safety Router Tests (safety_router.py)
# ==============================================================================

def test_pediatric_keyword_detection_depth():
    """Verifies detection across clinical, pediatric, colloquial, and Indian terms."""
    assert is_pediatric_query("My 4-year-old child has high fever") is True
    assert is_pediatric_query("Bachhe ko tez bukhar hai") is True
    assert is_pediatric_query("Infant 6 months old with diarrhea") is True
    assert is_pediatric_query("Navjaat shishu ka vajan kam hai") is True
    assert is_pediatric_query("Adult 35 year old male with headache") is False


def test_safety_router_poison_control_detection():
    """Verifies poison and ingestion queries route to toxicological warnings."""
    poison_queries = [
        "Child accidentally swallowed phenyl floor cleaner",
        "Ingested rat poison rodenticide by mistake",
        "Pesticide spray inhalation and vomiting"
    ]
    for q in poison_queries:
        res = evaluate_safety(q)
        assert not res.is_safe
        assert res.category in ("emergency", "crisis", "poison") or "108" in res.response or "112" in res.response


def test_safety_router_acute_anaphylaxis_detection():
    """Verifies acute allergic airway emergency triggers emergency category."""
    res = evaluate_safety("Severe peanut allergy reaction, throat swelling shut and cannot breathe")
    assert not res.is_safe
    assert res.category == "emergency"
    assert "108" in res.response or "112" in res.response or "EMERGENCY" in res.response


# ==============================================================================
# 5. ABDM & FHIR R4 Bundle Validation Tests (abdm_service.py & fhir_service.py)
# ==============================================================================

def test_generate_abha_id_strict_format():
    """Verifies generated ABHA ID satisfies National Health Authority format (14 digits hyphenated)."""
    abha_res = generate_abha_id()
    assert abha_res["status"] == "ACTIVE"
    assert re.match(r"^\d{2}-\d{4}-\d{4}-\d{4}$", abha_res["abha_number"]) is not None
    assert "@abdm" in abha_res["abha_address"]
    assert abha_res["pm_jay_eligible"] is True


def test_fhir_r4_bundle_structural_integrity():
    """Verifies FHIR R4 bundle satisfies HL7 standards and valid transaction entries."""
    bundle = build_fhir_r4_bundle(
        patient_id="P-9921",
        name="Ramesh Chandra",
        gender="male",
        vitals={"systolic_bp": 120, "diastolic_bp": 80, "heart_rate": 78},
        conditions=["Viral Gastroenteritis"]
    )
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] in ("transaction", "document", "collection")
    assert "entry" in bundle
    assert len(bundle["entry"]) >= 2
    
    # Check for Patient resource
    patient_entry = next((e for e in bundle["entry"] if e["resource"]["resourceType"] == "Patient"), None)
    assert patient_entry is not None
    assert "Ramesh" in str(patient_entry["resource"])


def test_ayushman_bharat_schemes_lookup():
    """Verifies retrieval of Indian National Healthcare schemes."""
    schemes = check_ayushman_bharat_schemes("cardiac")
    assert "pmjay" in schemes
    assert "jan_aushadhi" in schemes
    assert "tele_manas" in schemes
    assert "14555" in schemes["pmjay"]["toll_free_helpline"]


# ==============================================================================
# 6. Appointment Slot Management Tests (appointment_agent.py)
# ==============================================================================

def test_available_doctors_by_specialty():
    """Verifies PM-JAY empanelled specialist roster lookup."""
    docs = find_doctors_by_specialty("Cardiologist")
    assert len(docs) >= 1
    assert any("Cardio" in d["specialty"] for d in docs)
    assert "available_slots" in docs[0]


def test_confirm_phc_slot_booking():
    """Verifies appointment confirmation generates a booking reference."""
    res = book_appointment_slot(
        patient_name="Sita Devi",
        doctor_id="DOC-HAMIDIA-102",
        slot_time="Tomorrow at 11:15 AM",
        abha_id="91-4829-1029-4821",
        symptoms_brief="Persistent cough and fever"
    )
    assert res["status"] == "CONFIRMED"
    assert res["booking_id"].startswith("APT-")
    assert res["patient_name"] == "Sita Devi"
    assert "calendar_ics_payload" in res
