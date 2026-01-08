'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';
import { SponsorDashboard, CDEDashboard, InvestorDashboard } from '@/components/dashboard';
import NewSponsorDashboard from '@/components/dashboard/NewSponsorDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WelcomeModal from '@/components/WelcomeModal';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { orgType, userName, orgName, organizationId, currentDemoRole, user } = useCurrentUser();
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Check for first login on mount - using new auth system
  useEffect(() => {
    // Clean up any old localStorage auth data that might cause conflicts
    try {
      localStorage.removeItem('tcredex_session');
      localStorage.removeItem('tcredex_demo_role');
      localStorage.removeItem('tcredex_registered_user');
    } catch {
      // Ignore cleanup errors
    }
    
    // Show welcome for new users (could be enhanced with server-side flag)
    if (user && !showWelcome) {
      // For now, don't auto-show welcome to avoid confusion
      // setShowWelcome(true);
    }
  }, [user, showWelcome]);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
  };
  
  // Determine which dashboard to show based on role
  const isAdmin = currentDemoRole === 'admin';
  
  // Admin sees CDE dashboard as default
  if (isAdmin) {
    return (
      <div className="p-6 bg-gray-950 min-h-screen">
        {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
        <CDEDashboard userName={userName} orgName={orgName || 'Admin'} />
      </div>
    );
  }

  // Role-based dashboard selection
  switch (orgType) {
    case 'sponsor':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <NewSponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} organizationId={organizationId} />
        </div>
      );
    case 'cde':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <CDEDashboard userName={userName} orgName={orgName || 'Demo CDE'} />
        </div>
      );
    case 'investor':
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <InvestorDashboard userName={userName} orgName={orgName || 'Demo Investor'} />
        </div>
      );
    default:
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <NewSponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} organizationId={organizationId} />
        </div>
      );
  }
}
