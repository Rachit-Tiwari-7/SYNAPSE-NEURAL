# 🌿 Synapse-OS — WhatsApp Healthcare Service (Google Gemini Powered)

A standalone, high-performance **Meta WhatsApp Cloud API (Graph API v20.0)** microservice integrated directly with **Google Gemini API** (`gemini-2.0-flash` & `gemini-1.5-flash`) for clinical intelligence, drug-drug safety evaluation, and multimodal prescription OCR vision.

---

## 🌟 Key Features

1. **Google Gemini LLM Clinical Triage**
   - Autonomous clinical reasoning adhering to Indian **MoHFW, ICMR, and WHO** triage protocols.
   - Dynamic consensus calculation, clinical rationale, prioritized actions, and red-flag symptom warnings.

2. **Google Gemini Multimodal Vision (Prescription & Scan OCR)**
   - Upload prescription or diagnostic scan photos via WhatsApp.
   - Gemini Vision transcribes doctor handwriting, dosages, timing (e.g. before/after food), and flags drug-drug contraindications.

3. **Strict WhatsApp Clinical Messaging Protocol (`AGENTS.md`)**
   - Emits clean, normal **plain text** without markdown asterisks (`*`), backticks, or hashes.
   - Distinct status badges: `🔴 EMERGENCY`, `🟡 CLINICAL CONSULT`, `🟢 HOME CARE`.
   - Clear divider: `━━━━━━━━━━━━━━━━━━━━`.
   - Indian pharmacy relief brands: **Dolo 650, Electral ORS, Pan-40, Cetirizine**.
   - Direct emergency helpline referrals: **108 (Ambulance), 112 (National Emergency), 14416 (Tele-MANAS)**.

4. **11 Indian Regional Languages**
   - English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), ਪੰਜਾਬੀ (Punjabi), and ଓଡ଼ିଆ (Odia).
   - Fast language switching by texting `lang` or `भाषा`.

5. **Sandbox Simulation Mode**
   - Test locally out-of-the-box without needing live Meta WhatsApp Cloud credentials or public webhook tunnels.

---

## 📁 Directory Structure

```text
whatsapp_service/
├── __init__.py                  # Package facade
├── config.py                    # Settings (GEMINI_API_KEY, Meta WhatsApp tokens)
├── gemini_service.py            # Direct Google Gemini API client (Text & Vision)
├── gemini_swarm.py              # Gemini-powered clinical triage, pharmacology, and mental health
├── meta_whatsapp_client.py      # Meta Cloud API outbound client & sandbox simulator
├── meta_whatsapp_service.py     # Inbound webhook ingestion, menus, and protocol formatter
├── prescription_ocr_service.py  # Gemini Vision prescription & scan reader
├── session_manager.py           # In-memory conversational state & language tracker
├── i18n_service.py              # 11 Indian languages script detector & clinical translations
├── whatsapp_service.py          # Unified service module exports
├── main.py                      # Standalone FastAPI server with webhooks & simulation
├── test_whatsapp_service.py     # Pytest automated test suite
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment configuration template
└── README.md                    # Documentation
```

---

## 🚀 Getting Started

### 1. Configure Environment

Copy `.env.example` to `.env` in the `whatsapp_service` directory:

```bash
cp whatsapp_service/.env.example whatsapp_service/.env
```

Add your Google Gemini API key:

```ini
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

*(Optional: Add `WHATSAPP_CLOUD_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` for live production WhatsApp dispatch).*

---

### 2. Install Dependencies

```bash
pip install -r whatsapp_service/requirements.txt
```

---

### 3. Run the Service Standalone

```bash
python -m uvicorn whatsapp_service.main:app --host 0.0.0.0 --port 8001 --reload
```

Interactive Swagger API documentation will be available at:
👉 **http://localhost:8001/docs**

---

### 4. Run Automated Tests

Execute the unit and integration tests:

```bash
pytest whatsapp_service/test_whatsapp_service.py -v
```

---

## 🧪 Testing with cURL / Simulation

### A. Symptom Triage (English)
```bash
curl -X POST http://localhost:8001/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"sender_phone": "919876543210", "message": "1 I have high fever, dry cough, and headache"}'
```

### B. Symptom Triage (Hindi)
```bash
curl -X POST http://localhost:8001/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"sender_phone": "919876543210", "message": "1 मुझे 3 दिन से तेज बुखार और सीने में दर्द है"}'
```

### C. Drug Interaction Check
```bash
curl -X POST http://localhost:8001/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"sender_phone": "919876543210", "message": "2 Aspirin with Ibuprofen"}'
```

### D. Emergency SOS Trigger
```bash
curl -X POST http://localhost:8001/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"sender_phone": "919876543210", "message": "sos"}'
```

---

## 🌐 Meta WhatsApp Cloud API Production Setup

1. In the **Meta for Developers Dashboard**, navigate to **WhatsApp > Configuration**.
2. Set Callback URL: `https://your-domain.com/whatsapp/webhook`
3. Set Verify Token: `synapse_secret_token_123` (or the token configured in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`).
4. Subscribe to the `messages` webhook field.
5. Provide `WHATSAPP_CLOUD_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in your `.env`.
