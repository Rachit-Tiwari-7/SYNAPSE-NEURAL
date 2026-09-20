'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Bell, 
  Sparkles, 
  BarChart3, 
  Activity, 
  Building2,
  Layers,
  Globe,
  Watch,
  Smartphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldCheck,
  MessageCircle,
  LogOut
} from 'lucide-react';
import { PatientInfo } from './types';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface TopNavProps {
  activeTab: 'overview' | 'swarm' | 'analytics' | 'hospital' | 'scan' | 'records' | 'sync' | 'rural' | 'security' | 'whatsapp';
  onTabChange: (tab: 'overview' | 'swarm' | 'analytics' | 'hospital' | 'scan' | 'records' | 'sync' | 'rural' | 'security' | 'whatsapp') => void;
  patient: PatientInfo;
  onOpenExportModal: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function OrchestratorTopNav({
  activeTab,
  onTabChange,
  patient,
  onOpenExportModal,
  searchQuery = '',
  onSearchChange
}: TopNavProps) {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const WhoIcon = ({ size }: { size?: number | string }) => (
    <img src="/who.svg" alt="WHO Logo" style={{ width: size || 13, height: size || 13, objectFit: 'contain' }} />
  );

  const tabs = [
    { id: 'overview', label: t('tab_overview', 'My Condition'), icon: Layers },
    { id: 'swarm', label: t('tab_swarm', 'Swarm Intelligence'), icon: Sparkles },
    { id: 'whatsapp', label: t('tab_whatsapp', 'WhatsApp Bot'), icon: MessageCircle },
    { id: 'rural', label: t('tab_rural_health', 'Rural AI Healthcare'), icon: Smartphone },
    { id: 'analytics', label: t('tab_analytics', 'Visual Analytics'), icon: BarChart3 },
    { id: 'hospital', label: t('tab_hospital', 'WHO Surveillance & Map'), icon: WhoIcon },
    { id: 'scan', label: t('tab_scan', 'Prescription OCR & Vision'), icon: Search },
    { id: 'records', label: t('tab_records', 'ABHA & Records'), icon: Building2 },
    { id: 'sync', label: t('tab_health_sync', 'Google & Apple Health'), icon: Watch },
    { id: 'security', label: t('tab_security', '2FA & Sessions'), icon: ShieldCheck }
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

      {/* Left: Active Clinical Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ 
            color: '#64748b', 
            fontWeight: 600,
            fontSize: '12px',
            letterSpacing: '-0.01em'
          }}>
            Hospital OS
          </span>
          <ChevronRight size={13} color="#94a3b8" />
          <span style={{ 
            color: '#0284c7', 
            fontWeight: 700,
            fontSize: '12px',
            background: '#f0f9ff',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid #bae6fd',
            whiteSpace: 'nowrap'
          }}>
            {activeTabLabel}
          </span>
        </div>
      </div>

      {/* Center: Segmented Workspace Tabs Track */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#f1f5f9',
        padding: '3px 4px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        gap: '2px',
        flex: '1 1 auto',
        minWidth: 0,
        maxWidth: '720px',
        position: 'relative'
      }}>
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-140)}
            title="Scroll left"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
            }}
          >
            <ChevronLeft size={12} />
          </button>
        )}

        {/* Scrollable Pills Track */}
        <div
          ref={trackRef}
          onScroll={checkScroll}
          onWheel={(e) => {
            if (trackRef.current && e.deltaY) {
              e.stopPropagation();
              trackRef.current.scrollLeft += e.deltaY * 0.8;
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            flex: '1 1 auto',
            minWidth: 0
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className="orch-nav-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0284c7' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={12} color={isActive ? '#0284c7' : '#94a3b8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(140)}
            title="Scroll right"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
            }}
          >
            <ChevronRight size={12} />
          </button>
        )}

        {/* Arrow Dropdown Menu Button */}
        <div ref={moreMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            title="View all sections"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: isMoreOpen ? '#ffffff' : 'transparent',
              border: isMoreOpen ? '1px solid #cbd5e1' : '1px solid transparent',
              color: '#64748b',
              cursor: 'pointer',
              boxShadow: isMoreOpen ? '0 1px 2px rgba(15, 23, 42, 0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronDown 
              size={12} 
              style={{ 
                transform: isMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isMoreOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '220px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
              zIndex: 9999,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{
                padding: '6px 8px',
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #f1f5f9'
              }}>
                Workspaces Navigation
              </div>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id as any);
                      setIsMoreOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 9px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isActive ? '#f0f9ff' : 'transparent',
                      color: isActive ? '#0284c7' : '#0f172a',
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={13} color={isActive ? '#0284c7' : '#64748b'} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <Check size={13} color="#0284c7" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls & Patient Avatar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        flexShrink: 0,
        marginLeft: '16px'
      }}>
        {/* Language Selector */}
        <div style={{ flexShrink: 0 }}>
          <LanguageSelector variant="nav" />
        </div>

        {/* Quick Export Hub Trigger */}
        <button
          onClick={onOpenExportModal}
          title="Export HL7 FHIR Bundle / Download Clinical PDF"
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <Download size={13} color="#0284c7" />
          <span style={{ whiteSpace: 'nowrap' }}>{t('btn_export_hub', 'Export Hub')}</span>
        </button>

        {/* Notification Bell */}
        <div 
          title="Clinical Alerts & Notifications"
          style={{
            width: '32px',
            minWidth: '32px',
            height: '32px',
            minHeight: '32px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            boxSizing: 'border-box',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <Bell size={14} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#dc2626'
          }} />
        </div>

        {/* Patient Profile / Doctor Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '10px',
          borderLeft: '1px solid #e2e8f0',
          flexShrink: 0
        }}>
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                flexShrink: 0
              }}
            />
          ) : (
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid #bae6fd',
                flexShrink: 0
              }}
            >
              {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AB'}
            </div>
          )}
          <div style={{ whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              <span>{user?.name || patient.name}</span>
              {(user?.isAdmin || user?.role === 'admin' || user?.email?.includes('admin')) ? (
                <span style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid #fca5a5',
                  letterSpacing: '0.03em',
                }}>
                  ADMIN
                </span>
              ) : (
                <span style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid #a7f3d0',
                  letterSpacing: '0.03em',
                }}>
                  ABDM
                </span>
              )}
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.2, marginTop: '1px' }}>
              ABHA: <span style={{ fontWeight: 600, color: '#0284c7', fontVariantNumeric: 'tabular-nums' }}>{patient.abhaId}</span>
            </div>
          </div>
        </div>

        {/* Sleek Logout Action Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign Out of Synapse OS"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isLoggingOut) {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#f87171';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoggingOut) {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }
          }}
        >
          <LogOut size={13} color="#dc2626" />
        </button>
      </div>
    </header>
  );
}
