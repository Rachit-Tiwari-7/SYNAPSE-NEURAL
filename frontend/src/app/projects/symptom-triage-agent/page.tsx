import { redirect } from 'next/navigation';

export default function RedirectSymptomTriage() {
  redirect('/orchestrator-agent?tab=swarm');
}
