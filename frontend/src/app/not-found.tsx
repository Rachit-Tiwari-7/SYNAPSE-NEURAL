import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Telemetry Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-mono tracking-wider uppercase text-amber-400 font-medium">
              Routing Disconnect (404)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
            HTTP_404_NOT_FOUND
          </span>
        </div>

        {/* 404 Large Display */}
        <div className="mb-6">
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-2 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
            404
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 mb-2">
            Clinical Route or Stream Not Found
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The requested sub-agent telemetry stream, patient record endpoint, or interface page does not exist or has been relocated to a secure cluster.
          </p>
        </div>

        {/* Suggested Clinical Hubs */}
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-4 mb-6 space-y-2.5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Available Command Endpoints
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              href="/"
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition border border-slate-700/40"
            >
              <span className="text-emerald-400 font-bold">→</span> Command Center
            </Link>
            <Link
              href="/projects/synapseos-assistant"
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition border border-slate-700/40"
            >
              <span className="text-teal-400 font-bold">→</span> AI Assistant
            </Link>
            <Link
              href="/orchestrator-agent"
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition border border-slate-700/40"
            >
              <span className="text-cyan-400 font-bold">→</span> Orchestrator Swarm
            </Link>
            <Link
              href="/projects/records"
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition border border-slate-700/40"
            >
              <span className="text-blue-400 font-bold">→</span> ABDM Records Vault
            </Link>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-semibold text-sm shadow-lg shadow-teal-950/40 transition-all duration-200 text-center cursor-pointer"
          >
            Return to Command Center
          </Link>
        </div>

        {/* Emergency Triage Notice */}
        <div className="mt-6 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
          <span>Emergency Services:</span>
          <span className="text-rose-400 font-semibold">108 / 112 (India)</span>
        </div>
      </div>
    </div>
  );
}
