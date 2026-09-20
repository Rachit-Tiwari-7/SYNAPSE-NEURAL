"""
whatsapp_service — gemini_service.py
Google Gemini API Universal Client for Clinical Reasoning, Structured JSON, & Multimodal Vision.
Supports gemini-2.0-flash and gemini-1.5-flash with automatic failover and JSON parsing.
"""

import base64
import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple, Union
import httpx

from .config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def _format_messages_for_gemini(
    messages: List[Dict[str, str]]
) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Transforms generic chat messages (system, user, assistant) into Gemini API format:
    Extracts system prompt into system_instruction and normalizes conversation turns.
    """
    system_parts = []
    contents = []

    for msg in messages:
        role = msg.get("role", "user").lower()
        content = msg.get("content", "")

        if role == "system":
            system_parts.append({"text": content})
        elif role == "assistant":
            contents.append({
                "role": "model",
                "parts": [{"text": content}]
            })
        else:  # user or function
            contents.append({
                "role": "user",
                "parts": [{"text": content}]
            })

    system_instruction = {"parts": system_parts} if system_parts else None

    # Gemini requires contents to be non-empty. If only system was provided, add a prompt
    if not contents and system_parts:
        contents.append({
            "role": "user",
            "parts": [{"text": "Please proceed according to system instructions."}]
        })

    return system_instruction, contents


async def call_gemini(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    json_mode: bool = False,
    timeout: float = 30.0
) -> Optional[str]:
    """
    Asynchronously invokes the Google Gemini generateContent API.
    Attempts primary model (e.g. gemini-2.0-flash), then falls back to gemini-1.5-flash.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("[Gemini Service] GEMINI_API_KEY is not configured in environment.")
        # Check if fallback Groq/OpenRouter keys exist
        return await _fallback_to_groq_or_openrouter(messages, temperature, max_tokens, json_mode, timeout)

    candidate_models = [
        model or settings.GEMINI_MODEL,
        settings.GEMINI_FALLBACK_MODEL,
        "gemini-1.5-flash",
        "gemini-2.0-flash"
    ]
    # Remove duplicates while maintaining order
    models_to_try = []
    for m in candidate_models:
        if m and m not in models_to_try:
            models_to_try.append(m)

    system_instruction, contents = _format_messages_for_gemini(messages)
    temp = temperature if temperature is not None else settings.GEMINI_TEMPERATURE
    max_out = max_tokens or settings.GEMINI_MAX_TOKENS

    generation_config: Dict[str, Any] = {
        "temperature": temp,
        "maxOutputTokens": max_out
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    for candidate in models_to_try:
        url = f"{GEMINI_API_BASE}/{candidate}:generateContent?key={api_key}"
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config
        }
        if system_instruction:
            payload["system_instruction"] = system_instruction

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "")
                            logger.info(f"[Gemini Service] Successfully invoked {candidate} (Tokens: ~{len(text)//4})")
                            return text
                    logger.warning(f"[Gemini Service] Candidate {candidate} returned 200 but empty content.")
                elif res.status_code in (429, 503):
                    logger.warning(f"[Gemini Service] Model {candidate} returned HTTP {res.status_code} (Rate limit/Busy). Trying next candidate.")
                    continue
                else:
                    logger.warning(f"[Gemini Service] Model {candidate} failed with status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"[Gemini Service] Exception calling Gemini model {candidate}: {e}")

    # If all Gemini models fail, attempt secondary providers if present
    return await _fallback_to_groq_or_openrouter(messages, temperature, max_tokens, json_mode, timeout)


async def call_gemini_json(
    messages: List[Dict[str, str]],
    fallback_dict: Dict[str, Any],
    model: Optional[str] = None,
    temperature: float = 0.1
) -> Dict[str, Any]:
    """
    Executes a Gemini LLM request and guarantees structured JSON dictionary output.
    Handles json_mode, markdown stripping (```json ... ```), and regex fallbacks.
    """
    raw = await call_gemini(messages=messages, model=model, temperature=temperature, json_mode=True)
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

        # Direct parse attempt
        try:
            parsed = json.loads(clean_text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            # Regex extraction of outermost JSON
            match = re.search(r"(\{[\s\S]*\})", clean_text)
            if match:
                parsed = json.loads(match.group(1))
                if isinstance(parsed, dict):
                    return parsed
    except Exception as e:
        logger.warning(f"[Gemini Service] JSON parse failure: {e}")

    return fallback_dict


async def call_gemini_vision(
    prompt: str,
    image_bytes_or_base64: Union[bytes, str],
    mime_type: str = "image/jpeg",
    model: Optional[str] = None,
    system_instruction: Optional[str] = None,
    temperature: float = 0.2,
    json_mode: bool = False
) -> Optional[str]:
    """
    Multimodal medical scan / prescription OCR analysis using Gemini Vision (inlineData).
    Accepts raw bytes or base64 string directly.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("[Gemini Vision] GEMINI_API_KEY is not configured.")
        return None

    if isinstance(image_bytes_or_base64, bytes):
        b64_data = base64.b64encode(image_bytes_or_base64).decode("utf-8")
    else:
        # Strip data URL prefix if present
        b64_data = image_bytes_or_base64
        if "," in b64_data and "base64" in b64_data[:60]:
            parts = b64_data.split(",", 1)
            # Try to infer mime type from data url
            if ";" in parts[0] and "image" in parts[0]:
                mime_type = parts[0].split(";")[0].replace("data:", "")
            b64_data = parts[1]

    vision_model = model or settings.GEMINI_VISION_MODEL or "gemini-2.0-flash"
    url = f"{GEMINI_API_BASE}/{vision_model}:generateContent?key={api_key}"

    generation_config: Dict[str, Any] = {
        "temperature": temperature,
        "maxOutputTokens": 2048
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload: Dict[str, Any] = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": b64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": generation_config
    }

    if system_instruction:
        payload["system_instruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.error(f"[Gemini Vision] Request failed ({res.status_code}): {res.text[:200]}")
    except Exception as e:
        logger.error(f"[Gemini Vision] Exception during analysis: {e}")

    return None


async def _fallback_to_groq_or_openrouter(
    messages: List[Dict[str, str]],
    temperature: Optional[float],
    max_tokens: Optional[int],
    json_mode: bool,
    timeout: float
) -> Optional[str]:
    """Graceful fallback to Groq or OpenRouter if configured and Gemini is unavailable."""
    if settings.GROQ_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.GROQ_MODEL,
                "messages": messages,
                "temperature": temperature or 0.2,
                "max_tokens": max_tokens or 1500
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}

            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"[Fallback Groq] Failed: {e}")

    return None


# 100% Drop-in aliases for existing codebase interoperability
call_llm = call_gemini
call_llm_json = call_gemini_json
