"""
whatsapp_service — test_whatsapp_service.py
Automated unit and integration test suite for Gemini-powered WhatsApp service.
Verifies webhook parsing, Gemini clinical triage, language switching, and protocol compliance.
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock

from whatsapp_service.config import settings
from whatsapp_service.whatsapp_service import (
    process_whatsapp_inbound_webhook,
    strip_markdown_to_plain_text,
    format_compact_whatsapp_card,
    clear_deduplication_cache,
    send_whatsapp_message
)
from whatsapp_service.session_manager import session_manager


@pytest.fixture(autouse=True)
def setup_teardown():
    clear_deduplication_cache()
    yield
    clear_deduplication_cache()


def test_strip_markdown():
    raw_md = "### **Suspected Diagnosis:** *Acute Bronchitis*\n---\n• Take `Dolo 650`."
    clean = strip_markdown_to_plain_text(raw_md)
    assert "**" not in clean
    assert "*" not in clean
    assert "`" not in clean
    assert "###" not in clean
    assert "---" not in clean
    assert "Suspected Diagnosis: Acute Bronchitis" in clean
    assert "• Take Dolo 650." in clean


def test_compact_card_protocol():
    sample_triage = {
        "triage_category": "DOCTOR_CONSULT",
        "suspected_diagnosis": "Viral Upper Respiratory Infection",
        "consensus_percentage": 92,
        "immediate_actions": ["Hydrate frequently", "Rest adequately"],
        "medications_relief_india": ["Dolo 650: 1 tab after meals", "Electral ORS: Sip in water"],
        "red_flag_warnings": ["High fever > 103 F", "Chest pain"],
    }
    card = format_compact_whatsapp_card(sample_triage, lang="en")
    assert "🟡 SYNAPSE CLINICAL CONSULT REQUIRED" in card
    assert "━━━━━━━━━━━━━━━━━━━━" in card
    assert "🩺 Suspected Diagnosis: Viral Upper Respiratory Infection" in card
    assert "📊 Council Consensus: 92%" in card
    assert "💊 Medications & Relief (India):" in card
    assert "Dolo 650" in card
    assert "🚨 Seek Emergency Care / Call 108 If:" in card
    assert "👉 Quick Shortcuts:" in card
    assert "Reply 5 to Find Empanelled PM-JAY Doctor" in card
    assert "Reply sos for Instant Ambulance Guide" in card
    assert "🌿 Powered by Synapse-OS" in card


@pytest.mark.asyncio
async def test_greeting_webhook_dispatches_menu():
    payload = {
        "sender_phone": "919999988888",
        "message": "hello",
        "type": "text"
    }
    res = await process_whatsapp_inbound_webhook(payload)
    assert res["status"] == "processed"
    assert res["type"] == "menu_dispatched"


@pytest.mark.asyncio
async def test_language_selection_flow():
    phone = "918888877777"
    # Step 1: Trigger language change
    res1 = await process_whatsapp_inbound_webhook({
        "sender_phone": phone,
        "message": "lang",
        "type": "text"
    })
    assert res1["type"] == "language_menu_dispatched"
    session = session_manager.get_session(phone)
    assert session["active_flow"] == "LANG_SELECT"

    # Step 2: Select Hindi ("2")
    res2 = await process_whatsapp_inbound_webhook({
        "sender_phone": phone,
        "message": "2",
        "type": "text"
    })
    assert res2["type"] == "language_selected"
    assert res2["language"] == "hi"
    assert session["context"]["lang"] == "hi"
    assert session["active_flow"] == "IDLE"


@pytest.mark.asyncio
async def test_emergency_sos_trigger():
    phone = "917777766666"
    res = await process_whatsapp_inbound_webhook({
        "sender_phone": phone,
        "message": "sos",
        "type": "text"
    })
    assert res["status"] == "processed"
    assert res["type"] == "emergency_sos"
    session_manager.reset_flow(phone)


@pytest.mark.asyncio
async def test_gemini_triage_integration_with_mock():
    mock_triage_res = {
        "triage_category": "HOME_CARE",
        "suspected_diagnosis": "Mild Seasonal Common Cold",
        "consensus_percentage": 95,
        "immediate_actions": ["Warm saline gargle 3 times daily", "Steam inhalation"],
        "medications_relief_india": [
            "Cetirizine 10mg: 1 tab at bedtime after food",
            "Dolo 650: 1 tab after meals if fever > 100 F"
        ],
        "red_flag_warnings": ["Persistent breathlessness", "Chest pain"],
        "tele_manas_or_helpline": "108"
    }

    with patch("whatsapp_service.meta_whatsapp_service.run_gemini_triage", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = mock_triage_res

        res = await process_whatsapp_inbound_webhook({
            "sender_phone": "919876543210",
            "message": "1 I have runny nose and mild sore throat",
            "type": "text"
        })

        assert res["status"] == "processed"
        assert res["type"] == "gemini_clinical_triage"
        mock_gemini.assert_called_once()


@pytest.mark.asyncio
async def test_drug_safety_query():
    mock_drug_res = {
        "status": "MODERATE_RISK",
        "summary": "Combining NSAIDs increases stomach irritation.",
        "interactions": [{
            "severity": "Moderate",
            "effect": "Gastric irritation",
            "action": "Take after meals with water."
        }],
        "safe_alternatives": ["Paracetamol 650mg"],
        "administration_guidance": "Take after food."
    }

    with patch("whatsapp_service.meta_whatsapp_service.run_gemini_drug_safety", new_callable=AsyncMock) as mock_drug:
        mock_drug.return_value = mock_drug_res

        res = await process_whatsapp_inbound_webhook({
            "sender_phone": "919876543210",
            "message": "2 Aspirin with Ibuprofen",
            "type": "text"
        })

        assert res["status"] == "processed"
        assert res["type"] == "drug_check"
        mock_drug.assert_called_once()
