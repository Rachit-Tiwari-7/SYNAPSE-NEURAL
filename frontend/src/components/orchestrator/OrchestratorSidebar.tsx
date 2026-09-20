'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Layers, 
  Activity, 
  Scan, 
  FileText, 
  AlertOctagon, 
  Zap, 
  Globe,
  ShieldCheck,
  Watch,
  Smartphone,
  MessageCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface OrchestratorSidebarProps {
  onOpenSOS?: () => void;
  activeTab?: string;
  onTabChange?: (tab: 'overview' | 'swarm' | 'analytics' | 'hospital' | 'scan' | 'records' | 'sync' | 'rural' | 'security' | 'whatsapp') => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface NavCategory {
  title: string;
  items: {
    labelKey: string;
    fallback: string;
    tab?: 'overview' | 'swarm' | 'analytics' | 'hospital' | 'scan' | 'records' | 'sync' | 'rural' | 'security' | 'whatsapp';
    href?: string;
    icon: React.ComponentType<{ size?: number | string; strokeWidth?: number; color?: string; className?: string }>;
    isTab?: boolean;
  }[];
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
      title: 'Clinical Core',
      items: [
        { labelKey: 'tab_overview', fallback: 'My Condition & Twin', tab: 'overview', icon: Layers, isTab: true },
        { labelKey: 'tab_swarm', fallback: 'Swarm Intelligence', tab: 'swarm', icon: Zap, isTab: true },
        { labelKey: 'tab_whatsapp', fallback: 'WhatsApp AI Bot', tab: 'whatsapp', icon: MessageCircle, isTab: true },
        { labelKey: 'tab_rural_health', fallback: 'Rural AI Healthcare', tab: 'rural', icon: Smartphone, isTab: true }
      ]
    },
    {
      title: 'Diagnostics & Analytics',
      items: [
        { labelKey: 'tab_scan', fallback: 'Prescription OCR & Vision', tab: 'scan', icon: Scan, isTab: true },
        { labelKey: 'tab_analytics', fallback: 'Visual Analytics', tab: 'analytics', icon: Activity, isTab: true },
        { labelKey: 'tab_hospital', fallback: 'WHO Surveillance', tab: 'hospital', icon: Globe, isTab: true }
      ]
    },
    {
      title: 'Records & Security',
      items: [
        { labelKey: 'tab_records', fallback: 'ABHA Health Records', tab: 'records', icon: FileText, isTab: true },
        { labelKey: 'tab_health_sync', fallback: 'Health Device Sync', tab: 'sync', icon: Watch, isTab: true },
        { labelKey: 'tab_security', fallback: '2FA & Active Sessions', tab: 'security', icon: ShieldCheck, isTab: true }
      ]
    }
  ];

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
        padding: isExpanded ? '16px 12px' : '16px 0',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 999,
        boxShadow: '2px 0 12px rgba(15, 23, 42, 0.04)',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowX: 'hidden',
        overflowY: 'auto'
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
            title="Synapse Hospital OS — Home"
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
                alt="AIIMS New Delhi Emblem" 
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
                  Synapse Hospital OS
                </span>
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: 700, 
                  color: '#0284c7', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Clinical Core v4.2
                </span>
              </div>
            )}
          </Link>

          {/* Expand/Collapse Toggle Button (Visible in Header when Expanded) */}
          {isExpanded && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title="Collapse Sidebar (76px)"
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
              title="Expand Sidebar (250px)"
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
                e.currentTarget.style.background = '#e0f2fe';
                e.currentTarget.style.color = '#0284c7';
                e.currentTarget.style.borderColor = '#bae6fd';
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

        {/* Categorized Clinical Navigation Sections */}
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
                  const isRouteActive = !item.isTab && pathname === item.href;
                  const isActive = isTabActive || isRouteActive;
                  const titleLabel = t(item.labelKey, item.fallback);

                  return (
                    <div 
                      key={idx} 
                      className="orch-nav-item"
                      style={{ 
                        position: 'relative', 
                        width: isExpanded ? '100%' : 'auto',
                        display: 'flex',
                        justifyContent: isExpanded ? 'stretch' : 'center'
                      }}
                    >
                      <button
                        onClick={() => item.tab && onTabChange?.(item.tab)}
                        title={isExpanded ? '' : titleLabel}
                        style={{
                          width: isExpanded ? '100%' : '44px',
                          height: isExpanded ? '38px' : '44px',
                          padding: isExpanded ? '0 12px' : '0',
                          borderRadius: '10px',
                          border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isExpanded ? 'flex-start' : 'center',
                          gap: isExpanded ? '10px' : '0',
                          background: isActive ? '#e0f2fe' : 'transparent',
                          color: isActive ? '#0284c7' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isActive ? '0 1px 3px rgba(2, 132, 199, 0.08)' : 'none',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#0284c7';
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
                          color={isActive ? '#0284c7' : 'currentColor'} 
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
                            background: '#0284c7',
                            flexShrink: 0
                          }} />
                        )}
                      </button>

                      {/* Floating Tooltip for Collapsed State */}
                      {!isExpanded && (
                        <div className="orch-sidebar-tooltip">
                          {titleLabel}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Synapse Home Link */}
          <div style={{ marginTop: '4px', width: '100%', display: 'flex', justifyContent: isExpanded ? 'stretch' : 'center' }}>
            <div 
              className="orch-nav-item"
              style={{ 
                position: 'relative', 
                width: isExpanded ? '100%' : 'auto',
                display: 'flex',
                justifyContent: isExpanded ? 'stretch' : 'center'
              }}
            >
              <Link
                href="/"
                title={isExpanded ? '' : t('brand_title', 'SynapseOS Home')}
                data-no-swup="true"
                style={{
                  width: isExpanded ? '100%' : '44px',
                  height: isExpanded ? '38px' : '44px',
                  padding: isExpanded ? '0 12px' : '0',
                  borderRadius: '10px',
                  border: pathname === '/' ? '1px solid #bae6fd' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  gap: isExpanded ? '10px' : '0',
                  background: pathname === '/' ? '#e0f2fe' : 'transparent',
                  color: pathname === '/' ? '#0284c7' : '#64748b',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/') {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0284c7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <Home size={18} strokeWidth={1.8} className="flex-shrink-0" />
                {isExpanded && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {t('brand_title', 'SynapseOS Home')}
                  </span>
                )}
              </Link>

              {!isExpanded && (
                <div className="orch-sidebar-tooltip">
                  {t('brand_title', 'SynapseOS Home')}
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Emergency SOS & Hospital Actions */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        alignItems: isExpanded ? 'stretch' : 'center', 
        width: '100%',
        paddingTop: '10px',
        borderTop: '1px solid #f1f5f9'
      }}>
        {/* Emergency SOS Button */}
        {onOpenSOS && (
          <div 
            className="orch-nav-item"
            style={{ 
              position: 'relative', 
              width: isExpanded ? '100%' : 'auto',
              display: 'flex',
              justifyContent: isExpanded ? 'stretch' : 'center'
            }}
          >
            <button
              onClick={onOpenSOS}
              title={isExpanded ? '' : t('btn_emergency_sos', 'Emergency SOS (112)')}
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
                fontSize: '12px'
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
                  {t('btn_emergency_sos', 'Emergency SOS (112)')}
                </span>
              )}
            </button>

            {!isExpanded && (
              <div className="orch-sidebar-tooltip" style={{ background: '#dc2626' }}>
                {t('btn_emergency_sos', 'Emergency SOS (112)')}
              </div>
            )}
          </div>
        )}

        {/* Sign Out Action Button */}
        <div 
          className="orch-nav-item"
          style={{ 
            position: 'relative', 
            width: isExpanded ? '100%' : 'auto',
            display: 'flex',
            justifyContent: isExpanded ? 'stretch' : 'center'
          }}
        >
          <button
            onClick={() => logout()}
            title={isExpanded ? '' : 'Sign Out of Synapse OS'}
            style={{
              width: isExpanded ? '100%' : '40px',
              height: isExpanded ? '34px' : '40px',
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
              fontWeight: 600
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

          {!isExpanded && (
            <div className="orch-sidebar-tooltip">
              Sign Out
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
