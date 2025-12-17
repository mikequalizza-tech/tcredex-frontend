'use client';

import { useRouter } from 'next/navigation';
import { IntakeShell, IntakeData } from '@/components/intake-v4';

export default function IntakePage() {
  const router = useRouter();

  const handleSave = async (_data: IntakeData, _readinessScore: number) => {
    // TODO: integrate save endpoint; currently no-op in demo
    alert('Draft saving is not available in demo mode yet.');
  };

  const handleSubmit = async (_data: IntakeData, _readinessScore: number) => {
    // TODO: integrate submit endpoint; currently redirects only
    alert('Submission is demo-only right now. Redirecting to the marketplace.');
    router.push('/deals');
  };

  return (
    <IntakeShell
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}
