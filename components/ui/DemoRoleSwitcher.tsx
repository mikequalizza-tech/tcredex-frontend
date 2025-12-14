'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/lib/auth';

export default function DemoRoleSwitcher() {
  const { currentDemoRole, switchRole, userName, orgName } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { 
      id: 'sponsor' as const, 
      name: 'Sponsor', 
      color: 'bg-green-600', 
      textColor: 'text-green-400',
      description: 'Project submitter view',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    { 
      id: 'cde' as const, 
      name: 'CDE', 
      color: 'bg-purple-600', 
      textColor: 'text-purple-400',
      description: 'Allocatee admin view',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    { 
      id: 'investor' as const, 
      name: 'Investor', 
      color: 'bg-blue-600', 
      textColor: 'text-blue-400',
      description: 'Credit buyer view',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    { 
      id: 'admin' as const, 
      name: 'Admin', 
      color: 'bg-red-600', 
      textColor: 'text-red-400',
      description: 'Platform admin view',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const currentRole = roles.find(r => r.id === currentDemoRole)!;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full ${currentRole.color} text-white shadow-lg hover:opacity-90 transition-all`}
        >
          {currentRole.icon}
          <span className="text-sm font-medium">{currentRole.name}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Demo Mode</p>
              <p className="text-sm text-gray-300 font-medium">{userName}</p>
              <p className="text-xs text-gray-500">{orgName}</p>
            </div>
            
            <div className="p-2">
              <p className="px-2 py-1 text-xs text-gray-500 uppercase tracking-wider">Switch Role</p>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    switchRole(role.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    role.id === currentDemoRole
                      ? 'bg-gray-800 ' + role.textColor
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg ${role.color} flex items-center justify-center text-white`}>
                    {role.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                  {role.id === currentDemoRole && (
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-800 bg-gray-800/50">
              <p className="text-xs text-gray-500">
                This switcher is for demo purposes. In production, roles are assigned by organization type.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
