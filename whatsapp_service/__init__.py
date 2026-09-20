"""
Synapse-OS — WhatsApp Service (Gemini Powered)
Standalone, high-performance WhatsApp Omni-channel conversational intelligence service
integrated directly with the Google Gemini API.
"""

from .whatsapp_service import (
    process_whatsapp_inbound_webhook,
    send_whatsapp_message,
    send_whatsapp_image,
    send_whatsapp_interactive_buttons,
    download_meta_media,
    trigger_emergency_sos_whatsapp,
    MAIN_MENU_TEXT,
    format_response_for_whatsapp,
    format_compact_whatsapp_card,
    clear_deduplication_cache,
    message_deduplicator
)

__all__ = [
    "process_whatsapp_inbound_webhook",
    "send_whatsapp_message",
    "send_whatsapp_image",
    "send_whatsapp_interactive_buttons",
    "download_meta_media",
    "trigger_emergency_sos_whatsapp",
    "MAIN_MENU_TEXT",
    "format_response_for_whatsapp",
    "format_compact_whatsapp_card",
    "clear_deduplication_cache",
    "message_deduplicator"
]
