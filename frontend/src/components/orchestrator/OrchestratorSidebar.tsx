'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Bot,
  Mic,
  FileText, 
  AlertOctagon, 
  Zap, 
  ShieldCheck,
  Smartphone,
  MessageCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export type OrchestratorTab = 'overview' | 'chat' | 'records' | 'rural' | 'security' | 'whatsapp';

interface OrchestratorSidebarProps {
  onOpenSOS?: () => void;
  activeTab?: string;
  onTabChange?: (tab: OrchestratorTab) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface NavItem {
  labelKey: string;
  fallback: string;
  tab?: OrchestratorTab;
  action?: 'voice';
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number; color?: string; className?: string }>;
  isTab?: boolean;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export default function OrchestratorSidebar({ 
  onOpenSOS,
  activeTab = 'overview',
  onTabChange,
  isExpanded = false,
  onToggleExpand
}: OrchestratorSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { logout } = useAuth();

  const navigationSections: NavCategory[] = [
    {
      title: 'Main',
      items: [
        { labelKey: 'tab_overview', fallback: 'Home / Dashboard', tab: 'overview', icon: Home, isTab: true },
        { labelKey: 'tab_chat', fallback: 'AI Health Chat', tab: 'chat', icon: Bot, isTab: true },
        { labelKey: 'tab_whatsapp', fallback: 'WhatsApp AI Bot', tab: 'whatsapp', icon: MessageCircle, isTab: true },
        { labelKey: 'tab_rural_health', fallback: 'Rural Health Hub', tab: 'rural', icon: Smartphone, isTab: true },
        { labelKey: 'tab_records', fallback: 'ABHA ID & Records', tab: 'records', icon: FileText, isTab: true }
      ]
    },
    {
      title: 'Tools & Care',
      items: [
        { labelKey: 'tab_security', fallback: 'Security & 2FA', tab: 'security', icon: ShieldCheck, isTab: true },
        { labelKey: 'tab_voice', fallback: 'Voice Consultation', action: 'voice', icon: Mic, isTab: false }
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.action === 'voice') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'voice', fullscreen: true } }));
      }
    } else if (item.tab === 'chat') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'chat', fullscreen: true } }));
      }
    } else if (item.tab) {
      onTabChange?.(item.tab);
    }
  };

  return (
    <aside 
      className="orch-sidebar-fixed"
      style={{
        width: isExpanded ? '250px' : '76px',
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isExpanded ? '16px 12px 36px 12px' : '16px 0 36px 0',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 999,
        boxShadow: '2px 0 12px rgba(15, 23, 42, 0.04)',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header & Hospital Branding */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          padding: isExpanded ? '0 4px' : '0',
          width: '100%'
        }}>
          {/* Hospital Logo & Brand Link */}
          <Link 
            href="/" 
            title="Rural AI Healthcare"
            style={{ 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
              cursor: 'pointer',
              overflow: 'hidden',
              padding: '3px',
              flexShrink: 0
            }}>
              <img 
                src="/AIIMS_New_Delhi.png" 
                alt="Rural AI Healthcare Emblem" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>

            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap'
                }}>
                  Rural AI Healthcare
                </span>
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: 700, 
                  color: '#059669', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Sanjeevni AI Swarm
                </span>
              </div>
            )}
          </Link>

          {/* Expand/Collapse Toggle Button (Visible in Header when Expanded) */}
          {isExpanded && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title="Collapse Sidebar"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>

        {/* Expand Toggle Button when Collapsed (Under Logo) */}
        {!isExpanded && onToggleExpand && (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button
              onClick={onToggleExpand}
              title="Expand Sidebar"
              style={{
                width: '32px',
                height: '28px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ecfdf5';
                e.currentTarget.style.color = '#059669';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <PanelLeftOpen size={15} />
            </button>
          </div>
        )}

        {/* Categorized Rural AI Navigation Sections */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isExpanded ? '12px' : '6px', 
          width: '100%' 
        }}>
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* Category Divider / Header */}
              {isExpanded ? (
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 8px 3px 8px',
                  whiteSpace: 'nowrap'
                }}>
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div style={{ 
                  margin: '4px 14px', 
                  borderTop: '1px solid #f1f5f9' 
                }} />
              ) : null}

              {/* Items in Section */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isExpanded ? '2px' : '4px', 
                alignItems: isExpanded ? 'stretch' : 'center',
                width: '100%' 
              }}>
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  const isTabActive = item.isTab && activeTab === item.tab;
                  const isActive = isTabActive;
                  const titleLabel = t(item.labelKey, item.fallback);

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        padding: isExpanded ? '0' : '0 4px'
                      }}
                    >
                      <button
                        onClick={() => handleItemClick(item)}
                        title={titleLabel}
                        aria-label={titleLabel}
                        style={{
                          width: isExpanded ? '100%' : '44px',
                          height: isExpanded ? '38px' : '44px',
                          padding: isExpanded ? '0 12px' : '0',
                          borderRadius: '10px',
                          border: isActive ? '1px solid #a7f3d0' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isExpanded ? 'flex-start' : 'center',
                          gap: isExpanded ? '10px' : '0',
                          background: isActive ? '#ecfdf5' : 'transparent',
                          color: isActive ? '#059669' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isActive ? '0 1px 3px rgba(5, 150, 105, 0.08)' : 'none',
                          textAlign: 'left',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#059669';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#334155';
                          }
                        }}
                      >
                        <Icon 
                          size={18} 
                          strokeWidth={isActive ? 2.3 : 1.7} 
                          color={isActive ? '#059669' : 'currentColor'} 
                          className="flex-shrink-0"
                        />
                        
                        {isExpanded && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                          }}>
                            {titleLabel}
                          </span>
                        )}

                        {isExpanded && isActive && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#059669',
                            flexShrink: 0
                          }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        width: '100%',
        alignItems: isExpanded ? 'stretch' : 'center',
        paddingTop: '12px',
        borderTop: '1px solid #f1f5f9'
      }}>
        {/* WhatsApp Quick Consultation QR Card */}
        <div style={{ width: '100%', padding: isExpanded ? '0' : '0 4px', marginBottom: '4px' }}>
          {isExpanded ? (
            <div style={{
              width: '100%',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '10px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <MessageCircle size={15} color="#16a34a" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                  Chat on WhatsApp
                </span>
              </div>

              <a
                href="https://wa.me/15552028141?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                title="Scan QR or Click to Chat on WhatsApp"
                style={{
                  background: '#ffffff',
                  padding: '6px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textDecoration: 'none'
                }}
              >
                <img
                  src="/whatsapp-qr.svg"
                  alt="Chat on WhatsApp"
                  width={76}
                  height={76}
                  style={{ display: 'block', borderRadius: '4px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/whatsapp-qr.png';
                  }}
                />
              </a>

              <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 700, marginTop: '6px' }}>
                Scan QR to start triage
              </div>

              <a
                href="https://wa.me/15552028141?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 4px rgba(22, 163, 74, 0.25)'
                }}
              >
                <MessageCircle size={12} />
                <span>Open WhatsApp</span>
              </a>
            </div>
          ) : (
            <a
              href="https://wa.me/15552028141?text=Hi"
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                color: '#16a34a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)',
                textDecoration: 'none',
                margin: '0 auto'
              }}
            >
              <img
                src="/whatsapp-qr.svg"
                alt="Chat on WhatsApp"
                width={22}
                height={22}
                style={{ display: 'block', borderRadius: '2px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/whatsapp-qr.png';
                }}
              />
              <span style={{ fontSize: '7px', fontWeight: 900, color: '#166534', lineHeight: 1 }}>WA</span>
            </a>
          )}
        </div>
        {/* Emergency SOS Button */}
        {onOpenSOS && (
          <div 
            style={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: isExpanded ? '0' : '0 4px'
            }}
          >
            <button
              onClick={onOpenSOS}
              title={t('btn_emergency_sos', 'Emergency SOS (108)')}
              aria-label={t('btn_emergency_sos', 'Emergency SOS (108)')}
              style={{
                width: isExpanded ? '100%' : '44px',
                height: isExpanded ? '38px' : '44px',
                padding: isExpanded ? '0 12px' : '0',
                borderRadius: '10px',
                background: '#dc2626',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                gap: isExpanded ? '8px' : '0',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)',
                transition: 'all 0.15s ease',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
              }}
            >
              <AlertOctagon size={18} className="flex-shrink-0" />
              {isExpanded && (
                <span style={{ whiteSpace: 'nowrap' }}>
                  {t('btn_emergency_sos', 'Emergency SOS (108)')}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Sign Out Action Button */}
        <div 
          style={{ 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: isExpanded ? '0' : '0 4px'
          }}
        >
          <button
            onClick={() => logout()}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              width: isExpanded ? '100%' : '44px',
              height: isExpanded ? '36px' : '40px',
              padding: isExpanded ? '0 12px' : '0',
              borderRadius: '9px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              gap: isExpanded ? '8px' : '0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '11.5px',
              fontWeight: 600,
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#fee2e2';
            }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {isExpanded && (
              <span style={{ whiteSpace: 'nowrap' }}>
                Sign Out
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
