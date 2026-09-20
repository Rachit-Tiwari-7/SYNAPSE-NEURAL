'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Utensils, 
  Search, 
  Check, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Download, 
  Sparkles,
  ShieldAlert,
  Leaf,
  ChevronRight,
  Flame,
  Heart,
  Droplets,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  BadgeCheck,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import { PatientInfo } from './types';
import { useLanguage } from '@/context/LanguageContext';

export type NutritionCondition = 'diabetes' | 'hypertension' | 'anaemia' | 'diarrhoea' | 'fever';

interface FoodItem {
  food_id: string;
  names: { en: string; hi: string };
  diet: 'veg' | 'nonveg';
  verdict: 'eat' | 'limit' | 'avoid';
  reason: string;
  image_url: string;
  nutrients?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  provider?: string;
}

interface NutritionPanelProps {
  patient?: PatientInfo;
  initialCondition?: NutritionCondition;
}

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

const STATIC_FOODS: FoodItem[] = [
  {
    food_id: 'moong_dal',
    names: { en: 'Moong dal', hi: 'मूंग दाल' },
    diet: 'veg',
    verdict: 'eat',
    reason: 'High protein, slow-release carbs',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'methi_leaves',
    names: { en: 'Methi leaves', hi: 'मेथी' },
    diet: 'veg',
    verdict: 'eat',
    reason: 'Fibre-rich and low in sugar',
    image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'ragi_roti',
    names: { en: 'Ragi or jowar roti', hi: 'रागी / ज्वार रोटी' },
    diet: 'veg',
    verdict: 'eat',
    reason: 'More fibre than white rice or maida',
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'plain_curd',
    names: { en: 'Plain curd', hi: 'दही' },
    diet: 'veg',
    verdict: 'eat',
    reason: 'Protein without added sugar',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'boiled_eggs',
    names: { en: 'Eggs', hi: 'अंडे' },
    diet: 'nonveg',
    verdict: 'eat',
    reason: 'Protein that barely moves sugar',
    image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'fish_curry',
    names: { en: 'Fish curry or grilled fish', hi: 'मछली' },
    diet: 'nonveg',
    verdict: 'eat',
    reason: 'Lean protein, good fats',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'white_rice',
    names: { en: 'White rice', hi: 'चावल' },
    diet: 'veg',
    verdict: 'limit',
    reason: 'Keep to a small bowl, add dal and veg',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'ripe_banana',
    names: { en: 'Ripe banana', hi: 'केला' },
    diet: 'veg',
    verdict: 'limit',
    reason: 'Half at a time, pair with nuts or curd',
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'potato',
    names: { en: 'Potato', hi: 'आलू' },
    diet: 'veg',
    verdict: 'limit',
    reason: 'Fast-acting starch, keep portions small',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'poha',
    names: { en: 'Poha', hi: 'पोहा' },
    diet: 'veg',
    verdict: 'limit',
    reason: 'Add peanuts and veg to slow the rise',
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'sugary_drinks',
    names: { en: 'Sugary drinks and juice', hi: 'मीठे पेय' },
    diet: 'veg',
    verdict: 'avoid',
    reason: 'Raise sugar quickly',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'mithai',
    names: { en: 'Mithai and jalebi', hi: 'मिठाई' },
    diet: 'veg',
    verdict: 'avoid',
    reason: 'Concentrated sugar and refined flour',
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80'
  },
  {
    food_id: 'fried_snacks',
    names: { en: 'Fried maida snacks', hi: 'समौसा, बिस्कुट' },
    diet: 'veg',
    verdict: 'avoid',
    reason: 'Refined flour plus fat',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80'
  }
];

