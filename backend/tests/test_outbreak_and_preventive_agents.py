"""
Tests for Outbreak Surveillance, Rural Preventive Healthcare, and National UIP Vaccination Agents.
Ensures IDSP epidemiological tracking, PIN-code heatmaps, community quizzes, and U-WIN timelines work reliably.
"""

import pytest
from unittest.mock import patch, AsyncMock
from backend.app.core.state import SynapseOSState
from backend.app.agents.outbreak_agent import (
    get_pincode_outbreak_heatmap,
    record_community_symptom_signal,
    get_district_outbreak_risk,
    broadcast_outbreak_advisory,
    outbreak_agent_node,
    DISTRICT_SURVEILLANCE_DATABASE,
    PINCODE_SURVEILLANCE_GRID
)
from backend.app.agents.preventive_health_agent import (
    get_preventive_topics,
    generate_community_health_quiz,
    evaluate_quiz_answers,
    preventive_health_agent_node,
    PREVENTIVE_HEALTH_CURRICULUM,
    COMMUNITY_QUIZ_BANK
)
from backend.app.agents.vaccination_agent import (
    calculate_vaccination_schedule,
    generate_uwin_record,
    vaccination_agent_node,
    UIP_VACCINATION_SCHEDULE
)


# ==========================================
# 1. OUTBREAK & SURVEILLANCE AGENT TESTS
# ==========================================

def test_get_pincode_outbreak_heatmap_default():
    result = get_pincode_outbreak_heatmap()
    assert result["status"] == "ONLINE_HEATMAP_GRID"
    assert result["total_wards_tracked"] > 0
    assert "city_mean_reproduction_rate_rt" in result
    assert "epidemic_velocity_assessment" in result
    assert isinstance(result["wards"], list)


def test_get_pincode_outbreak_heatmap_filter_pincode():
    # Exact match
    res_exact = get_pincode_outbreak_heatmap(pincode="110005")
    assert res_exact["total_wards_tracked"] == 1
    assert res_exact["wards"][0]["pincode"] == "110005"

    # Non-existent pincode fallback
    res_unknown = get_pincode_outbreak_heatmap(pincode="999999")
    assert res_unknown["total_wards_tracked"] > 0


def test_get_pincode_outbreak_heatmap_filter_city():
    res_delhi = get_pincode_outbreak_heatmap(city="Delhi")
    assert all(w["city"].lower() == "delhi" for w in res_delhi["wards"])
    assert res_delhi["total_wards_tracked"] >= 3

    res_mumbai = get_pincode_outbreak_heatmap(city="Mumbai")
    assert all(w["city"].lower() == "mumbai" for w in res_mumbai["wards"])


def test_record_community_symptom_signal():
    initial_signals = PINCODE_SURVEILLANCE_GRID[0]["active_signals_24h"]
    target_pin = PINCODE_SURVEILLANCE_GRID[0]["pincode"]

    res = record_community_symptom_signal(pincode=target_pin, syndrome="acute_febrile", channel="whatsapp")
    assert res["status"] == "SIGNAL_RECORDED"
    assert res["pincode"] == target_pin
    assert res["syndrome_logged"] == "acute_febrile"
    assert res["updated_active_signals_24h"] == initial_signals + 1


def test_record_community_symptom_signal_unknown_pincode():
    res = record_community_symptom_signal(pincode="999000", syndrome="respiratory", channel="sms")
    assert res["status"] == "SIGNAL_RECORDED"
    assert "updated_active_signals_24h" in res


def test_get_district_outbreak_risk():
    # Specific district search
    res = get_district_outbreak_risk("Delhi")
    assert res["status"] == "ONLINE_SURVEILLANCE"
    assert "Delhi" in res["query_matched"]
    assert "primary_outbreak" in res["data"]
    assert "risk_badge" in res["data"]

    # Search by pathogen
    res_nipah = get_district_outbreak_risk("Nipah")
    assert "Kozhikode" in res_nipah["query_matched"] or "Nipah" in res_nipah["data"]["primary_outbreak"]

    # Fallback to default
    res_fallback = get_district_outbreak_risk("Atlantis")
    assert res_fallback["status"] == "ONLINE_SURVEILLANCE"
    assert res_fallback["data"] is not None


