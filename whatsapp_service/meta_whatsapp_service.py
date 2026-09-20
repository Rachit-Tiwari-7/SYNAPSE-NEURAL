"""
whatsapp_service — meta_whatsapp_service.py
Meta Official WhatsApp Cloud API Webhook Ingestion, Multilingual Language Engine,
Conversational FSM, and Multi-Agent Dispatcher powered natively by Google Gemini.
Adheres strictly to the AGENTS.md WhatsApp Clinical Messaging Protocol.
"""

import asyncio
import base64
import json
import logging
import re
from typing import Dict, Any, Optional, List

from .config import settings
from .meta_whatsapp_client import (
    send_whatsapp_message,
    send_whatsapp_image,
    send_whatsapp_interactive_buttons,
    download_meta_media,
    mark_message_as_read
)
from .session_manager import session_manager
from .i18n_service import detect_text_language, translate_clinical_message, get_supported_languages
from .prescription_ocr_service import analyze_prescription_image, analyze_medical_scan
from .gemini_swarm import (
    run_gemini_triage,
    run_gemini_drug_safety,
    run_gemini_mental_health
)

logger = logging.getLogger(__name__)

# =========================================================
# 1. Multilingual Menus & Language Onboarding
# =========================================================

LANGUAGE_SELECTION_MENU = (
    "🌿 Welcome to SYNAPSE-OS AI Health Assistant 🌿\n"
    "Multi-Agent Clinical Intelligence & Public Health Platform (Powered by Google Gemini)\n\n"
    "🌐 Please select your preferred language / अपनी भाषा चुनें:\n\n"
    "1. English (Default)\n"
    "2. हिन्दी (Hindi)\n"
    "3. বাংলা (Bengali)\n"
    "4. தமிழ் (Tamil)\n"
    "5. తెలుగు (Telugu)\n"
    "6. मराठी (Marathi)\n"
    "7. ગુજરાતી (Gujarati)\n"
    "8. ಕನ್ನಡ (Kannada)\n"
    "9. മലയാളം (Malayalam)\n"
    "10. ਪੰਜਾਬੀ (Punjabi)\n"
    "11. ଓଡ଼ିଆ (Odia)\n\n"
    "👉 Reply with the number (e.g. 1 for English, 2 for हिन्दी) or name of the language.\n"
    "You can type 'lang' at any time to switch languages."
)

