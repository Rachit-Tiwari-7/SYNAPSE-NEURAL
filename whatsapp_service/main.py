"""
whatsapp_service — main.py
Standalone FastAPI application for WhatsApp Service powered natively by Google Gemini.
Can be executed standalone via:
    uvicorn whatsapp_service.main:app --port 8001 --reload
"""

import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .whatsapp_service import (
    process_whatsapp_inbound_webhook,
    send_whatsapp_message,
    send_whatsapp_image,
    trigger_emergency_sos_whatsapp,
    MAIN_MENU_TEXT
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("whatsapp_service")

app = FastAPI(
    title="Synapse-OS WhatsApp Service (Gemini Powered)",
    description="Standalone Meta WhatsApp Cloud API Service integrated directly with Google Gemini for Multilingual Clinical Triage, Drug Safety, and Medical Vision OCR.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Synapse-OS WhatsApp Service",
        "engine": "Google Gemini API",
        "model": settings.GEMINI_MODEL,
        "vision_model": settings.GEMINI_VISION_MODEL,
        "gemini_key_configured": bool(settings.GEMINI_API_KEY),
        "whatsapp_token_configured": bool(settings.WHATSAPP_CLOUD_API_TOKEN),
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini": {
            "configured": bool(settings.GEMINI_API_KEY),
            "primary_model": settings.GEMINI_MODEL,
            "vision_model": settings.GEMINI_VISION_MODEL
        },
        "meta_whatsapp": {
            "configured": bool(settings.WHATSAPP_CLOUD_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID),
            "phone_id": settings.WHATSAPP_PHONE_NUMBER_ID or "SANDBOX_SIMULATION",
            "api_version": settings.WHATSAPP_API_VERSION
        }
    }


# =========================================================
# Meta WhatsApp Cloud API Webhook Endpoints
# =========================================================

@app.get("/whatsapp/webhook", tags=["WhatsApp Webhook"])
async def whatsapp_webhook_verification(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Official Meta WhatsApp Cloud API Webhook Handshake Verification.
    Validates hub.verify_token against configured secret and returns hub.challenge.
    """
    expected_token = settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN or "synapse_secret_token_123"

    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        logger.info("[Meta Webhook Verification] Successfully verified webhook handshake.")
        return Response(content=str(hub_challenge), media_type="text/plain", status_code=200)

    logger.warning(f"[Meta Webhook Verification Failed] Invalid token '{hub_verify_token}' or mode '{hub_mode}'")
    raise HTTPException(
        status_code=403,
        detail="Meta Webhook Verification Failed: Invalid hub.verify_token or hub.mode"
    )


@app.post("/whatsapp/webhook", tags=["WhatsApp Webhook"])
async def whatsapp_webhook_endpoint(payload: Dict[str, Any]):
    """
    Official Meta WhatsApp Cloud API Inbound Webhook Handler.
    Processes text, interactive button replies, location pins, and prescription images.
    """
    return await process_whatsapp_inbound_webhook(payload)


# =========================================================
# Local Testing & Omnichannel Simulation Endpoints
# =========================================================

class WhatsAppSimulateRequest(BaseModel):
    message: str = Field(default="1 I have fever and dry cough", description="Incoming user message or triage choice")
    sender_phone: str = Field(default="919876543210", description="User WhatsApp phone number")
    message_type: str = Field(default="text", description="'text' or 'image'")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded prescription or scan image")


@app.post("/whatsapp/simulate", tags=["WhatsApp Simulation"])
async def whatsapp_simulate_endpoint(req: WhatsAppSimulateRequest):
    """
    Simulates an incoming WhatsApp message or prescription scan locally without requiring live webhooks.
    """
    clean_phone = req.sender_phone.replace("+", "").replace("@c.us", "").strip()

    if req.image_base64 or req.message_type == "image":
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "100000000000000",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"display_phone_number": "15550234567", "phone_number_id": "100000000000000"},
                        "contacts": [{"profile": {"name": "Test User"}, "wa_id": clean_phone}],
                        "messages": [{
                            "from": clean_phone,
                            "id": "wamid.SIMULATED_IMG_ID",
                            "timestamp": "1772185000",
                            "type": "image",
                            "image": {"id": "meta_img_simulated", "caption": req.message, "mime_type": "image/jpeg"}
                        }]
                    },
                    "field": "messages"
                }]
            }],
            "image_base64": req.image_base64
        }
    else:
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "100000000000000",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"display_phone_number": "15550234567", "phone_number_id": "100000000000000"},
                        "contacts": [{"profile": {"name": "Test User"}, "wa_id": clean_phone}],
                        "messages": [{
                            "from": clean_phone,
                            "id": "wamid.SIMULATED_TXT_ID",
                            "timestamp": "1772185000",
                            "type": "text",
                            "text": {"body": req.message}
                        }]
                    },
                    "field": "messages"
                }]
            }]
        }

    return await process_whatsapp_inbound_webhook(payload)


class WhatsAppSendRequest(BaseModel):
    to_phone: str = Field(example="919876543210")
    message: str = Field(example="Hello from Synapse-OS!")


@app.post("/whatsapp/send", tags=["WhatsApp Outbound"])
async def whatsapp_send_endpoint(req: WhatsAppSendRequest):
    """Directly sends an outbound WhatsApp message."""
    return await send_whatsapp_message(to_phone=req.to_phone, text=req.message)


class EmergencySOSRequest(BaseModel):
    emergency_contact: str = Field(example="919876543210")
    patient_name: str = Field(default="Ramesh Kumar")
    location_coords: str = Field(default="28.6139,77.2090")
    blood_group: str = Field(default="B+")
    critical_symptoms: str = Field(default="Severe chest pain and breathlessness")


@app.post("/whatsapp/sos", tags=["Emergency SOS"])
async def trigger_emergency_sos_endpoint(req: EmergencySOSRequest):
    """Triggers an emergency SOS WhatsApp dispatch with GPS location link."""
    return await trigger_emergency_sos_whatsapp(
        emergency_contact=req.emergency_contact,
        patient_name=req.patient_name,
        location_coords=req.location_coords,
        blood_group=req.blood_group,
        critical_symptoms=req.critical_symptoms
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("whatsapp_service.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
