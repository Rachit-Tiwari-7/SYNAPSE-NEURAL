"""
SynapseOS — agents/triage_agent.py
Clinical Symptom Triage & Risk Detection Agent.
Uses genuine LLM reasoning (Groq / OpenRouter) with deterministic safety heuristics.
Categorizes user symptoms into: Emergency (Red), Doctor Consult (Amber), Home Care (Green).
"""

import time
from typing import Dict, Any, List, Optional
from backend.app.core.state import SynapseOSState, AgentTraceStep
from backend.app.services.llm_service import call_llm_json
from backend.app.services.i18n_service import detect_text_language, LANGUAGE_NAME_MAP

SYMPTOM_TAXONOMY = {
    "red_flags": [
        "chest pain", "shortness of breath", "difficulty breathing", "unconscious",
        "hemoptysis", "hematemesis", "sudden paralysis", "severe head injury",
        "anaphylaxis", "severe allergic reaction", "cyanosis", "seizure",
        "chhati me dard", "saas lene me taklif", "behosh"
    ],
    "amber_flags": [
        "persistent fever", "fever over 102", "unexplained weight loss", "productive cough",
        "blood in stool", "severe abdominal pain", "jaundice", "yellow eyes",
        "persistent vomiting", "dysuria", "burning urination", "joint swelling",
        "tez bukhar", "pet me tez dard", "piliya", "ulti"
    ],
    "green_flags": [
        "mild headache", "runny nose", "sneezing", "sore throat", "mild body ache",
        "fatigue", "dry cough", "indigestion", "mild acidity", "minor scrape",
        "halka bukhar", "khansi", "sar dard", "thakan", "sardi"
    ]
}


