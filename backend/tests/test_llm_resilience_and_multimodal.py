"""
Tests for LLM Service Resilience, Multimodal Vision, IPFS Pinata, and 2G SMS Inbound Dispatcher.
Validates structured JSON parsing, code block cleanup, regex extraction, offline fallbacks,
and multi-channel communication pipelines.
"""

import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from backend.app.services.llm_service import (
    call_llm_json,
    call_llm,
    call_gemini,
    call_gemini_vision
)
from backend.app.services.pinata_service import (
    upload_json_to_ipfs,
    upload_file_to_ipfs,
    get_simulated_record,
    get_ipfs_gateway_url,
    _generate_simulated_cid
)
from backend.app.services.sms_service import (
    format_sms_text,
    generate_twiml_response,
    send_outbound_sms,
    process_sms_inbound_webhook
)


# ==========================================
# 1. LLM SERVICE RESILIENCE & PARSING TESTS
# ==========================================

@pytest.mark.asyncio
async def test_call_llm_json_empty_input():
    fallback = {"status": "default_fallback"}
    with patch("backend.app.services.llm_service.call_llm", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = ""
        result = await call_llm_json(messages=[{"role": "user", "content": "hi"}], fallback_dict=fallback)
        assert result == fallback

        mock_call.return_value = None
        result_none = await call_llm_json(messages=[{"role": "user", "content": "hi"}], fallback_dict=fallback)
        assert result_none == fallback


@pytest.mark.asyncio
async def test_call_llm_json_markdown_wrapped():
    fallback = {"status": "failed"}
    raw_response = "```json\n{\"condition\": \"Common Cold\", \"risk_score\": 0.15}\n```"
    
    with patch("backend.app.services.llm_service.call_llm", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = raw_response
        result = await call_llm_json(messages=[], fallback_dict=fallback)
        assert result["condition"] == "Common Cold"
        assert result["risk_score"] == 0.15


@pytest.mark.asyncio
async def test_call_llm_json_generic_codeblock():
    fallback = {"status": "failed"}
    raw_response = "```\n{\"diagnosis\": \"Migraine\", \"triage\": \"ROUTINE\"}\n```"
    
    with patch("backend.app.services.llm_service.call_llm", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = raw_response
        result = await call_llm_json(messages=[], fallback_dict=fallback)
        assert result["diagnosis"] == "Migraine"
        assert result["triage"] == "ROUTINE"


@pytest.mark.asyncio
async def test_call_llm_json_regex_recovery():
    fallback = {"status": "failed"}
    # Model returns conversational preamble followed by JSON
    raw_response = (
        "Sure! Here is the clinical assessment for the patient:\n"
        "{\"identified_pathogen\": \"Dengue\", \"severity\": \"HIGH\"}\n"
        "Please let me know if you need more details."
    )
    
    with patch("backend.app.services.llm_service.call_llm", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = raw_response
        result = await call_llm_json(messages=[], fallback_dict=fallback)
        assert result["identified_pathogen"] == "Dengue"
        assert result["severity"] == "HIGH"


@pytest.mark.asyncio
async def test_call_llm_json_malformed_syntax():
    fallback = {"status": "retained_fallback"}
    raw_response = "This is not json at all: {foo: bar, invalid}"
    
    with patch("backend.app.services.llm_service.call_llm", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = raw_response
        result = await call_llm_json(messages=[], fallback_dict=fallback)
        assert result == fallback


@pytest.mark.asyncio
async def test_call_gemini_success():
    mock_payload = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Gemini Clinical Reasoning Output"}]
                }
            }
        ]
    }
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload

    with patch("backend.app.core.config.settings.GEMINI_API_KEY", "test_gemini_key"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            out = await call_gemini(messages=[{"role": "user", "content": "test triage"}])
            assert out == "Gemini Clinical Reasoning Output"


@pytest.mark.asyncio
async def test_call_gemini_vision_success():
    mock_payload = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Prescription: Amoxicillin 500mg TDS"}]
                }
            }
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload

    with patch("backend.app.core.config.settings.GEMINI_API_KEY", "test_gemini_key"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            out = await call_gemini_vision(
                image_base64="data:image/jpeg;base64,samplebase64data",
                prompt="Read prescription"
            )
            assert out == "Prescription: Amoxicillin 500mg TDS"


# ==========================================
# 2. IPFS & PINATA SERVICES TESTS
# ==========================================

def test_simulated_cid_generator():
    cid1 = _generate_simulated_cid(b"hello world")
    cid2 = _generate_simulated_cid(b"hello world")
    cid3 = _generate_simulated_cid(b"different content")
    assert cid1.startswith("Qm")
    assert cid1 == cid2
    assert cid1 != cid3


@pytest.mark.asyncio
async def test_upload_json_to_ipfs_simulation():
    with patch("backend.app.core.config.settings.PINATA_JWT", ""):
        sample_record = {"patient": "Ramesh", "diagnosis": "Hypertension"}
        res = await upload_json_to_ipfs(sample_record, record_name="test_record.json")
        assert res["status"] == "pinned"
        assert res["simulated"] is True
        assert res["cid"].startswith("Qm")
        assert "gateway" in res["gateway_url"]

        # Verify retrieval from simulation store
        cached = get_simulated_record(res["cid"])
        assert cached is not None
        assert cached["data"]["patient"] == "Ramesh"


@pytest.mark.asyncio
async def test_upload_file_to_ipfs_simulation():
    with patch("backend.app.core.config.settings.PINATA_JWT", ""):
        sample_bytes = b"%PDF-1.4 simulated pdf data"
        res = await upload_file_to_ipfs(sample_bytes, filename="lab_report.pdf", content_type="application/pdf")
        assert res["status"] == "pinned"
        assert res["simulated"] is True
        assert res["cid"].startswith("Qm")


# ==========================================
# 3. 2G SMS FORMATTING & DISPATCH TESTS
# ==========================================

def test_format_sms_text():
    dirty_text = (
        "### 🔴 SYNAPSE EMERGENCY TRIAGE 🔴\n"
        "```python\nprint('code')\n```\n"
        "Here is the result for **Patient**: Take Dolo 650.\n"
        "--------------------\n"
        "Visit: https://gateway.pinata.cloud/ipfs/Qm12345\n"
        "Stay safe! 🌿💊"
    )
    clean = format_sms_text(dirty_text, max_chars=160)
    assert "```" not in clean
    assert "###" not in clean
    assert "**" not in clean
    assert "https://gateway.pinata.cloud" not in clean
    assert "🔴" not in clean
    assert "Dolo 650" in clean
    assert len(clean) <= 160


def test_generate_twiml_response():
    msg = "SYNAPSE: Visit PHC for evaluation & care."
    xml_out = generate_twiml_response(msg)
    assert xml_out.startswith('<?xml version="1.0"')
    assert "<Response>" in xml_out
    assert "<Body>SYNAPSE: Visit PHC for evaluation &amp; care.</Body>" in xml_out


@pytest.mark.asyncio
async def test_send_outbound_sms_simulated():
    with patch("backend.app.core.config.settings.TWILIO_ACCOUNT_SID", ""):
        res = await send_outbound_sms(to_number="+919999999999", message="Health Check Reminder")
        assert res["status"] == "sent"
        assert res["simulated"] is True
        assert res["to"] == "+919999999999"
        assert "Health Check Reminder" in res["body"]


@pytest.mark.asyncio
async def test_process_sms_inbound_sos():
    res = await process_sms_inbound_webhook(from_number="+919876543210", body="SOS severe chest pain")
    assert res["status"] == "processed"
    assert res["intent"] == "EMERGENCY_SOS"
    assert "108" in res["reply"]
    assert "<Response>" in res["twiml"]


@pytest.mark.asyncio
async def test_process_sms_inbound_empty_and_menu():
    # Empty message
    res_empty = await process_sms_inbound_webhook(from_number="+919876543210", body="")
    assert res_empty["type"] == "empty_fallback"
    assert "Reply 1" in res_empty["reply"]

    # Greeting
    res_hi = await process_sms_inbound_webhook(from_number="+919876543210", body="Namaste")
    assert res_hi["intent"] == "MENU_NAVIGATION"
    assert "Reply 1" in res_hi["reply"]


@pytest.mark.asyncio
async def test_process_sms_inbound_symptom_triage():
    with patch("backend.app.agents.triage_agent.analyze_symptoms", new_callable=AsyncMock) as mock_triage:
        mock_triage.return_value = {
            "triage_level": "DOCTOR_CONSULT",
            "clinical_rationale": "High persistent fever with body pain."
        }
        res = await process_sms_inbound_webhook(
            from_number="+919876543210",
            body="1 I have high continuous fever and headache"
        )
        assert res["status"] == "processed"
        assert res["intent"] == "SYMPTOM_TRIAGE"
        assert "Dolo 650" in res["reply"]
        assert "108" in res["reply"]


@pytest.mark.asyncio
async def test_process_sms_inbound_vaccine():
    res = await process_sms_inbound_webhook(from_number="+919876543210", body="7 birth")
    assert res["status"] == "processed"
    assert res["intent"] == "VACCINATION_SCHEDULE"
    assert "BCG" in res["reply"]