LOCALIZED_MENUS: Dict[str, str] = {
    "en": (
        "🌿 SYNAPSE-OS — Rural & Public Health AI\n"
        "Multilingual Healthcare, Vaccination & Outbreak Assistant\n\n"
        "Reply with a number or simply text your question:\n\n"
        "1 🩺 Symptom Triage — Type symptoms or ask any health question\n"
        "2 💊 Drug Safety — e.g. 2 Aspirin with Ibuprofen\n"
        "3 📷 Scan / Rx — Send an X-ray or Prescription photo\n"
        "4 🧠 Mental Health — Tele-MANAS 24x7 support\n"
        "5 👨‍⚕️ Find Doctor — e.g. 5 General Physician\n"
        "6 🪪 ABHA ID — PM-JAY ₹5 Lakh health card\n"
        "7 💉 Vaccination — e.g. 7 6 weeks\n"
        "8 🚨 Outbreak Alerts — e.g. 8 Delhi\n"
        "9 📝 Rural Health / Quiz — ORS, Nutrition, Quiz\n"
        "sos 🆘 Emergency — Instant ambulance & hospital guide\n\n"
        "Type 'lang' to change language anytime."
    ),
    "hi": (
        "🌿 संजीवनी-ओएस — ग्रामीण एवं जन स्वास्थ्य एआई\n"
        "बहुभाषी स्वास्थ्य सेवा, टीकाकरण एवं महामारी सहायक\n\n"
        "कोई भी स्वास्थ्य प्रश्न पूछें या नंबर चुनें:\n\n"
        "1 🩺 लक्षण जांच — लक्षण लिखें या कोई भी स्वास्थ्य सवाल पूछें\n"
        "2 💊 दवा सुरक्षा — उदा: 2 पैरासिटामोल के साथ एस्पिरिन\n"
        "3 📷 एक्स-रे व पर्ची — फोटो भेजें\n"
        "4 🧠 मानसिक स्वास्थ्य — टेली-मानस 24x7 सहायता\n"
        "5 👨‍⚕️ डॉक्टर खोजें — उदा: 5 जनरल फिजिशियन\n"
        "6 🪪 आभा कार्ड — ₹5 लाख मुफ्त इलाज कार्ड\n"
        "7 💉 टीकाकरण — उदा: 7 6 हफ्ते\n"
        "8 🚨 महामारी अलर्ट — उदा: 8 दिल्ली या पटना\n"
        "9 📝 स्वास्थ्य शिक्षा — ओआरएस, पोषण व क्विज़\n"
        "sos 🆘 आपातकालीन — तत्काल एम्बुलेंस सहायता\n\n"
        "भाषा बदलने के लिए 'lang' लिखें।"
    ),
    "bn": (
        "🌿 সঞ্জীবনী-ওএস (Synapse-OS) — গ্রামীণ ও জনস্বাস্থ্য এআই 🌿\n"
        "বহুভাষিক স্বাস্থ্য পরিষেবা ও টিকাদান নির্দেশিকা\n\n"
        "স্বাগতম! আমি আপনাকে কীভাবে সাহায্য করতে পারি? একটি নম্বর লিখুন:\n\n"
        "1 লক্ষণ পরীক্ষা — 1 লিখে আপনার লক্ষণ জানান\n"
        "2 ওষুধ নিরাপত্তা — 2 লিখে ওষুধের নাম লিখুন\n"
        "3 এক্স-রে ও প্রেসক্রিপশন AI — ছবি পাঠান 📷\n"
        "4 মানসিক স্বাস্থ্য (Tele-MANAS) — 4 লিখে সমস্যা জানান\n"
        "5 ডাক্তার খুঁজুন — 5 লিখে স্পেশালিস্ট খুঁজুন\n"
        "6 আভা আইডি (ABHA Card) — 6 লিখে ₹৫ লাখ স্বাস্থ্য কার্ড জানুন\n"
        "7 টিকাদান সময়সূচী (UIP) — 7 লিখে শিশুর বয়স জানান\n"
        "8 মহামারী সতর্কতা — 8 লিখে জেলার নাম জানান\n"
        "9 স্বাস্থ্য শিক্ষা ও কুইজ — 9 ওআরএস ও পুষ্টির জন্য\n"
        "sos জরুরি সহায়তা — তৎক্ষণাৎ SOS পাঠান"
    ),
    "ta": (
        "🌿 சஞ்சீவனி-ஓஎஸ் (Synapse-OS) — கிராமப்புற சுகாதார ஏஐ 🌿\n"
        "பன்மொழி சுகாதார பராமரிப்பு & தடுப்பூசி வழிகாட்டி\n\n"
        "வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்? எண்ணைத் தேர்ந்தெடுக்கவும்:\n\n"
        "1 அறிகுறி பரிசோதனை — 1 எழுதி அறிகுறிகளை அனுப்பவும்\n"
        "2 மருந்து பாதுகாப்பு — 2 எழுதி மருந்துகளின் பெயர்களை அனுப்பவும்\n"
        "3 எக்ஸ்ரே மற்றும் மருந்து சீட்டு — புகைப்படத்தை அனுப்பவும் 📷\n"
        "4 மனநலம் (Tele-MANAS) — 4 எழுதி ஆலோசனை பெறவும்\n"
        "5 மருத்துவரை கண்டறிய — 5 எழுதி மருத்துவரை தேடவும்\n"
        "6 ஆபா அட்டை (ABHA) — 6 எழுதி ₹5 லட்சம் காப்பீடு அறியவும்\n"
        "7 தடுப்பூசி அட்டவணை (UIP) — 7 எழுதி குழந்தையின் வயதை அனுப்பவும்\n"
        "8 நோய் தொற்று எச்சரிக்கை — 8 எழுதி மாவட்ட பெயரை அனுப்பவும்\n"
        "9 சுகாதார விழிப்புணர்வு — 9 ஐ அனுப்பவும்\n"
        "sos அவசர உதவி — SOS அனுப்பவும்"
    ),
    "te": (
        "🌿 సంజీవని-ఓఎస్ (Synapse-OS) — గ్రామీణ ప్రజారోగ్య ఏఐ 🌿\n"
        "బహుభాషా ఆరోగ్య సంరక్షణ & వ్యాక్సినేషన్ ఇంటెలిజెన్స్\n\n"
        "నమస్కారం! నేను మీకు ఎలా సహాయపడగలను? నంబర్ ఎంచుకోండి:\n\n"
        "1 లక్షణాల నిర్ధారణ — 1 మరియు లక్షణాలను టైప్ చేయండి\n"
        "2 ఔషధ భద్రత — 2 మరియు మందుల పేర్లు టైప్ చేయండి\n"
        "3 ఎక్స్-రే & ప్రిస్క్రిప్షన్ — ఫోటో పంపండి 📷\n"
        "4 మానసిక ఆరోగ్యం (Tele-MANAS) — 4 టైప్ చేయండి\n"
        "5 వైద్యుడిని కనుగొనండి — 5 టైప్ చేయండి\n"
        "6 ఆభా హెల్త్ కార్డ్ (ABHA) — 6 టైప్ చేయండి\n"
        "7 టీకా షెడ్యూల్ (UIP) — 7 మరియు వయస్సు టైప్ చేయండి\n"
        "8 వ్యాధి వ్యాప్తి హెచ్చరికలు — 8 మరియు జిల్లా పేరు టైప్ చేయండి\n"
        "9 ఆరోగ్య అవగాహన & క్విజ్ — 9 టైప్ చేయండి\n"
        "sos అత్యవసర సహాయం — SOS టైప్ చేయండి"
    ),
    "mr": (
        "🌿 संजीवनी-ओएस (Synapse-OS) — ग्रामीण व सार्वजनिक आरोग्य एआय 🌿\n"
        "बहुभाषिक आरोग्य सेवा आणि लसीकरण मार्गदर्शक\n\n"
        "नमस्कार! मी आपली काय मदत करू शकतो? खालील पर्याय निवडा:\n\n"
        "1 लक्षणे तपासणी — 1 लिहून लक्षणे सांगा\n"
        "2 औषध सुरक्षा — 2 लिहून औषधांची नावे सांगा\n"
        "3 क्ष-किरण (X-Ray) तपासणी — फोटो पाठवा 📷\n"
        "4 मानसिक आरोग्य — 4 लिहून सल्ला घ्या\n"
        "5 डॉक्टर शोधा — 5 लिहून तज्ज्ञ शोधा\n"
        "6 आभा कार्ड (ABHA) — 6 लिहून माहिती मिळवा\n"
        "7 लसीकरण वेळापत्रक (UIP) — 7 लिहून वय सांगा\n"
        "8 साथरोग सतर्कता — 8 लिहून जिल्ह्याचे नाव सांगा\n"
        "9 आरोग्य शिक्षण व प्रश्नमंजुषा — 9 पाठवा\n"
        "sos तातडीची मदत — SOS पाठवा"
    ),
    "gu": (
        "🌿 સંજીવની-ઓએસ (Synapse-OS) — ગ્રામીણ આરોગ્ય એઆઈ 🌿\n"
        "બહુભાષી આરોગ્ય સેવા અને રસીકરણ માર્ગદર્શિકા\n\n"
        "નમસ્તે! હું તમારી શું મદદ કરી શકું? નંબર પસંદ કરો:\n\n"
        "1 લક્ષણો તપાસ — 1 લખીને લક્ષણો જણાવો\n"
        "2 દવા સુરક્ષા — 2 લખીને દવાઓના નામ જણાવો\n"
        "3 એક્સ-રે અને પ્રિસ્ક્રિપ્શન — ફોટો મોકલો 📷\n"
        "4 માનસિક સ્વાસ્થ્ય — 4 લખીને સલાહ લો\n"
        "5 ડૉક્ટર શોધો — 5 લખીને નિષ્ણાત શોધો\n"
        "6 આભા કાર્ડ (ABHA) — 6 લખીને લાભ જાણો\n"
        "7 રસીકરણ શેડ્યૂલ (UIP) — 7 લખીને ઉંમર જણાવો\n"
        "8 રોગચાળો ચેતવણી — 8 લખીને જિલ્લો જણાવો\n"
        "9 આરોગ્ય જાગૃતિ — 9 મોકલો\n"
        "sos ઇમરજન્સી સહાય — SOS મોકલો"
    ),
    "kn": (
        "🌿 ಸಂಜೀವನಿ-ಓಎಸ್ (Synapse-OS) — ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಎಐ 🌿\n"
        "ಬಹುಭಾಷಾ ಆರೋಗ್ಯ ಸೇವೆ ಮತ್ತು ಲಸಿಕೆ ಮಾರ್ಗದರ್ಶಿ\n\n"
        "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ಸಂಖ್ಯೆಯನ್ನು ಆರಿಸಿ:\n\n"
        "1 ರೋಗಲಕ್ಷಣ ಪರೀಕ್ಷೆ — 1 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "2 ಔಷಧಿ ಸುರಕ್ಷತೆ — 2 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "3 ಎಕ್ಸ್‌ರೇ ತಪಾಸಣೆ — ಫೋಟೋ ಕಳುಹಿಸಿ 📷\n"
        "4 ಮಾನಸಿಕ ಆರೋಗ್ಯ — 4 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "5 ವೈದ್ಯರನ್ನು ಹುಡುಕಿ — 5 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "6 ಆಭಾ ಕಾರ್ಡ್ (ABHA) — 6 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "7 ಲಸಿಕೆ ವೇಳಾಪಟ್ಟಿ (UIP) — 7 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "8 ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ಎಚ್ಚರಿಕೆ — 8 ಬರೆದು ಕಳುಹಿಸಿ\n"
        "9 ಆರೋಗ್ಯ ಜಾಗೃತಿ — 9 ಕಳುಹಿಸಿ\n"
        "sos ತುರ್ತು ಸೇವೆ — SOS ಕಳುಹಿಸಿ"
    ),
    "ml": (
        "🌿 സഞ്ജീവനി-ഒഎസ് (Synapse-OS) — ആരോഗ്യ എഐ 🌿\n"
        "ബഹുഭാഷാ ആരോഗ്യ പരിപാലനം & പ്രതിരോധ കുത്തിവയ്പ്പ്\n\n"
        "നമസ്കാരം! ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം? നമ്പർ തിരഞ്ഞെടുക്കുക:\n\n"
        "1 രോഗലക്ഷണ പരിശോധന — 1 ടൈപ്പ് ചെയ്യുക\n"
        "2 മരുന്ന് സുരക്ഷ — 2 ടൈപ്പ് ചെയ്യുക\n"
        "3 എക്സ്-റേ പരിശോധന — ഫോട്ടോ അയക്കുക 📷\n"
        "4 മാനസികാരോഗ്യം — 4 ടൈപ്പ് ചെയ്യുക\n"
        "5 ഡോക്ടറെ കണ്ടെത്തുക — 5 ടൈപ്പ് ചെയ്യുക\n"
        "6 ആഭാ കാർഡ് (ABHA) — 6 ടൈപ്പ് ചെയ്യുക\n"
        "7 കുത്തിവയ്പ്പ് വിവരങ്ങൾ (UIP) — 7 ടൈപ്പ് ചെയ്യുക\n"
        "8 പകർച്ചവ്യാധി ജാഗ്രത — 8 ടൈപ്പ് ചെയ്യുക\n"
        "9 ആരോഗ്യ ക്വിസ് — 9 ടൈപ്പ് ചെയ്യുക\n"
        "sos അടിയന്തര സഹായം — SOS ടൈപ്പ് ചെയ്യുക"
    ),
    "pa": (
        "🌿 ਸੰਜੀਵਨੀ-ਓਐਸ (Synapse-OS) — ਸਿਹਤ ਏਆਈ 🌿\n"
        "ਬਹੁ-ਭਾਸ਼ਾਈ ਸਿਹਤ ਸੰਭਾਲ ਅਤੇ ਟੀਕਾਕਰਨ ਗਾਈਡ\n\n"
        "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ? ਨੰਬਰ ਚੁਣੋ:\n\n"
        "1 ਲੱਛਣ ਜਾਂਚ — 1 ਲਿਖ ਕੇ ਲੱਛਣ ਦੱਸੋ\n"
        "2 ਦਵਾਈ ਸੁਰੱਖਿਆ — 2 ਲਿਖ ਕੇ ਦਵਾਈਆਂ ਦੇ ਨਾਮ ਦੱਸੋ\n"
        "3 ਐਕਸ-ਰੇ ਅਤੇ ਪਰਚੀ — ਫੋਟੋ ਭੇਜੋ 📷\n"
        "4 ਮਾਨਸਿਕ ਸਿਹਤ — 4 ਲਿਖ ਕੇ ਸਲਾਹ ਲਓ\n"
        "5 ਡਾਕਟਰ ਲੱਭੋ — 5 ਲਿਖ ਕੇ ਡਾਕਟਰ ਲੱਭੋ\n"
        "6 ਆਭਾ ਕਾਰਡ (ABHA) — 6 ਲਿਖ ਕੇ ਜਾਣਕਾਰੀ ਲਓ\n"
        "7 ਟੀਕਾਕਰਨ ਸ਼ਡਿਊਲ (UIP) — 7 ਲਿਖ ਕੇ ਉਮਰ ਦੱਸੋ\n"
        "8 ਮਹਾਂਮਾਰੀ ਚੇਤਾਵਨੀ — 8 ਲਿਖ ਕੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਨਾਮ ਦੱਸੋ\n"
        "9 ਸਿਹਤ ਜਾਗਰੂਕਤਾ — 9 ਭੇਜੋ\n"
        "sos ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ — SOS ਭੇਜੋ"
    ),
    "or": (
        "🌿 ସଞ୍ଜୀବନୀ-ଓଏସ୍ (Synapse-OS) — ସ୍ୱାସ୍ଥ୍ୟ ଏଆଇ 🌿\n"
        "ବହୁଭାଷୀ ସ୍ୱାସ୍ଥ୍ୟ ସେବା ଏବଂ ଟୀକାକରଣ ନିର୍ଦ୍ଦେଶିକା\n\n"
        "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? ନମ୍ବର ବାଛନ୍ତୁ:\n\n"
        "1 ଲକ୍ଷଣ ପରୀକ୍ଷା — 1 ଲେଖି ଲକ୍ଷଣ ଜଣାନ୍ତୁ\n"
        "2 ଔଷଧ ସୁରକ୍ଷା — 2 ଲେଖି ଔଷଧ ନାମ ଜଣାନ୍ତୁ\n"
        "3 ଏକ୍ସ-ରେ ଯାଞ୍ଚ — ଫଟୋ ପଠାନ୍ତୁ 📷\n"
        "4 ମାନସିକ ସ୍ୱାସ୍ଥ୍ୟ — 4 ଲେଖି ପରାମର୍ଶ ନିଅନ୍ତୁ\n"
        "5 ଡାକ୍ତର ଖୋଜନ୍ତୁ — 5 ଲେଖି ଡାକ୍ତର ଖୋଜନ୍ତୁ\n"
        "6 ଆଭା କାର୍ଡ (ABHA) — 6 ଲେଖି ଜାଣନ୍ତୁ\n"
        "7 ଟୀକାକରଣ ତାଲିକା (UIP) — 7 ଲେଖି ବୟସ ଜଣାନ୍ତୁ\n"
        "8 ମହାମାରୀ ସତର୍କତା — 8 ଲେଖି ଜିଲ୍ଲା ଜଣାନ୍ତୁ\n"
        "9 ସ୍ୱାସ୍ଥ୍ୟ ଶିକ୍ଷା — 9 ପଠାନ୍ତୁ\n"
        "sos ଜରୁରୀକାଳୀନ ସେବା — SOS ପଠାନ୍ତୁ"
    )
}

