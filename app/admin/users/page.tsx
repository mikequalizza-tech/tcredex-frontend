'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cde' | 'investor' | 'sponsor';
  status: 'active' | 'pending' | 'suspended';
  organization: string;
  lastActive: string;
  dealsCount: number;
}

const sampleUsers: User[] = [
  {
    id: 'U001',
    name: 'Mike Qualizza',
    email: 'mike@tcredex.com',
    role: 'admin',
    status: 'active',
    organization: 'tCredex',
    lastActive: '2024-01-15',
    dealsCount: 24,
  },
  {
    id: 'U002',
    name: 'Sarah Johnson',
    email: 'sarah@clearwatercde.com',
    role: 'cde',
    status: 'active',
    organization: 'Clearwater CDE',
    lastActive: '2024-01-14',
    dealsCount: 18,
  },
  {
    id: 'U003',
    name: 'Robert Chen',
    email: 'rchen@capitalpartners.com',
    role: 'investor',
    status: 'active',
    organization: 'Capital Partners LLC',
    lastActive: '2024-01-13',
    dealsCount: 12,
  },
  {
    id: 'U004',
    name: 'Maria Garcia',
    email: 'mgarcia@communityfirst.org',
    role: 'sponsor',
    status: 'pending',
    organization: 'Community First Development',
    lastActive: '2024-01-10',
    dealsCount: 3,
  },
  {
    id: 'U005',
    name: 'James Wilson',
    email: 'jwilson@midwestcde.com',
    role: 'cde',
    status: 'active',
    organization: 'Midwest Community CDE',
    lastActive: '2024-01-15',
    dealsCount: 31,
  },
];

const roleColors = {
  admin: 'bg-purple-500/20 text-purple-400',
  cde: 'bg-blue-500/20 text-blue-400',
  investor: 'bg-green-500/20 text-green-400',
  sponsor: 'bg-orange-500/20 text-orange-400',
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-red-500/20 text-red-400',
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = sampleUsers.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">User Management</h1>
                <p className="text-sm text-gray-400">Manage platform users and permissions</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                + Invite User
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-800">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-gray-100">{sampleUsers.length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-400">{sampleUsers.filter(u => u.status === 'active').length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{sampleUsers.filter(u => u.status === 'pending').length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">CDEs</p>
            <p className="text-2xl font-bold text-blue-400">{sampleUsers.filter(u => u.role === 'cde').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {['all', 'admin', 'cde', 'investor', 'sponsor'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Organization</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-gray-900/50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-gray-900' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-100">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.organization}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[user.status]}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.dealsCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                      <button className="text-xs text-gray-400 hover:text-gray-300">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Panel */}
      {selectedUser && (
        <div className="w-[350px] border-l border-gray-800 bg-gray-900 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-100">User Details</h2>
            <button 
              onClick={() => setSelectedUser(null)}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{selectedUser.name}</h3>
            <p className="text-sm text-gray-400">{selectedUser.email}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Organization</p>
              <p className="text-sm text-gray-200">{selectedUser.organization}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Role</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[selectedUser.role]}`}>
                {selectedUser.role.toUpperCase()}
              </span>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Total Deals</p>
              <p className="text-2xl font-bold text-indigo-400">{selectedUser.dealsCount}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Last Active</p>
              <p className="text-sm text-gray-200">{selectedUser.lastActive}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              Edit User
            </button>
            <button className="w-full px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
              View Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
