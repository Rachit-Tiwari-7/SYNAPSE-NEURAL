'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Utensils, 
  Search, 
  Check, 
  AlertTriangle, 
  AlertOctagon, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  Leaf, 
  CheckCircle2, 
  XCircle, 
  Bot, 
  Send, 
  User, 
  RefreshCw, 
  BadgeCheck, 
  Stethoscope, 
  UserCheck, 
  Dumbbell, 
  Cigarette, 
  Wine, 
  Coffee, 
  Coins, 
  Scale, 
  Zap, 
  Clock, 
  Maximize2, 
  Minimize2,
  CheckCircle
} from 'lucide-react';
import { PatientInfo, VitalsData } from './types';
import { MockHealthProfile } from '@/data/mockHealthProfiles';
import { useLanguage } from '@/context/LanguageContext';

export type NutritionCondition = 'diabetes' | 'hypertension' | 'anaemia' | 'diarrhoea' | 'fever';
export type NutritionMode = 'clinical' | 'general';

interface FoodItem {
  food_id: string;
  names: { en: string; hi: string };
  diet: 'veg' | 'nonveg';
  verdict: 'eat' | 'limit' | 'avoid';
  reason: string;
  image_url: string;
  nutrients?: {
    protein_g?: number;
    sodium_mg?: number;
    fibre_g?: number;
    potassium_mg?: number;
    sugar_g?: number;
    carbs_g?: number;
    iron_mg?: number;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  provider?: string;
}

export interface NutritionPanelProps {
  patient?: PatientInfo;
  activeProfile?: MockHealthProfile;
  vitals?: VitalsData;
  initialCondition?: NutritionCondition;
}

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('synapseos_backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
};

const CONDITIONS_MAP: { id: NutritionCondition; label: string; hi: string; type: 'long_term' | 'short_term'; subtitle: string; redFlag: string }[] = [
  { 
    id: 'diabetes', 
    label: 'Type 2 diabetes', 
    hi: 'टाइप 2 मधुमेह', 
    type: 'long_term', 
    subtitle: 'Long-term guide for everyday eating & glycemic control.',
    redFlag: 'Get help if: Feeling confused, very drowsy, or blood sugar > 250 mg/dL? Get medical help now.' 
  },
  { 
    id: 'hypertension', 
    label: 'High blood pressure', 
    hi: 'उच्च रक्तचाप (बीपी)', 
    type: 'long_term', 
    subtitle: 'Long-term low-sodium guide for heart & vascular health.',
    redFlag: 'Get help if: Severe sudden headache, chest pressure, or blurred vision? Call 108 immediately.' 
  },
  { 
    id: 'anaemia', 
    label: 'Anaemia', 
    hi: 'एनीमिया', 
    type: 'long_term', 
    subtitle: 'Everyday iron and folate rich food guide for hemoglobin.',
    redFlag: 'Get help if: Severe dizziness, extreme paleness, or fainting? Consult doctor.' 
  },
  { 
    id: 'diarrhoea', 
    label: 'Diarrhoea', 
    hi: 'दस्त / उल्टी', 
    type: 'short_term', 
    subtitle: 'Recover this week: Hydrating & gut-soothing foods.',
    redFlag: 'Get help if: Sunken eyes, inability to retain fluids, or blood in stool? Rush to PHC.' 
  },
  { 
    id: 'fever', 
    label: 'Fever', 
    hi: 'बुखार', 
    type: 'short_term', 
    subtitle: 'Recover this week: Light, cooling, energy-restoring foods.',
    redFlag: 'Get help if: Fever > 103°F, stiff neck, or severe breathing difficulty? Get emergency help.' 
  }
];

// Per-Condition In-Memory Database with authentic clinical verdicts & distinct images
const CURATED_FOODS_BY_CONDITION: Record<NutritionCondition, FoodItem[]> = {
  diabetes: [
    { food_id: 'moong_dal', names: { en: 'Moong dal', hi: 'मूंग दाल' }, diet: 'veg', verdict: 'eat', reason: 'High protein, slow-release carbs with minimal glycemic surge', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'methi_leaves', names: { en: 'Methi leaves (Fenugreek)', hi: 'मेथी' }, diet: 'veg', verdict: 'eat', reason: 'Fibre-rich and low in sugar, improves peripheral insulin sensitivity', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ragi_roti', names: { en: 'Ragi or jowar roti', hi: 'रागी / ज्वार रोटी' }, diet: 'veg', verdict: 'eat', reason: 'Complex millet fibre prevents sudden postprandial glucose spikes', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'plain_curd', names: { en: 'Plain curd / Dahi', hi: 'दही' }, diet: 'veg', verdict: 'eat', reason: 'Low GI protein with zero added sugar and healthy probiotics', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'boiled_eggs', names: { en: 'Boiled eggs', hi: 'अंडे' }, diet: 'nonveg', verdict: 'eat', reason: 'High quality complete protein that barely moves blood glucose', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fish_curry', names: { en: 'Fish curry or grilled fish', hi: 'मछली' }, diet: 'nonveg', verdict: 'eat', reason: 'Lean protein rich in anti-inflammatory omega-3 fatty acids', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'lauki_bottle_gourd', names: { en: 'Lauki (Bottle gourd)', hi: 'लौकी' }, diet: 'veg', verdict: 'eat', reason: '96% water, negligible sugar, and ultra-low glycemic load', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'white_rice', names: { en: 'White rice', hi: 'चावल' }, diet: 'veg', verdict: 'limit', reason: 'High glycemic index; limit to 1 small cup and pair with dal/veg', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ripe_banana', names: { en: 'Ripe banana', hi: 'केला' }, diet: 'veg', verdict: 'limit', reason: 'Eat half at a time; pair with nuts or curd to blunt glucose spike', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'potato', names: { en: 'Potato (Aloo)', hi: 'आलू' }, diet: 'veg', verdict: 'limit', reason: 'Fast-acting starch; keep portions small, boiled rather than fried', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'poha', names: { en: 'Poha', hi: 'पोहा' }, diet: 'veg', verdict: 'limit', reason: 'Add roasted peanuts and chopped vegetables to slow starch absorption', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'sugary_drinks', names: { en: 'Sugary drinks and packaged juice', hi: 'मीठे पेय' }, diet: 'veg', verdict: 'avoid', reason: 'Rapidly spikes blood sugar without satiety; causes insulin resistance', image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'mithai', names: { en: 'Mithai and jalebi', hi: 'मिठाई' }, diet: 'veg', verdict: 'avoid', reason: 'Concentrated refined sugar and ghee trigger immediate hyperglycemia', image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fried_snacks', names: { en: 'Fried maida snacks (Samosa, pakora)', hi: 'समौसा, बिस्कुट' }, diet: 'veg', verdict: 'avoid', reason: 'Refined flour plus saturated fats delay glucose clearance and increase resistance', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80' }
  ],
  hypertension: [
    { food_id: 'methi_leaves', names: { en: 'Methi leaves (Fenugreek)', hi: 'मेथी' }, diet: 'veg', verdict: 'eat', reason: 'Naturally low in sodium and high in bioavailable arterial antioxidants', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'moong_dal', names: { en: 'Moong dal', hi: 'मूंग दाल' }, diet: 'veg', verdict: 'eat', reason: 'Extremely low sodium (2mg/100g) and rich in potassium for vascular dilation', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'lauki_bottle_gourd', names: { en: 'Lauki (Bottle gourd)', hi: 'लौकी' }, diet: 'veg', verdict: 'eat', reason: 'Natural mild diuretic with zero sodium, helps reduce fluid pressure', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'plain_curd', names: { en: 'Plain curd / Dahi', hi: 'दही' }, diet: 'veg', verdict: 'eat', reason: 'Calcium and potassium support endothelial smooth muscle relaxation', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ripe_banana', names: { en: 'Ripe banana', hi: 'केला' }, diet: 'veg', verdict: 'eat', reason: 'High potassium (358mg) naturally counters dietary sodium retention', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fish_curry', names: { en: 'Fish curry (light salt)', hi: 'मछली' }, diet: 'nonveg', verdict: 'eat', reason: 'Omega-3 fatty acids lower systemic arterial stiffness and inflammation', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'white_rice', names: { en: 'White rice (un-salted)', hi: 'चावल' }, diet: 'veg', verdict: 'eat', reason: 'Naturally salt-free staple grain suitable for low-sodium DASH diet', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'boiled_eggs', names: { en: 'Boiled eggs', hi: 'अंडे' }, diet: 'nonveg', verdict: 'eat', reason: 'Lean protein; avoid adding sprinkle of extra table salt', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'potato', names: { en: 'Boiled potato', hi: 'आलू' }, diet: 'veg', verdict: 'eat', reason: 'Rich in potassium when boiled without salt', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'poha', names: { en: 'Poha (low salt)', hi: 'पोहा' }, diet: 'veg', verdict: 'eat', reason: 'Heart-healthy light breakfast when cooked with low salt and peanuts', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'pickles_achar', names: { en: 'Pickles (Achar)', hi: 'अचार' }, diet: 'veg', verdict: 'avoid', reason: 'Massive sodium bomb (1200mg/100g); causes immediate fluid overload & BP spike', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'papad_namkeen', names: { en: 'Papad and namkeen', hi: 'पापड़, नमकीन' }, diet: 'veg', verdict: 'avoid', reason: 'Extremely high hidden sodium and trans fats elevate systolic pressure', image_url: 'https://images.unsplash.com/photo-1567184109411-4779e0ed6674?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fried_snacks', names: { en: 'Fried maida snacks (Samosa)', hi: 'समौसा' }, diet: 'veg', verdict: 'avoid', reason: 'Trans fats plus sodium accelerate arterial hardening and hypertension', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80' }
  ],
  anaemia: [
    { food_id: 'methi_leaves', names: { en: 'Methi leaves & Saag', hi: 'मेथी / साग' }, diet: 'veg', verdict: 'eat', reason: 'Rich non-heme iron and folate; add fresh lemon to boost iron absorption by 300%', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ragi_roti', names: { en: 'Ragi or jowar roti', hi: 'रागी / ज्वार रोटी' }, diet: 'veg', verdict: 'eat', reason: 'Ragi is one of the highest plant-based calcium & iron grains in India', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'poha', names: { en: 'Poha (Flattened rice)', hi: 'पोहा' }, diet: 'veg', verdict: 'eat', reason: 'Traditional iron-rich snack (up to 20mg iron per 100g in pounded iron rollers)', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'boiled_eggs', names: { en: 'Boiled eggs', hi: 'अंडे' }, diet: 'nonveg', verdict: 'eat', reason: 'Contains highly bioavailable heme iron and Vitamin B12 for red blood cell synthesis', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fish_curry', names: { en: 'Fish curry', hi: 'मछली' }, diet: 'nonveg', verdict: 'eat', reason: 'Direct source of heme iron and essential micronutrients for hemoglobin', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'moong_dal', names: { en: 'Moong dal', hi: 'मूंग दाल' }, diet: 'veg', verdict: 'eat', reason: 'Plant iron and folate champion; sprouting increases iron bioavailability', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'plain_curd', names: { en: 'Plain curd', hi: 'दही' }, diet: 'veg', verdict: 'eat', reason: 'Improves gut microbiome integrity and iron absorption across the villi', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ripe_banana', names: { en: 'Ripe banana', hi: 'केला' }, diet: 'veg', verdict: 'eat', reason: 'Provides folate and Vitamin B6 essential for RBC maturation', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'white_rice', names: { en: 'White rice', hi: 'चावल' }, diet: 'limit', reason: 'Low in iron and micronutrients unless paired with leafy greens or fortified', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fried_snacks', names: { en: 'Fried maida snacks', hi: 'समौसा' }, diet: 'veg', verdict: 'avoid', reason: 'Fills appetite with zero iron benefit and hinders digestive absorption', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80' }
  ],
  diarrhoea: [
    { food_id: 'white_rice', names: { en: 'Soft steamed white rice / Kanji', hi: 'सफेद चावल का मांड / कांजी' }, diet: 'veg', verdict: 'eat', reason: 'Gentle, binding carbohydrate that calms the intestinal tract and stops loose stools', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ripe_banana', names: { en: 'Ripe banana', hi: 'केला' }, diet: 'veg', verdict: 'eat', reason: 'Core component of BRAT diet; pectin solidifies stool and restores lost potassium', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'plain_curd', names: { en: 'Plain curd / Fresh buttermilk (Chhach)', hi: 'ताजा दही / छाछ' }, diet: 'veg', verdict: 'eat', reason: 'Live Lactobacillus probiotics restore destroyed gut flora and normalize motility', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'moong_dal', names: { en: 'Thin moong dal khichdi', hi: 'मूंग दाल पतली खिचड़ी' }, diet: 'veg', verdict: 'eat', reason: 'Easiest protein to digest without putting mechanical strain on inflamed bowel', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'potato', names: { en: 'Boiled mashed potato (un-fried)', hi: 'उबला आलू' }, diet: 'veg', verdict: 'eat', reason: 'Acts as a natural intestinal binder, restoring electrolytes and bland energy', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'poha', names: { en: 'Soft washed poha with curd', hi: 'दही पोहा' }, diet: 'veg', verdict: 'eat', reason: 'Extremely light and easily absorbed carbohydrate', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'lauki_bottle_gourd', names: { en: 'Boiled lauki soup', hi: 'लौकी का सूप' }, diet: 'veg', verdict: 'eat', reason: 'Hydrates without intestinal friction or heavy insoluble roughage', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'methi_leaves', names: { en: 'Methi leaves / Raw greens', hi: 'मेथी' }, diet: 'veg', verdict: 'limit', reason: 'Coarse roughage can stimulate overactive bowel movements during acute phase', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ragi_roti', names: { en: 'Ragi or jowar roti', hi: 'रागी' }, diet: 'veg', verdict: 'limit', reason: 'Heavy coarse millet fibre; consume soft or wait until stools firm up', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'boiled_eggs', names: { en: 'Fried eggs / Omelette', hi: 'अंडे' }, diet: 'nonveg', verdict: 'limit', reason: 'Avoid oily preparations; soft-boiled is acceptable', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'sugary_drinks', names: { en: 'Packaged juice / Soda', hi: 'मीठे पेय' }, diet: 'veg', verdict: 'avoid', reason: 'Hyper-osmotic sugar pulls water into bowel lumen, causing osmotic diarrhea', image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fried_snacks', names: { en: 'Fried maida snacks (Samosa, pakora)', hi: 'समौसा, बिस्कुट' }, diet: 'veg', verdict: 'avoid', reason: 'Heavy greasy fats trigger painful intestinal contractions and diarrhea flares', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'pickles_achar', names: { en: 'Pickles / Spicy achar', hi: 'अचार' }, diet: 'veg', verdict: 'avoid', reason: 'High acid, chili, and oil severely irritate inflamed digestive mucosa', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' }
  ],
  fever: [
    { food_id: 'moong_dal', names: { en: 'Moong dal khichdi & soup', hi: 'मूंग दाल' }, diet: 'veg', verdict: 'eat', reason: 'Provides light, non-taxing protein to preserve muscle during catabolic fever state', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'lauki_bottle_gourd', names: { en: 'Boiled lauki soup', hi: 'लौकी' }, diet: 'veg', verdict: 'eat', reason: 'Cools internal metabolic heat and delivers gentle cellular hydration', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'plain_curd', names: { en: 'Plain curd / Sweet Lassi', hi: 'दही' }, diet: 'veg', verdict: 'eat', reason: 'Soothing on fever-inflamed digestive tract, replenishing immune flora', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'ripe_banana', names: { en: 'Ripe banana', hi: 'केला' }, diet: 'veg', verdict: 'eat', reason: 'Easy to swallow, soft energy fruit with vital potassium and electrolytes', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'boiled_eggs', names: { en: 'Soft boiled eggs', hi: 'अंडे' }, diet: 'nonveg', verdict: 'eat', reason: 'Soft high-biological-value protein supporting antibody and WBC production', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'white_rice', names: { en: 'Soft steamed rice / Kanji', hi: 'चावल' }, diet: 'veg', verdict: 'eat', reason: 'Easy digestible energy source when appetite is depressed', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'methi_leaves', names: { en: 'Methi leaves / Cooked greens', hi: 'मेथी' }, diet: 'veg', verdict: 'eat', reason: 'Nutrient-dense greens rich in micronutrients for faster immune recovery', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'fried_snacks', names: { en: 'Fried maida snacks (Samosa, pakora)', hi: 'समौसा' }, diet: 'veg', verdict: 'avoid', reason: 'Strains digestion, causes sluggish metabolism, nausea, and stomach heaviness', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80' },
    { food_id: 'mithai', names: { en: 'Mithai and heavy sweets', hi: 'मिठाई' }, diet: 'veg', verdict: 'avoid', reason: 'Heavy concentrated sugar and fat worsens fever nausea and malaise', image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80' }
  ]
};

// 10 Distinct Cheap Indian Superfoods with unique high-res pictures
interface CheapSuperfood {
  id: string;
  name: string;
  hiName: string;
  cost: string;
  macroBenefit: string;
  nutrient: string;
  whyItWorks: string;
  bestTiming: string;
  image: string;
}

const CHEAP_INDIAN_SUPERFOODS: CheapSuperfood[] = [
  {
    id: 'sattu',
    name: 'Sattu Drink (Roasted Gram Flour)',
    hiName: 'सत्तू का नमकीन शरबत / घोल',
    cost: '₹10 - ₹14 / glass',
    macroBenefit: '+20.5g Protein, +5.4g Fiber',
    nutrient: 'Plant Protein, Iron, Magnesium',
    whyItWorks: 'Known as the poor man’s whey protein. High biological value, low glycemic index, cooling sustained energy.',
    bestTiming: 'Breakfast or Post-Workout Drink',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'sprouts',
    name: 'Sprouted Moong & Kala Chana',
    hiName: 'अंकुरित मूंग व देसी चना',
    cost: '₹7 - ₹9 / bowl',
    macroBenefit: '+14.2g Protein, +8.0g Fiber',
    nutrient: 'Vitamin C, Zinc, Digestive Enzymes',
    whyItWorks: 'Sprouting doubles Vitamin C and unlocks bioavailable amino acids while cutting cooking gas and anti-nutrients.',
    bestTiming: 'Morning Snack (add lemon & pinch of black salt)',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'roasted_chana',
    name: 'Roasted Chana (Bhuna Chana)',
    hiName: 'भुना चना (छिलके सहित)',
    cost: '₹8 - ₹12 / 50g packet',
    macroBenefit: '+12.0g Protein, +6.5g Fiber',
    nutrient: 'Slow Carbs, Folate, Iron',
    whyItWorks: 'The ultimate zero-prep swap for tea-time biscuits and oily namkeen. Keeps blood sugar flat for hours.',
    bestTiming: 'Evening 4 PM - 5 PM with Chai',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'curd_dahi',
    name: 'Fresh Homemade Curd (Dahi)',
    hiName: 'घर का ताजा गाढ़ा दही',
    cost: '₹8 - ₹12 / cup',
    macroBenefit: '+6.2g Protein, 0 Sugar',
    nutrient: 'Live Probiotics, Calcium, B12',
    whyItWorks: 'Restores the gut microbiome after alcohol, smoking, or spicy foods. Enhances iron absorption from vegetarian dals.',
    bestTiming: 'With Lunch or as Chhach (Buttermilk)',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'boiled_eggs',
    name: 'Boiled Farm Eggs',
    hiName: 'उबले देसी / पोल्ट्री अंडे',
    cost: '₹7 - ₹8 / egg',
    macroBenefit: '+6.5g Complete Protein / egg',
    nutrient: 'Choline, Vitamin D, Vitamin B12',
    whyItWorks: '100% complete PDCAAS protein with all 9 essential amino acids for muscle repair and cognitive recovery.',
    bestTiming: 'Breakfast or Post-Workout (2-3 whole eggs)',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'soya_chunks',
    name: 'Soya Chunks (Soya Vadi)',
    hiName: 'सोया बड़ी / चंक्स',
    cost: '₹6 - ₹8 / 50g serving',
    macroBenefit: '+26.0g Protein (52% by weight)',
    nutrient: 'Isoflavones, Calcium, Iron',
    whyItWorks: 'The cheapest protein source per gram in India. Boil, squeeze well, and cook with tomatoes, onions, and cumin.',
    bestTiming: 'Lunch or Dinner Sabzi / Pulao',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'palak_saag',
    name: 'Seasonal Green Saag / Palak',
    hiName: 'ताजा पालक / मेथी का साग',
    cost: '₹12 - ₹15 / bunch',
    macroBenefit: 'Ultra-low calorie, +3.2g Fiber',
    nutrient: 'Non-Heme Iron, Folate, Lutein',
    whyItWorks: 'Combats common Indian borderline anaemia. Cooking with a squeeze of fresh lemon increases iron uptake by 300%.',
    bestTiming: 'Dinner with Jowar or Roti',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'roasted_peanuts',
    name: 'Roasted Peanuts (Moongfali)',
    hiName: 'भुनी मूंगफली',
    cost: '₹8 - ₹10 / handful',
    macroBenefit: '+7.5g Protein, +14g Healthy Fats',
    nutrient: 'Biotin, Niacin, Monounsaturated Fat',
    whyItWorks: 'Affordable alternative to expensive almonds and walnuts. Provides dense calories and healthy heart lipids.',
    bestTiming: 'Mid-Morning or Mixed with Poha',
    image: 'https://images.unsplash.com/photo-1567184109411-4779e0ed6674?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'amla_lemon',
    name: 'Fresh Amla or Lemon Water',
    hiName: 'कच्चा आंवला / नींबू पानी',
    cost: '₹4 - ₹6 / piece',
    macroBenefit: '+60mg - 250mg Vitamin C',
    nutrient: 'Pure Natural Ascorbic Acid',
    whyItWorks: 'Crucial for smokers to quench heavy free radical damage and reverse smoke-induced endothelial inflammation.',
    bestTiming: 'First thing upon waking in morning',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'ragi_jowar',
    name: 'Ragi & Jowar Flour (Millets)',
    hiName: 'रागी व ज्वार की रोटी',
    cost: '₹10 / 2 rotis',
    macroBenefit: '+8.0g Complex Fiber, Slow Carbs',
    nutrient: '344mg Calcium, Resistant Starch',
    whyItWorks: 'Zero refined flour (maida). Eliminates mid-day insulin crashes and provides bone-strengthening natural calcium.',
    bestTiming: 'Lunch & Dinner staple grain',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&auto=format&fit=crop&q=80'
  }
];

export default function NutritionPanel({ 
  patient, 
  activeProfile, 
  vitals, 
  initialCondition = 'diabetes' 
}: NutritionPanelProps) {
  const { t } = useLanguage();
  
  // Top Level Mode State
  const [activeMode, setActiveMode] = useState<NutritionMode>('clinical');

  // Mode 1: Clinical State
  const [selectedCondition, setSelectedCondition] = useState<NutritionCondition>(initialCondition);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [pdfToast, setPdfToast] = useState<string | null>(null);

  // Dynamic Foods list from API or fallback
  const [liveFoods, setLiveFoods] = useState<FoodItem[]>(CURATED_FOODS_BY_CONDITION[initialCondition]);

  // Mode 2: General Diet & Lifestyle Audit Form State
  const [workoutLevel, setWorkoutLevel] = useState<'sedentary' | 'light' | 'moderate' | 'intense'>('moderate');
  const [smokingStatus, setSmokingStatus] = useState<'no' | 'occasional' | 'regular'>('no');
  const [alcoholStatus, setAlcoholStatus] = useState<'no' | 'social' | 'regular'>('no');
  const [dietPreference, setDietPreference] = useState<'veg' | 'nonveg' | 'eggetarian' | 'vegan'>('veg');
  const [fitnessGoal, setFitnessGoal] = useState<'muscle' | 'fatloss' | 'energy' | 'budget'>('muscle');
  
  // Meal Form Inputs
  const [breakfastInput, setBreakfastInput] = useState<string>('Chai + 4 Parle-G biscuits / Toast');
  const [lunchInput, setLunchInput] = useState<string>('Large bowl White Rice + Thin Dal + Aloo Sabzi');
  const [dinnerInput, setDinnerInput] = useState<string>('3 Wheat Rotis + Dal + Bhindi Sabzi');
  const [extrasInput, setExtrasInput] = useState<string>('2 Cups Milk Tea + Evening Samosa / Namkeen');

  // AI Chatbot State (Enlarged Container)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const hasUserSentMessageRef = useRef<boolean>(false);

  const activeCondObj = useMemo(() => {
    return CONDITIONS_MAP.find(c => c.id === selectedCondition) || CONDITIONS_MAP[0];
  }, [selectedCondition]);

  // Dynamic Patient Info from Prop & Active Profile
  const patientName = patient?.name && patient.name !== '----' ? patient.name : (activeProfile?.patient?.name || 'Rachit Tiwari');
  const abhaId = patient?.abhaId && patient.abhaId !== '----' ? patient.abhaId : (activeProfile?.patient?.abhaId || '91-8842-1920-7463');
  const age = activeProfile?.patient?.age ? `${activeProfile.patient.age} Years` : (patient?.dob ? `DOB: ${patient.dob}` : '23 Years');
  const gender = patient?.gender || activeProfile?.patient?.gender || 'Male';
  const bpString = vitals && vitals.systolicBp ? `${vitals.systolicBp}/${vitals.diastolicBp} mmHg` : (activeProfile?.vitals?.bloodPressure || '116/74 mmHg');
  const glucoseString = vitals?.glucoseLevel ? `${vitals.glucoseLevel} mg/dL` : (activeProfile?.vitals?.bloodGlucose ? `${activeProfile.vitals.bloodGlucose} mg/dL` : '90 mg/dL');
  const activeConditions = activeProfile?.conditions && activeProfile.conditions.length > 0 
    ? activeProfile.conditions.map(c => c.title) 
    : ['Pulmonary Aerobic Function', 'Patellar Biomechanics'];
  const activeMeds = (activeProfile?.visualAnalytics?.carePlan as any)?.medicationStatus 
    ? [(activeProfile?.visualAnalytics?.carePlan as any)?.medicationStatus] 
    : (activeProfile?.visualAnalytics?.carePlan as any)?.medication?.title 
    ? [(activeProfile?.visualAnalytics?.carePlan as any)?.medication?.title] 
    : ['Electrolytes & Vitamin D3 Complete'];

  // Helper to construct welcome message
  const getWelcomeMessage = useCallback((mode: NutritionMode): ChatMessage => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (mode === 'clinical') {
      return {
        id: `welcome_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: `Namaste **${patientName}**! I am your **SynapseOS Clinical AI Nutritionist**, synced with your **ABHA ID (${abhaId})**.\n\n` +
          `• **Active Vitals:** Blood Pressure: \`${bpString}\` | Fasting Glucose: \`${glucoseString}\`\n` +
          `• **ABDM Profile:** ${activeConditions.join(', ')}\n` +
          `• **Care Plan / Prescriptions:** ${activeMeds.join(', ')}\n\n` +
          `Ask me any question regarding your daily meals, foods to consume/avoid for ${activeCondObj.label}, or drug-food safety interactions!`,
        timestamp: timeStr,
        provider: 'OpenRouter AI • Clinical Mode'
      };
    } else {
      const goalName = fitnessGoal === 'muscle' ? 'Muscle Gain & High Protein' : fitnessGoal === 'fatloss' ? 'Fat Loss & Deficit' : fitnessGoal === 'energy' ? 'All-Day Energy & Stamina' : 'Budget-Friendly Healthy Eating';
      return {
        id: `welcome_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: `Hello **${patientName}**! Welcome to the **General Lifestyle, Macro & Budget Indian Nutrition Engine**.\n\n` +
          `I have audited your lifestyle inputs:\n` +
          `• **Workout:** ${workoutLevel.toUpperCase()} | **Diet:** ${dietPreference.toUpperCase()}\n` +
          `• **Habits:** Smoking: \`${smokingStatus}\` | Alcohol: \`${alcoholStatus}\`\n` +
          `• **Primary Goal:** ${goalName}\n\n` +
          `💡 **Key Finding:** Typical Indian diets (Chai + biscuits + large white rice) have a **~35g-45g protein deficit** and high refined sugar load. Ask me how to fix your diet with cheap foods like Sattu, Bhuna Chana, Dahi, and Eggs!`,
        timestamp: timeStr,
        provider: 'OpenRouter AI • General Lifestyle Mode'
      };
    }
  }, [patientName, abhaId, bpString, glucoseString, activeConditions, activeMeds, activeCondObj.label, fitnessGoal, workoutLevel, dietPreference, smokingStatus, alcoholStatus]);

  // Keep initial greeting in chat synced with current profile if user has not typed yet
  useEffect(() => {
    if (!hasUserSentMessageRef.current) {
      setChatMessages([getWelcomeMessage(activeMode)]);
    }
  }, [patientName, abhaId, bpString, activeMode, getWelcomeMessage]);

  const handleModeChange = (mode: NutritionMode) => {
    setActiveMode(mode);
    if (!hasUserSentMessageRef.current) {
      setChatMessages([getWelcomeMessage(mode)]);
    }
  };

  // Fetch dynamic food guide whenever condition changes
  useEffect(() => {
    let isMounted = true;
    const fetchGuide = async () => {
      try {
        const apiBase = getApiBase();
        const resp = await fetch(`${apiBase}/api/nutrition/guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            condition: selectedCondition,
            vegetarian_only: isVegOnly,
            allergies: [],
            medicines: activeMeds
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (isMounted && data.categories) {
            const allItems: FoodItem[] = [
              ...(data.categories.eat?.items || []),
              ...(data.categories.limit?.items || []),
              ...(data.categories.avoid?.items || [])
            ];
            if (allItems.length > 0) {
              setLiveFoods(allItems);
              return;
            }
          }
        }
      } catch (err) {
        // Fallback to local curated condition list
      }
      if (isMounted) {
        setLiveFoods(CURATED_FOODS_BY_CONDITION[selectedCondition] || CURATED_FOODS_BY_CONDITION.diabetes);
      }
    };

    fetchGuide();
    return () => { isMounted = false; };
  }, [selectedCondition, isVegOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat only when user actively sends a message, NOT on mount or filter change
  useEffect(() => {
    if (hasUserSentMessageRef.current) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Filter foods for Clinical Mode
  const filteredFoods = useMemo(() => {
    return liveFoods.filter(item => {
      if (isVegOnly && item.diet !== 'veg') return false;
      return true;
    });
  }, [liveFoods, isVegOnly]);

  const eatFoods = useMemo(() => filteredFoods.filter(f => f.verdict === 'eat'), [filteredFoods]);
  const limitFoods = useMemo(() => filteredFoods.filter(f => f.verdict === 'limit'), [filteredFoods]);
  const avoidFoods = useMemo(() => filteredFoods.filter(f => f.verdict === 'avoid'), [filteredFoods]);
  const top3Foods = useMemo(() => eatFoods.slice(0, 3), [eatFoods]);

  // Compute Macro Metrics for General Mode
  const macroReport = useMemo(() => {
    const isHeavyWorkout = workoutLevel === 'moderate' || workoutLevel === 'intense';
    const targetProtein = isHeavyWorkout ? (fitnessGoal === 'muscle' ? 105 : 85) : 65;
    
    let estimatedProtein = 28;
    const bLower = breakfastInput.toLowerCase();
    const lLower = lunchInput.toLowerCase();
    const dLower = dinnerInput.toLowerCase();

    if (bLower.includes('egg') || bLower.includes('sattu') || bLower.includes('paneer') || bLower.includes('sprout')) estimatedProtein += 14;
    if (lLower.includes('chicken') || lLower.includes('egg') || lLower.includes('soya') || lLower.includes('paneer')) estimatedProtein += 18;
    if (dLower.includes('paneer') || dLower.includes('soya') || dLower.includes('egg') || dLower.includes('chicken')) estimatedProtein += 15;
    if (dietPreference === 'nonveg') estimatedProtein += 10;

    const proteinDeficit = Math.max(0, targetProtein - estimatedProtein);
    const targetFiber = 35;
    const estimatedFiber = lLower.includes('salad') || dLower.includes('saag') || lLower.includes('vegetable') ? 22 : 12;
    const fiberDeficit = Math.max(0, targetFiber - estimatedFiber);

    const hasSmokingRisk = smokingStatus !== 'no';
    const hasAlcoholRisk = alcoholStatus !== 'no';
    const hasHighSugarRisk = extrasInput.toLowerCase().includes('biscuit') || extrasInput.toLowerCase().includes('tea') || extrasInput.toLowerCase().includes('chai') || extrasInput.toLowerCase().includes('namkeen');

    return {
      targetProtein,
      estimatedProtein,
      proteinDeficit,
      targetFiber,
      estimatedFiber,
      fiberDeficit,
      hasSmokingRisk,
      hasAlcoholRisk,
      hasHighSugarRisk
    };
  }, [workoutLevel, fitnessGoal, breakfastInput, lunchInput, dinnerInput, extrasInput, dietPreference, smokingStatus, alcoholStatus]);

  const handleSendChatMessage = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim() || isChatLoading) return;

    hasUserSentMessageRef.current = true;
    const userMsgId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setIsChatLoading(true);

    const abhaProfilePayload = {
      name: patientName,
      abhaId: abhaId,
      age: age,
      gender: gender,
      vitals: {
        systolicBp: parseInt(bpString.split('/')[0]) || 138,
        diastolicBp: parseInt(bpString.split('/')[1]) || 88,
        bloodGlucose: 154,
        spo2: 98
      },
      conditions: activeConditions,
      medicines: activeMeds
    };

    const lifestylePayload = {
      workout: workoutLevel,
      smoking: smokingStatus,
      alcohol: alcoholStatus,
      dietPreference: dietPreference,
      goal: fitnessGoal,
      breakfast: breakfastInput,
      lunch: lunchInput,
      dinner: dinnerInput,
      extras: extrasInput,
      deficiencies: [
        macroReport.proteinDeficit > 10 ? `Protein deficit (-${macroReport.proteinDeficit}g/day)` : '',
        macroReport.fiberDeficit > 10 ? `Dietary fiber deficit (-${macroReport.fiberDeficit}g/day)` : '',
        macroReport.hasSmokingRisk ? 'Smoking-induced Vitamin C & antioxidant depletion' : '',
        macroReport.hasAlcoholRisk ? 'Alcohol-related gut & B-complex depletion' : '',
        macroReport.hasHighSugarRisk ? 'Refined sugar & trans-fat overload from tea/biscuits/namkeen' : ''
      ].filter(Boolean)
    };

    const formattedHistory = chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    const apiBase = getApiBase();
    try {
      const res = await fetch(`${apiBase}/api/nutrition/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          condition: activeMode === 'clinical' ? selectedCondition : 'general',
          history: formattedHistory,
          abha_profile: abhaProfilePayload,
          lifestyle_data: activeMode === 'general' ? lifestylePayload : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            role: 'assistant',
            content: data.response || 'Here is your personalized diet recommendation.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEmergency: data.is_emergency,
            provider: data.provider || 'OpenRouter AI (Llama 3.3 / Gemini 2.0)'
          }
        ]);
      } else {
        // Fallback
        if (activeMode === 'clinical') {
          setChatMessages(prev => [
            ...prev,
            {
              id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              role: 'assistant',
              content: `Hello **${patientName}**! Based on your clinical profile:\n\n` +
                `🟢 **Recommended:** Moong dal khichdi, Lauki soup, Ragi roti, Plain curd.\n` +
                `🔴 **Avoid:** Sugary drinks, Samosa/biscuits, Pickles.\n\n` +
                `💡 **Tip:** Pair high-protein dals with whole grain millets to prevent blood sugar spikes.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              provider: 'ICMR-NIN Clinical Guideline Fallback'
            }
          ]);
        } else {
          setChatMessages(prev => [
            ...prev,
            {
              id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              role: 'assistant',
              content: `Hello **${patientName}**! Based on your lifestyle audit (${workoutLevel} workout, ${dietPreference} diet):\n\n` +
                `• **Protein Fix:** Drink **1 glass of Sattu drink** (~₹12) or eat **2 boiled eggs** (~₹15) to cover your ${macroReport.proteinDeficit > 0 ? `-${macroReport.proteinDeficit}g` : 'daily'} protein target.\n` +
                `• **Tea Snack Fix:** Replace biscuits/namkeen with **Bhuna Chana (roasted chickpeas)** (~₹10).\n` +
                `• **Detox & Fiber:** Add **1 glass fresh Amla or Lemon water** in the morning for Vitamin C recovery.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              provider: 'ICMR-NIN Budget Superfood Engine'
            }
          ]);
        }
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: `Here is your practical Indian food fix: Prioritize **Sattu**, **Sprouted Moong**, **Roasted Chana**, and **Fresh Curd (Dahi)** to resolve protein and fiber deficits without expensive supplements.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'ICMR-NIN Rule Engine'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSearchCheck = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const apiBase = getApiBase();
    try {
      const resp = await fetch(`${apiBase}/api/nutrition/check?food=${encodeURIComponent(searchQuery)}&condition=${selectedCondition}`);
      if (resp.ok) {
        const data = await resp.json();
        setSearchResult(data);
      } else {
        const q = searchQuery.toLowerCase();
        const found = liveFoods.find(f => f.names.en.toLowerCase().includes(q) || f.names.hi.includes(q) || (q.includes('samosa') && f.food_id.includes('fried')) || (q.includes('pickle') && f.food_id.includes('pickle')));
        if (found) {
          setSearchResult({
            is_emergency: false,
            matched_curated: true,
            names: found.names,
            verdict: found.verdict,
            reason: found.reason
          });
        } else {
          setSearchResult({
            is_emergency: false,
            matched_curated: false,
            names: { en: searchQuery, hi: searchQuery },
            verdict: 'limit',
            reason: `AI-suggested: Consume '${searchQuery}' in small portions and pair with protein/fiber.`
          });
        }
      }
    } catch (e) {
      setSearchResult({
        is_emergency: false,
        matched_curated: true,
        names: { en: searchQuery, hi: searchQuery },
        verdict: 'limit',
        reason: 'Consume in small portions and pair with fibre/protein.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfToast('Generating verifiable PDF report...');
    const apiBase = getApiBase();
    try {
      const resp = await fetch(`${apiBase}/api/reports/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          abha_id: abhaId,
          triage_summary: activeMode === 'clinical' 
            ? `Clinical Nutrition Plan for ${activeCondObj.label}` 
            : `General Indian Macro & Superfood Nutrition Plan (${fitnessGoal.toUpperCase()} / ${workoutLevel.toUpperCase()})`,
          vital_signs: { 
            BP: bpString, 
            BloodGlucose: glucoseString, 
            Mode: activeMode === 'clinical' ? activeCondObj.label : 'General Macro Wellness'
          }
        })
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SynapseOS_Nutrition_Guide_${activeMode}.pdf`;
        a.click();
        setPdfToast('✓ PDF Downloaded successfully!');
        setTimeout(() => setPdfToast(null), 3000);
      } else {
        setPdfToast('⚠️ PDF export unavailable. Please check backend connection.');
        setTimeout(() => setPdfToast(null), 3000);
      }
    } catch (e) {
      setPdfToast('⚠️ Network error during PDF export.');
      setTimeout(() => setPdfToast(null), 3000);
    }
  };

  // Format chat markdown text with clean single bullets
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**'));
      const textToProcess = isBullet ? trimmed.replace(/^[•*-]\s*/, '') : line;

      const parts = textToProcess.split(/(\*\*.*?\*\*|`.*?`)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ fontWeight: 800, color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#2563eb', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '4px' }}>
            <span style={{ color: '#2563eb', fontWeight: 800 }}>•</span>
            <span style={{ flex: 1 }}>{formattedLine}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} style={{ margin: lineIdx === 0 ? '0' : '6px 0 0 0', lineHeight: 1.6 }}>
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1240px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '26px',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Toast notification */}
      {pdfToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 700,
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{pdfToast}</span>
        </div>
      )}

      {/* 1. Top Header & Mode Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Food & Nutrition Intelligence
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <BadgeCheck size={15} color="#059669" />
                ICMR-NIN 2024 Guidelines
              </span>
            </div>
            <div style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
              Dual-mode nutrition engine: Manage clinical illnesses with ABHA safety or audit lifestyle macros with cheap Indian superfoods.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={16} color="#059669" />
              <span>Export Diet Plan (PDF)</span>
            </button>
          </div>
        </div>

        {/* 🌟 2-MODE SELECTOR TABS ON TOP */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Mode 1 Button */}
          <button
            onClick={() => handleModeChange('clinical')}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: activeMode === 'clinical' ? '1.5px solid #2563eb' : '1px solid transparent',
              background: activeMode === 'clinical' ? '#ffffff' : 'transparent',
              color: activeMode === 'clinical' ? '#0f172a' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: activeMode === 'clinical' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: activeMode === 'clinical' ? '#eff6ff' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeMode === 'clinical' ? '#2563eb' : '#64748b'
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: activeMode === 'clinical' ? '#0f172a' : '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Mode 1: Clinical & Illness Care</span>
                  <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>If You&apos;re Sick</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Diabetes, BP, Anaemia, Fever, ABHA ID sync & Drug-Food Safety
                </div>
              </div>
            </div>
            {activeMode === 'clinical' && <CheckCircle2 size={20} color="#2563eb" />}
          </button>

          {/* Mode 2 Button */}
          <button
            onClick={() => handleModeChange('general')}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: activeMode === 'general' ? '1.5px solid #059669' : '1px solid transparent',
              background: activeMode === 'general' ? '#ffffff' : 'transparent',
              color: activeMode === 'general' ? '#0f172a' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: activeMode === 'general' ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: activeMode === 'general' ? '#ecfdf5' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeMode === 'general' ? '#059669' : '#64748b'
              }}>
                <Utensils size={22} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: activeMode === 'general' ? '#0f172a' : '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Mode 2: General Diet & Macro Deficiency Engine</span>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>General Diet</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Workout & habit audit, missing macro calculator & cheap Indian food swaps
                </div>
              </div>
            </div>
            {activeMode === 'general' && <CheckCircle2 size={20} color="#059669" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: CLINICAL & ILLNESS CARE (IF SICK ALREADY) */}
      {/* ========================================================================= */}
      {activeMode === 'clinical' && (
        <>
          {/* Condition Selector Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {CONDITIONS_MAP.map(c => {
              const isSelected = selectedCondition === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCondition(c.id); setSearchQuery(''); setSearchResult(null); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: isSelected ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    background: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '13.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.label} ({c.hi})
                </button>
              );
            })}

            <div style={{ width: '1px', height: '26px', background: '#cbd5e1', margin: '0 4px' }} />

            {/* Diet Filters */}
            <button
              onClick={() => setIsVegOnly(false)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: !isVegOnly ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                background: !isVegOnly ? '#0f172a' : '#ffffff',
                color: !isVegOnly ? '#ffffff' : '#334155',
                fontSize: '13px',
                fontWeight: !isVegOnly ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              All foods
            </button>
            <button
              onClick={() => setIsVegOnly(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: isVegOnly ? '1.5px solid #059669' : '1px solid #cbd5e1',
                background: isVegOnly ? '#ecfdf5' : '#ffffff',
                color: isVegOnly ? '#047857' : '#334155',
                fontSize: '13px',
                fontWeight: isVegOnly ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Leaf size={14} color="#059669" />
              <span>Vegetarian only</span>
            </button>
          </div>

          {/* ABHA Patient Health Profile Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.25)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserCheck size={24} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{patientName}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{gender}, {age}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px', fontFamily: 'monospace' }}>
                    ABHA ID: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{abhaId}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 14px' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Blood Pressure</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>{bpString}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 14px' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Blood Glucose</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>{glucoseString}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 14px' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Meds</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>{activeMeds.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Red-Flag Warning Banner */}
          <div style={{
            background: 'linear-gradient(90deg, #78350f 0%, #92400e 100%)',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(120, 53, 15, 0.15)'
          }}>
            <AlertTriangle size={18} color="#f59e0b" className="flex-shrink-0" />
            <span>{activeCondObj.redFlag}</span>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GENERAL DIET & MACRO DEFICIENCY ENGINE (QUESTIONNAIRE & AUDIT) */}
      {/* ========================================================================= */}
      {activeMode === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* General Mode Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)',
            borderRadius: '16px',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(6, 78, 59, 0.15)'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={22} color="#6ee7b7" />
                <span>General Indian Lifestyle & Macro Deficiency Evaluator</span>
              </div>
              <div style={{ fontSize: '13px', color: '#a7f3d0', marginTop: '4px' }}>
                Tell the AI your daily habits, workout routine & meals to uncover missing protein, fiber, vitamins and find cheap Indian food fixes.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                ICMR-NIN Daily RDA
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                Budget-Friendly Superfoods
              </span>
            </div>
          </div>

          {/* Interactive Questionnaire Form Container */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#2563eb" />
              <span>1. Your Fitness, Lifestyle & Habit Audit</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Workout Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Dumbbell size={15} color="#2563eb" /> Physical Activity / Workout
                </label>
                <select
                  value={workoutLevel}
                  onChange={(e) => setWorkoutLevel(e.target.value as 'sedentary' | 'light' | 'moderate' | 'intense')}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="sedentary">Sedentary (Desk Job / Minimal Walk)</option>
                  <option value="light">Light (Casual Walk / 15m Yoga)</option>
                  <option value="moderate">Moderate (Gym / Jogging 3-4 days/wk)</option>
                  <option value="intense">Intense (Heavy Lifting / Daily Athlete)</option>
                </select>
              </div>

              {/* Smoking Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cigarette size={15} color="#dc2626" /> Smoking Habit
                </label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value as 'no' | 'occasional' | 'regular')}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="no">Non-Smoker (No tobacco)</option>
                  <option value="occasional">Occasional (1-3 cigarettes / week)</option>
                  <option value="regular">Regular Smoker (Daily 3-10+)</option>
                </select>
              </div>

              {/* Alcohol Consumption */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wine size={15} color="#d97706" /> Alcohol Consumption
                </label>
                <select
                  value={alcoholStatus}
                  onChange={(e) => setAlcoholStatus(e.target.value as 'no' | 'social' | 'regular')}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="no">Non-Drinker (0 drinks)</option>
                  <option value="social">Social Drinker (1-2 drinks on weekends)</option>
                  <option value="regular">Regular (Multiple times / week)</option>
                </select>
              </div>

              {/* Dietary Preference */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Leaf size={15} color="#059669" /> Dietary Preference
                </label>
                <select
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value as 'veg' | 'nonveg' | 'eggetarian' | 'vegan')}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="veg">Pure Vegetarian (No eggs/meat)</option>
                  <option value="eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                  <option value="nonveg">Non-Vegetarian (Chicken/Fish/Mutton)</option>
                  <option value="vegan">Vegan (Zero Dairy)</option>
                </select>
              </div>

              {/* Fitness Goal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={15} color="#7c3aed" /> Primary Health / Fitness Goal
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value as 'muscle' | 'fatloss' | 'energy' | 'budget')}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="muscle">Muscle Building & High Protein</option>
                  <option value="fatloss">Fat Loss & Calorie Deficit</option>
                  <option value="energy">All-Day Stamina & No Midday Fatigue</option>
                  <option value="budget">Healthy Indian Diet Under Budget (₹50-₹80/day)</option>
                </select>
              </div>
            </div>

            {/* Daily Meals Breakdown Form */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={17} color="#d97706" />
                <span>2. What do you usually eat in a day?</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {/* Breakfast */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>🍳 Breakfast</label>
                  <input
                    type="text"
                    value={breakfastInput}
                    onChange={(e) => setBreakfastInput(e.target.value)}
                    placeholder="e.g. Chai + 4 Parle-G / Poha / 2 Parathas"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['Chai + Biscuits', '2 Aloo Parathas', 'Poha + Peanuts', '3 Boiled Eggs + Toast'].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setBreakfastInput(preset)}
                        style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: '#475569' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lunch */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>🍛 Lunch</label>
                  <input
                    type="text"
                    value={lunchInput}
                    onChange={(e) => setLunchInput(e.target.value)}
                    placeholder="e.g. White rice + Dal + Aloo Sabzi / Roti"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['Rice + Dal + Aloo', '2 Rotis + Dal + Sabzi', 'Rajma Chawal', 'Chicken Biryani'].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setLunchInput(preset)}
                        style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: '#475569' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extras / Snacks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>☕ Extras / Evening Snacks</label>
                  <input
                    type="text"
                    value={extrasInput}
                    onChange={(e) => setExtrasInput(e.target.value)}
                    placeholder="e.g. 2 Milk Teas + Samosa / Bhujia / Soft Drink"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['2 Chai + Samosa', 'Namkeen / Bhujia', 'Cold Drink + Chips', 'Fruits / Roasted Chana'].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setExtrasInput(preset)}
                        style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: '#475569' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dinner */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>🍲 Dinner</label>
                  <input
                    type="text"
                    value={dinnerInput}
                    onChange={(e) => setDinnerInput(e.target.value)}
                    placeholder="e.g. 3 Rotis + Dal / Khichdi / Late night Maggi"
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['3 Rotis + Dal + Sabzi', 'Moong Khichdi', 'Rice + Chicken Curry', 'Maggi / Fast Food'].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setDinnerInput(preset)}
                        style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: '#475569' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Computed Macro & Deficiency Report Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={20} color="#f59e0b" />
                  <span>Macronutrient Gap & Deficiency Breakdown</span>
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Based on your {workoutLevel} activity level and meal inputs vs ICMR-NIN recommendations
                </div>
              </div>
            </div>

            {/* Visual Macro Score Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Protein Meter */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Daily Protein Intake</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: macroReport.proteinDeficit > 10 ? '#dc2626' : '#059669' }}>
                    {macroReport.estimatedProtein}g / {macroReport.targetProtein}g
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((macroReport.estimatedProtein / macroReport.targetProtein) * 100))}%`,
                    height: '100%',
                    background: macroReport.proteinDeficit > 20 ? '#ef4444' : macroReport.proteinDeficit > 0 ? '#f59e0b' : '#10b981',
                    borderRadius: '4px'
                  }} />
                </div>
                <div style={{ fontSize: '11.5px', color: macroReport.proteinDeficit > 0 ? '#dc2626' : '#059669', marginTop: '6px', fontWeight: 700 }}>
                  {macroReport.proteinDeficit > 0 ? `⚠️ -${macroReport.proteinDeficit}g Protein Deficit (Muscle fatigue & slow recovery)` : '✓ Optimal Protein (Goal Met)'}
                </div>
              </div>

              {/* Dietary Fiber Meter */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Dietary Fiber (Digestion & Gut)</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: macroReport.fiberDeficit > 10 ? '#d97706' : '#059669' }}>
                    {macroReport.estimatedFiber}g / {macroReport.targetFiber}g
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((macroReport.estimatedFiber / macroReport.targetFiber) * 100))}%`,
                    height: '100%',
                    background: macroReport.fiberDeficit > 15 ? '#f59e0b' : '#10b981',
                    borderRadius: '4px'
                  }} />
                </div>
                <div style={{ fontSize: '11.5px', color: macroReport.fiberDeficit > 0 ? '#b45309' : '#059669', marginTop: '6px', fontWeight: 700 }}>
                  {macroReport.fiberDeficit > 0 ? `⚠️ -${macroReport.fiberDeficit}g Fiber Deficit (High refined carb ratio)` : '✓ Good Gut Fiber'}
                </div>
              </div>

              {/* Lifestyle Habit Warnings */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Habit & Micronutrient Status</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {smokingStatus !== 'no' && (
                    <div style={{ fontSize: '11.5px', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Smoking depletes Vitamin C & cellular oxygen
                    </div>
                  )}
                  {alcoholStatus !== 'no' && (
                    <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Alcohol depletes B-Complex & irritates gut flora
                    </div>
                  )}
                  {smokingStatus === 'no' && alcoholStatus === 'no' && (
                    <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Clean lifestyle habits (Low oxidative stress)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cheap Indian Superfood Alternatives Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} color="#059669" />
                  <span>Cheap Indian Superfoods to Fix Your Missing Nutrients</span>
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Superfoods under ₹5 - ₹15 per serving that naturally fix your protein, fiber & vitamin deficiencies.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {CHEAP_INDIAN_SUPERFOODS.map((food) => (
                <div
                  key={food.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img
                      src={food.image}
                      alt={food.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1px solid #f1f5f9',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                        {food.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                        {food.hiName}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                      {food.cost}
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563eb' }}>
                      {food.macroBenefit}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    {food.whyItWorks}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="#2563eb" />
                    <span><strong>Best Timing:</strong> {food.bestTiming}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ENLARGED INTERACTIVE AI NUTRITION CHATBOT (ACTIVE IN BOTH MODES) */}
      {/* ========================================================================= */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: isChatExpanded ? '850px' : '680px',
        transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Chatbot Top Header Bar */}
        <div style={{
          padding: '18px 22px',
          background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: activeMode === 'clinical' ? '#2563eb' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <Bot size={24} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{activeMode === 'clinical' ? 'Clinical AI Nutritionist & Dietitian' : 'AI Macro & Budget Diet Coach'}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: activeMode === 'clinical' ? '#dbeafe' : '#dcfce7', color: activeMode === 'clinical' ? '#1e40af' : '#15803d' }}>
                  {activeMode === 'clinical' ? 'Mode 1: Illness Care' : 'Mode 2: General Diet'}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '1px' }}>
                {activeMode === 'clinical' 
                  ? 'Grounded in ICMR-NIN clinical rules & ABHA medical history' 
                  : 'Tailored to your workout routine, smoking/alcohol factors & cheap Indian food swaps'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              title={isChatExpanded ? 'Shrink height' : 'Expand height'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isChatExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isChatExpanded ? 'Normal' : 'Expand'}</span>
            </button>

            <button
              onClick={() => setChatMessages([getWelcomeMessage(activeMode)])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Body (Spacious & Scrollable) */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: '#f8fafc'
        }}>
          {chatMessages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '12px'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: msg.isEmergency ? '#ef4444' : activeMode === 'clinical' ? '#2563eb' : '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.isEmergency ? <ShieldAlert size={20} /> : <Bot size={20} />}
                </div>
              )}

              <div style={{
                maxWidth: '84%',
                background: msg.role === 'user' ? '#0f172a' : msg.isEmergency ? '#fef2f2' : '#ffffff',
                border: msg.role === 'user' ? 'none' : msg.isEmergency ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                fontSize: '14.5px',
                lineHeight: 1.6
              }}>
                <div style={{ marginBottom: '6px' }}>
                  {renderFormattedText(msg.content)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  color: msg.role === 'user' ? '#94a3b8' : '#94a3b8',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.12)' : '1px solid #f1f5f9'
                }}>
                  <span>{msg.timestamp}</span>
                  {msg.provider && (
                    <span style={{ color: activeMode === 'clinical' ? '#2563eb' : '#059669', fontWeight: 700 }}>{msg.provider}</span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {isChatLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activeMode === 'clinical' ? '#2563eb' : '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px 20px', fontSize: '13.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={16} color={activeMode === 'clinical' ? '#2563eb' : '#059669'} className="animate-spin" />
                <span>Computing personalized ICMR-NIN diet & macro guidance for {patientName}...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Dynamic Quick Prompt Chips */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Sparkles size={14} color={activeMode === 'clinical' ? '#2563eb' : '#059669'} /> Quick Ask:
          </span>
          {(activeMode === 'clinical'
            ? [
                `What to eat for dinner with BP ${bpString}?`,
                `Is ripe banana safe with glucose ${glucoseString}?`,
                `1-day Indian diet plan for ${activeCondObj.label}`,
                `Food interactions with Telmisartan & Metformin`
              ]
            : [
                `Give me a ₹60/day high-protein Indian diet plan`,
                `What cheap snack can replace biscuits with tea?`,
                macroReport.proteinDeficit > 0 ? `How to fix my -${macroReport.proteinDeficit}g protein deficit without whey powder?` : `How to optimize my high-protein budget meal plan?`,
                `I smoke occasionally, what Indian foods help detox?`
              ]
          ).map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChatMessage(promptText)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
            placeholder={
              activeMode === 'clinical'
                ? `Ask clinical diet question for ${patientName} (e.g. Can I eat oats with diabetes?)...`
                : `Ask macro & budget food question (e.g. How to get 80g protein under ₹50/day?)...`
            }
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              padding: '0 18px',
              fontSize: '14.5px',
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSendChatMessage()}
            disabled={isChatLoading || !chatInput.trim()}
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: '12px',
              background: isChatLoading || !chatInput.trim() 
                ? '#94a3b8' 
                : activeMode === 'clinical' ? '#2563eb' : '#059669',
              color: '#ffffff',
              border: 'none',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Send</span>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FOOD CHECKER & CATEGORIZED LISTS (ACTIVE IN CLINICAL MODE) */}
      {/* ========================================================================= */}
      {activeMode === 'clinical' && (
        <>
          {/* Quick Food Checker Search Bar */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '0 14px',
              height: '48px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
            }}>
              <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchCheck()}
                placeholder="Search specific food safety (e.g. banana, pickle, roti, samosa)..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: '#0f172a'
                }}
              />
            </div>
            <button
              onClick={handleSearchCheck}
              disabled={isSearching}
              style={{
                padding: '0 24px',
                height: '48px',
                borderRadius: '12px',
                background: '#0f172a',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isSearching ? 'Checking...' : 'Check Food'}
            </button>
          </div>

          {/* Search Result Banner (If active) */}
          {searchResult && (
            <div style={{
              background: searchResult.is_emergency ? '#fef2f2' : searchResult.verdict === 'eat' ? '#ecfdf5' : searchResult.verdict === 'limit' ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${searchResult.is_emergency ? '#fca5a5' : searchResult.verdict === 'eat' ? '#a7f3d0' : searchResult.verdict === 'limit' ? '#fde68a' : '#fca5a5'}`,
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              {searchResult.is_emergency ? (
                <AlertOctagon size={22} color="#dc2626" style={{ marginTop: '2px' }} />
              ) : searchResult.verdict === 'eat' ? (
                <CheckCircle2 size={22} color="#059669" style={{ marginTop: '2px' }} />
              ) : searchResult.verdict === 'limit' ? (
                <AlertTriangle size={22} color="#d97706" style={{ marginTop: '2px' }} />
              ) : (
                <XCircle size={22} color="#dc2626" style={{ marginTop: '2px' }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{searchResult.names?.en || searchQuery}</span>
                  {searchResult.names?.hi && <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{searchResult.names.hi}</span>}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    background: searchResult.verdict === 'eat' ? '#d1fae5' : searchResult.verdict === 'limit' ? '#fef3c7' : '#fee2e2',
                    color: searchResult.verdict === 'eat' ? '#047857' : searchResult.verdict === 'limit' ? '#b45309' : '#b91c1c'
                  }}>
                    {searchResult.verdict || 'Limit'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', lineHeight: 1.5 }}>
                  {searchResult.reason || searchResult.safety_message}
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Recommended Foods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Best for you today ({activeCondObj.label})
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {top3Foods.map((item) => (
                <div
                  key={item.food_id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={item.image_url}
                      alt={item.names.en}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1px solid #f1f5f9'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                        {item.names.en}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                        {item.names.hi}
                      </div>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#ecfdf5',
                      color: '#047857',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      <Check size={12} strokeWidth={3} color="#059669" />
                      <span>Eat</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.45 }}>
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Categorized Food Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '4px' }}>
            {/* EAT GROUP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#047857' }}>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>✓ Eat</span>
                <span>Good choices ({eatFoods.length})</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {eatFoods.map((item, idx) => (
                  <div
                    key={item.food_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: idx < eatFoods.length - 1 ? '1px solid #f1f5f9' : 'none',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <img
                        src={item.image_url}
                        alt={item.names.en}
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.names.en} </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{item.names.hi}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', textAlign: 'right', fontWeight: 500, maxWidth: '400px' }}>
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIMIT GROUP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#b45309' }}>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a' }}>⚠️ Limit</span>
                <span>Small portions or less often ({limitFoods.length})</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {limitFoods.map((item, idx) => (
                  <div
                    key={item.food_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: idx < limitFoods.length - 1 ? '1px solid #f1f5f9' : 'none',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <img
                        src={item.image_url}
                        alt={item.names.en}
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.names.en} </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{item.names.hi}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', textAlign: 'right', fontWeight: 500, maxWidth: '400px' }}>
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AVOID GROUP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#b91c1c' }}>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fca5a5' }}>❌ Avoid</span>
                <span>Best avoided for now ({avoidFoods.length})</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                {avoidFoods.map((item, idx) => (
                  <div
                    key={item.food_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: idx < avoidFoods.length - 1 ? '1px solid #f1f5f9' : 'none',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <img
                        src={item.image_url}
                        alt={item.names.en}
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.names.en} </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{item.names.hi}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', textAlign: 'right', fontWeight: 500, maxWidth: '400px' }}>
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer Disclaimer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          {activeMode === 'clinical' 
            ? 'General clinical guidance, not a medical prescription. Your attending physician’s advice comes first.'
            : 'Lifestyle nutrition and dietary suggestions are based on ICMR-NIN guidelines. For personalized therapy or extreme deficiency, consult a clinical dietitian.'}
        </div>
      </div>
    </div>
  );
}
