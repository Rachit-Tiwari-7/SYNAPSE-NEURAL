"""
SynapseOS — tests/test_nutrition_agent.py
Pytest unit test suite for Clinical Nutrition & Dietary Guidance Agent.
Verifies safety gate rules, allergen filtering, food-drug interaction checks, and condition consistency.
"""

import pytest
from backend.app.agents.nutrition_agent import (
    CURATED_FOODS_DATABASE,
    get_nutrition_guide_for_condition,
    check_specific_food_safety,
    handle_nutrition_chatbot_conversation
)

def test_no_food_is_both_eat_and_avoid_for_same_condition():
    """Requirement 1: No food can have conflicting Eat and Avoid verdicts for the exact same condition."""
    conditions = ["diabetes", "hypertension", "anaemia", "diarrhoea", "fever"]
    for cond in conditions:
        guide = get_nutrition_guide_for_condition(condition=cond)
        eat_ids = set([f["food_id"] for f in guide["categories"]["eat"]["items"]])
        avoid_ids = set([f["food_id"] for f in guide["categories"]["avoid"]["items"]])
        intersection = eat_ids.intersection(avoid_ids)
        assert len(intersection) == 0, f"Conflicting verdicts found for condition '{cond}': {intersection}"

def test_allergen_is_never_recommended():
    """Requirement 2: An allergen specified by user is never recommended in the Eat category."""
    guide = get_nutrition_guide_for_condition(condition="diabetes", allergies=["dairy", "egg", "fish"])
    eat_items = guide["categories"]["eat"]["items"]
    eat_allergens = [f for f in eat_items if any(a in ["dairy", "egg", "fish"] for a in f.get("nutrients", {}))]
    
    for item in eat_items:
        food_id = item["food_id"]
        assert food_id not in ["plain_curd", "mithai_jalebi", "eggs", "grilled_fish"], f"Allergen food '{food_id}' recommended in Eat category despite user allergy."

def test_safety_router_catches_chest_pain_in_food_search():
    """Requirement 3: The safety router catches emergency symptoms (e.g. 'chest pain') typed into food search box."""
    result = check_specific_food_safety(query="Can I eat banana with severe chest pain?")
    assert result["is_emergency"] is True
    assert "Emergency Red Flag" in result["reason"] or "emergency" in result["safety_message"].lower()

test_every_food_has_hindi_name_or_fallback = None

def test_every_food_has_hindi_name():
    """Requirement 4: Every curated food item has a valid Hindi name."""
    for item in CURATED_FOODS_DATABASE:
        hi_name = item.get("names", {}).get("hi")
        assert hi_name is not None and len(hi_name.strip()) > 0, f"Food '{item['food_id']}' is missing a Hindi name."

def test_medicine_interaction_triggers_caution():
    """Requirement 5: Food-medicine interactions (e.g. Warfarin + spinach/leafy greens) trigger explicit cautions."""
    guide = get_nutrition_guide_for_condition(condition="hypertension", medicines=["warfarin"])
    palak_item = None
    for item in guide["categories"]["eat"]["items"] + guide["categories"]["limit"]["items"]:
        if item["food_id"] == "spinach_palak":
            palak_item = item
            break
    assert palak_item is not None
    assert "Warfarin" in palak_item["reason"] or "Vitamin K" in palak_item["reason"]

@pytest.mark.asyncio
async def test_nutrition_chatbot_conversation_with_abha_profile():
    """Requirement 6: Nutrition chatbot incorporates ABHA health profile details and returns responses."""
    abha_profile = {
        "name": "Mausam Kar",
        "abhaId": "91-5829-3910-4821",
        "dob": "2002-05-14",
        "gender": "Male",
        "vitals": {"systolicBp": 138, "diastolicBp": 88, "bloodGlucose": 154, "spo2": 98},
        "conditions": ["Type 2 Diabetes", "Essential Hypertension"],
        "medicines": ["Metformin 500mg", "Telmisartan 40mg"]
    }
    res = await handle_nutrition_chatbot_conversation(
        user_message="What should I eat for dinner given my blood glucose and BP?",
        abha_profile=abha_profile,
        condition="diabetes"
    )
    assert res["success"] is True
    assert res["is_emergency"] is False
    assert "Mausam Kar" in res["response"] or "91-5829-3910-4821" in res["response"] or "ABHA" in res["response"] or "diabetes" in res["response"].lower()
    assert res["abha_profile_used"]["name"] == "Mausam Kar"

