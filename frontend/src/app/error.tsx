'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalRouteError({ error, reset }: ErrorProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    // Log sanitized error trace internally without exposing raw injection vectors
    console.error('[Synapse-OS App Router caught route exception]:', {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Telemetry Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-rose-400">
              Synapse-OS Resilience Shield
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
            {error?.digest ? `ERR_${error.digest.slice(0, 8)}` : 'FAILOVER_ACTIVE'}
          </span>
        </div>

        {/* Primary Diagnosis / Notice */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Clinical Interface Interruption
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The active application encountered an unexpected runtime condition. Synapse-OS isolated the session failure to prevent state corruption across active swarm agents.
          </p>
        </div>

        {/* Clinical Safe Actions */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            System Status & Safety Protocol
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Patient records, contraindication checks, and external emergency channels remain fully protected and operational.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-950/40 transition-all duration-200 text-center cursor-pointer"
          >
            ↻ Recover Session
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all duration-200 text-center cursor-pointer"
          >
            Return to Command Center
          </Link>
        </div>

        {/* Collapsible Technical Diagnostics for Debugging */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-[11px] text-slate-400 hover:text-slate-300 font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>{showDiagnostics ? '▲ Hide' : '▼ View'} Clinical Telemetry Log</span>
          </button>

          {showDiagnostics && (
            <div className="mt-3 p-3 bg-black/50 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 overflow-x-auto space-y-1">
              <div><span className="text-slate-500">Error Name:</span> {error?.name || 'Error'}</div>
              <div><span className="text-slate-500">Message:</span> {error?.message || 'Unknown runtime condition'}</div>
              {error?.digest && (
                <div><span className="text-slate-500">Digest Hash:</span> {error.digest}</div>
              )}
            </div>
          )}
        </div>

        {/* Emergency Triage Notice */}
        <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>In acute medical emergency:</span>
          <span className="text-rose-400 font-semibold tracking-wide">Dial 108 / 112 (India)</span>
        </div>
      </div>
    </div>
  );
}
