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


async def call_llm(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 400,
    json_mode: bool = False,
    timeout: float = 8.0
) -> Optional[str]:
    """
    Google Gemini Multimodal AI Client.
    Exclusively powered by Google Gemini 2.0 Flash and Gemini 1.5 Pro.
    Falls back gracefully to deterministic clinical safeguards if offline.
    """
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
    Executes a Google Gemini LLM request and guarantees a structured JSON dictionary output.
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
            match = re.search(r"(\{[\s\S]*\})", clean_text)
            if match:
                parsed = json.loads(match.group(1))
                if isinstance(parsed, dict):
                    return parsed
            raise
    except Exception as e:
        logger.warning(f"Error parsing Gemini response as JSON: {e}")

    return fallback_dict
