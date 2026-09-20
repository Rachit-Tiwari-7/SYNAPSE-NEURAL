'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Download, 
  User, 
  Activity, 
  Calendar, 
  Sparkles, 
  Clock, 
  Pill, 
  Share2, 
  Building2, 
  QrCode, 
  Heart,
  ChevronRight,
  Bot,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { DetectedCondition, PatientInfo, VitalsData } from '../types';
import { MockHealthProfile } from '@/data/mockHealthProfiles';
import { useLanguage } from '@/context/LanguageContext';

export interface ClinicalConditionsPanelProps {
  patient?: PatientInfo;
  activeProfile?: MockHealthProfile;
  vitals?: VitalsData;
  isAbhaLinked?: boolean;
  conditions: DetectedCondition[];
  selectedCondition: DetectedCondition | null;
  onSelectCondition: (c: DetectedCondition) => void;
  onOpenExportModal: () => void;
  onNavigateToSwarmTab?: () => void;
  onNavigateToChatTab?: () => void;
}

export default function ClinicalConditionsPanel({
  patient,
  activeProfile,
  vitals,
  isAbhaLinked = true,
  conditions,
  selectedCondition,
  onSelectCondition,
  onOpenExportModal,
  onNavigateToSwarmTab,
  onNavigateToChatTab
}: ClinicalConditionsPanelProps) {
  const { t, translateText } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conditions' | 'records' | 'care'>('conditions');

  // Fallbacks if activeProfile or patient not directly passed
  const citizenName = patient?.name || activeProfile?.patient?.name || 'Rachit Tiwari';
  const abhaId = patient?.abhaId || activeProfile?.patient?.abhaId || '91-8842-1920-7463';
  const abhaAddress = activeProfile?.patient?.abhaAddress || `${citizenName.toLowerCase().replace(/\s+/g, '')}@abdm`;
  const policyNumber = patient?.policyNumber || activeProfile?.patient?.policyNumber || 'PM-JAY-2026-IND-9924';
  const linkedHip = activeProfile?.patient?.linkedHip || "King George's Medical University (KGMU) & AIIMS Node";
  const stateCode = activeProfile?.patient?.stateCode || (activeProfile?.profileId === 'shaikh_warsi_verified_abha' ? 'MH' : 'UP');
  const bloodType = patient?.bloodType || activeProfile?.patient?.bloodType || 'O+';
  const age = activeProfile?.patient?.age || 23;
  const gender = patient?.gender || activeProfile?.patient?.gender || 'Male';
  const dob = patient?.dob || activeProfile?.patient?.dob || 'June 18, 2003';

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const nextAppointment = activeProfile?.visualAnalytics?.nextAppointment || {
    doctor: 'Dr. Amitava Roy',
    specialty: 'Sports Medicine & Rehab',
    date: 'Wednesday, 21 Jan, 03:30 PM',
    mode: 'In-Clinic',
    color: '#7c3aed'
  };

  const carePlan = activeProfile?.visualAnalytics?.carePlan || {
    medicationPercent: 100,
    medicationStatus: 'Electrolytes & Vitamin D3 Complete (1 tab daily)',
    hydrationPercent: 90,
    hydrationStatus: '2.7L / 3.0L Target Reached'
  };

  const recordsList = activeProfile?.patient?.blockchainRecords || [
    {
      id: 'REC-0x9924-RT',
      title: 'Athletic VO2 Max & High-Endurance Pulmonary Spirometry',
      facility: 'Sports Medicine & Pulmonology Centre',
      timestamp: '2026-08-19 14:15 UTC',
      verified: true
    },
    {
      id: 'REC-0x9925-RT',
      title: 'Lower Kinetic Chain & Patellar Joint Cartilage Diagnostic',
      facility: 'KGMU Sports Orthopedics Unit',
      timestamp: '2026-08-21 16:40 UTC',
      verified: true
    }
  ];

  return (
    <div 
      className="orch-col-side"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '400px',
        flexShrink: 0
      }}
    >
      {/* 1. Official ABHA Identity & ABDM Credentials Card */}
      <div 
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          border: '1.5px solid #0284c7',
          padding: '18px 20px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative top tricolor bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          background: 'linear-gradient(90deg, #ff9933 0%, #ffffff 50%, #138808 100%)'
        }} />

        {/* Card Header: ABDM Branding & KYC Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', marginTop: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <ShieldCheck size={17} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {translateText('Ayushman Bharat ABDM')}
              </span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                {translateText('Logged-in Health ID')}
              </div>
            </div>
          </div>

          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#059669',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '3px 9px',
            borderRadius: '20px'
          }}>
            <CheckCircle2 size={12} />
            {translateText('ABDM KYC Verified')}
          </span>
        </div>

        {/* Citizen Profile Details Banner */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #e2e8f0',
          marginBottom: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 3px 0' }}>
                {citizenName}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>{translateText('Age')}: <strong>{age}</strong></span>
                <span>•</span>
                <span>{translateText('Gender')}: <strong>{gender}</strong></span>
                <span>•</span>
                <span>{translateText('Blood')}: <strong style={{ color: '#dc2626' }}>{bloodType}</strong></span>
                <span>•</span>
                <span>{translateText('State')}: <strong>{stateCode}</strong></span>
              </div>
            </div>

            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '13px',
              border: '1px solid #cbd5e1'
            }}>
              <QrCode size={20} color="#0284c7" />
            </div>
          </div>

          {/* 14-Digit ABHA ID & Address Row */}
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {translateText('14-Digit ABHA Number')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.04em', marginTop: '1px' }}>
                {abhaId}
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                {abhaAddress}
              </div>
            </div>

            <button
              onClick={() => handleCopy(abhaId, 'abha')}
              title={translateText('Copy ABHA ID')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: copiedField === 'abha' ? '#ecfdf5' : '#ffffff',
                color: copiedField === 'abha' ? '#059669' : '#334155',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedField === 'abha' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedField === 'abha' ? translateText('Copied') : translateText('Copy')}</span>
            </button>
          </div>
        </div>

        {/* Insurance Coverage & Empanelled Facility */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '11px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '9px 11px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              {translateText('PM-JAY Cover')}
            </span>
            <span style={{ fontWeight: 800, color: '#059669' }}>
              ₹5,00,000 / Year
            </span>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
              {policyNumber}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '9px 11px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              {translateText('Linked HIP')}
            </span>
            <span style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={linkedHip}>
              {linkedHip.split('(')[0].trim()}
            </span>
            <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '1px' }}>
              {translateText('Digital Node Verified')}
            </div>
          </div>
        </div>

        {/* Quick ABHA Action Strip */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={onOpenExportModal}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Download size={14} />
            <span>{translateText('Export ABDM Health Card')}</span>
          </button>

          <button
            onClick={() => handleCopy(`https://synapseos.health/verify?abha=${abhaId}`, 'share')}
            title={translateText('Share ABHA with Doctor')}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: copiedField === 'share' ? '#ecfdf5' : '#ffffff',
              color: copiedField === 'share' ? '#059669' : '#475569',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {copiedField === 'share' ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedField === 'share' ? translateText('Link Copied') : translateText('Share')}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Pills: Active Conditions / Diagnostic Records / Care Plan */}
      <div style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '3px',
        borderRadius: '12px',
        gap: '3px'
      }}>
        <button
          onClick={() => setActiveTab('conditions')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'conditions' ? '#ffffff' : 'transparent',
            color: activeTab === 'conditions' ? '#0f172a' : '#64748b',
            fontSize: '11.5px',
            fontWeight: activeTab === 'conditions' ? 800 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'conditions' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          {translateText('Clinical Diagnoses')} ({conditions.length})
        </button>

        <button
          onClick={() => setActiveTab('records')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'records' ? '#ffffff' : 'transparent',
            color: activeTab === 'records' ? '#0f172a' : '#64748b',
            fontSize: '11.5px',
            fontWeight: activeTab === 'records' ? 800 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'records' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          {translateText('ABDM Records')} ({recordsList.length})
        </button>

        <button
          onClick={() => setActiveTab('care')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'care' ? '#ffffff' : 'transparent',
            color: activeTab === 'care' ? '#0f172a' : '#64748b',
            fontSize: '11.5px',
            fontWeight: activeTab === 'care' ? 800 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'care' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          {translateText('Care & Review')}
        </button>
      </div>

      {/* 3. TAB 1: Verified Clinical Conditions List */}
      {activeTab === 'conditions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {conditions.map((cond, idx) => {
            const isSelected = selectedCondition?.id === cond.id || (!selectedCondition && idx === 0);
            const isStable = cond.status?.toLowerCase() === 'stable';
            const isCritical = cond.status?.toLowerCase() === 'critical';

            return (
              <div
                key={cond.id || idx}
                onClick={() => onSelectCondition(cond)}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: isSelected ? '0 6px 18px rgba(2, 132, 199, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Condition Header & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ paddingRight: '8px' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                      {translateText(cond.title)}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {cond.doctor || 'Dr. Rajesh K. Varma'} • {translateText(cond.specialty || 'General Medicine')}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isCritical ? '#fef2f2' : isStable ? '#ecfdf5' : '#fffbeb',
                    color: isCritical ? '#ef4444' : isStable ? '#059669' : '#d97706',
                    border: isCritical ? '1px solid #fecaca' : isStable ? '1px solid #a7f3d0' : '1px solid #fde68a',
                    flexShrink: 0
                  }}>
                    {translateText(cond.status || 'Stable')}
                  </span>
                </div>

                {/* Doctor's Clinical Assessment Notes */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  border: '1px solid #f1f5f9',
                  marginBottom: '10px'
                }}>
                  <p style={{ fontSize: '11.5px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                    {translateText(cond.notes || 'Normal clinical findings. Continued routine monitoring.')}
                  </p>
                </div>

                {/* Condition Specific Biomarkers (Clean Clinical Metrics) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#64748b',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px'
                }}>
                  {cond.metrics?.o2 && (
                    <span>{translateText('SpO2')}: <strong style={{ color: '#059669' }}>{cond.metrics.o2}</strong></span>
                  )}
                  {cond.metrics?.fev1 && (
                    <span>{translateText('FEV1')}: <strong style={{ color: '#0f172a' }}>{cond.metrics.fev1}</strong></span>
                  )}
                  {cond.metrics?.heartRate && (
                    <span>{translateText('Heart Rate')}: <strong style={{ color: '#0f172a' }}>{cond.metrics.heartRate}</strong></span>
                  )}
                  {cond.angleCurrent && (
                    <span>{translateText('ROM Range')}: <strong style={{ color: '#0284c7' }}>{cond.angleCurrent}°</strong></span>
                  )}
                  {cond.painLevel !== undefined && (
                    <span>{translateText('Pain Index')}: <strong style={{ color: cond.painLevel > 3 ? '#d97706' : '#059669' }}>{cond.painLevel}/10</strong></span>
                  )}
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {cond.lastUpdated ? translateText(cond.lastUpdated) : translateText('ABDM Synced')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB 2: Verified ABDM Digital Health Records */}
      {activeTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recordsList.map((rec: any, i: number) => (
            <div
              key={rec.id || i}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    {translateText(rec.title || rec.type || 'Diagnostic Clinical Report')}
                  </span>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0'
                }}>
                  {translateText('FHIR Verified')}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                {translateText(rec.facility || 'AIIMS Department')} • {rec.timestamp}
              </div>

              <div style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                background: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{translateText('Record ID')}: {rec.id || `REC-ABDM-${i + 1}`}</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>ABDM R4 Bundle</span>
              </div>
            </div>
          ))}

          <button
            onClick={onOpenExportModal}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px dashed #0284c7',
              background: '#f0f9ff',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px'
            }}
          >
            <Download size={14} />
            <span>{translateText('Download Complete ABDM History Bundle')}</span>
          </button>
        </div>
      )}

      {/* 5. TAB 3: Care Plan, Prescriptions & Next Doctor Review */}
      {activeTab === 'care' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Next Doctor Appointment */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Calendar size={16} color="#0284c7" />
              <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {translateText('Next Scheduled Review')}
              </h4>
            </div>

            <div style={{
              background: '#f0f9ff',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #bae6fd',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                {nextAppointment.doctor}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {translateText(nextAppointment.specialty || 'General Medicine')} • {translateText(nextAppointment.mode || 'Teleconsultation')}
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color="#0284c7" />
                <span>{nextAppointment.date}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onNavigateToChatTab) onNavigateToChatTab();
                else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'chat' } }));
                }
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Bot size={14} />
              <span>{translateText('Prepare Consultation Brief with AI')}</span>
            </button>
          </div>

          {/* Prescribed Medications & Jan Aushadhi Savings */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pill size={16} color="#059669" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {translateText('Active Care Plan & Prescriptions')}
                </h4>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#059669',
                background: '#ecfdf5',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid #a7f3d0'
              }}>
                {(carePlan as any)?.medicationPercent || 100}% {translateText('Adherent')}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#334155', fontWeight: 700, marginBottom: '6px' }}>
              • {(carePlan as any)?.medicationStatus || (carePlan as any)?.medication?.title || 'Multivitamin & Omega-3 Complete (1 tab after food)'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
              • {translateText('Dolo 650 mg (Paracetamol) - SOS for mild headache/fever after food')}
            </div>

            {/* Jan Aushadhi generic dispensary notice */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: '10px',
              padding: '9px 12px',
              border: '1px solid #bbf7d0',
              fontSize: '11px',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span>{translateText('Jan Aushadhi Generic alternatives available at 85% reduced cost.')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. In-Dashboard AI Swarm Assistance Link */}
      <div 
        onClick={() => {
          if (onNavigateToChatTab) onNavigateToChatTab();
          else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('synapseos-open-assistant', { detail: { mode: 'chat' } }));
          }
        }}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '14px 16px',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
          transition: 'transform 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800 }}>
              {translateText('Query Health Assistant')}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {translateText('ABDM Swarm & OTC Safety Check')}
            </div>
          </div>
        </div>

        <ChevronRight size={18} color="#94a3b8" />
      </div>
    </div>
  );
}
