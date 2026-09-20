"""
whatsapp_service — config.py
Centralized configuration for WhatsApp Service powered natively by Google Gemini API.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Try loading from local directory .env first, then parent workspace .env
local_env = Path(__file__).parent / ".env"
root_env = Path(__file__).resolve().parent.parent / ".env"

if local_env.exists():
    load_dotenv(local_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()


class WhatsAppServiceSettings:
    """Settings for WhatsApp Service with direct Google Gemini API integration."""

    # 1. Google Gemini API Configuration (Primary LLM & Multimodal Vision)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_FALLBACK_MODEL: str = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-1.5-flash")
    GEMINI_VISION_MODEL: str = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))

    # Optional secondary fallback keys (if user also specifies them)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # 2. Meta WhatsApp Cloud API Configuration
    WHATSAPP_CLOUD_API_TOKEN: str = os.getenv("WHATSAPP_CLOUD_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = os.getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "synapse_secret_token_123")
    WHATSAPP_API_VERSION: str = os.getenv("WHATSAPP_API_VERSION", "v20.0")

    # 3. Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    # 4. Service Defaults
    DEFAULT_LANGUAGE: str = "en"
    SESSION_TTL_SECONDS: int = 1800  # 30 minutes in-memory conversation state


settings = WhatsAppServiceSettings()
