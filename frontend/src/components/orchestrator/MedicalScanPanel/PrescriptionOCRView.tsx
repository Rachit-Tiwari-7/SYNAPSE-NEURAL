'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Info, 
  User, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Stethoscope,
  ShieldCheck,
  Pill,
  Copy,
  Check,
  Send,
  Download,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { StructuredPrescription } from './useMedicalScan';

export default function PrescriptionOCRView({ state }: { state: any }) {
  const { translateText } = useLanguage();
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [showRawTextAccordion, setShowRawTextAccordion] = useState(true);

  const prescription: StructuredPrescription = state.structuredPrescription;

  if (!prescription && state.loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        minHeight: '450px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '4px solid #f1f5f9',
          borderTopColor: '#059669',
          animation: 'spin 0.9s linear infinite'
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', marginBottom: '8px' }}>
            {state.ocrStep === 'uploading' && translateText('Uploading prescription image...')}
            {state.ocrStep === 'preparing' && translateText('Preparing image & normalizing resolution...')}
            {state.ocrStep === 'reading' && translateText('Reading handwriting & text via OpenRouter Vision AI...')}
            {state.ocrStep === 'checking' && translateText('Deducing probable diagnosis & preventive measures...')}
            {(!state.ocrStep || state.ocrStep === 'idle') && translateText('Processing prescription with Vision AI...')}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {translateText('Handwriting OCR • Probable Diagnosis • Preventive Measures & Indian Generics')}
          </div>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        color: '#64748b',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>
          {translateText('No Prescription Selected')}
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
          {translateText('Upload a photo of any doctor prescription or select a clinical preset to view extracted details, diagnosis, and preventive measures.')}
        </p>
      </div>
    );
  }

  const copyTranscription = () => {
    if (prescription.raw_text) {
      navigator.clipboard.writeText(prescription.raw_text);
      setCopiedRawText(true);
      setTimeout(() => setCopiedRawText(false), 2000);
    }
  };

  const probDiag = prescription.probable_diagnosis;
  const preventiveList = prescription.preventive_measures || [];
  const rulesList = prescription.precautions_and_rules || [];
  const redFlags = prescription.red_flag_warnings || [];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%'
    }}>

      {/* 1. TOP HEADER & METADATA CARD */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#059669',
                background: '#ecfdf5',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                OpenRouter Multimodal Vision
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                {prescription.prescription_date || 'Date: Active'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {prescription.diagnosis || probDiag?.condition || translateText('Clinical Prescription Analysis')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={14} />
              {translateText('Vision OCR Extracted')} ({(prescription.overall_confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Doctor & Patient Metadata Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          background: '#f8fafc',
          border: '1px solid #f1f5f9',
          borderRadius: '14px',
          padding: '12px 16px'
        }}>
          {/* Patient Details */}
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              👤 {translateText('Patient')}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {prescription.patient.name || 'Not Explicitly Stated'} 
              {prescription.patient.age && <span style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}> ({prescription.patient.age} yrs{prescription.patient.gender ? `, ${prescription.patient.gender}` : ''})</span>}
            </div>
          </div>

          {/* Doctor Details */}
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              🩺 {translateText('Prescribing Physician')}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {prescription.doctor.name || 'Consultant Physician'}
              {prescription.doctor.specialization && <span style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}> • {prescription.doctor.specialization}</span>}
            </div>
          </div>

          {/* Registration / Facility */}
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              🏥 {translateText('Medical Facility / Reg')}
            </span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              {prescription.doctor.hospital || prescription.doctor.registration_number || 'Registered Medical Practitioner'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROBABLE DIAGNOSIS & CLINICAL RATIONALE CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '20px',
        padding: '22px 24px',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#059669',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {translateText('Clinical Vision Impression')}
            </span>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#065f46' }}>
              🩺 {translateText('Probable Diagnosis')}: {probDiag?.condition || prescription.diagnosis || 'Clinical Diagnosis Inferred'}
            </h3>
          </div>
        </div>

        <p style={{ margin: '8px 0 0 0', fontSize: '13.5px', color: '#166534', lineHeight: 1.6, fontWeight: 500 }}>
          {probDiag?.clinical_rationale || translateText('Clinical condition deduced from prescribed therapeutic drug classes, dosage strengths, and doctor consultation notes.')}
        </p>

        {probDiag?.confidence_level && (
          <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#047857', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
            <Sparkles size={13} />
            <span>{translateText('Diagnostic Confidence')}: {probDiag.confidence_level}</span>
          </div>
        )}
      </div>

      {/* 3. PREVENTIVE MEASURES & PATIENT CARE GUIDE CARD */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              🛡️ {translateText('Preventive Measures & Patient Care Guide')}
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {translateText('Actionable lifestyle, dietary, hydration, and recovery guidelines')}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {/* Lifestyle & Dietary Preventive Measures */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '14px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🥗 {translateText('Lifestyle & Dietary Guidelines')}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {preventiveList.length > 0 ? (
                preventiveList.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: '13px', color: '#0c4a6e' }}>
                  {translateText('Maintain balanced nutrition, adequate hydration, and appropriate rest during treatment.')}
                </li>
              )}
            </ul>
          </div>

          {/* Medication Administration Rules */}
          <div style={{
            background: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '14px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: '#a16207', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💊 {translateText('Medication Administration Rules')}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rulesList.length > 0 ? (
                rulesList.map((rule, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#713f12', lineHeight: 1.5 }}>
                    {rule}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: '13px', color: '#713f12' }}>
                  {translateText('Always take medications as scheduled. Never discontinue prescribed antibiotics prematurely.')}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Red Flag Warning Box */}
        {redFlags.length > 0 && (
          <div style={{
            marginTop: '16px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldAlert size={20} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#be123c', marginBottom: '4px' }}>
                🚨 {translateText('Red Flag Warnings — Seek Urgent Emergency Care / Call 108 If:')}
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {redFlags.map((flag, idx) => (
                  <li key={idx} style={{ fontSize: '12.5px', color: '#9f1239', lineHeight: 1.4 }}>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 4. MEDICATIONS SCHEDULE & JAN AUSHADHI GENERICS TABLE */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#8b5cf6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Pill size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                💊 {translateText('Prescribed Medications & Administration Timing')}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {prescription.medications.length} {translateText('medicines identified from prescription handwriting')}
              </span>
            </div>
          </div>

          {prescription.generic_savings_tip && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '4px 10px',
              borderRadius: '8px'
            }}>
              💡 {prescription.generic_savings_tip}
            </span>
          )}
        </div>

        {/* Medications Cards / Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {prescription.medications.map((med, idx) => (
            <div 
              key={idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'border-color 0.2s ease'
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {med.name || med.raw_name || 'Prescribed Medicine'}
                  </span>
                  {med.strength && (
                    <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      {med.strength}
                    </span>
                  )}
                  {med.dosage && (
                    <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      {med.dosage}
                    </span>
                  )}
                </div>

                {med.timing && (
                  <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <span>{med.timing}</span>
                  </div>
                )}

                {med.instructions && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    📝 {med.instructions}
                  </div>
                )}

                {med.generic_alternative && (
                  <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '6px', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    🏷️ {med.generic_alternative}
                  </div>
                )}
              </div>

              {/* Timing & Frequency Column */}
              <div style={{ textAlign: 'right', minWidth: '130px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {med.frequency || 'As Directed'}
                </div>
                {med.duration && (
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    🗓️ {med.duration}
                  </div>
                )}
                <div style={{ marginTop: '6px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: med.confidence >= 0.9 ? '#ecfdf5' : '#fef3c7',
                    color: med.confidence >= 0.9 ? '#059669' : '#d97706'
                  }}>
                    {(med.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. VERBATIM WRITTEN TRANSCRIPTION ACCORDION CARD */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div 
          onClick={() => setShowRawTextAccordion(!showRawTextAccordion)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                📝 {translateText('Verbatim Written Prescription Details (Raw OCR Text)')}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {translateText('Complete transcribed text of all visible doctor handwriting & print')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyTranscription();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: copiedRawText ? '#ecfdf5' : '#f1f5f9',
                border: '1px solid ' + (copiedRawText ? '#a7f3d0' : '#e2e8f0'),
                color: copiedRawText ? '#059669' : '#475569',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {copiedRawText ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedRawText ? translateText('Copied!') : translateText('Copy Written Text')}</span>
            </button>

            {showRawTextAccordion ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
          </div>
        </div>

        {showRawTextAccordion && (
          <div style={{ marginTop: '16px' }}>
            <pre style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
              margin: 0,
              maxHeight: '350px',
              overflowY: 'auto',
              border: '1px solid #1e293b'
            }}>
              {prescription.raw_text || translateText('No raw text captured.')}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}
