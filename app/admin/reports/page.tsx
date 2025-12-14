'use client';

import { useState } from 'react';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'deals' | 'cdes' | 'investors' | 'compliance' | 'financial';
  lastRun: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  format: 'pdf' | 'xlsx' | 'csv';
}

const availableReports: Report[] = [
  {
    id: 'R001',
    name: 'Deal Pipeline Summary',
    description: 'Overview of all deals by status, stage, and value',
    category: 'deals',
    lastRun: '2024-01-15',
    frequency: 'daily',
    format: 'pdf',
  },
  {
    id: 'R002',
    name: 'CDE Allocation Status',
    description: 'Current allocation and deployment by CDE',
    category: 'cdes',
    lastRun: '2024-01-14',
    frequency: 'weekly',
    format: 'xlsx',
  },
  {
    id: 'R003',
    name: 'Investor Capital Deployment',
    description: 'Investor capital flow and deployment metrics',
    category: 'investors',
    lastRun: '2024-01-13',
    frequency: 'weekly',
    format: 'xlsx',
  },
  {
    id: 'R004',
    name: 'NMTC Compliance Tracker',
    description: 'Track compliance requirements and deadlines',
    category: 'compliance',
    lastRun: '2024-01-12',
    frequency: 'monthly',
    format: 'pdf',
  },
  {
    id: 'R005',
    name: 'Fee Revenue Report',
    description: 'Platform fee revenue and projections',
    category: 'financial',
    lastRun: '2024-01-15',
    frequency: 'monthly',
    format: 'xlsx',
  },
  {
    id: 'R006',
    name: 'Geographic Distribution',
    description: 'Deal distribution by state and census tract',
    category: 'deals',
    lastRun: '2024-01-10',
    frequency: 'on-demand',
    format: 'pdf',
  },
  {
    id: 'R007',
    name: 'Match Success Rate',
    description: 'AutoMatch performance and conversion metrics',
    category: 'deals',
    lastRun: '2024-01-14',
    frequency: 'weekly',
    format: 'csv',
  },
  {
    id: 'R008',
    name: 'QEI Deadline Calendar',
    description: 'Upcoming QEI deadlines and requirements',
    category: 'compliance',
    lastRun: '2024-01-15',
    frequency: 'daily',
    format: 'pdf',
  },
];

const categoryColors = {
  deals: 'bg-blue-500/20 text-blue-400',
  cdes: 'bg-purple-500/20 text-purple-400',
  investors: 'bg-green-500/20 text-green-400',
  compliance: 'bg-orange-500/20 text-orange-400',
  financial: 'bg-indigo-500/20 text-indigo-400',
};

const formatIcons = {
  pdf: '📄',
  xlsx: '📊',
  csv: '📋',
};

export default function AdminReportsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredReports = availableReports.filter((report) => {
    return categoryFilter === 'all' || report.category === categoryFilter;
  });

  const handleGenerateReport = async (report: Report) => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    alert(`Report "${report.name}" generated successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Reports</h1>
              <p className="text-sm text-gray-400">Generate and download platform reports</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              + Create Custom Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-4 grid grid-cols-5 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Reports</p>
          <p className="text-2xl font-bold text-gray-100">{availableReports.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Deal Reports</p>
          <p className="text-2xl font-bold text-blue-400">{availableReports.filter(r => r.category === 'deals').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">CDE Reports</p>
          <p className="text-2xl font-bold text-purple-400">{availableReports.filter(r => r.category === 'cdes').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Compliance</p>
          <p className="text-2xl font-bold text-orange-400">{availableReports.filter(r => r.category === 'compliance').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Financial</p>
          <p className="text-2xl font-bold text-green-400">{availableReports.filter(r => r.category === 'financial').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
        <span className="text-sm text-gray-400">Filter by category:</span>
        <div className="flex gap-2">
          {['all', 'deals', 'cdes', 'investors', 'compliance', 'financial'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`bg-gray-900 border rounded-lg p-5 cursor-pointer transition-all hover:border-indigo-500 ${
                selectedReport?.id === report.id ? 'border-indigo-500' : 'border-gray-800'
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{formatIcons[report.format]}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[report.category]}`}>
                    {report.category.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500 uppercase">{report.format}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-100 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{report.description}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Last run: {report.lastRun}
                </span>
                <span className="text-gray-500 capitalize">
                  {report.frequency}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateReport(report);
                  }}
                  disabled={isGenerating}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Report Activity</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Report</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Generated By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Format</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">Deal Pipeline Summary</td>
                <td className="px-4 py-3 text-sm text-gray-400">Mike Qualizza</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 15, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">PDF</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">CDE Allocation Status</td>
                <td className="px-4 py-3 text-sm text-gray-400">System (Auto)</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 14, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">XLSX</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">Match Success Rate</td>
                <td className="px-4 py-3 text-sm text-gray-400">System (Auto)</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 14, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">CSV</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
