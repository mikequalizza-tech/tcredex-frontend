'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CDE {
  id: string;
  name: string;
  allocation: number;
  deployed: number;
  available: number;
  activeDeals: number;
  states: string[];
  sectors: string[];
  minDeal: number;
  maxDeal: number;
  status: 'active' | 'pending' | 'paused';
  contact: string;
  email: string;
}

const sampleCDEs: CDE[] = [
  { id: 'CDE001', name: 'Clearwater Community Development', allocation: 75000000, deployed: 52000000, available: 23000000, activeDeals: 12, states: ['IL', 'IN', 'OH', 'MI'], sectors: ['Healthcare', 'Manufacturing', 'Retail'], minDeal: 2000000, maxDeal: 15000000, status: 'active', contact: 'Sarah Johnson', email: 'sjohnson@clearwatercde.com' },
  { id: 'CDE002', name: 'Midwest Community Finance', allocation: 120000000, deployed: 89000000, available: 31000000, activeDeals: 18, states: ['MO', 'KS', 'NE', 'IA'], sectors: ['Community Facilities', 'Mixed-Use', 'Industrial'], minDeal: 3000000, maxDeal: 20000000, status: 'active', contact: 'James Wilson', email: 'jwilson@midwestcf.org' },
  { id: 'CDE003', name: 'Southern Impact Partners', allocation: 50000000, deployed: 48000000, available: 2000000, activeDeals: 8, states: ['TN', 'AL', 'MS', 'GA'], sectors: ['Healthcare', 'Education', 'Childcare'], minDeal: 1500000, maxDeal: 10000000, status: 'paused', contact: 'Maria Garcia', email: 'mgarcia@southernimpact.com' },
  { id: 'CDE004', name: 'Great Lakes Economic Corp', allocation: 95000000, deployed: 61000000, available: 34000000, activeDeals: 15, states: ['OH', 'PA', 'NY', 'MI'], sectors: ['Manufacturing', 'Technology', 'Retail'], minDeal: 5000000, maxDeal: 25000000, status: 'active', contact: 'Robert Chen', email: 'rchen@greatlakesecon.org' },
];

const formatCurrency = (amount: number) => amount >= 1000000 ? `$${(amount / 1000000).toFixed(1)}M` : `$${(amount / 1000).toFixed(0)}K`;

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  paused: 'bg-orange-500/20 text-orange-400',
};