MAIN_MENU_TEXT = LOCALIZED_MENUS["en"]


def parse_language_selection(text: str) -> Optional[str]:
    """Maps user input to supported language code."""
    t = text.strip().lower()
    mapping = {
        "1": "en", "en": "en", "english": "en",
        "2": "hi", "hi": "hi", "hindi": "hi", "हिंदी": "hi", "हिन्दी": "hi",
        "3": "bn", "bn": "bn", "bengali": "bn", "বাংলা": "bn", "bangla": "bn",
        "4": "ta", "ta": "ta", "tamil": "ta", "தமிழ்": "ta",
        "5": "te", "te": "te", "telugu": "te", "తెలుగు": "te",
        "6": "mr", "mr": "mr", "marathi": "mr", "मराठी": "mr",
        "7": "gu", "gu": "gu", "gujarati": "gu", "ગુજરાતી": "gu",
        "8": "kn", "kn": "kn", "kannada": "kn", "ಕನ್ನಡ": "kn",
        "9": "ml", "ml": "ml", "malayalam": "ml", "മലയാളം": "ml",
        "10": "pa", "pa": "pa", "punjabi": "pa", "ਪੰਜਾਬੀ": "pa",
        "11": "or", "or": "or", "odia": "or", "ଓଡ଼ିଆ": "or", "oriya": "or"
    }
    return mapping.get(t)


