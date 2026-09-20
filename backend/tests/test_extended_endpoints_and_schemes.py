"""
Tests for Extended FastAPI Endpoints: UIP Vaccination, Rural Preventive Healthcare,
IDSP Outbreak Surveillance, Decentralized IPFS Pinata, 2G SMS Gateway, Live Surveillance,
Wearables Telemetry Dossier, and Clinical Accuracy Benchmarks.
"""

import io
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


# ==========================================
# 1. LIVE SURVEILLANCE & WEARABLES DOSSIER
# ==========================================

def test_live_surveillance_endpoint():
    resp = client.get("/api/surveillance/live")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "global" in data
    assert "india" in data
    assert data["india"]["cases"] > 0


def test_wearables_dossier_endpoint():
    resp = client.get("/api/wearables/dossier?patient_id=PAT-TEST-100&patient_name=Ramesh+Kumar")
    assert resp.status_code == 200
    data = resp.json()
    assert data["patient_id"] == "PAT-TEST-100"
    assert data["patient_name"] == "Ramesh Kumar"
    assert "metrics_summary" in data
    assert data["metrics_summary"]["avg_resting_heart_rate_bpm"] > 0
    assert len(data["telemetry_stream"]) > 0


# ==========================================
# 2. UIP VACCINATION & U-WIN ENDPOINTS
# ==========================================

def test_vaccination_schedule_endpoint_child():
    payload = {"age_in_weeks": 6, "category": "child"}
    resp = client.post("/api/vaccination/schedule", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["child_age_weeks"] == 6
    assert "next_vaccine_due" in data
    assert "current_due" in data


def test_vaccination_schedule_endpoint_maternal():
    payload = {"category": "pregnant"}
    resp = client.post("/api/vaccination/schedule", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "maternal"
    assert len(data["recommended_vaccines"]) > 0


def test_vaccination_milestones_endpoint():
    resp = client.get("/api/vaccination/milestones")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_milestones"] > 0
    assert len(data["milestones"]) > 0


def test_uwin_record_endpoint():
    payload = {
        "beneficiary_name": "Aarav Sharma",
        "dob": "2024-05-12",
        "guardian_name": "Siddharth Sharma",
        "state": "Delhi"
    }
    resp = client.post("/api/vaccination/uwin-record", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["beneficiary_name"] == "Aarav Sharma"
    assert "UWIN-" in data["certificate_id"]
    assert "qr_verification" in data


# ==========================================
# 3. RURAL PREVENTIVE HEALTHCARE ENDPOINTS
# ==========================================

def test_preventive_topics_endpoint():
    resp = client.get("/api/preventive/topics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_modules"] >= 5
    assert len(data["modules"]) >= 5


def test_preventive_quiz_endpoint():
    resp = client.get("/api/preventive/quiz?count=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_questions"] == 3
    assert len(data["questions"]) == 3


def test_preventive_quiz_evaluate_endpoint():
    payload = {"user_answers": {"q1": 0, "q2": 1}}
    resp = client.post("/api/preventive/quiz-evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "score_percentage" in data
    assert "badge" in data


# ==========================================
# 4. IDSP OUTBREAK SURVEILLANCE ENDPOINTS
# ==========================================

def test_outbreak_pincode_heatmap_endpoint():
    resp = client.get("/api/outbreak/pincode-heatmap?city=Delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ONLINE_HEATMAP_GRID"
    assert len(data["wards"]) > 0


def test_outbreak_report_signal_endpoint():
    payload = {"pincode": "110005", "syndrome": "acute_febrile", "channel": "web"}
    resp = client.post("/api/outbreak/report-signal", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SIGNAL_RECORDED"
    assert data["pincode"] == "110005"


def test_outbreak_district_risk_endpoint():
    resp = client.get("/api/outbreak/district-risk?district=Delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ONLINE_SURVEILLANCE"
    assert "primary_outbreak" in data["data"]


def test_outbreak_broadcast_advisory_endpoint():
    payload = {
        "district": "Delhi NCR (Central & South)",
        "recipient_phone": "+919876543210",
        "channel": "whatsapp"
    }
    with patch("backend.app.services.whatsapp_service.send_whatsapp_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"status": "sent"}
        resp = client.post("/api/outbreak/broadcast-advisory", json=payload)
        assert resp.status_code == 200
        assert resp.json()["status"] == "DISPATCHED"


# ==========================================
# 5. OMNICHANNEL 2G SMS & IPFS PINATA ENDPOINTS
# ==========================================

def test_sms_webhook_endpoint():
    form_data = {
        "From": "+919876543210",
        "Body": "SOS severe dizziness and breathing trouble"
    }
    resp = client.post("/api/sms/webhook", data=form_data)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/xml")
    assert "<Response>" in resp.text
    assert "<Message>" in resp.text


def test_sms_send_endpoint():
    payload = {
        "to_number": "+919876543210",
        "message": "Reminder: Routine vaccination camp at PHC tomorrow 9 AM."
    }
    resp = client.post("/api/sms/send", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "sent"
    assert data["to"] == "+919876543210"


def test_sms_inbound_and_simulate_endpoint():
    payload = {
        "sender": "+919876543210",
        "message": "7 6 weeks"
    }
    resp = client.post("/api/sms/inbound", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "DELIVERED"
    assert "reply_text" in data

    resp_sim = client.post("/api/sms/simulate", json=payload)
    assert resp_sim.status_code == 200
    assert resp_sim.json()["status"] == "DELIVERED"


def test_sms_model_backend_status_endpoint():
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "running"}
        mock_resp.text = '{"status": "running"}'
        mock_get.return_value = mock_resp

        resp = client.get("/api/sms/model/status")
        assert resp.status_code == 200
        assert resp.json()["healthy"] is True


def test_ipfs_pin_json_endpoint():
    payload = {
        "record_name": "test_triage.json",
        "data": {"patient_id": "PAT-001", "triage": "HOME_CARE"}
    }
    resp = client.post("/api/ipfs/pin-json", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "cid" in data
    assert "gateway_url" in data


def test_ipfs_pin_file_endpoint():
    file_content = b"%PDF-1.5 test document bytes for verification"
    files = {"file": ("report.pdf", io.BytesIO(file_content), "application/pdf")}
    resp = client.post("/api/ipfs/pin-file", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert "cid" in data
    assert "gateway_url" in data


# ==========================================
# 6. CLINICAL ACCURACY BENCHMARK ENDPOINT
# ==========================================

def test_benchmarks_accuracy_endpoint():
    resp = client.get("/api/benchmarks/accuracy")
    assert resp.status_code == 200
    data = resp.json()
    assert "measured_clinical_accuracy" in data
    assert "community_awareness_impact" in data
    assert data["status"] == "EXCEEDS_HACKATHON_SPECIFICATION"
