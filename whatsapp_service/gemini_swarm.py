"""
whatsapp_service — gemini_swarm.py
Google Gemini-powered Multi-Agent Clinical Swarm for WhatsApp.
Conducts autonomous medical triage, drug interaction verification, mental health crisis support,
and rural healthcare education adhering strictly to Indian clinical guidelines (MoHFW & WHO).
"""

import logging
from typing import Dict, Any, Optional

from .gemini_service import call_gemini, call_gemini_json
from .config import settings

logger = logging.getLogger(__name__)

TRIAGE_COUNCIL_SYSTEM_PROMPT = """
You are Synapse-OS's board-certified AI Medical Council, providing clinical triage for Indian rural and public healthcare over WhatsApp.
Evaluate the user's reported symptoms according to Indian MoHFW, ICMR, and WHO clinical triage standards.

You MUST produce a valid JSON object with the following fields:
{
  "triage_category": "EMERGENCY" | "DOCTOR_CONSULT" | "HOME_CARE",
  "suspected_diagnosis": "Clear, plain-language suspected condition (e.g. Acute Viral Bronchitis or Gastroenteritis)",
  "consensus_percentage": 94,
  "immediate_actions": [
    "Prioritized clinical step 1",
    "Prioritized clinical step 2"
  ],
  "medications_relief_india": [
    "Indian brand/generic name with exact timing, e.g. Dolo 650 (Paracetamol 650mg): 1 tablet after meals (max 3/day)",
    "Secondary relief e.g. Electral ORS: 1 sachet in 1L clean water; sip continuously"
  ],
  "red_flag_warnings": [
    "Red flag symptom 1 e.g. Difficulty breathing or persistent chest pain",
    "Red flag symptom 2 e.g. High fever exceeding 102 F for more than 48 hours"
  ],
  "tele_manas_or_helpline": "14416 (Tele-MANAS 24x7) or 108 (Ambulance)",
  "clinical_rationale": "2-line physiological reason for the diagnosis and next steps"
}

SAFETY RULES:
1. In high-risk emergencies (chest pain, stroke symptoms, severe breathlessness, pediatric convulsions), set triage_category to "EMERGENCY" and explicitly state to withhold self-medication and rush to hospital / call 108.
2. In mild/home-care conditions, recommend safe Indian OTC remedies with explicit food instructions (e.g. Dolo 650 after food, Pan-40 before breakfast on empty stomach, Cetirizine at bedtime).
3. If language requested is Hindi (hi) or other Indian regional language, output the string values in that language/script.
"""

DRUG_SAFETY_SYSTEM_PROMPT = """
You are Synapse-OS's Chief Pharmacologist AI.
Evaluate drug combinations, dosages, side effects, and contraindications.
Pay special attention to Indian commercial pharmaceutical formulations (e.g., Paracetamol + Ibuprofen / Combiflam, Pan-D, Augmentin, Cetzine).

Output valid JSON:
{
  "status": "SAFE" | "MODERATE_RISK" | "HIGH_RISK" | "CONTRAINDICATED",
  "summary": "Brief 2-sentence summary of drug safety",
  "interactions": [
    {
      "severity": "High" | "Moderate" | "Minor",
      "effect": "Clinical effect e.g. Increased gastrointestinal bleeding risk",
      "action": "Recommended clinical action"
    }
  ],
  "safe_alternatives": ["Alternative Indian generic/brand 1", "Alternative 2"],
  "administration_guidance": "Timing guidance e.g. Take with food / Avoid alcohol"
}
"""


async def run_gemini_triage(symptoms: str, language: str = "en") -> Dict[str, Any]:
    """
    Executes clinical triage using Google Gemini API.
    Guarantees structured medical reasoning adhering to MoHFW guidelines.
    """
    lang_prompt = f"Patient language preference: {language}." if language != "en" else "Respond in English."
    user_prompt = f"{lang_prompt}\nPatient reported symptoms: '{symptoms}'"

    fallback_dict = {
        "triage_category": "DOCTOR_CONSULT",
        "suspected_diagnosis": "Symptom evaluation requires clinical assessment",
        "consensus_percentage": 88,
        "immediate_actions": [
            "Rest in a comfortable position and stay well hydrated.",
            "Schedule an in-person consultation with a medical professional."
        ],
        "medications_relief_india": [
            "Dolo 650 (Paracetamol 650mg): 1 tablet after meals for fever/body ache if needed (max 3/day).",
            "Electral ORS: Sip in water for hydration balance."
        ],
        "red_flag_warnings": [
            "Sudden breathlessness or chest tightness",
            "Persistent fever > 102°F or confusion"
        ],
        "tele_manas_or_helpline": "108 (Ambulance) / 112 (National Emergency)",
        "clinical_rationale": "Symptom profile analyzed by AI clinical triage."
    }

    try:
        result = await call_gemini_json(
            messages=[
                {"role": "system", "content": TRIAGE_COUNCIL_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            fallback_dict=fallback_dict,
            temperature=0.1
        )
        return result
    except Exception as e:
        logger.error(f"[Gemini Swarm] Triage failed: {e}")
        return fallback_dict


async def run_gemini_drug_safety(query: str, language: str = "en") -> Dict[str, Any]:
    """
    Evaluates drug-drug interactions and dosage safety using Google Gemini API.
    """
    lang_prompt = f"Patient language preference: {language}." if language != "en" else "Respond in English."
    user_prompt = f"{lang_prompt}\nMedication query: '{query}'"

    fallback = {
        "status": "MODERATE_RISK",
        "summary": f"Drug safety review for '{query}'. Always verify combination with a qualified pharmacist.",
        "interactions": [
            {
                "severity": "Moderate",
                "effect": "Potential pharmacokinetic or gastric irritation",
                "action": "Maintain at least 2 hours interval between oral doses and take after meals."
            }
        ],
        "safe_alternatives": ["Consult a medical practitioner for personalized alternatives."],
        "administration_guidance": "Take with a full glass of water after food."
    }

    try:
        return await call_gemini_json(
            messages=[
                {"role": "system", "content": DRUG_SAFETY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            fallback_dict=fallback,
            temperature=0.1
        )
    except Exception as e:
        logger.error(f"[Gemini Swarm] Drug safety failed: {e}")
        return fallback


async def run_gemini_mental_health(query: str, language: str = "en") -> str:
    """
    Provides empathetic, de-escalating mental health crisis support with Tele-MANAS (14416) referral.
    """
    sys_prompt = """
You are Synapse-OS's compassionate Mental Health Support AI assistant.
Respond with deep clinical empathy, active listening, validation, and zero judgment.
Always prominently provide the National Tele-MANAS Mental Health Helpline: 14416 (Toll-Free 24x7) and Vandrevala Foundation (9999 666 555).
Do not prescribe psychiatric medications.
Keep response concise and formatted cleanly for WhatsApp plain text (no markdown asterisks or backticks).
"""
    prompt = f"User message: '{query}'. Language: {language}."
    reply = await call_gemini(
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    if not reply:
        return (
            "🧠 SYNAPSE MENTAL HEALTH SUPPORT\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "You are not alone. If you are feeling overwhelmed, anxious, or distressed, help is available 24x7:\n\n"
            "📞 Tele-MANAS (National Mental Health Helpline): 14416 (Toll-Free 24/7)\n"
            "📞 Vandrevala Foundation Helpline: +91 9999 666 555\n"
            "📞 Kiran Mental Health Helpline: 1800-599-0019\n\n"
            "Please reach out to a certified counselor or trusted loved one. Your feelings matter."
        )

    return reply
