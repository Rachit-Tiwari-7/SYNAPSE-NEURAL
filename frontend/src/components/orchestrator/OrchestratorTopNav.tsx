'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Sparkles, 
  Layers, 
  Smartphone, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ShieldCheck, 
  MessageCircle, 
  LogOut,
  Building2,
  Mic,
  Bot
} from 'lucide-react';
import { PatientInfo } from './types';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export type OrchestratorTab = 'overview' | 'chat' | 'records' | 'rural' | 'security' | 'whatsapp';

interface TopNavProps {
  activeTab: OrchestratorTab;
  onTabChange: (tab: OrchestratorTab) => void;
  patient: PatientInfo;
  onOpenExportModal: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function OrchestratorTopNav({
  activeTab,
  onTabChange,
  patient,
  onOpenExportModal
}: TopNavProps) {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const tabs: { id: OrchestratorTab; label: string; icon: React.ComponentType<{ size?: number | string; color?: string }> }[] = [
    { id: 'overview', label: t('tab_overview', 'Home / Dashboard'), icon: Layers },
    { id: 'chat', label: t('tab_chat', 'AI Health Chat'), icon: Bot },
    { id: 'whatsapp', label: t('tab_whatsapp', 'WhatsApp AI Bot'), icon: MessageCircle },
    { id: 'rural', label: t('tab_rural_health', 'Rural Health Hub'), icon: Smartphone },
    { id: 'records', label: t('tab_records', 'ABHA ID & Records'), icon: Building2 },
    { id: 'security', label: t('tab_security', 'Security & 2FA'), icon: ShieldCheck }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const activeTabLabel = currentTab ? currentTab.label : 'Overview';

  const checkScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollBy = (amount: number) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handleTriggerChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'chat', fullscreen: true } }));
    }
  };

  const handleTriggerVoice = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'voice', fullscreen: true } }));
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="orch-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: '56px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'visible',
      fontFamily: 'inherit'
    }}>

      {/* Left: Active Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ 
            color: '#059669', 
            fontWeight: 800,
            fontSize: '12.5px',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            Rural AI Healthcare
          </span>
          <ChevronRight size={13} color="#94a3b8" />
          <span style={{ 
            color: '#0284c7', 
            fontWeight: 700,
            fontSize: '12px',
            background: '#f0f9ff',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid #e0f2fe'
          }}>
            {activeTabLabel}
          </span>
        </div>
      </div>

      {/* Center: Interactive Tabs */}
      <div 
        className="orch-tabs-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          maxWidth: '620px',
          margin: '0 12px',
          position: 'relative'
        }}
      >
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-140)}
            style={{
              position: 'absolute',
              left: '-14px',
              zIndex: 10,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
          >
            <ChevronLeft size={14} color="#64748b" />
          </button>
        )}

        <div 
          ref={trackRef}
          onScroll={checkScroll}
          className="orch-tabs-scroll-track"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'chat') {
                    handleTriggerChat();
                  } else {
                    onTabChange(tab.id);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0
                }}
              >
                <Icon size={13} color={isActive ? '#059669' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollBy(140)}
            style={{
              position: 'absolute',
              right: '-14px',
              zIndex: 10,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
          >
            <ChevronRight size={14} color="#64748b" />
          </button>
        )}
      </div>

      {/* Right Controls & Quick Action Buttons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        flexShrink: 0,
        marginLeft: '12px'
      }}>
        {/* Quick Voice Consultation Button */}
        <button
          onClick={handleTriggerVoice}
          title="Start Live Voice Consultation (Vapi)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            height: '32px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#047857',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(5, 150, 105, 0.08)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#a7f3d0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
          }}
        >
          <Mic size={13} color="#059669" />
          <span>Talk to AI</span>
        </button>

        {/* Quick AI Health Chat Button */}
        <button
          onClick={handleTriggerChat}
          title="Open AI Healthcare Chatbot"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            height: '32px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#1d4ed8',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.08)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#bfdbfe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
          }}
        >
          <Bot size={13} color="#2563eb" />
          <span>Chat with AI</span>
        </button>

        {/* Language Selector */}
        <div style={{ flexShrink: 0 }}>
          <LanguageSelector variant="nav" />
        </div>

        {/* Export Hub Trigger */}
        <button
          onClick={onOpenExportModal}
          title="Export Health Passport PDF / HL7 FHIR Bundle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            height: '32px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#0f172a',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <Download size={13} color="#0284c7" />
          <span>{t('btn_export_hub', 'Export')}</span>
        </button>

        {/* Patient Profile Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          height: '32px'
        }}>
          {patient.avatarUrl ? (
            <img 
              src={patient.avatarUrl} 
              alt={patient.name} 
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {patient.name.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{patient.name}</span>
        </div>
      </div>
    </header>
  );
}