export default function AdminCDEsPage() {
  const [cdes, setCDEs] = useState<CDE[]>(sampleCDEs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCDE, setSelectedCDE] = useState<CDE | null>(null);
  const [editingCDE, setEditingCDE] = useState<CDE | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredCDEs = cdes.filter((cde) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return cde.name.toLowerCase().includes(query) || cde.states.some(s => s.toLowerCase().includes(query)) || cde.sectors.some(s => s.toLowerCase().includes(query));
  });

  const totalAllocation = cdes.reduce((sum, cde) => sum + cde.allocation, 0);
  const totalAvailable = cdes.reduce((sum, cde) => sum + cde.available, 0);

  const handleEditCDE = (cde: CDE, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCDE({ ...cde });
    setShowEditModal(true);
  };

  const handleSaveCDE = () => {
    if (!editingCDE) return;
    setCDEs(cdes.map(c => c.id === editingCDE.id ? editingCDE : c));
    if (selectedCDE?.id === editingCDE.id) setSelectedCDE(editingCDE);
    setShowEditModal(false);
    setEditingCDE(null);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">CDE Management</h1>
              <p className="text-sm text-gray-400">Manage Community Development Entities</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">+ Add CDE</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total CDEs</p>
          <p className="text-2xl font-bold text-gray-100">{cdes.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Allocation</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalAllocation)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Available Capital</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAvailable)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Active Deals</p>
          <p className="text-2xl font-bold text-blue-400">{cdes.reduce((sum, cde) => sum + cde.activeDeals, 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
        <input type="text" placeholder="Search CDEs by name, state, or sector..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-lg px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex">
        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">CDE Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Allocation</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Available</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">States</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCDEs.map((cde) => (
                <tr key={cde.id} className={`hover:bg-gray-900/50 cursor-pointer ${selectedCDE?.id === cde.id ? 'bg-gray-900' : ''}`}
                  onClick={() => setSelectedCDE(cde)}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-100">{cde.name}</div>
                    <div className="text-xs text-gray-500">{cde.contact}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatCurrency(cde.allocation)}</td>
                  <td className="px-6 py-4 text-sm text-green-400 font-medium">{formatCurrency(cde.available)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {cde.states.slice(0, 3).map(state => (
                        <span key={state} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">{state}</span>
                      ))}
                      {cde.states.length > 3 && <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">+{cde.states.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{cde.activeDeals}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[cde.status]}`}>
                      {cde.status.charAt(0).toUpperCase() + cde.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={(e) => handleEditCDE(cde, e)} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedCDE(cde); }} className="text-xs text-gray-400 hover:text-gray-300">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview Panel */}
        {selectedCDE && (
          <div className="w-80 border-l border-gray-800 bg-gray-900 p-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-100">CDE Details</h2>
              <button onClick={() => setSelectedCDE(null)} className="text-gray-400 hover:text-gray-200 text-lg">×</button>
            </div>

            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-100">{selectedCDE.name}</h3>
              <p className="text-xs text-gray-400">{selectedCDE.contact} • {selectedCDE.email}</p>
            </div>

            {/* Allocation Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Deployment Progress</span>
                <span className="text-gray-200">{Math.round((selectedCDE.deployed / selectedCDE.allocation) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(selectedCDE.deployed / selectedCDE.allocation) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Deployed: {formatCurrency(selectedCDE.deployed)}</span>
                <span className="text-green-400">Available: {formatCurrency(selectedCDE.available)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">Deal Size Range</p>
                <p className="text-sm text-gray-200">{formatCurrency(selectedCDE.minDeal)} - {formatCurrency(selectedCDE.maxDeal)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">Service Area</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedCDE.states.map(state => <span key={state} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">{state}</span>)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">Target Sectors</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedCDE.sectors.map(sector => <span key={sector} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">{sector}</span>)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">Active Deals</p>
                <p className="text-xl font-bold text-indigo-400">{selectedCDE.activeDeals}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button onClick={() => handleEditCDE(selectedCDE)} className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
                Edit CDE Profile
              </button>
              <Link href={`/admin/deals?cde=${selectedCDE.id}`} className="block w-full px-4 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors text-center">
                View All Deals
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCDE && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-100">Edit CDE</h2>
              <button onClick={() => { setShowEditModal(false); setEditingCDE(null); }} className="text-gray-400 hover:text-gray-200 text-xl">×</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">CDE Name</label>
                <input type="text" value={editingCDE.name} onChange={(e) => setEditingCDE({ ...editingCDE, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Contact Name</label>
                  <input type="text" value={editingCDE.contact} onChange={(e) => setEditingCDE({ ...editingCDE, contact: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={editingCDE.email} onChange={(e) => setEditingCDE({ ...editingCDE, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Total Allocation ($)</label>
                  <input type="number" value={editingCDE.allocation} onChange={(e) => setEditingCDE({ ...editingCDE, allocation: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Available ($)</label>
                  <input type="number" value={editingCDE.available} onChange={(e) => setEditingCDE({ ...editingCDE, available: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Deal Size ($)</label>
                  <input type="number" value={editingCDE.minDeal} onChange={(e) => setEditingCDE({ ...editingCDE, minDeal: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Deal Size ($)</label>
                  <input type="number" value={editingCDE.maxDeal} onChange={(e) => setEditingCDE({ ...editingCDE, maxDeal: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={editingCDE.status} onChange={(e) => setEditingCDE({ ...editingCDE, status: e.target.value as CDE['status'] })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowEditModal(false); setEditingCDE(null); }}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleSaveCDE}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
