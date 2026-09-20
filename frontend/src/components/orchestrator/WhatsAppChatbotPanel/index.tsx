'use client';

import React, { useState } from 'react';
import { 
  MessageCircle, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertOctagon, 
  Activity, 
  Sparkles, 
  Pill, 
  Heart, 
  Globe, 
  FileText,
  CheckCircle2,
  Stethoscope,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PatientInfo } from '../types';

interface WhatsAppChatbotPanelProps {
  patient?: PatientInfo;
}

const OFFICIAL_WA_PHONE = '+1 (555) 202-8141';
const OFFICIAL_WA_CLEAN = '15552028141';
const OFFICIAL_WA_LINK = `https://wa.me/${OFFICIAL_WA_CLEAN}?text=Hi`;

export default function WhatsAppChatbotPanel({ patient }: WhatsAppChatbotPanelProps) {
  const { t, translateText } = useLanguage();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(OFFICIAL_WA_PHONE);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(OFFICIAL_WA_LINK);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const commandDirectory = [
    {
      code: 'Hi / Hello',
      title: 'Service Menu & Language Selection',
      desc: 'Welcomes user, auto-detects language, and presents the numbered clinical options directory.',
      badge: 'Main Menu',
      badgeColor: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeBorder: '#bae6fd'
    },
    {
      code: '1 <symptoms>',
      title: 'Multi-Agent Symptom Triage',
      desc: 'BioBERT + Swarm analyzes urgency, council consensus %, Dolo 650/ORS dosages, and 108 emergency red flags.',
      badge: 'Clinical Triage',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0'
    },
    {
      code: '2 <drugs>',
      title: 'RxNav Drug-Drug Interaction Safety',
      desc: 'Cross-audits multiple medications for severe interactions, timing spacing, and pregnancy warnings.',
      badge: 'Rx Safety',
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe'
    },
    {
      code: '5',
      title: 'Tele-Consultation Booking',
      desc: 'Connects directly with an on-duty hospital physician or Ayushman Bharat Health & Wellness Centre.',
      badge: 'Doctor Consult',
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe'
    },
    {
      code: '7 <child age>',
      title: 'UIP Universal Immunization Milestones',
      desc: 'Calculates upcoming vaccines (BCG, Pentavalent, Rotavirus, MR) under Ministry of Health guidelines.',
      badge: 'Vaccination',
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a'
    },
    {
      code: '8 <district>',
      title: 'IDSP District Outbreak Surveillance',
      desc: 'Fetches active epidemiological disease advisories (Dengue, Malaria, Cholera) for your specific district.',
      badge: 'Outbreaks',
      badgeColor: '#0d9488',
      badgeBg: '#f0fdfa',
      badgeBorder: '#99f6e4'
    },
    {
      code: '9',
      title: 'Rural Preventive Wellness & Hygiene',
      desc: 'Provides low-cost, evidence-based preventive health, diet, clean drinking water, and seasonal advisories.',
      badge: 'Wellness',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0'
    },
    {
      code: 'SOS',
      title: 'Critical Emergency Crisis Intercept',
      desc: 'Bypasses AI processing to provide immediate 108 ambulance prompt and emergency first-response safety rules.',
      badge: 'Emergency 108',
      badgeColor: '#dc2626',
      badgeBg: '#fef2f2',
      badgeBorder: '#fecaca'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* 1. Hero Strategic Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #e0f2fe 100%)',
        borderRadius: '20px',
        border: '1px solid #86efac',
        padding: '24px 28px',
        boxShadow: '0 2px 10px rgba(34, 197, 94, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 550px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 16px rgba(34, 197, 94, 0.3)',
            flexShrink: 0
          }}>
            <MessageCircle size={30} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#ffffff',
                border: '1px solid #86efac',
                color: '#15803d',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Meta Cloud API Verified
              </span>
              <span style={{
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                ABDM Sandbox Integrated
              </span>
              <span style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#b45309',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                ICMR Grounded
              </span>
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#0f172a',
              margin: '6px 0 2px 0',
              letterSpacing: '-0.02em'
            }}>
              Synapse-OS WhatsApp Clinical Bot
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#334155',
              margin: 0,
              lineHeight: 1.4,
              maxWidth: '680px'
            }}>
              Instant, hospital-grade AI triage, emergency crisis intercept, prescription OCR, and Indian medication protocols delivered directly to any citizen via WhatsApp.
            </p>
          </div>
        </div>

        {/* Quick Direct Launch Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={OFFICIAL_WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageCircle size={16} />
            <span>Launch on WhatsApp</span>
            <ExternalLink size={13} />
          </a>

          <button
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            {copiedLink ? <Check size={15} color="#15803d" /> : <Copy size={15} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
        </div>
      </div>

      {/* 2. Getting Started Launchpad (3-Column Layout: Direct Action, QR Code, and 3-Step Guide) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Left Column (4 Cols): Official Numbers & Quick Launch Cards */}
        <div style={{
          gridColumn: 'span 4',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Smartphone size={16} color="#0284c7" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Hotline
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Connect Your Smartphone
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Save our verified hospital number or tap copy to add to your contacts for instant 24/7 access.
            </p>
          </div>

          {/* Phone Number Pill */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>VERIFIED WHATSAPP BOT</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                {OFFICIAL_WA_PHONE}
              </div>
            </div>
            <button
              onClick={handleCopyPhone}
              title="Copy phone number"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: copiedPhone ? '#ecfdf5' : '#ffffff',
                border: '1px solid',
                borderColor: copiedPhone ? '#86efac' : '#cbd5e1',
                color: copiedPhone ? '#15803d' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedPhone ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          {/* Quick Shortcuts Highlights */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '12px 14px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1' }}>
              ⚡ Popular WhatsApp One-Word Commands:
            </span>
            <div style={{ fontSize: '11.5px', color: '#0f172a', lineHeight: 1.5 }}>
              • Send <strong>Hi</strong> to receive the full service directory.<br />
              • Send <strong>1 &lt;symptoms&gt;</strong> for multi-agent triage.<br />
              • Send <strong>SOS</strong> for immediate 108 emergency dial.<br />
              • Send <strong>7</strong> for baby vaccination schedule.
            </div>
          </div>
        </div>

        {/* Center Column (3 Cols): Official Scan QR Code */}
        <div style={{
          gridColumn: 'span 3',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#15803d',
            background: '#dcfce7',
            padding: '3px 10px',
            borderRadius: '20px',
            border: '1px solid #86efac'
          }}>
            <QrCode size={13} />
            <span>Scan to Chat</span>
          </div>

          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '14px',
            background: '#ffffff',
            border: '2px solid #22c55e',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)'
          }}>
            <img
              src="/whatsapp-qr.svg"
              alt="Scan to Chat on WhatsApp"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/whatsapp-qr.png';
              }}
            />
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.3 }}>
            Point your phone camera at this QR code to open the clinical bot immediately.
          </div>
        </div>

        {/* Right Column (5 Cols): 3-Step Setup Guide */}
        <div style={{
          gridColumn: 'span 5',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                How to Get Started
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              3 Steps to Complete Clinical Access
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid #86efac',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Scan the QR or Tap Direct Launch
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Opens WhatsApp directly without installing extra apps or software.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Send Symptoms in Any Indian Language
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Write naturally in Hindi, English, Bengali, Tamil, Telugu, Marathi, etc.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#b45309',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Get Grounded Advice & Indian Brands
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Verified consensus percentage, Dolo 650/ORS dosages, and 108 emergency alerts.
                </div>
              </div>
            </div>
          </div>

          <div style={{
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '10px',
            fontSize: '11px',
            color: '#64748b',
            border: '1px solid #e2e8f0'
          }}>
            🔒 <strong>ABDM Patient Privacy:</strong> Conversations are encrypted end-to-end and synced with your verified national ABHA ID.
          </div>
        </div>
      </div>

      {/* 3. Clinical Commands & Services Directory */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#0284c7" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                WhatsApp Clinical Commands & Shortcuts Directory
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Simply text these commands to the verified WhatsApp bot for immediate autonomous handling.
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#059669',
            background: '#ecfdf5',
            padding: '3px 10px',
            borderRadius: '6px',
            border: '1px solid #a7f3d0'
          }}>
            ✓ Real-Time Response &lt; 1.5s
          </span>
        </div>

        {/* Commands Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px'
        }}>
          {commandDirectory.map((cmd, idx) => (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1'
                  }}>
                    {cmd.code}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: cmd.badgeColor,
                    background: cmd.badgeBg,
                    border: `1px solid ${cmd.badgeBorder}`
                  }}>
                    {cmd.badge}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  {cmd.title}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                  {cmd.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Core Features & Hospital-Grade Capabilities Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {/* Feature 1: Crisis & Emergency Intercept */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertOctagon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Deterministic Crisis Intercept
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Instantly intercepts cardiac distress, stroke signs, and poisoning triggers with high-priority 108 emergency dialing and GPS nearest trauma routing.
            </p>
          </div>
        </div>

        {/* Feature 2: RxNav Drug-Drug Safety */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Pill size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              NIH RxNav Safety Engine
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Audits multi-drug regimens, pregnancy contraindications, and liver/renal safety across 25,000+ Indian generic and branded pharmaceutical compounds.
            </p>
          </div>
        </div>

        {/* Feature 3: Multilingual Indian Languages */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              12+ Regional Indian Languages
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Automatic language identification and clinical response translation in Hindi, Bengali, Tamil, Telugu, Marathi, Punjabi, Gujarati, Odia, Kannada, and Malayalam.
            </p>
          </div>
        </div>

        {/* Feature 4: Prescription Vision OCR */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            color: '#9333ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Prescription Photo Scan & OCR
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Users take a photo of handwritten doctor prescriptions directly in WhatsApp; our vision agent parses medicines, frequencies, and warnings.
            </p>
          </div>
        </div>

        {/* Feature 5: UIP Immunization Tracker */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Heart size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              UIP Vaccine Reminders
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Tracks national immunization milestones (BCG, Pentavalent, Rotavirus, MR) with scheduled WhatsApp notifications for rural and semi-urban mothers.
            </p>
          </div>
        </div>

        {/* Feature 6: IDSP Outbreak Alerts */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              IDSP Outbreak Surveillance
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Integrated with MoHFW disease surveillance; broadcasts instant vector-borne epidemic advisories (Dengue, Malaria, Cholera) to affected pin codes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
