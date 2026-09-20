"""
whatsapp_service — prescription_ocr_service.py
Google Gemini Vision-powered Prescription & Medical Scan OCR Engine.
Extracts doctor info, patient vitals, medications (dosage, frequency, instructions),
and flags high-risk drug-drug contraindications and illegible handwriting using Gemini Vision.
"""

import logging
import time
from typing import Dict, Any, Optional, Tuple

from .gemini_service import call_gemini_vision, call_gemini_json
from .config import settings

logger = logging.getLogger(__name__)

PRESCRIPTION_OCR_SYSTEM_PROMPT = """
You are Synapse-OS's board-certified clinical pharmacist and medical document vision specialist.
Analyze this medical prescription or diagnostic report image with meticulous clinical precision.
Extract every medication, dosage, administration timing (e.g. before meals, after meals), duration, and doctor instructions.
Pay extreme attention to Indian commercial brand names (e.g. Dolo 650, Augmentin 625, Pan-D, Combiflam, Azithral 500, Shelcal 500).

You MUST output structured JSON matching this schema:
{
  "doctor_name": "Dr. Name or null",
  "clinic_or_hospital": "Hospital/Clinic name or null",
  "patient_name": "Patient Name or null",
  "date": "Prescription date or null",
  "medications": [
    {
      "name": "Brand name or generic",
      "dosage": "Strength e.g. 650mg",
      "frequency": "e.g. 1-0-1 or Twice daily",
      "timing": "After meals / Empty stomach / Bedtime",
      "duration": "e.g. 5 days",
      "purpose": "Suspected purpose e.g. Fever relief / Antibiotic",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "instructions": ["General patient instructions or dietary advice"],
  "potential_alerts": ["Any drug contraindications, allergy risks, or illegible handwriting warnings"],
  "summary": "Brief 2-line plain text summary of the prescription"
}
"""

SCAN_ANALYSIS_SYSTEM_PROMPT = """
You are Synapse-OS's expert radiologist AI assistant.
Analyze this diagnostic medical scan (X-ray, CT, MRI, Ultrasound, ECG, or Lab Report).
Provide an objective, non-definitive clinical description in clear language.
Highlight key radiological findings, standard physiological landmarks, and recommended follow-up tests.
Always include an explicit disclaimer that this AI reading must be correlated with a licensed physician.
"""


async def analyze_prescription_image(
    image_bytes_or_b64: Any,
    mime_type: str = "image/jpeg"
) -> Dict[str, Any]:
    """
    Parses a prescription image using Google Gemini Vision into structured clinical JSON.
    """
    start_t = time.time()
    logger.info("[Gemini Vision] Starting prescription analysis...")

    fallback_result = {
        "doctor_name": None,
        "clinic_or_hospital": None,
        "patient_name": None,
        "date": None,
        "medications": [],
        "instructions": [],
        "potential_alerts": ["Unable to process image. Please upload a clearer photograph."],
        "summary": "Could not extract legible medication details."
    }

    try:
        raw_output = await call_gemini_vision(
            prompt="Analyze this medical prescription image and output the exact structured JSON as specified in the system instructions.",
            image_bytes_or_base64=image_bytes_or_b64,
            mime_type=mime_type,
            system_instruction=PRESCRIPTION_OCR_SYSTEM_PROMPT,
            json_mode=True,
            temperature=0.1
        )

        if not raw_output:
            logger.warning("[Gemini Vision] Received empty response from vision model.")
            return fallback_result

        # Parse JSON from output
        parsed = await call_gemini_json(
            messages=[{"role": "user", "content": f"Extract the valid JSON object from this text:\n{raw_output}"}],
            fallback_dict=fallback_result,
            temperature=0.0
        )
        elapsed = round(time.time() - start_t, 2)
        parsed["processing_time_sec"] = elapsed
        parsed["engine"] = f"Google Gemini Vision ({settings.GEMINI_VISION_MODEL})"
        return parsed

    except Exception as e:
        logger.error(f"[Gemini Vision] Error analyzing prescription: {e}")
        return fallback_result


async def analyze_medical_scan(
    image_bytes_or_b64: Any,
    user_notes: str = "",
    mime_type: str = "image/jpeg"
) -> str:
    """
    Analyzes medical scan (X-Ray, MRI, ECG, Ultrasound) using Google Gemini Vision.
    Returns plain-text summary suitable for WhatsApp messaging.
    """
    prompt = f"Diagnostic scan analysis requested. User notes: '{user_notes}'. Please provide your radiological assessment."
    
    result = await call_gemini_vision(
        prompt=prompt,
        image_bytes_or_base64=image_bytes_or_b64,
        mime_type=mime_type,
        system_instruction=SCAN_ANALYSIS_SYSTEM_PROMPT,
        temperature=0.2
    )

    if not result:
        return (
            "📷 *Medical Image Received*\n"
            "Our Gemini Vision model could not clearly resolve the scan details. "
            "Please ensure the image is well-lit, in focus, and send it again or consult a radiologist."
        )

    return result
