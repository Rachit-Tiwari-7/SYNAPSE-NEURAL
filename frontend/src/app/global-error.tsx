'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalFatalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Synapse-OS Fatal Root Layout Exception]:', {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>System Failover | Synapse-OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '90%',
            margin: '20px auto',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #1e293b',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 10px #ef4444',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#f87171',
                fontWeight: 600,
              }}
            >
              Synapse-OS Root Level Defense Shield
            </span>
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              color: '#ffffff',
            }}
          >
            Clinical Telemetry Protected
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}
          >
            A core shell anomaly was intercepted and neutralized before it could compromise clinical data or state machine buffers.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '12px 20px',
                backgroundColor: '#10b981',
                color: '#020617',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ↻ Re-initialize Kernel
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '12px 20px',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '10px',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Command Center
            </button>
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <span>Emergency Services:</span>
            <span style={{ color: '#f87171', fontWeight: 600 }}>108 / 112 (India)</span>
          </div>
        </div>
      </body>
    </html>
  );
}
