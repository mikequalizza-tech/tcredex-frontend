'use client';

import React, { useState } from 'react';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  title: string;
  role: MemberRole;
  avatar?: string;
  lastActive: string;
  status: 'active' | 'pending' | 'inactive';
}

const DEMO_TEAM: TeamMember[] = [
  {
    id: 'user-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    title: 'Development Director',
    role: 'owner',
    lastActive: '2 minutes ago',
    status: 'active',
  },
  {
    id: 'user-002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    title: 'Project Manager',
    role: 'admin',
    lastActive: '1 hour ago',
    status: 'active',
  },
  {
    id: 'user-003',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    title: 'Financial Analyst',
    role: 'member',
    lastActive: '3 hours ago',
    status: 'active',
  },
  {
    id: 'user-004',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    title: 'Compliance Officer',
    role: 'member',
    lastActive: 'Yesterday',
    status: 'active',
  },
  {
    id: 'user-005',
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    title: 'Legal Counsel',
    role: 'viewer',
    lastActive: '2 days ago',
    status: 'active',
  },
  {
    id: 'user-006',
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@example.com',
    title: 'Accountant',
    role: 'member',
    lastActive: 'Pending',
    status: 'pending',
  },
];

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: 'bg-purple-900/50 text-purple-300',
  admin: 'bg-blue-900/50 text-blue-300',
  member: 'bg-green-900/50 text-green-300',
  viewer: 'bg-gray-700 text-gray-300',
};

const STATUS_COLORS = {
  active: 'bg-green-500',
  pending: 'bg-amber-500',
  inactive: 'bg-gray-500',
};

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(DEMO_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');

  const filteredMembers = members.filter((member) => {
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    if (searchQuery && 
        !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    admins: members.filter(m => m.role === 'admin' || m.role === 'owner').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Team</h1>
          <p className="text-gray-400 mt-1">Manage your organization&apos;s team members</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending Invites</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-purple-400">{stats.admins}</div>
          <div className="text-sm text-gray-500">Admins</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as MemberRole | 'all')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="divide-y divide-gray-800">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-medium text-gray-300 border border-gray-700">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${STATUS_COLORS[member.status]}`} />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">{member.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{member.email}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{member.title}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {member.status === 'pending' ? 'Invitation sent' : `Active ${member.lastActive}`}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.status === 'pending' && (
                      <button className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                        Resend
                      </button>
                    )}
                    <button className="text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-800 rounded transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-400">No team members found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="font-semibold text-gray-100 mb-4">Role Permissions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
            <div className="font-medium text-purple-300">Owner</div>
            <ul className="text-sm text-purple-400/80 mt-2 space-y-1">
              <li>• Full access</li>
              <li>• Billing management</li>
              <li>• Delete organization</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <div className="font-medium text-blue-300">Admin</div>
            <ul className="text-sm text-blue-400/80 mt-2 space-y-1">
              <li>• Manage team</li>
              <li>• All deal operations</li>
              <li>• View analytics</li>
            </ul>
          </div>
          <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
            <div className="font-medium text-green-300">Member</div>
            <ul className="text-sm text-green-400/80 mt-2 space-y-1">
              <li>• Create/edit deals</li>
              <li>• Upload documents</li>
              <li>• View pipeline</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="font-medium text-gray-300">Viewer</div>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• View deals</li>
              <li>• View documents</li>
              <li>• Read-only access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Invite Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Personal Message (Optional)</label>
                <textarea
                  placeholder="Add a personal note to your invitation..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