@pytest.mark.asyncio
async def test_broadcast_outbreak_advisory():
    with patch("backend.app.services.whatsapp_service.send_whatsapp_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"status": "sent", "message_id": "MSG123"}
        res = await broadcast_outbreak_advisory(district="Delhi NCR", recipient_phone="+919876543210")
        assert res["status"] == "DISPATCHED"
        assert "Delhi" in res["district"]
        assert "URGENT DENGUE ALERT" in res["advisory_text"]
        mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_outbreak_agent_node():
    state = SynapseOSState(session_id="test_outbreak_sess", input_text="Is there any dengue outbreak in Delhi?")
    res_state = await outbreak_agent_node(state)
    assert res_state.outbreak_data is not None
    assert res_state.outbreak_data["status"] == "ONLINE_SURVEILLANCE"
    assert any("disease surveillance" in step.action.lower() for step in res_state.trace)


# ==========================================
# 2. PREVENTIVE HEALTH AGENT TESTS
# ==========================================

def test_get_preventive_topics():
    topics = get_preventive_topics()
    assert len(topics) >= 5
    topic_ids = [t["id"] for t in topics]
    assert "ors_diarrhea" in topic_ids
    assert "poshan_maternal" in topic_ids
    assert "vector_control" in topic_ids


def test_generate_community_health_quiz():
    quiz = generate_community_health_quiz(count=3)
    assert quiz["total_questions"] == 3
    assert len(quiz["questions"]) == 3
    for q in quiz["questions"]:
        assert "question" in q
        assert len(q["options"]) >= 2
        assert "correct_index" in q


def test_evaluate_quiz_answers_perfect_score():
    # Submit correct answer for first question
    q1 = COMMUNITY_QUIZ_BANK[0]
    answers = {q1["id"]: q1["correct_index"]}
    result = evaluate_quiz_answers(answers)
    assert result["score"] == 1
    assert result["total"] == 1
    assert result["score_percentage"] == 100.0
    assert result["status"] == "EXCELLENT_AWARENESS"
    assert "Ambassador" in result["badge"]


def test_evaluate_quiz_answers_incorrect_score():
    # Submit wrong answer
    q1 = COMMUNITY_QUIZ_BANK[0]
    wrong_idx = (q1["correct_index"] + 1) % len(q1["options"])
    answers = {q1["id"]: wrong_idx}
    result = evaluate_quiz_answers(answers)
    assert result["score"] == 0
    assert result["score_percentage"] == 0.0
    assert result["status"] == "NEEDS_REVIEW"
    assert "Learner" in result["badge"]


@pytest.mark.asyncio
async def test_preventive_health_agent_node_routes():
    # Test ORS topic routing
    state_ors = SynapseOSState(session_id="test_prev_1", input_text="Child has severe diarrhea and vomiting, how to make ORS?")
    res_ors = await preventive_health_agent_node(state_ors)
    assert res_ors.preventive_data["active_guide"]["id"] == "ors_diarrhea"

    # Test Maternal topic routing
    state_mat = SynapseOSState(session_id="test_prev_2", input_text="Maternal nutrition guidance for pregnant woman anemia")
    res_mat = await preventive_health_agent_node(state_mat)
    assert res_mat.preventive_data["active_guide"]["id"] == "poshan_maternal"

    # Test Vector control routing
    state_vec = SynapseOSState(session_id="test_prev_3", input_text="How to control mosquito and dengue fever around house")
    res_vec = await preventive_health_agent_node(state_vec)
    assert res_vec.preventive_data["active_guide"]["id"] == "vector_control"

    # Test NCD routing
    state_ncd = SynapseOSState(session_id="test_prev_4", input_text="Tips for hypertension blood pressure and diabetes diet")
    res_ncd = await preventive_health_agent_node(state_ncd)
    assert res_ncd.preventive_data["active_guide"]["id"] == "lifestyle_ncd"


# ==========================================
# 3. VACCINATION AGENT TESTS
# ==========================================

def test_calculate_vaccination_schedule_birth():
    sched = calculate_vaccination_schedule(age_in_weeks=0)
    assert sched["child_age_weeks"] == 0
    assert sched["uip_compliance_pct"] >= 0
    assert len(sched["current_due"]) > 0
    # At birth, BCG / OPV-0 / Hep B are due
    due_names = [v["name"] for v in sched["current_due"][0]["vaccines"]]
    assert "BCG" in due_names


def test_calculate_vaccination_schedule_pregnant():
    sched = calculate_vaccination_schedule(category="pregnant")
    assert sched["category"] == "maternal"
    assert "Maternal Immunization" in sched["current_status"]
    assert len(sched["recommended_vaccines"]) >= 2


def test_calculate_vaccination_schedule_with_dob():
    sched = calculate_vaccination_schedule(dob_str="2024-01-01")
    assert sched["child_age_weeks"] > 0
    assert "completed" in sched
    assert "upcoming" in sched


def test_generate_uwin_record():
    record = generate_uwin_record(
        beneficiary_name="Devansh",
        dob="2024-06-01",
        guardian_name="Pooja Sharma",
        state="Haryana"
    )
    assert "UWIN-" in record["certificate_id"]
    assert record["beneficiary_name"] == "Devansh"
    assert record["guardian_name"] == "Pooja Sharma"
    assert len(record["doses_administered"]) == 3
    assert "uwin.mohfw.gov.in" in record["qr_verification"]


@pytest.mark.asyncio
async def test_vaccination_agent_node():
    # Newborn query
    state_newborn = SynapseOSState(session_id="test_vac_1", input_text="What vaccines are needed at birth for newborn?")
    res_newborn = await vaccination_agent_node(state_newborn)
    assert res_newborn.vaccination_data is not None
    assert res_newborn.vaccination_data["child_age_weeks"] == 0

    # Pregnancy query
    state_preg = SynapseOSState(session_id="test_vac_2", input_text="What are the pregnancy tetanus injections schedule?")
    res_preg = await vaccination_agent_node(state_preg)
    assert res_preg.vaccination_data is not None
    assert res_preg.vaccination_data["category"] == "maternal"
