'use client';

import { useState } from 'react';

interface Investor {
  id: string;
  name: string;
  type: 'bank' | 'insurance' | 'corporate' | 'family-office' | 'fund';
  totalCapacity: number;
  deployed: number;
  available: number;
  activeDeals: number;
  targetReturn: string;
  preferredSectors: string[];
  preferredStates: string[];
  minDeal: number;
  maxDeal: number;
  status: 'active' | 'pending' | 'paused';
  contact: string;
  email: string;
}

const sampleInvestors: Investor[] = [
  {
    id: 'INV001',
    name: 'Midwest Regional Bank',
    type: 'bank',
    totalCapacity: 150000000,
    deployed: 95000000,
    available: 55000000,
    activeDeals: 22,
    targetReturn: 'CRA + 4-5%',
    preferredSectors: ['Healthcare', 'Community Facilities', 'Manufacturing'],
    preferredStates: ['IL', 'WI', 'IN', 'MI', 'OH'],
    minDeal: 5000000,
    maxDeal: 25000000,
    status: 'active',
    contact: 'Thomas Reynolds',
    email: 'treynolds@midwestbank.com',
  },
  {
    id: 'INV002',
    name: 'National Life Insurance Co',
    type: 'insurance',
    totalCapacity: 200000000,
    deployed: 142000000,
    available: 58000000,
    activeDeals: 31,
    targetReturn: '5-6% IRR',
    preferredSectors: ['Healthcare', 'Senior Housing', 'Mixed-Use'],
    preferredStates: ['Nationwide'],
    minDeal: 10000000,
    maxDeal: 50000000,
    status: 'active',
    contact: 'Linda Park',
    email: 'lpark@nationallife.com',
  },
  {
    id: 'INV003',
    name: 'GreenTech Industries',
    type: 'corporate',
    totalCapacity: 45000000,
    deployed: 32000000,
    available: 13000000,
    activeDeals: 8,
    targetReturn: 'ESG + Market',
    preferredSectors: ['Clean Energy', 'Manufacturing', 'Technology'],
    preferredStates: ['CA', 'TX', 'NY', 'WA'],
    minDeal: 3000000,
    maxDeal: 15000000,
    status: 'active',
    contact: 'Michael Torres',
    email: 'mtorres@greentech.com',
  },
  {
    id: 'INV004',
    name: 'Harrison Family Office',
    type: 'family-office',
    totalCapacity: 75000000,
    deployed: 41000000,
    available: 34000000,
    activeDeals: 12,
    targetReturn: '6-7% + Impact',
    preferredSectors: ['Education', 'Childcare', 'Healthcare'],
    preferredStates: ['Northeast'],
    minDeal: 2000000,
    maxDeal: 12000000,
    status: 'active',
    contact: 'Elizabeth Harrison',
    email: 'eharrison@harrisonfamily.com',
  },
  {
    id: 'INV005',
    name: 'Impact Capital Fund III',
    type: 'fund',
    totalCapacity: 300000000,
    deployed: 178000000,
    available: 122000000,
    activeDeals: 45,
    targetReturn: '7-9% Net IRR',
    preferredSectors: ['All Qualified'],
    preferredStates: ['Nationwide'],
    minDeal: 8000000,
    maxDeal: 40000000,
    status: 'active',
    contact: 'David Kim',
    email: 'dkim@impactcapital.com',
  },
];

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

const typeColors = {
  bank: 'bg-blue-500/20 text-blue-400',
  insurance: 'bg-purple-500/20 text-purple-400',
  corporate: 'bg-green-500/20 text-green-400',
  'family-office': 'bg-orange-500/20 text-orange-400',
  fund: 'bg-indigo-500/20 text-indigo-400',
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  paused: 'bg-orange-500/20 text-orange-400',
};

export default function AdminInvestorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  const filteredInvestors = sampleInvestors.filter((inv) => {
    const matchesSearch = !searchQuery || 
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCapacity = sampleInvestors.reduce((sum, inv) => sum + inv.totalCapacity, 0);
  const totalAvailable = sampleInvestors.reduce((sum, inv) => sum + inv.available, 0);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Investor Management</h1>
                <p className="text-sm text-gray-400">Manage tax credit investors and capital sources</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                + Add Investor
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-800">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Total Investors</p>
            <p className="text-2xl font-bold text-gray-100">{sampleInvestors.length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Total Capacity</p>
            <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalCapacity)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Available Capital</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAvailable)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Active Deals</p>
            <p className="text-2xl font-bold text-blue-400">{sampleInvestors.reduce((sum, inv) => sum + inv.activeDeals, 0)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {['all', 'bank', 'insurance', 'corporate', 'family-office', 'fund'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Investor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Available</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredInvestors.map((investor) => (
                <tr 
                  key={investor.id} 
                  className={`hover:bg-gray-900/50 cursor-pointer ${selectedInvestor?.id === investor.id ? 'bg-gray-900' : ''}`}
                  onClick={() => setSelectedInvestor(investor)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-100">{investor.name}</div>
                    <div className="text-xs text-gray-500">{investor.contact}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColors[investor.type]}`}>
                      {investor.type.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatCurrency(investor.totalCapacity)}</td>
                  <td className="px-6 py-4 text-sm text-green-400 font-medium">{formatCurrency(investor.available)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{investor.activeDeals}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{investor.targetReturn}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                      <button className="text-xs text-gray-400 hover:text-gray-300">Match</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Panel */}
      {selectedInvestor && (
        <div className="w-[380px] border-l border-gray-800 bg-gray-900 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-100">Investor Details</h2>
            <button 
              onClick={() => setSelectedInvestor(null)}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-100">{selectedInvestor.name}</h3>
            <p className="text-sm text-gray-400">{selectedInvestor.contact} • {selectedInvestor.email}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${typeColors[selectedInvestor.type]}`}>
              {selectedInvestor.type.replace('-', ' ').toUpperCase()}
            </span>
          </div>

          {/* Deployment Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Capital Deployed</span>
              <span className="text-gray-200">{Math.round((selectedInvestor.deployed / selectedInvestor.totalCapacity) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 rounded-full"
                style={{ width: `${(selectedInvestor.deployed / selectedInvestor.totalCapacity) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Deployed: {formatCurrency(selectedInvestor.deployed)}</span>
              <span className="text-green-400">Available: {formatCurrency(selectedInvestor.available)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Target Return</p>
              <p className="text-lg font-semibold text-indigo-400">{selectedInvestor.targetReturn}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Deal Size Range</p>
              <p className="text-sm text-gray-200">{formatCurrency(selectedInvestor.minDeal)} - {formatCurrency(selectedInvestor.maxDeal)}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Preferred Sectors</p>
              <div className="flex gap-1 flex-wrap">
                {selectedInvestor.preferredSectors.map(sector => (
                  <span key={sector} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Geographic Focus</p>
              <div className="flex gap-1 flex-wrap">
                {selectedInvestor.preferredStates.map(state => (
                  <span key={state} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                    {state}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Active Deals</p>
              <p className="text-2xl font-bold text-green-400">{selectedInvestor.activeDeals}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              Edit Profile
            </button>
            <button className="w-full px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
              Find Matching Deals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
