'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'sponsor' | 'cde' | 'investor' | 'admin';
  logo_url?: string;
  website?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  verified: boolean;
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'ORG_ADMIN' | 'PROJECT_ADMIN' | 'MEMBER' | 'VIEWER';
  title?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export default function OrganizationPage() {
  const { user, isLoading, orgType } = useCurrentUser();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'PROJECT_ADMIN' | 'VIEWER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  // Redirect if not authenticated or not ORG_ADMIN
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [isLoading, user, router]);

  // Fetch organization and team data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        setError(null);

        // Fetch organization
        const orgResponse = await fetch('/api/organizations', {
<<<<<<< HEAD
          credentials: 'include',
=======
>>>>>>> origin/main
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
        });

        if (!orgResponse.ok) {
          throw new Error('Failed to fetch organization');
        }

        const orgData = await orgResponse.json();
        setOrganization(orgData.organization);

        // Fetch team members
        const teamResponse = await fetch('/api/team', {
<<<<<<< HEAD
          credentials: 'include',
=======
>>>>>>> origin/main
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
        });

        if (!teamResponse.ok) {
          throw new Error('Failed to fetch team members');
        }

        const teamData = await teamResponse.json();
        setTeamMembers(teamData.members);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !user) return;

    try {
      setIsInviting(true);
      const response = await fetch('/api/team', {
        method: 'POST',
<<<<<<< HEAD
        credentials: 'include',
=======
>>>>>>> origin/main
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteEmail.split('@')[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invite team member');
      }

      // Refresh team members
      const teamResponse = await fetch('/api/team', {
<<<<<<< HEAD
        credentials: 'include',
=======
>>>>>>> origin/main
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData.members);
      }

      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite team member');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-gray-600">Manage your organization and team members</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Organization Info */}
        {organization && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Organization Information</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                  <p className="mt-1 text-gray-900">{organization.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Type</label>
                  <p className="mt-1 text-gray-900 capitalize">{organization.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <p className="mt-1 text-gray-900">{organization.slug}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      organization.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {organization.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="px-6 py-4">
            {teamMembers.length === 0 ? (
              <p className="text-gray-600">No team members yet. Invite someone to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            member.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Invite Team Member */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
          </div>
          <div className="px-6 py-4">
            <form onSubmit={handleInviteTeamMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="team@example.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="PROJECT_ADMIN">Project Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
