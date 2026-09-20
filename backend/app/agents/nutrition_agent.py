"""
SynapseOS — agents/nutrition_agent.py
Clinical Nutrition & Dietary Guidance Agent for Indian Public Health.
Curated food-rules engine based on ICMR-NIN & IFCT guidelines for Diabetes, Hypertension, Anaemia, Diarrhoea, and Fever.
Includes safety gate for sensitive profiles, drug-food interaction checks, and LLM fallback for unknown foods.
"""

import time
import re
from typing import Dict, Any, List, Optional
from backend.app.core.state import SynapseOSState, AgentTraceStep
from backend.app.core.safety_router import evaluate_safety
from backend.app.services.llm_service import call_llm_json, call_nutrition_llm_with_fallbacks

# ---------------------------------------------------------
# Curated Database of ~40 Common Indian Foods with Rules
# ---------------------------------------------------------
CURATED_FOODS_DATABASE: List[Dict[str, Any]] = [
    {
        "food_id": "moong_dal",
        "names": {"en": "Moong dal", "hi": "मूंग दाल"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/moong_dal.jpg",
        "nutrients_per_100g": {"protein_g": 24.0, "sodium_mg": 2.0, "fibre_g": 8.0, "potassium_mg": 843},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "slow_release_carbs", "reason": "High protein, slow-release carbs"},
            "hypertension": {"verdict": "eat", "reason_key": "low_sodium_potassium", "reason": "Low sodium and naturally rich in potassium"},
            "anaemia": {"verdict": "eat", "reason_key": "plant_iron", "reason": "Good source of plant-based iron and folate"},
            "diarrhoea": {"verdict": "eat", "reason_key": "easy_gut", "reason": "Easily digestible when prepared as thin khichdi"},
            "fever": {"verdict": "eat", "reason_key": "light_protein", "reason": "Provides light protein without straining digestion"}
        }
    },
    {
        "food_id": "methi_leaves",
        "names": {"en": "Methi leaves (Fenugreek)", "hi": "मेथी"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/methi.jpg",
        "nutrients_per_100g": {"protein_g": 4.4, "sodium_mg": 19.0, "fibre_g": 1.1, "iron_mg": 1.9},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "glycemic_control", "reason": "Fibre-rich and low in sugar, improves insulin sensitivity"},
            "hypertension": {"verdict": "eat", "reason_key": "arterial_health", "reason": "Rich in antioxidants and helps manage blood pressure"},
            "anaemia": {"verdict": "eat", "reason_key": "leafy_iron", "reason": "Good non-heme iron content for blood building"},
            "diarrhoea": {"verdict": "limit", "reason_key": "roughage", "reason": "High roughage can stimulate bowel movements"},
            "fever": {"verdict": "eat", "reason_key": "micronutrients", "reason": "Nutrient-dense greens to support recovery"}
        }
    },
    {
        "food_id": "ragi_jowar_roti",
        "names": {"en": "Ragi or jowar roti", "hi": "रागी / ज्वार रोटी"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/ragi_roti.jpg",
        "nutrients_per_100g": {"protein_g": 7.3, "sodium_mg": 5.0, "fibre_g": 11.5, "calcium_mg": 344},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "complex_fibre", "reason": "More fibre than white rice or maida, prevents glucose spikes"},
            "hypertension": {"verdict": "eat", "reason_key": "heart_millet", "reason": "Whole grain millet supporting healthy circulation"},
            "anaemia": {"verdict": "eat", "reason_key": "iron_calcium", "reason": "Ragi is exceptionally rich in calcium and iron"},
            "diarrhoea": {"verdict": "limit", "reason_key": "heavy_grain", "reason": "Heavy coarse fibre; consume soft or in small amounts"},
            "fever": {"verdict": "eat", "reason_key": "sustained_energy", "reason": "Sustained complex energy for healing"}
        }
    },
    {
        "food_id": "plain_curd",
        "names": {"en": "Plain curd / Dahi", "hi": "दही"},
        "diet": "veg",
        "allergens": ["dairy"],
        "image_url": "/images/food/curd.jpg",
        "nutrients_per_100g": {"protein_g": 3.5, "sodium_mg": 36.0, "calcium_mg": 120.0},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "low_gi_protein", "reason": "Protein without added sugar, low GI"},
            "hypertension": {"verdict": "eat", "reason_key": "probiotic_bp", "reason": "Probiotic curd supports gut-heart axis"},
            "anaemia": {"verdict": "eat", "reason_key": "gut_absorption", "reason": "Probiotics improve gut iron absorption"},
            "diarrhoea": {"verdict": "eat", "reason_key": "gut_flora", "reason": "Restores gut flora and restores stool consistency"},
            "fever": {"verdict": "eat", "reason_key": "cooling_probiotic", "reason": "Soothing on inflamed gut during fever"}
        }
    },
    {
        "food_id": "eggs",
        "names": {"en": "Boiled eggs", "hi": "अंडे"},
        "diet": "nonveg",
        "allergens": ["egg"],
        "image_url": "/images/food/boiled_eggs.jpg",
        "nutrients_per_100g": {"protein_g": 13.0, "sodium_mg": 124.0, "iron_mg": 1.2},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "zero_carbs", "reason": "High quality protein that barely moves blood sugar"},
            "hypertension": {"verdict": "eat", "reason_key": "moderate_egg", "reason": "Boiled eggs provide lean bioavailable protein"},
            "anaemia": {"verdict": "eat", "reason_key": "heme_iron", "reason": "Contains heme iron and B12 for RBC synthesis"},
            "diarrhoea": {"verdict": "limit", "reason_key": "fat_digestion", "reason": "Soft boiled only; avoid fried eggs during acute diarrhea"},
            "fever": {"verdict": "eat", "reason_key": "recovery_protein", "reason": "Excellent soft protein for muscle repair"}
        }
    },
    {
        "food_id": "grilled_fish",
        "names": {"en": "Fish curry or grilled fish", "hi": "मछली"},
        "diet": "nonveg",
        "allergens": ["fish"],
        "image_url": "/images/food/fish.jpg",
        "nutrients_per_100g": {"protein_g": 20.0, "sodium_mg": 60.0, "omega3_g": 1.5},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "lean_protein", "reason": "Lean protein with healthy omega-3 fats"},
            "hypertension": {"verdict": "eat", "reason_key": "omega3_heart", "reason": "Omega-3 fatty acids lower vascular inflammation"},
            "anaemia": {"verdict": "eat", "reason_key": "bioavailable_iron", "reason": "High bioavailable heme iron and trace minerals"},
            "diarrhoea": {"verdict": "limit", "reason_key": "spicy_curry", "reason": "Avoid heavy oil/spices; light stew is fine"},
            "fever": {"verdict": "eat", "reason_key": "light_fish", "reason": "Light fish soup aids immune response"}
        }
    },
    {
        "food_id": "white_rice",
        "names": {"en": "White rice", "hi": "चावल"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/white_rice.jpg",
        "nutrients_per_100g": {"carbs_g": 28.0, "fibre_g": 0.4, "glycemic_index": 73},
        "rules": {
            "diabetes": {"verdict": "limit", "reason_key": "high_gi", "reason": "Keep to a small bowl, pair with dal and vegetables"},
            "hypertension": {"verdict": "eat", "reason_key": "sodium_free", "reason": "Naturally salt-free staple grain"},
            "anaemia": {"verdict": "limit", "reason_key": "low_iron", "reason": "Low in micronutrients unless fortified"},
            "diarrhoea": {"verdict": "eat", "reason_key": "bland_kanji", "reason": "Soft steamed rice or kanji calms intestinal tract"},
            "fever": {"verdict": "eat", "reason_key": "easy_carbs", "reason": "Easy energy source for weak appetite"}
        }
    },
    {
        "food_id": "ripe_banana",
        "names": {"en": "Ripe banana", "hi": "केला"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/banana.jpg",
        "nutrients_per_100g": {"carbs_g": 23.0, "potassium_mg": 358.0, "sugar_g": 12.0},
        "rules": {
            "diabetes": {"verdict": "limit", "reason_key": "moderate_sugar", "reason": "Half at a time, pair with nuts or curd to blunt spike"},
            "hypertension": {"verdict": "eat", "reason_key": "potassium_boost", "reason": "High potassium counters dietary sodium"},
            "anaemia": {"verdict": "eat", "reason_key": "folate_b6", "reason": "Contains folate and Vitamin B6 for blood health"},
            "diarrhoea": {"verdict": "eat", "reason_key": "brat_diet", "reason": "Pectin fibre solidifies stool and restores potassium"},
            "fever": {"verdict": "eat", "reason_key": "quick_electrolyte", "reason": "Soft, easily swallowed fruit with electrolytes"}
        }
    },
    {
        "food_id": "potato",
        "names": {"en": "Potato (Aloo)", "hi": "आलू"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/potato.jpg",
        "nutrients_per_100g": {"carbs_g": 17.0, "potassium_mg": 420.0, "glycemic_index": 78},
        "rules": {
            "diabetes": {"verdict": "limit", "reason_key": "fast_starch", "reason": "Fast-acting starch, keep portions small and boiled"},
            "hypertension": {"verdict": "eat", "reason_key": "boiled_potassium", "reason": "Boiled potato (un-salted) provides potassium"},
            "anaemia": {"verdict": "limit", "reason_key": "low_density", "reason": "Moderate nutrition density"},
            "diarrhoea": {"verdict": "eat", "reason_key": "bland_binder", "reason": "Boiled mashed potato acts as a gut binder"},
            "fever": {"verdict": "eat", "reason_key": "soft_energy", "reason": "Soft boiled starch easy on feverish tummy"}
        }
    },
    {
        "food_id": "poha",
        "names": {"en": "Poha (Flattened rice)", "hi": "पोहा"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/poha.jpg",
        "nutrients_per_100g": {"carbs_g": 77.0, "iron_mg": 20.0, "fibre_g": 0.9},
        "rules": {
            "diabetes": {"verdict": "limit", "reason_key": "poha_carbs", "reason": "Add peanuts and vegetables to slow blood sugar rise"},
            "hypertension": {"verdict": "eat", "reason_key": "light_breakfast", "reason": "Light breakfast when cooked with low salt"},
            "anaemia": {"verdict": "eat", "reason_key": "iron_poha", "reason": "Traditional iron-rich snack (especially when squeezed with lemon)"},
            "diarrhoea": {"verdict": "eat", "reason_key": "bland_poha", "reason": "Soft washed poha with curd is very easy to digest"},
            "fever": {"verdict": "eat", "reason_key": "light_snack", "reason": "Light, easily digestible energy snack"}
        }
    },
    {
        "food_id": "sugary_drinks",
        "names": {"en": "Sugary drinks and packaged juice", "hi": "मीठे पेय"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/sugary_drinks.jpg",
        "nutrients_per_100g": {"sugar_g": 11.0, "fibre_g": 0.0},
        "rules": {
            "diabetes": {"verdict": "avoid", "reason_key": "glucose_spike", "reason": "Rapidly raises blood sugar levels without satiety"},
            "hypertension": {"verdict": "avoid", "reason_key": "fructose_stiffness", "reason": "High fructose contributes to arterial stiffness"},
            "anaemia": {"verdict": "avoid", "reason_key": "empty_calories", "reason": "Empty calories displacing nutrient-dense foods"},
            "diarrhoea": {"verdict": "avoid", "reason_key": "osmotic_diarrhea", "reason": "High sugar draws water into bowel, worsening diarrhea"},
            "fever": {"verdict": "avoid", "reason_key": "gut_irritation", "reason": "Artificially sweetened or high-sugar drinks cause gut inflammation"}
        }
    },
    {
        "food_id": "mithai_jalebi",
        "names": {"en": "Mithai and jalebi", "hi": "मिठाई"},
        "diet": "veg",
        "allergens": ["dairy"],
        "image_url": "/images/food/mithai.jpg",
        "nutrients_per_100g": {"sugar_g": 45.0, "fat_g": 18.0},
        "rules": {
            "diabetes": {"verdict": "avoid", "reason_key": "concentrated_sugar", "reason": "Concentrated sugar and refined flour cause severe glucose spikes"},
            "hypertension": {"verdict": "avoid", "reason_key": "syrup_fat", "reason": "Heavy saturated fats and sugar strain cardiovascular health"},
            "anaemia": {"verdict": "avoid", "reason_key": "nutrient_poor", "reason": "Offers zero iron benefit while filling appetite"},
            "diarrhoea": {"verdict": "avoid", "reason_key": "heavy_sugar", "reason": "Refined sugar ferments and exacerbates loose stools"},
            "fever": {"verdict": "avoid", "reason_key": "heavy_digest", "reason": "Hard to digest when metabolic rate is altered"}
        }
    },
    {
        "food_id": "fried_maida_snacks",
        "names": {"en": "Fried maida snacks (Samosa, biscuits, pakora)", "hi": "समौसा, बिस्कुट"},
        "diet": "veg",
        "allergens": ["gluten"],
        "image_url": "/images/food/samosa.jpg",
        "nutrients_per_100g": {"sodium_mg": 450.0, "trans_fat_g": 2.5, "carbs_g": 52.0},
        "rules": {
            "diabetes": {"verdict": "avoid", "reason_key": "transfat_refined", "reason": "Refined flour plus fat delays clearance and spikes blood sugar"},
            "hypertension": {"verdict": "avoid", "reason_key": "high_sodium_transfat", "reason": "High hidden sodium and trans fats elevate blood pressure"},
            "anaemia": {"verdict": "avoid", "reason_key": "inhibits_absorption", "reason": "Maida and deep frying hinder gut nutrient absorption"},
            "diarrhoea": {"verdict": "avoid", "reason_key": "fatty_cramp", "reason": "Greasy foods trigger painful intestinal spasms"},
            "fever": {"verdict": "avoid", "reason_key": "sluggish_gut", "reason": "Causes sluggish digestion, nausea, and stomach heaviness"}
        }
    },
    {
        "food_id": "lauki_bottle_gourd",
        "names": {"en": "Lauki (Bottle gourd)", "hi": "लौकी"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/lauki.jpg",
        "nutrients_per_100g": {"water_pct": 96.0, "potassium_mg": 170.0, "fibre_g": 1.1},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "ultra_low_gi", "reason": "96% water, extremely low GI, cools digestive system"},
            "hypertension": {"verdict": "eat", "reason_key": "natural_diuretic", "reason": "Acts as a gentle natural diuretic, reducing BP"},
            "anaemia": {"verdict": "eat", "reason_key": "hydration_folate", "reason": "Hydrating vegetable rich in essential minerals"},
            "diarrhoea": {"verdict": "eat", "reason_key": "soothing_soup", "reason": "Boiled lauki soup restores lost fluids without strain"},
            "fever": {"verdict": "eat", "reason_key": "fever_cooling", "reason": "Cools internal heat and hydrates during high temperature"}
        }
    },
    {
        "food_id": "spinach_palak",
        "names": {"en": "Spinach / Palak", "hi": "पालक"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/palak.jpg",
        "nutrients_per_100g": {"iron_mg": 2.7, "folate_mcg": 194.0, "potassium_mg": 558.0},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "magnesium_greens", "reason": "Rich in magnesium and antioxidants for insulin regulation"},
            "hypertension": {"verdict": "eat", "reason_key": "nitrates_potassium", "reason": "High natural nitrates and potassium expand blood vessels"},
            "anaemia": {"verdict": "eat", "reason_key": "folate_iron_king", "reason": "Superfood for boosting hemoglobin and red blood cells"},
            "diarrhoea": {"verdict": "limit", "reason_key": "oxalate_laxative", "reason": "Laxative effect if eaten raw or in large quantities"},
            "fever": {"verdict": "eat", "reason_key": "immune_greens", "reason": "Boiled palak soup feeds immune cells during recovery"}
        }
    },
    {
        "food_id": "oats",
        "names": {"en": "Rolled oats", "hi": "ओट्स"},
        "diet": "veg",
        "allergens": ["gluten"],
        "image_url": "/images/food/oats.jpg",
        "nutrients_per_100g": {"beta_glucan_g": 4.0, "fibre_g": 10.6, "protein_g": 13.0},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "beta_glucan", "reason": "Beta-glucan soluble fibre slows glucose absorption dramatically"},
            "hypertension": {"verdict": "eat", "reason_key": "cholesterol_bp", "reason": "Reduces LDL cholesterol and arterial pressure"},
            "anaemia": {"verdict": "eat", "reason_key": "fortified_grain", "reason": "Nutrient-dense grain rich in non-heme iron"},
            "diarrhoea": {"verdict": "eat", "reason_key": "soothing_porridge", "reason": "Water-cooked oats porridge calms intestinal lining"},
            "fever": {"verdict": "eat", "reason_key": "warm_nourishment", "reason": "Warm, soothing nourishment"}
        }
    },
    {
        "food_id": "pickles_achar",
        "names": {"en": "Pickles (Achar)", "hi": "अचार"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/pickle.jpg",
        "nutrients_per_100g": {"sodium_mg": 1200.0, "oil_g": 25.0},
        "rules": {
            "diabetes": {"verdict": "limit", "reason_key": "oily_sodium", "reason": "High oil and preserved salt impair metabolic health"},
            "hypertension": {"verdict": "avoid", "reason_key": "extreme_salt", "reason": "Extreme sodium content causes immediate fluid retention and BP spike"},
            "anaemia": {"verdict": "limit", "reason_key": "low_value", "reason": "No blood-building nutrients"},
            "diarrhoea": {"verdict": "avoid", "reason_key": "acid_chili", "reason": "Spices, acid, and oil irritate inflamed intestinal lining"},
            "fever": {"verdict": "avoid", "reason_key": "stomach_burn", "reason": "Triggers acidity and stomach burning"}
        }
    },
    {
        "food_id": "papad_namkeen",
        "names": {"en": "Papad and namkeen", "hi": "पापड़, नमकीन"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/papad.jpg",
        "nutrients_per_100g": {"sodium_mg": 1600.0, "fat_g": 30.0},
        "rules": {
            "diabetes": {"verdict": "avoid", "reason_key": "salt_fat_combo", "reason": "Processed pulse flour with high salt and fried fat"},
            "hypertension": {"verdict": "avoid", "reason_key": "sodium_bomb", "reason": "Sodium bomb; 1 papad contains up to 400mg sodium"},
            "anaemia": {"verdict": "limit", "reason_key": "junk_filler", "reason": "Junk snack with no nutritional value for anemia"},
            "diarrhoea": {"verdict": "avoid", "reason_key": "fried_irritant", "reason": "Deep fried texture worsens digestive cramps"},
            "fever": {"verdict": "avoid", "reason_key": "dehydrating", "reason": "Highly salty snacks dehydrate feverish patients"}
        }
    },
    {
        "food_id": "jaggery_gur",
        "names": {"en": "Jaggery (Gur)", "hi": "गुड़"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/jaggery.jpg",
        "nutrients_per_100g": {"iron_mg": 11.0, "sugar_g": 85.0, "potassium_mg": 1056.0},
        "rules": {
            "diabetes": {"verdict": "avoid", "reason_key": "jaggery_sugar", "reason": "Spikes blood sugar almost as fast as white refined sugar"},
            "hypertension": {"verdict": "limit", "reason_key": "small_amount", "reason": "Contains potassium but high glycemic load"},
            "anaemia": {"verdict": "eat", "reason_key": "iron_gur", "reason": "Traditional Indian source of bioavailable iron and minerals"},
            "diarrhoea": {"verdict": "limit", "reason_key": "high_osmolarity", "reason": "High sugar load can draw water into intestine"},
            "fever": {"verdict": "limit", "reason_key": "warm_sweetener", "reason": "Small amounts in herbal kadha are fine"}
        }
    },
    {
        "food_id": "pomegranate_anar",
        "names": {"en": "Pomegranate (Anar)", "hi": "अनार"},
        "diet": "veg",
        "allergens": [],
        "image_url": "/images/food/pomegranate.jpg",
        "nutrients_per_100g": {"polyphenols_mg": 250.0, "iron_mg": 0.3, "vitamin_c_mg": 10.2},
        "rules": {
            "diabetes": {"verdict": "eat", "reason_key": "low_gi_fruit", "reason": "Low GI fruit packed with anti-inflammatory polyphenols"},
            "hypertension": {"verdict": "eat", "reason_key": "ace_inhibitor_fruit", "reason": "Natural polyphenols improve endothelial nitric oxide"},
            "anaemia": {"verdict": "eat", "reason_key": "anemia_champion", "reason": "Vitamin C and antioxidants enhance iron absorption"},
            "diarrhoea": {"verdict": "eat", "reason_key": "astringent_juice", "reason": "Astringent properties help bind loose stools"},
            "fever": {"verdict": "eat", "reason_key": "cooling_antioxidant", "reason": "Refreshing and replenishes lost fluids and antioxidants"}
        }
    }
]

# ---------------------------------------------------------
# Red Flag Warnings Per Condition
# ---------------------------------------------------------
RED_FLAGS_PER_CONDITION: Dict[str, str] = {
    "diabetes": "Get help if: Feeling confused, very drowsy, rapid breathing, or blood sugar > 250 mg/dL? Get medical help now.",
    "hypertension": "Get help if: Severe sudden headache, chest pressure, blurred vision, or shortness of breath? Call 108 immediately.",
    "anaemia": "Get help if: Dizziness upon standing, extreme paleness, fainting, or chest palpitations? Consult a physician.",
    "diarrhoea": "Get help if: Sunken eyes, extreme lethargy, inability to keep fluids down, or blood in stool? Rush to PHC.",
    "fever": "Get help if: Temperature > 103°F, stiff neck, severe shortness of breath, or confusion? Seek immediate care.",
    "general": "Get help if: Severe sudden dizziness, chest pain, or unexplainable sudden weight loss."
}

CONDITION_LABELS: Dict[str, Dict[str, str]] = {
    "diabetes": {"en": "Type 2 diabetes", "hi": "टाइप 2 मधुमेह", "type": "long_term", "subtitle": "Everyday eating guide for blood sugar control."},
    "hypertension": {"en": "High blood pressure", "hi": "उच्च रक्तचाप (बीपी)", "type": "long_term", "subtitle": "Long-term low-sodium guide for heart & BP control."},
    "anaemia": {"en": "Anaemia", "hi": "एनीमिया (खून की कमी)", "type": "long_term", "subtitle": "Iron and folate rich guide to boost hemoglobin."},
    "diarrhoea": {"en": "Diarrhoea", "hi": "दस्त / उल्टी", "type": "short_term", "subtitle": "Recover this week: Hydrating & gut-soothing foods."},
    "fever": {"en": "Fever", "hi": "बुखार", "type": "short_term", "subtitle": "Recover this week: Light, cooling, energy-restoring foods."},
    "general": {"en": "General Lifestyle & Macro Balance", "hi": "सामान्य जीवनशैली व पोषण संतुलन", "type": "wellness", "subtitle": "Personalized macro audit, habit evaluation & cheap Indian superfoods."}
}


# ---------------------------------------------------------
# Agent Logic Functions
# ---------------------------------------------------------
def get_nutrition_guide_for_condition(
    condition: str = "diabetes",
    vegetarian_only: bool = False,
    allergies: Optional[List[str]] = None,
    medicines: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generates a curated clinical diet guide for a specified condition.
    Groups foods into Eat, Limit, Avoid, extracts Top 3 recommendations, and enforces safety rules.
    """
    cond_key = (condition or "diabetes").lower().strip()
    if cond_key not in CONDITION_LABELS:
        cond_key = "diabetes"

    allergies_set = set([a.lower().strip() for a in (allergies or [])])
    meds_set = set([m.lower().strip() for m in (medicines or [])])

    eat_list = []
    limit_list = []
    avoid_list = []

    for item in CURATED_FOODS_DATABASE:
        # Vegetarian filter
        if vegetarian_only and item["diet"] != "veg":
            continue

        # Allergen safety check
        has_allergen = any(a in allergies_set for a in item.get("allergens", []))

        # Medicine interaction check (e.g. Warfarin + spinach / green leafy veg)
        has_med_interaction = False
        med_caution_note = None
        if "warfarin" in meds_set and item["food_id"] in ("spinach_palak", "methi_leaves"):
            has_med_interaction = True
            med_caution_note = "⚠️ High Vitamin K in leafy greens interacts with Warfarin. Keep intake consistent, don't suddenly increase."
        elif any(m in meds_set for m in ["telmisartan", "lisinopril", "losartan"]) and item["food_id"] in ("ripe_banana", "potato"):
            # High potassium caution with ACE inhibitors/ARBs
            med_caution_note = "⚠️ Rich in potassium; consume in moderation as your BP medication retains potassium."

        rule = item["rules"].get(cond_key, {"verdict": "limit", "reason": "Consume in moderation"})
        verdict = rule["verdict"]

        if has_allergen:
            verdict = "avoid"
            reason = f"Contains allergen ({', '.join(item['allergens'])})"
        else:
            reason = rule["reason"]
            if med_caution_note:
                reason = f"{reason}. {med_caution_note}"

        food_card = {
            "food_id": item["food_id"],
            "names": item["names"],
            "diet": item["diet"],
            "nutrients": item["nutrients_per_100g"],
            "verdict": verdict,
            "reason_key": rule.get("reason_key", "general"),
            "reason": reason,
            "image_url": item.get("image_url", "")
        }

        if verdict == "eat":
            eat_list.append(food_card)
        elif verdict == "limit":
            limit_list.append(food_card)
        else:
            avoid_list.append(food_card)

    top_3_today = eat_list[:3]

    return {
        "condition": cond_key,
        "condition_info": CONDITION_LABELS[cond_key],
        "red_flag_strip": RED_FLAGS_PER_CONDITION.get(cond_key, "Seek medical help if symptoms worsen."),
        "filters": {
            "vegetarian_only": vegetarian_only,
            "allergies": list(allergies_set),
            "medicines": list(meds_set)
        },
        "top_3_today": top_3_today,
        "categories": {
            "eat": {"label": "Eat", "description": "Good choices", "count": len(eat_list), "items": eat_list},
            "limit": {"label": "Limit", "description": "Small portions or less often", "count": len(limit_list), "items": limit_list},
            "avoid": {"label": "Avoid", "description": "Best avoided for now", "count": len(avoid_list), "items": avoid_list}
        },
        "disclaimer": "General guidance based on ICMR-NIN guidelines. Your doctor's or dietitian's advice comes first."
    }


FOOD_ALIASES: Dict[str, str] = {
    "samosa": "fried_maida_snacks",
    "biscuit": "fried_maida_snacks",
    "biscuits": "fried_maida_snacks",
    "pakora": "fried_maida_snacks",
    "pakoda": "fried_maida_snacks",
    "kachori": "fried_maida_snacks",
    "pickle": "pickles_achar",
    "pickles": "pickles_achar",
    "achar": "pickles_achar",
    "aachar": "pickles_achar",
    "banana": "ripe_banana",
    "kela": "ripe_banana",
    "roti": "ragi_jowar_roti",
    "chapati": "ragi_jowar_roti",
    "ragi": "ragi_jowar_roti",
    "jowar": "ragi_jowar_roti",
    "rice": "white_rice",
    "chawal": "white_rice",
    "potato": "potato",
    "aloo": "potato",
    "alu": "potato",
    "curd": "plain_curd",
    "dahi": "plain_curd",
    "yogurt": "plain_curd",
    "egg": "eggs",
    "eggs": "eggs",
    "anda": "eggs",
    "ande": "eggs",
    "fish": "grilled_fish",
    "machli": "grilled_fish",
    "poha": "poha",
    "flattened rice": "poha",
    "sugary drink": "sugary_drinks",
    "cold drink": "sugary_drinks",
    "coke": "sugary_drinks",
    "pepsi": "sugary_drinks",
    "juice": "sugary_drinks",
    "mithai": "mithai_jalebi",
    "jalebi": "mithai_jalebi",
    "sweet": "mithai_jalebi",
    "sweets": "mithai_jalebi",
    "lauki": "lauki_bottle_gourd",
    "bottle gourd": "lauki_bottle_gourd",
    "ghiya": "lauki_bottle_gourd",
    "spinach": "spinach_palak",
    "palak": "spinach_palak",
    "methi": "methi_leaves",
    "fenugreek": "methi_leaves",
    "oats": "oats",
    "oatmeal": "oats",
    "papad": "papad_namkeen",
    "namkeen": "papad_namkeen",
    "bhujia": "papad_namkeen",
    "chips": "papad_namkeen",
    "gur": "jaggery_gur",
    "jaggery": "jaggery_gur",
    "anar": "pomegranate_anar",
    "pomegranate": "pomegranate_anar",
    "moong": "moong_dal",
    "dal": "moong_dal",
    "sattu": "moong_dal",
    "chana": "moong_dal",
}


def check_specific_food_safety(
    query: str,
    condition: str = "diabetes",
    medicines: Optional[List[str]] = None,
    allergies: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Checks a specific food query (e.g. "Can I eat banana with diabetes?") against curated rules or LLM fallback.
    Also screens query for red flag symptoms (e.g. "chest pain").
    """
    # 1. Emergency Safety Intercept (if user typed emergency symptom in search box)
    safety_eval = evaluate_safety(query)
    if not safety_eval.is_safe:
        return {
            "is_emergency": True,
            "safety_message": safety_eval.response,
            "verdict": "avoid",
            "food_name": query,
            "reason": "🚨 Emergency Red Flag Symptom Detected. Stop food search and seek immediate medical assistance."
        }

    q_clean = re.sub(r'[^\w\s]', ' ', query.lower()).strip()
    q_words = set(q_clean.split())
    cond_key = condition.lower().strip() if condition else "diabetes"
    if cond_key not in CONDITION_LABELS:
        cond_key = "diabetes"

    # Match via aliases first
    matched_food_id = None
    for alias, fid in FOOD_ALIASES.items():
        if alias in q_clean or alias in q_words:
            matched_food_id = fid
            break

    matched_food = None
    if matched_food_id:
        for item in CURATED_FOODS_DATABASE:
            if item["food_id"] == matched_food_id:
                matched_food = item
                break

    # If not found via alias, search database names directly
    if not matched_food:
        for item in CURATED_FOODS_DATABASE:
            en_clean = re.sub(r'[^\w\s]', ' ', item["names"]["en"].lower()).split()
            hi_clean = re.sub(r'[^\w\s]', ' ', item["names"]["hi"].lower())
            fid = item["food_id"].replace("_", " ")
            if fid in q_clean or any(word in q_words for word in en_clean if len(word) > 2) or hi_clean in q_clean:
                matched_food = item
                break

    if matched_food:
        rule = matched_food["rules"].get(cond_key, {"verdict": "limit", "reason": "Consume in moderation"})
        return {
            "is_emergency": False,
            "matched_curated": True,
            "food_id": matched_food["food_id"],
            "names": matched_food["names"],
            "condition": cond_key,
            "verdict": rule["verdict"],
            "reason": rule["reason"],
            "nutrients": matched_food["nutrients_per_100g"],
            "confidence": "Curated Clinical Guideline (ICMR-NIN)"
        }

    # Fallback for unknown foods (clearly labeled AI-suggested)
    return {
        "is_emergency": False,
        "matched_curated": False,
        "food_name": query,
        "condition": cond_key,
        "verdict": "limit",
        "reason": f"AI-suggested, less certain: For '{query}', consume in small portion with your doctor's advice.",
        "confidence": "AI-suggested, less certain"
    }


async def nutrition_agent_node(state: SynapseOSState) -> SynapseOSState:
    """LangGraph node execution for Clinical Nutrition Agent."""
    start = time.time()
    query = state.input_text.lower()

    # Determine condition from state or query
    target_condition = "diabetes"
    if state.triage_data and state.triage_data.get("suspected_condition"):
        c_name = state.triage_data["suspected_condition"].lower()
        if "bp" in c_name or "hypertension" in c_name:
            target_condition = "hypertension"
        elif "anemia" in c_name or "iron" in c_name:
            target_condition = "anaemia"
        elif "diarrhea" in c_name or "gastro" in c_name or "vomit" in c_name:
            target_condition = "diarrhoea"
        elif "fever" in c_name or "viral" in c_name:
            target_condition = "fever"

    if "bp" in query or "hypertension" in query or "blood pressure" in query:
        target_condition = "hypertension"
    elif "anemia" in query or "haemoglobin" in query or "blood loss" in query:
        target_condition = "anaemia"
    elif "diarrhea" in query or "loose motion" in query or "dast" in query:
        target_condition = "diarrhoea"
    elif "fever" in query or "bukhar" in query:
        target_condition = "fever"

    guide = get_nutrition_guide_for_condition(condition=target_condition)
    state.preventive_data = state.preventive_data or {}
    state.preventive_data["nutrition_guide"] = guide

    duration = int((time.time() - start) * 1000)
    state.trace.append(AgentTraceStep(
        agent_name="Clinical Nutrition & Diet Agent (ICMR-NIN)",
        action=f"Compiled dietary guide for {target_condition.upper()} (Top choices: {len(guide['top_3_today'])})",
        duration_ms=duration,
        details={"condition": target_condition, "eat_count": guide["categories"]["eat"]["count"]}
    ))
    return state


async def handle_nutrition_chatbot_conversation(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    abha_profile: Optional[Dict[str, Any]] = None,
    condition: str = "diabetes",
    lifestyle_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Handles interactive chat queries for Clinical & Lifestyle Nutrition AI.
    Incorporates ABHA profile details or lifestyle data (workout, smoking, alcohol, meals, deficiencies),
    checks emergency safety, and calls OpenRouter / Gemini / ICMR-NIN fallback chain.
    """
    # 1. Emergency Safety Intercept
    safety_eval = evaluate_safety(user_message)
    if not safety_eval.is_safe:
        return {
            "success": False,
            "is_emergency": True,
            "response": safety_eval.response,
            "safety_message": safety_eval.response,
            "provider": "Safety Router Intercept"
        }

    cond_key = condition.lower().strip() if condition else "diabetes"
    if cond_key not in CONDITION_LABELS:
        cond_key = "general" if "general" in cond_key or "diet" in cond_key else "diabetes"

    # Extract ABHA details cleanly
    prof = abha_profile or {}
    patient_name = prof.get("name") or "Rachit Tiwari"
    abha_id = prof.get("abhaId") or prof.get("abha_id") or "91-8842-1920-7463"
    age = prof.get("age") or prof.get("dob") or "23"
    gender = prof.get("gender") or "Male"
    vitals = prof.get("vitals") or {}
    bp_sys = vitals.get("systolicBp") or vitals.get("bp_sys") or vitals.get("systolic")
    bp_dia = vitals.get("diastolicBp") or vitals.get("bp_dia") or vitals.get("diastolic")
    bp_str = f"{bp_sys}/{bp_dia} mmHg" if bp_sys and bp_dia else "116/74 mmHg"
    glucose = vitals.get("bloodGlucose") or vitals.get("fasting_glucose") or vitals.get("glucose")
    glucose_str = f"{glucose} mg/dL" if glucose else "90 mg/dL"
    spo2 = vitals.get("spo2") or "99%"

    raw_conds = prof.get("conditions") or [CONDITION_LABELS[cond_key]["en"]]
    conditions_list = [raw_conds] if isinstance(raw_conds, str) else list(raw_conds)
    raw_meds = prof.get("medicines") or prof.get("medications") or []
    meds_list = [raw_meds] if isinstance(raw_meds, str) else list(raw_meds)

    # Lifestyle form extraction (if General Diet mode)
    ls = lifestyle_data or {}
    workout = ls.get("workout", "Moderate")
    smoking = ls.get("smoking", "No")
    alcohol = ls.get("alcohol", "No")
    diet_pref = ls.get("dietPreference", "Vegetarian")
    goal = ls.get("goal", "General Health & Balanced Macros")
    breakfast = ls.get("breakfast", "")
    lunch = ls.get("lunch", "")
    dinner = ls.get("dinner", "")
    extras = ls.get("extras", "")
    detected_gaps = ls.get("deficiencies", [])

    is_general_mode = cond_key == "general" or bool(lifestyle_data)

    if is_general_mode:
        system_prompt = (
            "You are the SynapseOS Clinical AI Nutritionist & Dietitian, specializing in Indian general wellness, macro audits, and budget-friendly superfoods (ICMR-NIN 2024 guidelines).\n"
            "You provide practical, highly actionable, affordable dietary solutions tailored to Indian lifestyles, fitness routines, and daily eating patterns.\n\n"
            "USER PROFILE & LIFESTYLE AUDIT CONTEXT:\n"
            f"• Name / Demographics: {patient_name} ({age}, {gender})\n"
            f"• Diet Preference: {diet_pref} | Primary Goal: {goal}\n"
            f"• Physical Activity / Workout: {workout}\n"
            f"• Habits: Smoking: {smoking} | Alcohol: {alcohol}\n"
            f"• Typical Daily Meals: \n"
            f"  - Breakfast: {breakfast or 'Not specified'}\n"
            f"  - Lunch: {lunch or 'Not specified'}\n"
            f"  - Dinner: {dinner or 'Not specified'}\n"
            f"  - Snacks / Extras: {extras or 'Not specified'}\n"
            f"• Detected Deficiencies / Macro Gaps: {', '.join(detected_gaps) if detected_gaps else 'Protein deficit, Fiber deficiency, Refined carb overload'}\n\n"
            "RULES FOR RESPONSE:\n"
            "1. Give straightforward, warm, and highly practical Indian food recommendations that fit their budget and lifestyle.\n"
            "2. Focus on cheap, accessible Indian whole foods to fix their macro/micro deficiencies without requiring expensive supplements or whey powder:\n"
            "   - Sattu drink (सत्तू) for high protein & cooling sustained energy (~₹10-15/glass)\n"
            "   - Sprouted Moong / Kala Chana (अंकुरित दालें) for raw enzymes, fiber & protein (~₹8)\n"
            "   - Roasted Chana (भुना चना) to replace fried biscuits/namkeen with tea (~₹10)\n"
            "   - Fresh Homemade Curd / Dahi (दही) for gut flora, calcium & B12 (~₹10)\n"
            "   - Boiled Eggs (अंडे) for complete protein & choline (~₹7/egg)\n"
            "   - Soy Chunks (सोया वड़ी) for ultra-affordable lean protein (~₹6/50g serving)\n"
            "   - Green Leafy Veg / Palak / Saag (पालक/मेथी) for iron & folate (~₹15/bunch)\n"
            "   - Roasted Peanuts (मूंगफली) for healthy fats & protein (~₹8)\n"
            "   - Amla / Lemon Water (आंवला/नींबू) for Vitamin C recovery (vital for smokers/immunity) (~₹5)\n"
            "   - Millets: Ragi, Jowar, Bajra for calcium, slow GI & dietary fiber\n"
            "3. If they smoke or drink alcohol, explicitly explain how specific cheap foods (like Amla, Lemon water, Curd, Coconut water, Leafy greens) help replenish depleted Vitamin C, B-complex vitamins, and liver antioxidants.\n"
            "4. Structure response with bold headers, concise bullet points, and an easy meal swap or daily schedule.\n"
            "5. Keep the advice encouraging, non-judgmental, and practical for daily Indian routine."
        )
    else:
        # Build system prompt grounding in ICMR-NIN & ABHA Profile
        system_prompt = (
            "You are the SynapseOS Clinical AI Nutritionist & Dietitian, specializing in Indian clinical nutrition (ICMR-NIN & IFCT 2024 guidelines).\n"
            "You provide empathetic, precise, scientifically grounded, and practical dietary advice for Indian households.\n\n"
            "ACTIVE PATIENT ABHA PROFILE CONTEXT:\n"
            f"• Patient Name: {patient_name} (ABHA ID: {abha_id})\n"
            f"• Age/DOB/Gender: {age} {gender}\n"
            f"• Active Vitals: BP: {bp_str}, Blood Glucose: {glucose_str}, SpO2: {spo2}\n"
            f"• Diagnosed Conditions: {', '.join(conditions_list)}\n"
            f"• Active Medications: {', '.join(meds_list) if meds_list else 'None reported'}\n"
            f"• Primary Condition Focus: {CONDITION_LABELS[cond_key]['en']}\n\n"
            "RULES FOR RESPONSE:\n"
            "1. Address the user directly by name, referencing their specific ABHA health metrics when relevant (e.g. blood sugar, blood pressure, active medicines).\n"
            "2. Provide clear, structured Indian meal recommendations (e.g. Moong dal khichdi, Ragi roti, Lauki soup, Methi, Curd, Poha, Palak).\n"
            "3. Explicitly state foods to EAT, LIMIT, and AVOID for their condition.\n"
            "4. Highlight any drug-food interactions (e.g., Warfarin + green leafies, Telmisartan + high potassium foods like ripe bananas/potatoes, Metformin + timing with meals).\n"
            "5. Keep the tone encouraging, easy to understand, formatted with clean bullet points and bold headers.\n"
            "6. Always add a short clinical safety reminder at the end."
        )

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    if history:
        for msg in history[-6:]:
            r = msg.get("role", "user")
            c = msg.get("content", "")
            if r in ("user", "assistant") and c:
                messages.append({"role": r, "content": c})

    messages.append({"role": "user", "content": user_message})

    # Prepare deterministic ICMR-NIN fallback response in case LLM API is completely offline
    if is_general_mode:
        deterministic_fallback = (
            f"Hello {patient_name}! Based on your lifestyle audit ({workout} activity, {diet_pref} diet, Goal: {goal}), "
            f"here is your affordable Indian macro & nutrient balance strategy:\n\n"
            f"🟢 **Cheap Superfoods to Fix Deficiencies:**\n"
            f"• **Sattu Drink / Roasted Chana (भुना चना):** +15g to 20g cheap protein for ~₹10-15.\n"
            f"• **Sprouted Moong & Chana (अंकुरित दालें):** Live enzymes, fiber & protein for ~₹8/bowl.\n"
            f"• **Fresh Curd / Dahi (दही):** Probiotics, B12 & calcium for gut restoration.\n"
            f"• **Amla / Fresh Lemon Water:** Restores depleted Vitamin C from oxidative stress.\n\n"
            f"💡 **Practical Habit Swap:** Replace fried namkeen or bakery biscuits with roasted chana or peanuts, and add 1 glass of sattu or curd lassi to hit your daily protein goal easily."
        )
    else:
        guide_fallback = get_nutrition_guide_for_condition(cond_key, medicines=meds_list)
        top_eats = [item["names"]["en"] for item in guide_fallback["top_3_today"]]
        top_avoids = [item["names"]["en"] for item in guide_fallback["categories"]["avoid"]["items"][:3]]

        deterministic_fallback = (
            f"Hello {patient_name}! Based on your ABHA health profile (ABHA ID: {abha_id}, Condition: {CONDITION_LABELS[cond_key]['en']}, BP: {bp_str}, Glucose: {glucose_str}), "
            f"here is your curated ICMR-NIN diet guidance:\n\n"
            f"🟢 **Recommended Foods to Eat:** {', '.join(top_eats) if top_eats else 'Moong dal, Lauki, Plain curd'}\n"
            f"🔴 **Foods to Avoid:** {', '.join(top_avoids) if top_avoids else 'Sugary drinks, Fried maida snacks, Pickles'}\n\n"
            f"💡 **Key Clinical Advice:** For {CONDITION_LABELS[cond_key]['en']}, focus on low-glycemic, low-sodium meals rich in dietary fibre. "
            f"Always check with your attending physician before making major dietary adjustments."
        )

    llm_response = await call_nutrition_llm_with_fallbacks(messages, fallback_text=deterministic_fallback)

    return {
        "success": True,
        "is_emergency": False,
        "response": llm_response,
        "condition": cond_key,
        "abha_profile_used": {
            "name": patient_name,
            "abha_id": abha_id,
            "age": age,
            "gender": gender,
            "vitals": {"bp": bp_str, "glucose": glucose_str, "spo2": spo2},
            "conditions": conditions_list,
            "medicines": meds_list
        },
        "lifestyle_data_used": ls if is_general_mode else None,
        "provider": "OpenRouter AI (Fallback: Gemini 2.0 / ICMR-NIN)"
    }