async def analyze_symptoms(text: str, lang: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates clinical symptoms using live LLM inference (Gemini / Groq / OpenRouter),
    with deterministic safety taxonomy verification and native multilingual support.
    """
    text_lower = (text or "").lower()
    
    # Auto-detect language if not provided
    if not lang or lang == "en":
        effective_lang = detect_text_language(text, default="en")
    else:
        effective_lang = lang.lower()

    target_lang_name = LANGUAGE_NAME_MAP.get(effective_lang, "English")

    # ── Step 1: Deterministic pre-screen (always runs, used as fallback) ──────
    detected_red   = [s for s in SYMPTOM_TAXONOMY["red_flags"]   if s in text_lower]
    detected_amber = [s for s in SYMPTOM_TAXONOMY["amber_flags"] if s in text_lower]
    detected_green = [s for s in SYMPTOM_TAXONOMY["green_flags"] if s in text_lower]

    from backend.app.core.safety_router import is_pediatric_query
    is_ped = is_pediatric_query(text)

    if effective_lang == "hi":
        if detected_red:
            default_level = "EMERGENCY_CARE"
            default_badge = "🔴 आपातकालीन देखभाल (तत्काल)"
            default_action = "कृपया तुरंत नजदीकी आपातकालीन विभाग (ER) जाएं या 112 / 108 पर कॉल करें।"
            default_specialist = "बाल आपातकालीन विशेषज्ञ" if is_ped else "आपातकालीन चिकित्सा विशेषज्ञ / ट्रॉमा फिजिशियन"
        elif detected_amber:
            default_level = "DOCTOR_CONSULT"
            default_badge = "🟡 डॉक्टर परामर्श आवश्यक"
            default_action = "24 से 48 घंटे के भीतर किसी योग्य चिकित्सक से परामर्श लें।"
            default_specialist = "बाल रोग विशेषज्ञ (Pediatrician)" if is_ped else "जनरल फिजिशियन / इंटरनल मेडिसिन विशेषज्ञ"
        else:
            default_level = "HOME_CARE"
            default_badge = "🟢 घरेलू देखभाल एवं निगरानी"
            if is_ped:
                default_action = "बच्चे की स्थिति (पानी, तापमान, सक्रियता) पर नजर रखें। कभी भी वयस्क गोलियां (Dolo 650) न दें। बुखार 24 घंटे से अधिक रहे तो बाल रोग विशेषज्ञ से मिलें।"
                default_specialist = "बाल रोग विशेषज्ञ"
            else:
                default_action = "लक्षणों पर नजर रखें, पर्याप्त पानी पिएं, आराम करें और जरूरत पड़ने पर ओटीसी दवा लें।"
                default_specialist = "प्राथमिक स्वास्थ्य चिकित्सक"
        
        fallback = {
            "triage_level": default_level,
            "urgency_badge": default_badge,
            "is_pediatric": is_ped,
            "detected_symptoms": {
                "critical_flags": detected_red,
                "moderate_flags": detected_amber,
                "mild_flags": detected_green
            },
            "primary_clinical_impression": "लक्षणों के आधार पर — चिकित्सक द्वारा परीक्षण की सलाह दी जाती है।",
            "recommended_action": default_action,
            "recommended_specialist": default_specialist,
            "vitals_to_check": ["शरीर का तापमान", "रक्तचाप (BP)", "ऑक्सीजन स्तर (SpO2)", "नाड़ी दर (Pulse)"],
            "indian_home_remedies_or_otc": None if default_level == "EMERGENCY_CARE" else "Dolo 650 (केवल वयस्क), Electral ORS, Pan-40",
            "disclaimer": "यह एआई मूल्यांकन केवल मार्गदर्शन के लिए है और डॉक्टर की जांच का स्थान नहीं लेता।"
        }
    else:
        if detected_red:
            default_level = "EMERGENCY_CARE"
            default_badge = "🔴 Emergency Care (Immediate)"
            default_action = "Please proceed immediately to the nearest Emergency Department or call 108 (Ambulance) / 112."
            default_specialist = "Pediatric Emergency Specialist" if is_ped else "Emergency Medicine Physician / Trauma Specialist"
        elif detected_amber:
            default_level = "DOCTOR_CONSULT"
            default_badge = "🟡 Doctor Consultation Needed"
            default_action = "Schedule a consultation with a physician within 24 to 48 hours for clinical evaluation and testing."
            default_specialist = "Pediatrician" if is_ped else "General Physician / Internal Medicine Specialist"
        else:
            default_level = "HOME_CARE"
            default_badge = "🟢 Home Self-Care & Monitoring"
            if is_ped:
                default_action = "Monitor child closely (hydration, temperature, alertness). Never give adult tablets (Dolo 650). Consult a pediatrician if fever persists > 24 hours."
                default_specialist = "Registered Pediatrician"
            else:
                default_action = "Monitor symptoms, ensure adequate hydration, rest, and follow OTC symptom relief protocols. Seek medical care if symptoms worsen."
                default_specialist = "Primary Care Provider if symptoms persist > 5 days"

        fallback = {
            "triage_level": default_level,
            "urgency_badge": default_badge,
            "is_pediatric": is_ped,
            "detected_symptoms": {
                "critical_flags": detected_red,
                "moderate_flags": detected_amber,
                "mild_flags": detected_green
            },
            "primary_clinical_impression": "Based on reported symptoms — clinical evaluation recommended.",
            "recommended_action": default_action,
            "recommended_specialist": default_specialist,
            "vitals_to_check": ["Body Temperature", "Blood Pressure", "SpO2 (Oxygen Saturation)", "Pulse Rate"],
            "indian_home_remedies_or_otc": None if default_level == "EMERGENCY_CARE" else "Dolo 650 (adult only), Electral ORS, Pan-40",
            "disclaimer": "This clinical triage assessment is for guidance and does not replace in-person physician diagnosis."
        }

    # ── Step 2: LLM Clinical Reasoning ───────────────────
    lang_prompt_instruction = ""
    if effective_lang != "en":
        lang_prompt_instruction = (
            f"MANDATORY: Write the string values ('urgency_badge', 'primary_clinical_impression', 'recommended_action', 'recommended_specialist', 'vitals_to_check', 'indian_home_remedies_or_otc') "
            f"in {target_lang_name} using its native script (e.g., Devanagari for Hindi). Do NOT return English text."
        )

    system_prompt = (
        "You are a senior clinical triage AI for Synapse-OS, an Indian public healthcare platform.\n"
        "Analyze the patient's reported symptoms and produce a structured JSON triage assessment.\n\n"
        "Return ONLY a valid JSON object with exactly these keys:\n"
        "{\n"
        '  "triage_level": "EMERGENCY_CARE" | "DOCTOR_CONSULT" | "HOME_CARE",\n'
        '  "urgency_badge": "short human-readable badge string with emoji",\n'
        '  "primary_clinical_impression": "1-2 sentence most likely diagnosis or differential",\n'
        '  "recommended_action": "clear, specific next-step instruction for the patient",\n'
        '  "recommended_specialist": "specialist type or department",\n'
        '  "vitals_to_check": ["list", "of", "vitals"],\n'
        '  "indian_home_remedies_or_otc": "OTC/home care advice using Indian brands (Dolo 650, Electral ORS, Pan-40) if HOME_CARE — null for emergencies",\n'
        '  "disclaimer": "standard medical disclaimer"\n'
        "}\n\n"
        f"{lang_prompt_instruction}\n\n"
        "Rules:\n"
        "- If ANY red-flag symptom is present (chest pain, stroke signs, severe breathing difficulty, "
        "anaphylaxis, heavy bleeding, seizure, unconsciousness) → ALWAYS return EMERGENCY_CARE.\n"
        "- Use Indian clinical context: mention Dolo 650, Electral ORS, Pan-40, Cetirizine etc. for home care.\n"
        "- If pediatric query: strictly warn against adult tablets.\n"
        "- Be concise and clinically accurate. No markdown. Pure JSON only."
    )

    user_prompt = (
        f"Patient Symptom Report: {text}\n"
        f"Language: {target_lang_name} ({effective_lang})\n\n"
        f"Deterministic pre-screen detected:\n"
        f"  Critical flags: {detected_red or 'None'}\n"
        f"  Moderate flags: {detected_amber or 'None'}\n"
        f"  Mild flags:     {detected_green or 'None'}\n"
        f"  Is Pediatric:   {is_ped}\n\n"
        "Provide your full structured clinical triage assessment as JSON."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt}
    ]

    llm_result = await call_llm_json(messages=messages, fallback_dict=fallback, temperature=0.1)

    # ── Step 3: Safety override — LLM must never downgrade a red-flag case ───
    if detected_red and llm_result.get("triage_level") != "EMERGENCY_CARE":
        llm_result["triage_level"]    = "EMERGENCY_CARE"
        llm_result["urgency_badge"]   = "🔴 आपातकालीन देखभाल (तत्काल)" if effective_lang == "hi" else "🔴 Emergency Care (Immediate)"
        llm_result["recommended_action"] = default_action

    # Ensure detected_symptoms and is_pediatric are always present for downstream agents
    if "detected_symptoms" not in llm_result:
        llm_result["detected_symptoms"] = fallback["detected_symptoms"]
    llm_result["is_pediatric"] = is_ped

    return llm_result


async def triage_agent_node(state: SynapseOSState) -> SynapseOSState:
    """LangGraph node execution for Symptom Triage."""
    start = time.time()
    res = await analyze_symptoms(state.input_text, lang=state.language)
    state.triage_data = res

    duration = int((time.time() - start) * 1000)
    state.trace.append(AgentTraceStep(
        agent_name="Clinical Symptom Triage Agent (Gemini / Swarm)",
        action=f"Classified symptoms -> {res.get('urgency_badge', 'Assessed')}",
        duration_ms=duration,
        details={"level": res.get("triage_level"), "specialist": res.get("recommended_specialist")}
    ))
    return state

