'use client';

import { useCurrentUser } from '@/lib/auth';
import { SponsorDashboard, CDEDashboard, InvestorDashboard } from '@/components/dashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { orgType, userName, orgName, currentDemoRole } = useCurrentUser();
  
  // Determine which dashboard to show based on role
  const isAdmin = currentDemoRole === 'admin';
  
  // Admin sees CDE dashboard as default
  if (isAdmin) {
    return (
      <div className="p-6 bg-gray-950 min-h-screen">
        <CDEDashboard userName={userName} orgName={orgName || 'Admin'} />
      </div>
    );
  }

  // Role-based dashboard selection
  switch (orgType) {
    case 'sponsor':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          <SponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} />
        </div>
      );
    case 'cde':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          <CDEDashboard userName={userName} orgName={orgName || 'Demo CDE'} />
        </div>
      );
    case 'investor':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          <InvestorDashboard userName={userName} orgName={orgName || 'Demo Investor'} />
        </div>
      );
    default:
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          <SponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} />
        </div>
      );
  }
}
