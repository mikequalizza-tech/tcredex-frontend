'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';
import { SponsorDashboard, CDEDashboard, InvestorDashboard } from '@/components/dashboard';
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
  const { orgType, userName, orgName, currentDemoRole } = useCurrentUser();
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Check for first login on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem('tcredex_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.showWelcomeModal) {
          setShowWelcome(true);
          // Clear the flag
          parsed.showWelcomeModal = false;
          localStorage.setItem('tcredex_session', JSON.stringify(parsed));
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

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
          <SponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} />
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
          <SponsorDashboard userName={userName} orgName={orgName || 'Demo Organization'} />
        </div>
      );
  }
}
