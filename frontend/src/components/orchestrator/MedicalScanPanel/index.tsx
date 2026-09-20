'use client';

import React from 'react';
import { Upload, FileText, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Eye } from 'lucide-react';
import { useMedicalScan } from './useMedicalScan';
import PrescriptionOCRView from './PrescriptionOCRView';
import { useLanguage } from '@/context/LanguageContext';

export default function MedicalScanPanel() {
  const scanState = useMedicalScan();
  const { t, translateText } = useLanguage();

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '22px',
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '9999px', 
              background: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              color: '#059669', 
              fontSize: '11px', 
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={12} />
              {t('scan_status_ready', 'OpenRouter Vision Active')}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Multimodal Medical OCR & Clinical Intelligence
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {t('scan_title', '📄 Prescription OCR & Clinical Vision Intelligence')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            {t('scan_subtitle', 'Upload doctor prescription photos to extract verbatim written text, probable clinical diagnosis, and tailored preventive measures.')}
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={scanState.fileInputRef}
            onChange={scanState.handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => scanState.fileInputRef.current?.click()}
            disabled={scanState.loading}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              cursor: scanState.loading ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Upload size={16} />
            <span>{scanState.loading ? translateText('Processing OCR...') : translateText('Upload Prescription Photo')}</span>
          </button>
        </div>
      </div>

      {/* 2. Sample Prescriptions Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ {translateText('Or Try Sample Prescriptions')}:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {scanState.samples.map(sample => {
            const isSelected = scanState.selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => scanState.selectSample(sample.id)}
                disabled={scanState.loading}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: '1px solid ' + (isSelected ? '#0f172a' : '#e2e8f0'),
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{sample.icon}</span>
                <span>{sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {scanState.ocrError && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          color: '#b45309',
          padding: '14px 18px',
          borderRadius: '14px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} color="#d97706" />
          <span>{scanState.ocrError}</span>
        </div>
      )}

      {/* 3. Main 2-Column Responsive Workspace */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(320px, 450px) 1fr', 
        gap: '22px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Uploaded Prescription Image & Document Preview */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          position: 'sticky',
          top: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {translateText('Prescription Document')}
              </h3>
            </div>
            {scanState.uploadedFileName && (
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {scanState.uploadedFileName}
              </span>
            )}
          </div>

          {/* Image Display */}
          <div style={{
            width: '100%',
            height: '420px',
            background: '#0f172a',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #1e293b',
            position: 'relative'
          }}>
            {scanState.uploadedImagePreview ? (
              <img
                src={scanState.uploadedImagePreview}
                alt="Prescription Document"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                  {translateText('No prescription image loaded')}
                </p>
              </div>
            )}
          </div>

          {/* Quick Info Footer */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#475569',
            lineHeight: 1.5
          }}>
            💡 <strong>{translateText('How it works')}:</strong> {translateText('OpenRouter Vision reads handwritten and printed doctor prescriptions to extract written details, estimate the probable diagnosis, and provide preventive measures.')}
          </div>
        </div>

        {/* RIGHT COLUMN: Extracted Details, Probable Diagnosis, Preventive Measures */}
        <div>
          <PrescriptionOCRView state={scanState} />
        </div>

      </div>
    </div>
  );
}
