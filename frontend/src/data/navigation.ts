import { NavItem } from '@/types';

export const mainNavItems: NavItem[] = [
  { label: 'Orchestrator OS', href: '/orchestrator-agent' },
  { label: 'Swarm Triage', href: '/orchestrator-agent?tab=swarm' },
  { label: 'Food & Nutrition AI', href: '/orchestrator-agent?tab=nutrition' },
  { label: 'Rural & 2G SMS Hub', href: '/orchestrator-agent?tab=rural' },
  { label: 'WhatsApp Copilot', href: '/orchestrator-agent?tab=whatsapp' },
];

export const projectNavItems: NavItem[] = [
  { label: '⚡ Synapse-OS Orchestrator', href: '/orchestrator-agent', badge: 'Active' },
  { label: '🩺 Multi-Agent Swarm Triage', href: '/orchestrator-agent?tab=swarm', badge: 'Active' },
  { label: '🥗 Clinical Nutrition & Indian Diet', href: '/orchestrator-agent?tab=nutrition', badge: 'Live' },
  { label: '💬 Official WhatsApp Copilot', href: '/orchestrator-agent?tab=whatsapp', badge: 'Active' },
  { label: '📡 Rural Health & 2G SMS Gateway', href: '/orchestrator-agent?tab=rural', badge: 'Active' },
  { label: '🔐 Verified ABDM / ABHA Records', href: '/orchestrator-agent?tab=records', badge: 'Active' },
  { label: '🛡️ Multi-Device Security & 2FA', href: '/orchestrator-agent?tab=security', badge: 'Active' },
];

export const legalNavItems: NavItem[] = [];