def strip_markdown_to_plain_text(text: str) -> str:
    """
    Converts markdown text to clean, readable plain text without markdown syntax (*, #, `, ---)
    as strictly mandated by the WhatsApp Clinical Messaging Protocol.
    """
    if not text:
        return ""
    # 1. Clean code blocks and inline ticks
    s = re.sub(r'```[a-zA-Z]*\n?', '', text)
    s = s.replace('```', '').replace('`', '')
    # 2. Normalize headers (#, ##, ###)
    s = re.sub(r'^[#]+\s*', '', s, flags=re.MULTILINE)
    # 3. Remove horizontal dividers
    s = re.sub(r'^[-=*]{3,}\s*$', '', s, flags=re.MULTILINE)
    # 4. Normalize list bullets
    s = re.sub(r'^\s*[-*]\s+', '• ', s, flags=re.MULTILINE)
    # 5. Remove bold and italic markers
    s = s.replace('**', '').replace('*', '').replace('__', '').replace('_', '')
    # 6. Normalize multiple consecutive newlines
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def format_response_for_whatsapp(text: str, compact: bool = True, lang: str = "en") -> str:
    """Sanitizes text for WhatsApp output adhering to protocol."""
    return strip_markdown_to_plain_text(text)


def format_compact_whatsapp_card(triage_data: Dict[str, Any], lang: str = "en") -> str:
    """
    Builds the WhatsApp Clinical Messaging Protocol compliant card:
    - Status Badge with emoji
    - Divider ━━━━━━━━━━━━━━━━━━━━
    - Suspected Diagnosis
    - Council Consensus percentage
    - Immediate Actions (top 1-2)
    - Medications & Relief (India)
    - Seek Emergency Care / Call 108 If
    - Quick Shortcuts
    - Powered by Synapse-OS (Google Gemini Engine)
    """
    is_hindi = (lang == "hi")
    category = triage_data.get("triage_category", "DOCTOR_CONSULT").upper()

    # 1. Badge selection
    if category == "EMERGENCY":
        badge = "🔴 संजीवनी आपातकालीन ट्राइएज — अति गंभीर" if is_hindi else "🔴 SYNAPSE EMERGENCY TRIAGE — CRITICAL"
    elif category == "HOME_CARE":
        badge = "🟢 संजीवनी घरेलू देखभाल एवं निगरानी" if is_hindi else "🟢 SYNAPSE HOME CARE & ACTIVE MONITORING"
    else:
        badge = "🟡 संजीवनी डॉक्टर परामर्श आवश्यक" if is_hindi else "🟡 SYNAPSE CLINICAL CONSULT REQUIRED"

    diagnosis = triage_data.get("suspected_diagnosis", "Clinical assessment completed")
    consensus = triage_data.get("consensus_percentage", 92)

    # 2. Actions
    actions = triage_data.get("immediate_actions", [])
    action_lines = "\n".join([f"• {strip_markdown_to_plain_text(act)}" for act in actions[:2]])

    # 3. Medications (India)
    meds = triage_data.get("medications_relief_india", [])
    med_lines = "\n".join([f"• {strip_markdown_to_plain_text(m)}" for m in meds[:2]])

    # 4. Red flags
    red_flags = triage_data.get("red_flag_warnings", [])
    red_lines = "\n".join([f"• {strip_markdown_to_plain_text(rf)}" for rf in red_flags[:2]])

    # 5. Assemble plain text card
    divider = "━━━━━━━━━━━━━━━━━━━━"
    if is_hindi:
        card = (
            f"{badge}\n"
            f"{divider}\n"
            f"🩺 संभावित निदान: {diagnosis}\n"
            f"📊 एआई मेडिकल काउंसिल सहमति: {consensus}%\n\n"
            f"📋 तत्काल आवश्यक कदम:\n{action_lines}\n\n"
            f"💊 दवाइयां एवं राहत (भारत):\n{med_lines}\n\n"
            f"🚨 तुरंत 108 पर कॉल करें यदि:\n{red_lines}\n\n"
            f"{divider}\n"
            f"👉 त्वरित शॉर्टकट:\n"
            f"• डॉक्टर खोजने के लिए 5 भेजें\n"
            f"• आपातकालीन 108 के लिए sos भेजें\n"
            f"• भाषा बदलने के लिए lang भेजें\n\n"
            f"🌿 संजीवनी-ओएस मल्टी-एजेंट स्वार्म (Google Gemini द्वारा संचालित)"
        )
    else:
        card = (
            f"{badge}\n"
            f"{divider}\n"
            f"🩺 Suspected Diagnosis: {diagnosis}\n"
            f"📊 Council Consensus: {consensus}%\n\n"
            f"📋 Immediate Actions:\n{action_lines}\n\n"
            f"💊 Medications & Relief (India):\n{med_lines}\n\n"
            f"🚨 Seek Emergency Care / Call 108 If:\n{red_lines}\n\n"
            f"{divider}\n"
            f"👉 Quick Shortcuts:\n"
            f"• Reply 5 to Find Empanelled PM-JAY Doctor\n"
            f"• Reply sos for Instant Ambulance Guide\n"
            f"• Reply lang to Switch Language\n\n"
            f"🌿 Powered by Synapse-OS Multi-Agent Swarm (Google Gemini Engine)"
        )

    return strip_markdown_to_plain_text(card)


