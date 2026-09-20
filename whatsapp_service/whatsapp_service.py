"""
whatsapp_service — whatsapp_service.py
Unified facade re-exporting official Meta WhatsApp Cloud API services and handlers
powered by Google Gemini.
"""

from .meta_whatsapp_service import (
    process_whatsapp_inbound_webhook,
    trigger_emergency_sos_whatsapp,
    MAIN_MENU_TEXT,
    LOCALIZED_MENUS,
    LANGUAGE_SELECTION_MENU,
    format_response_for_whatsapp,
    format_compact_whatsapp_card,
    strip_markdown_to_plain_text,
    clear_deduplication_cache,
    message_deduplicator
)
from .meta_whatsapp_client import (
    send_whatsapp_message,
    send_whatsapp_image,
    send_whatsapp_interactive_buttons,
    download_meta_media,
    mark_message_as_read
)
from .gemini_service import (
    call_gemini,
    call_gemini_json,
    call_gemini_vision,
    call_llm,
    call_llm_json
)
from .prescription_ocr_service import (
    analyze_prescription_image,
    analyze_medical_scan
)

__all__ = [
    "process_whatsapp_inbound_webhook",
    "send_whatsapp_message",
    "send_whatsapp_image",
    "send_whatsapp_interactive_buttons",
    "download_meta_media",
    "mark_message_as_read",
    "trigger_emergency_sos_whatsapp",
    "MAIN_MENU_TEXT",
    "LOCALIZED_MENUS",
    "LANGUAGE_SELECTION_MENU",
    "format_response_for_whatsapp",
    "format_compact_whatsapp_card",
    "strip_markdown_to_plain_text",
    "clear_deduplication_cache",
    "message_deduplicator",
    "call_gemini",
    "call_gemini_json",
    "call_gemini_vision",
    "call_llm",
    "call_llm_json",
    "analyze_prescription_image",
    "analyze_medical_scan"
]
