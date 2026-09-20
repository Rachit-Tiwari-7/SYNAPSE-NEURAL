"""
SynapseOS — services/llm_service.py
Google Gemini 2.0 Multimodal AI Service.
Exclusively powers the multi-agent clinical reasoning, Indic vernacular translation,
and multimodal medical vision across Synapse-OS.
"""

import json
import logging
import re
import httpx
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


async def call_gemini(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 500,
    json_mode: bool = False,
    timeout: float = 12.0
) -> Optional[str]:
    """
    Primary Google Gemini Generative API client for Synapse-OS.
    Powers the multimodal hero intelligence layer: clinical reasoning, Indic dialect synthesis,
    vernacular explanation, and multi-agent consensus.
    """
    if not settings.GEMINI_API_KEY:
        return None

    gemini_models = [
        model or settings.GEMINI_MODEL or "gemini-2.0-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-lite",
    ]
    # Remove duplicates preserving order
    seen = set()
    candidate_models = [m for m in gemini_models if m and not (m in seen or seen.add(m))]

    # Format messages for Gemini API
    system_text = None
    contents = []
    for msg in messages:
        role = msg.get("role", "user")
        text = msg.get("content", "")
        if role == "system":
            system_text = text if not system_text else f"{system_text}\n\n{text}"
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": text}]})
        else:
            contents.append({"role": "user", "parts": [{"text": text}]})

    if not contents:
        contents.append({"role": "user", "parts": [{"text": "Hello"}]})

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
        }
    }
    if system_text:
        payload["systemInstruction"] = {"parts": [{"text": system_text}]}
    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    for cand in candidate_models:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{cand}:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            text_out = parts[0]["text"].strip()
                            if text_out:
                                return text_out
                else:
                    logger.warning(f"Google Gemini [{cand}] returned {res.status_code}: {res.text[:120]}")
        except Exception as e:
            logger.warning(f"Google Gemini [{cand}] connection error: {e}")

    return None


async def call_gemini_vision(
    image_base64: str,
    prompt: str,
    mime_type: str = "image/jpeg",
    model: Optional[str] = None,
    timeout: float = 25.0
) -> Optional[str]:
    """
    Multimodal Google Gemini Vision client for handwritten Indian prescriptions and medical documents.
    """
    if not settings.GEMINI_API_KEY:
        return None

    clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
    target_model = model or settings.GEMINI_MODEL or "gemini-2.0-flash"
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": clean_b64
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024
        }
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(endpoint, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
            else:
                logger.warning(f"Gemini Vision [{target_model}] returned {res.status_code}: {res.text[:140]}")
    except Exception as e:
        logger.warning(f"Gemini Vision call failed: {e}")

    return None


async def call_openrouter_chat(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 800,
    timeout: float = 20.0
) -> Optional[str]:
    """
    OpenRouter API Client with primary & fallback models for Synapse-OS.
    Prioritizes openai/gpt-oss-120b and free tiers (nvidia/nemotron-3-super-120b-a12b:free, etc.).
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    candidate_models_raw = [
        model,
        settings.OPENROUTER_MODEL,
        settings.OPENROUTER_PRIMARY_MODEL,
        "openai/gpt-oss-120b",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "dots-studio/dots-3-note-preview:free",
        "inclusionai/ling-3.0-flash-sante:free",
        "inclusionai/ling-3.0-flash-vl:free",
        "openrouter/free"
    ]
    seen = set()
    candidate_models = [m for m in candidate_models_raw if m and not (m in seen or seen.add(m))]

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.OPENROUTER_REFERER or "https://synapseos.health",
        "X-Title": settings.OPENROUTER_APP_TITLE or "SynapseOS Medical AI"
    }

    for cand_model in candidate_models:
        payload = {
            "model": cand_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        msg_obj = choices[0]["message"]
                        text_out = (msg_obj.get("content") or msg_obj.get("reasoning") or "").strip()
                        if text_out:
                            return text_out
                else:
                    logger.warning(f"OpenRouter [{cand_model}] returned status {res.status_code}: {res.text[:120]}")
        except Exception as e:
            logger.warning(f"OpenRouter [{cand_model}] request failed: {e}")

    return None


async def call_llm(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 800,
    json_mode: bool = False,
    timeout: float = 18.0
) -> Optional[str]:
    """
    Unified LLM Client supporting OpenRouter (oss 120b / free models) and Google Gemini.
    Falls back gracefully across providers.
    """
    # 1. Primary: OpenRouter API (openai/gpt-oss-120b, nvidia/nemotron-3-super-120b-a12b:free, etc.)
    if settings.OPENROUTER_API_KEY:
        or_result = await call_openrouter_chat(
            messages=messages,
            model=model if model and (":" in model or "oss" in model or "nvidia" in model or "openrouter" in model) else None,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout
        )
        if or_result and len(or_result.strip()) > 5:
            return or_result

    # 2. Secondary: Google Gemini API (if Gemini key available)
    if settings.GEMINI_API_KEY:
        gemini_result = await call_gemini(
            messages=messages,
            model=model if model and "gemini" in model else None,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=json_mode,
            timeout=timeout
        )
        if gemini_result:
            return gemini_result

    return None


async def call_llm_json(
    messages: List[Dict[str, str]],
    fallback_dict: Dict[str, Any],
    model: Optional[str] = None,
    temperature: float = 0.1
) -> Dict[str, Any]:
    """
    Executes an LLM request and guarantees a structured JSON dictionary output.
    Gracefully handles empty responses, markdown wrapping, code blocks, and failovers.
    """
    raw = await call_llm(messages=messages, model=model, temperature=temperature, json_mode=True)
    if not raw or not isinstance(raw, str) or not raw.strip():
        return fallback_dict
        
    try:
        clean_text = raw.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        if not clean_text:
            return fallback_dict

        try:
            parsed = json.loads(clean_text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            # Extract JSON substring from possible preamble/postamble
            start_idx = clean_text.find("{")
            end_idx = clean_text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = clean_text[start_idx:end_idx+1]
                parsed = json.loads(json_str)
                if isinstance(parsed, dict):
                    return parsed
            raise
    except Exception as e:
        logger.warning(f"Error parsing LLM response as JSON: {e}")

    return fallback_dict


async def call_nutrition_llm_with_fallbacks(
    messages: List[Dict[str, str]],
    fallback_text: str = ""
) -> str:
    """
    Multi-tiered Fallback Chain for Nutrition Assistant:
    1. OpenRouter API (openai/gpt-oss-120b, nvidia/nemotron-3-super-120b-a12b:free, etc.)
    2. Google Gemini API (Gemini 2.0 Flash)
    3. Deterministic ICMR-NIN Curated Rules Fallback
    """
    # 1. Try OpenRouter API
    res_openrouter = await call_openrouter_chat(messages, timeout=20.0, max_tokens=1000)
    if res_openrouter and len(res_openrouter.strip()) > 20:
        return res_openrouter

    # 2. Try Gemini API
    res_gemini = await call_gemini(messages, temperature=0.3, max_tokens=600)
    if res_gemini and len(res_gemini.strip()) > 20:
        return res_gemini

    # 3. Deterministic Fallback
    return fallback_text