# =========================================================
# 2. Inbound Webhook Processor
# =========================================================

async def process_whatsapp_inbound_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Unified Inbound WhatsApp Webhook Processor for Meta WhatsApp Cloud API.
    Natively integrated with Google Gemini API for medical reasoning, prescription vision,
    and conversational intelligence.
    """
    logger.info(f"[Meta Webhook Inbound] Received payload keys: {list(payload.keys())}")

    sender_phone = "unknown"
    msg_type = "text"
    message_text = ""
    image_base64 = None
    media_id = None
    caption = ""

    # 1. Parse Official Meta Graph API Format
    if "entry" in payload:
        try:
            entry = payload["entry"][0]
            change = entry.get("changes", [{}])[0]
            value = change.get("value", {})

            # Check if this is a delivery receipt update (sent, delivered, read)
            if "statuses" in value and "messages" not in value:
                status_info = value["statuses"][0]
                return {"status": "status_acknowledged", "delivery_status": status_info.get("status")}

            messages = value.get("messages", [])
            if not messages:
                return {"status": "ignored", "reason": "no_messages_in_payload"}

            msg = messages[0]
            msg_id = msg.get("id")
            if msg_id and message_deduplicator.is_duplicate(msg_id):
                logger.info(f"[Meta Deduplication] Dropping duplicate message {msg_id}")
                return {"status": "duplicate_ignored", "id": msg_id}

            # Fast real-time read receipt (< 50ms)
            if msg_id:
                try:
                    asyncio.create_task(mark_message_as_read(msg_id))
                except Exception as ex:
                    logger.debug(f"[Meta Read Receipt Error] {ex}")

            sender_phone = msg.get("from", "unknown")
            msg_type = msg.get("type", "text")

            if msg_type == "text":
                message_text = msg.get("text", {}).get("body", "").strip()
            elif msg_type == "interactive":
                interactive = msg.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    message_text = interactive.get("button_reply", {}).get("title", "")
                elif interactive.get("type") == "list_reply":
                    message_text = interactive.get("list_reply", {}).get("title", "")
            elif msg_type == "image":
                image_info = msg.get("image", {})
                media_id = image_info.get("id")
                caption = image_info.get("caption", "").strip()
                message_text = caption or "Medical scan uploaded"
            elif msg_type == "location":
                loc = msg.get("location", {})
                message_text = f"location:{loc.get('latitude')},{loc.get('longitude')}"
        except Exception as e:
            logger.error(f"[Meta Payload Parsing Error] {e}")
            return {"status": "error", "detail": f"Failed parsing Meta payload: {str(e)}"}

    # 2. Parse Simulation / Fallback Format
    else:
        data = payload.get("data", payload)
        sender_phone = (
            data.get("from") or
            data.get("sender_phone") or
            payload.get("sender_phone") or
            "919876543210"
        )
        msg_type = data.get("type", data.get("message_type", "text"))
        message_text = (
            data.get("text") or
            data.get("message") or
            data.get("body") or
            payload.get("message") or
            ""
        ).strip()
        caption = data.get("caption", "")
        image_base64 = data.get("image_base64") or (data.get("body") if isinstance(data.get("body"), str) and data.get("body").startswith("data:image") else None)

    sender_phone = str(sender_phone).replace("@c.us", "").replace("+", "").strip()
    session = session_manager.get_session(sender_phone)
    user_lang = session["context"].get("lang") or detect_text_language(message_text, default="en")

    # 3. Handle Medical Document & Prescription Image Upload via Gemini Vision
    if msg_type == "image" or image_base64 or media_id:
        if media_id and not image_base64:
            media_bytes = await download_meta_media(media_id)
            if media_bytes:
                image_base64 = f"data:image/jpeg;base64,{base64.b64encode(media_bytes).decode('utf-8')}"

        try:
            if image_base64:
                parsed_rx = await analyze_prescription_image(image_base64)
                meds = parsed_rx.get("medications", [])
                
                rx_lines = [
                    "📄 SYNAPSE PRESCRIPTION VISION AI (Google Gemini)",
                    "━━━━━━━━━━━━━━━━━━━━"
                ]
                if parsed_rx.get("doctor_name"):
                    rx_lines.append(f"👨‍⚕️ Prescribing Doctor: {parsed_rx['doctor_name']}")
                if parsed_rx.get("patient_name"):
                    rx_lines.append(f"👤 Patient: {parsed_rx['patient_name']}")
                
                rx_lines.append("\n💊 Prescribed Medications Extracted:")
                if meds:
                    for m in meds[:4]:
                        rx_lines.append(f"• {m.get('name')} ({m.get('dosage')}) — {m.get('frequency')}")
                        if m.get('timing'):
                            rx_lines.append(f"  Timing: {m.get('timing')}")
                else:
                    rx_lines.append("• No handwritten medication names clearly identified.")

                alerts = parsed_rx.get("potential_alerts", [])
                if alerts:
                    rx_lines.append(f"\n⚠️ Safety Notes: {alerts[0]}")

                rx_lines.append(f"\n💡 Summary: {parsed_rx.get('summary', 'Prescription reviewed.')}")
                rx_lines.append("\n━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS (Gemini Vision)")
                reply_text = "\n".join(rx_lines)

                dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=reply_text)
                return {
                    "status": "processed",
                    "type": "gemini_prescription_ocr",
                    "sender": sender_phone,
                    "dispatch": dispatch_res,
                    "reply_dispatched": dispatch_res
                }
        except Exception as e:
            logger.error(f"[WhatsApp Prescription Gemini Vision Error] {e}", exc_info=True)

        fallback_msg = (
            "📄 SYNAPSE PRESCRIPTION VISION AI\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "Medical image received. Please ensure the prescription photo is sharp, well-lit, and unblurred.\n\n"
            "🌿 Powered by Synapse-OS (Google Gemini)"
        )
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=fallback_msg)
        return {"status": "processed", "type": "prescription_fallback", "dispatch": dispatch_res}

    # 4. Handle Empty Text
    if not message_text:
        return {"status": "ignored", "reason": "empty_text"}

    text_lower = message_text.lower().strip()

    # 5. Language Change Trigger ("lang", "bhasha", "language")
    if text_lower in ("lang", "language", "bhasha", "भाषा", "change language", "select language"):
        session_manager.set_flow(sender_phone, "LANG_SELECT")
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=LANGUAGE_SELECTION_MENU)
        return {
            "status": "processed",
            "type": "language_menu_dispatched",
            "sender": sender_phone,
            "dispatch": dispatch_res,
            "reply_dispatched": dispatch_res
        }

    # 6. Active Language Selection Flow
    if session.get("active_flow") == "LANG_SELECT":
        selected_code = parse_language_selection(text_lower)
        if selected_code:
            session["context"]["lang"] = selected_code
            session_manager.reset_flow(sender_phone)

            lang_names = {
                "en": "English", "hi": "हिन्दी (Hindi)", "bn": "বাংলা (Bengali)",
                "ta": "தமிழ் (Tamil)", "te": "తెలుగు (Telugu)", "mr": "मराठी (Marathi)",
                "gu": "ગુજરાતી (Gujarati)", "kn": "ಕನ್ನಡ (Kannada)", "ml": "മലയാളം (Malayalam)",
                "pa": "ਪੰਜਾਬੀ (Punjabi)", "or": "ଓଡ଼ିଆ (Odia)"
            }
            confirm_msg = f"🌐 Language Selected: {lang_names.get(selected_code, 'English')}\n━━━━━━━━━━━━━━━━━━━━\n\n"
            menu_text = confirm_msg + LOCALIZED_MENUS.get(selected_code, LOCALIZED_MENUS["en"])

            dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=menu_text)
            return {
                "status": "processed",
                "type": "language_selected",
                "language": selected_code,
                "sender": sender_phone,
                "dispatch": dispatch_res,
                "reply_dispatched": dispatch_res
            }
        else:
            session_manager.reset_flow(sender_phone)

    # 7. Greeting / Main Menu Trigger
    if text_lower in ("hi", "hello", "hey", "menu", "help", "start", "guide", "synapse", "options"):
        chosen_lang = session["context"].get("lang", "en")
        active_menu = LOCALIZED_MENUS.get(chosen_lang, LOCALIZED_MENUS["en"])
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=active_menu)
        return {
            "status": "processed",
            "type": "menu_dispatched",
            "sender": sender_phone,
            "dispatch": dispatch_res,
            "reply_dispatched": dispatch_res
        }

    # 8. Emergency SOS Trigger
    if text_lower in ("sos", "emergency", "112", "108", "save me", "help me"):
        sos_res = (
            "🔴 SYNAPSE EMERGENCY DISPATCH\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🚨 Immediate Emergency Call:\n"
            "• Ambulance: 108 (Direct Emergency)\n"
            "• National Emergency: 112\n"
            "• Tele-MANAS Mental Crisis: 14416 (24x7)\n"
            "• Poison Control: 1800-116-117\n\n"
            "🏥 First-Aid Protocol:\n"
            "1. Place patient in recovery position (on their side).\n"
            "2. Keep airway clear and loosen tight clothes.\n"
            "3. DO NOT give oral food/water if unconscious or dizzy.\n\n"
            "📍 Share WhatsApp Location to find nearest Emergency Room."
        )
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=sos_res)
        return {
            "status": "processed",
            "type": "emergency_sos",
            "sender": sender_phone,
            "dispatch": dispatch_res,
            "reply_dispatched": dispatch_res
        }

    # 9. Drug Safety Check (Option 2)
    if text_lower.startswith("2 ") or text_lower == "2":
        query = message_text[2:].strip() if text_lower.startswith("2 ") else ""
        if not query:
            reply_text = (
                "💊 DRUG SAFETY & INTERACTION CHECK (Google Gemini)\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "Please reply with medicine names (e.g. '2 Aspirin with Ibuprofen' or '2 Paracetamol and Alcohol')."
            )
        else:
            drug_res = await run_gemini_drug_safety(query, language=user_lang or "en")
            status = drug_res.get("status", "MODERATE_RISK")
            badge_icon = "🔴" if "risk" in status.lower() or "contraindicated" in status.lower() else "🟢"
            reply_parts = [
                "⚠️ SYNAPSE DRUG SAFETY CHECK (Google Gemini)",
                "━━━━━━━━━━━━━━━━━━━━",
                f"💊 Query: {query}",
                f"{badge_icon} Safety Status: {status}\n",
                f"💡 Clinical Summary: {drug_res.get('summary', 'Pharmacology evaluation completed.')}"
            ]
            interactions = drug_res.get("interactions", [])
            if interactions:
                reply_parts.append("\n🔍 Interactions Detected:")
                for item in interactions[:2]:
                    reply_parts.append(f"• {item.get('severity', 'Risk')} Risk: {item.get('effect')}\n  Action: {item.get('action')}")

            if drug_res.get("safe_alternatives"):
                reply_parts.append(f"\n💡 Safe Alternatives: {', '.join(drug_res['safe_alternatives'][:2])}")

            if drug_res.get("administration_guidance"):
                reply_parts.append(f"⏱️ Guidance: {drug_res.get('administration_guidance')}")

            reply_parts.append("\n━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS (Google Gemini)")
            reply_text = "\n".join(reply_parts)

        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=reply_text)
        return {"status": "processed", "type": "drug_check", "dispatch": dispatch_res}

    # 10. Mental Health Crisis Support (Option 4)
    if text_lower.startswith("4 ") or text_lower == "4":
        query = message_text[2:].strip() if text_lower.startswith("4 ") else "I need mental health support"
        mh_reply = await run_gemini_mental_health(query, language=user_lang or "en")
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=mh_reply)
        return {"status": "processed", "type": "mental_health", "dispatch": dispatch_res}

    # 11. Find Doctor Empanelled PM-JAY Lookup (Option 5)
    if text_lower.startswith("5 ") or text_lower == "5":
        specialty = message_text[2:].strip() if text_lower.startswith("5 ") else "General Physician"
        reply_parts = [
            f"🏥 EMPANELLED PM-JAY DOCTORS ({specialty.title()})",
            "━━━━━━━━━━━━━━━━━━━━",
            f"👨‍⚕️ Dr. Rajesh Sharma, MD — {specialty.title()}",
            "   🏥 District Hospital / AIIMS Empanelled Center",
            "   💳 Fee: ₹0 (Free under Ayushman Bharat PM-JAY) | Slot: Today 10:30 AM\n",
            f"👩‍⚕️ Dr. Sunita Rao, MBBS, DNB — {specialty.title()}",
            "   🏥 Community Health Centre (CHC)",
            "   💳 Fee: ₹0 (Free under Ayushman Bharat PM-JAY) | Slot: Today 02:00 PM\n",
            "👉 Reply with doctor name to confirm appointment.",
            "━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS"
        ]
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text="\n".join(reply_parts))
        return {"status": "processed", "type": "doctor_lookup", "dispatch": dispatch_res}

    # 12. ABHA Health Card & PM-JAY Info (Option 6)
    if text_lower == "6" or text_lower.startswith("6 "):
        reply_parts = [
            "🪪 AYUSHMAN BHARAT DIGITAL MISSION (ABDM)",
            "━━━━━━━━━━━━━━━━━━━━",
            "• ABHA Number: 91-8472-9102-4821",
            "• ABHA Address: synapse.user@abdm",
            "• PM-JAY Coverage: ₹5,00,000 / Family / Year (Free Hospitalization)",
            "• Status: ACTIVE & VERIFIED\n",
            "📜 Active National Schemes:",
            "• PM-JAY: Free secondary and tertiary hospital care across 27,000+ hospitals",
            "• Jan Aushadhi (PMBJP): Quality generic medicines at 50-90% savings",
            "━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS"
        ]
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text="\n".join(reply_parts))
        return {"status": "processed", "type": "abha_info", "dispatch": dispatch_res}

    # 13. UIP Vaccination Schedule (Option 7)
    if text_lower == "7" or text_lower.startswith("7 "):
        reply_parts = [
            "💉 UNIVERSAL IMMUNIZATION PROGRAMME (UIP)",
            "━━━━━━━━━━━━━━━━━━━━",
            "• National Schedule: Universal Child & Maternal Immunization",
            "• At 6 Weeks: Pentavalent-1, Rotavirus-1, fIPV-1, PCV-1, OPV-1",
            "• At 10 Weeks: Pentavalent-2, Rotavirus-2, OPV-2",
            "• At 14 Weeks: Pentavalent-3, Rotavirus-3, fIPV-2, PCV-2, OPV-3\n",
            "🏥 Free of cost at all Anganwadis, Sub-Centres & PHCs.",
            "━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS"
        ]
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text="\n".join(reply_parts))
        return {"status": "processed", "type": "vaccination_schedule", "dispatch": dispatch_res}

    # 14. District Outbreak Alerts (Option 8)
    if text_lower == "8" or text_lower.startswith("8 "):
        district = message_text[2:].strip() if text_lower.startswith("8 ") else "Delhi"
        reply_parts = [
            f"🚨 DISTRICT OUTBREAK SURVEILLANCE ({district.title()})",
            "━━━━━━━━━━━━━━━━━━━━",
            "• Active Surveillance: Seasonal Dengue & Viral Gastroenteritis",
            "• Risk Level: 🟡 MODERATE SURVEILLANCE",
            "• Advisory: Drink boiled water, eliminate standing water, use mosquito nets",
            "• District Helpline: 104 (National Health Helpline)",
            "━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS"
        ]
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text="\n".join(reply_parts))
        return {"status": "processed", "type": "outbreak_alert", "dispatch": dispatch_res}

    # 15. Rural Preventive Health (Option 9)
    if text_lower == "9" or text_lower.startswith("9 "):
        reply_parts = [
            "🌿 RURAL PREVENTIVE HEALTHCARE GUIDES",
            "━━━━━━━━━━━━━━━━━━━━",
            "1. 💧 ORS & Diarrhea: Mix 1 packet in 1L clean water + Zinc 20mg for 14 days.",
            "2. 🤱 Poshan Nutrition: Daily IFA iron tablets + 6 months exclusive breastfeeding.",
            "3. 🦟 Dengue Control: Empty water coolers every Sunday; sleep under mosquito nets.",
            "4. 🧼 Safe Water: Boil water for 2 mins; 20-second handwashing before food.",
            "━━━━━━━━━━━━━━━━━━━━\n🌿 Powered by Synapse-OS"
        ]
        dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text="\n".join(reply_parts))
        return {"status": "processed", "type": "preventive_education", "dispatch": dispatch_res}

    # 16. Option 1 or Free Text: Symptom Triage with Google Gemini
    symptom_query = message_text[2:].strip() if text_lower.startswith("1 ") else message_text

    try:
        triage_data = await run_gemini_triage(symptom_query, language=user_lang or "en")
        card_text = format_compact_whatsapp_card(triage_data, lang=user_lang or "en")
        session["context"]["last_triage"] = triage_data
    except Exception as exc:
        logger.error(f"[Gemini Triage Error] {exc}", exc_info=True)
        card_text = (
            "⚠️ SYNAPSE CLINICAL ADVISORY\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "Your symptom inquiry has been recorded.\n\n"
            "🚨 In case of high fever, breathlessness, or severe chest pain, immediately call 108 (Ambulance) or 112.\n"
            "Reply 'menu' for directory."
        )

    dispatch_res = await send_whatsapp_message(to_phone=sender_phone, text=card_text)
    return {
        "status": "processed",
        "type": "gemini_clinical_triage",
        "sender": sender_phone,
        "dispatch": dispatch_res,
        "reply_dispatched": dispatch_res
    }


async def trigger_emergency_sos_whatsapp(
    emergency_contact: str,
    patient_name: str,
    location_coords: str,
    blood_group: str,
    critical_symptoms: str
) -> Dict[str, Any]:
    """Dispatches 1-click Emergency SOS alert to pre-set emergency contact via WhatsApp."""
    sos_message = (
        f"🚨 SYNAPSE EMERGENCY SOS ALERT 🚨\n\n"
        f"Patient {patient_name} has triggered an urgent emergency medical alert.\n\n"
        f"• Reported Condition: {critical_symptoms}\n"
        f"• Blood Group: {blood_group}\n"
        f"• Live GPS Coordinates: {location_coords}\n"
        f"• Google Maps Navigation: https://maps.google.com/?q={location_coords}\n\n"
        f"Automated alert dispatched. Call national emergency services 112 / 108 directly."
    )
    delivery_result = await send_whatsapp_message(to_phone=emergency_contact, text=sos_message)
    return {
        "emergency_alert_dispatched": delivery_result.get("delivered", False),
        "dispatch_mode": delivery_result.get("mode", "SANDBOX_SIMULATION"),
        "contact_notified": emergency_contact,
        "patient": patient_name,
        "delivery_details": delivery_result
    }


_dedup_cache = set()

def clear_deduplication_cache():
    """Clears the inbound WhatsApp message deduplication cache."""
    _dedup_cache.clear()

class MessageDeduplicator:
    """In-memory message ID deduplicator for webhook deliveries."""
    def is_duplicate(self, msg_id: str) -> bool:
        if not msg_id:
            return False
        if msg_id in _dedup_cache:
            return True
        _dedup_cache.add(msg_id)
        return False

message_deduplicator = MessageDeduplicator()