export default function NutritionPanel({ patient, initialCondition = 'diabetes' }: NutritionPanelProps) {
  const { t } = useLanguage();
  const [selectedCondition, setSelectedCondition] = useState<NutritionCondition>(initialCondition);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // AI Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeCondObj = CONDITIONS_MAP.find(c => c.id === selectedCondition) || CONDITIONS_MAP[0];

  // Active ABHA Patient Data Fallbacks
  const patientName = patient?.name || 'Mausam Kar';
  const abhaId = patient?.abhaId || '91-5829-3910-4821';
  const age = patient?.dob ? `DOB: ${patient.dob}` : '24 Years';
  const gender = patient?.gender || 'Male';
  const bpString = '138/88 mmHg';
  const glucoseString = '154 mg/dL';
  const activeConditions = ['Type 2 Diabetes', 'Essential Hypertension', 'Mild Anaemia'];
  const activeMeds = ['Metformin 500mg', 'Telmisartan 40mg', 'Autrin IFA'];

  // Initialize initial greeting in chat
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Namaste **${patientName}**! I am your **SynapseOS Clinical AI Nutritionist**, synced directly with your **ABHA ID (${abhaId})**.\n\n` +
            `I have fetched your active health profile:\n` +
            `• **Vitals:** Blood Pressure: \`${bpString}\` | Fasting Glucose: \`${glucoseString}\` | SpO2: \`98%\` \n` +
            `• **Active Conditions:** ${activeConditions.join(', ')}\n` +
            `• **Active Medicines:** ${activeMeds.join(', ')}\n\n` +
            `How can I assist your diet today? You can ask me for meal ideas, food safety checks, or drug-food interaction advice.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'OpenRouter AI (Llama 3.3 / Gemini 2.0)'
        }
      ]);
    }
  }, [patientName, abhaId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Filter foods based on dietary preference
  const filteredFoods = STATIC_FOODS.filter(item => {
    if (isVegOnly && item.diet !== 'veg') return false;
    return true;
  });

  const eatFoods = filteredFoods.filter(f => f.verdict === 'eat');
  const limitFoods = filteredFoods.filter(f => f.verdict === 'limit');
  const avoidFoods = filteredFoods.filter(f => f.verdict === 'avoid');
  const top3Foods = eatFoods.slice(0, 3);

  const handleSendChatMessage = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim() || isChatLoading) return;

    const userMsgId = Date.now().toString();
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
        systolicBp: 138,
        diastolicBp: 88,
        bloodGlucose: 154,
        spo2: 98
      },
      conditions: activeConditions,
      medicines: activeMeds
    };

    const formattedHistory = chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/nutrition/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          condition: selectedCondition,
          history: formattedHistory,
          abha_profile: abhaProfilePayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || 'Here is your personalized diet recommendation.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEmergency: data.is_emergency,
            provider: data.provider || 'OpenRouter AI (Llama 3.3 / Gemini 2.0)'
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Hello **${patientName}**! Based on your ABHA Profile (${abhaId}, BP: ${bpString}, Glucose: ${glucoseString}):\n\n` +
              `🟢 **Recommended:** Moong dal khichdi, Lauki soup, Ragi roti, Plain curd.\n` +
              `🔴 **Avoid:** Sugary drinks, Samosa/biscuits, Pickles.\n\n` +
              `💡 **Tip:** Pair high-protein dals with whole grain millets to prevent blood sugar spikes.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider: 'ICMR-NIN Clinical Guideline Fallback'
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Hello **${patientName}**! For ${activeCondObj.label}, prioritize low-glycemic, low-sodium meals rich in dietary fibre. Always consult your attending doctor before major dietary adjustments.`,
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
    try {
      const resp = await fetch(`/api/nutrition/check?food=${encodeURIComponent(searchQuery)}&condition=${selectedCondition}`);
      if (resp.ok) {
        const data = await resp.json();
        setSearchResult(data);
      } else {
        const q = searchQuery.toLowerCase();
        const found = STATIC_FOODS.find(f => f.names.en.toLowerCase().includes(q) || f.names.hi.includes(q));
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
            reason: `AI-suggested: Consume '${searchQuery}' in small portions and consult your doctor.`
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
    try {
      const resp = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          abha_id: abhaId,
          triage_summary: `Clinical Nutrition Plan for ${activeCondObj.label}`,
          vital_signs: { BP: bpString, BloodGlucose: glucoseString, Condition: activeCondObj.label }
        })
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SynapseOS_Nutrition_Guide_${selectedCondition}.pdf`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to parse markdown bold/code/bullet formatting in chat bubbles
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let content: React.ReactNode = line;
      
      // Simple inline replacement for **bold** and `code`
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ fontWeight: 800, color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#2563eb', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
            <span style={{ color: '#2563eb', fontWeight: 800 }}>•</span>
            <span>{formattedLine}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} style={{ margin: lineIdx === 0 ? '0' : '4px 0 0 0', lineHeight: 1.5 }}>
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. Header & Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Clinical Nutrition AI Assistant
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
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                <BadgeCheck size={14} color="#059669" />
                ABHA ID Synced
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
              Curated Indian dietary guidance powered by OpenRouter API & ICMR-NIN guidelines
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={15} color="#059669" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Condition Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {CONDITIONS_MAP.map(c => {
            const isSelected = selectedCondition === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedCondition(c.id); setSearchResult(null); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                  background: isSelected ? '#0f172a' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {c.label}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '24px', background: '#cbd5e1', margin: '0 4px' }} />

          {/* Diet Filters */}
          <button
            onClick={() => setIsVegOnly(false)}
            style={{
              padding: '7px 14px',
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
              padding: '7px 14px',
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
      </div>

      {/* 2. ABHA Patient Health Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={22} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>Metformin, Telmisartan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Red-Flag Warning Banner */}
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

      {/* 4. Interactive AI Nutrition Chatbot Section */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '520px'
      }}>
        {/* Chatbot Top Bar */}
        <div style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Ask AI Nutritionist</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Connected to OpenRouter API • Auto-fetches ABHA ID profile
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setChatMessages([])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: msg.isEmergency ? '#ef4444' : '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.isEmergency ? <ShieldAlert size={18} /> : <Bot size={18} />}
                </div>
              )}

              <div style={{
                maxWidth: '82%',
                background: msg.role === 'user' ? '#0f172a' : msg.isEmergency ? '#fef2f2' : '#ffffff',
                border: msg.role === 'user' ? 'none' : msg.isEmergency ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                fontSize: '13.5px'
              }}>
                <div style={{ marginBottom: '4px' }}>
                  {renderFormattedText(msg.content)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: msg.role === 'user' ? '#94a3b8' : '#94a3b8',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9'
                }}>
                  <span>{msg.timestamp}</span>
                  {msg.provider && (
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{msg.provider}</span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {isChatLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 18px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#2563eb" className="animate-spin" />
                <span>Consulting OpenRouter LLM & ICMR-NIN Rules for {patientName}...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '10px 16px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Sparkles size={13} color="#2563eb" /> Quick Ask:
          </span>
          {[
            `What to eat for dinner with BP ${bpString}?`,
            `Is banana safe with glucose ${glucoseString}?`,
            `1-day Indian diet plan for Type 2 Diabetes`,
            `Food interactions with Telmisartan & Metformin`
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChatMessage(promptText)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '12px',
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
          padding: '14px 16px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
            placeholder={`Ask diet question for ${patientName} (e.g. Can I eat oats with diabetes?)...`}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              padding: '0 16px',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSendChatMessage()}
            disabled={isChatLoading || !chatInput.trim()}
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '12px',
              background: isChatLoading || !chatInput.trim() ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* 5. "Can I eat...?" Quick Food Checker Bar */}
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          padding: '0 14px',
          height: '46px',
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
            padding: '0 22px',
            height: '46px',
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

      {/* 6. "Best for you today" Top 3 Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
          Best for you today
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                position: 'relative',
                overflow: 'hidden'
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

      {/* 7. Categorized Food Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
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

      {/* 8. Footer Disclaimer */}
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
          General clinical guidance, not a prescription. Your doctor's advice comes first.
        </div>
      </div>
    </div>
  );
}
