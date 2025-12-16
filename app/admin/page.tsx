'use client';

export default function AdminDashboard() {
  // Sample stats
  const stats = [
    { label: 'Total Deals', value: '127', change: '+12%', positive: true },
    { label: 'Active Projects', value: '48', change: '+8%', positive: true },
    { label: 'Total Investment', value: '$847M', change: '+23%', positive: true },
    { label: 'Pending Reviews', value: '14', change: '-5%', positive: false },
  ];

  const recentActivity = [
    { id: 1, action: 'New deal submitted', deal: 'Eastside Grocery Co-Op', time: '2 hours ago' },
    { id: 2, action: 'CDE matched', deal: 'Northgate Health Center', time: '4 hours ago' },
    { id: 3, action: 'Memo requested', deal: 'Heritage Arts Center', time: '6 hours ago' },
    { id: 4, action: 'Deal approved', deal: 'Riverfront Manufacturing Hub', time: '1 day ago' },
    { id: 5, action: 'Investor committed', deal: 'Downtown Child Care Center', time: '1 day ago' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-400">Overview of your tCredex marketplace</p>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-100">{stat.value}</p>
                <span className={`text-sm font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-200">{activity.action}</p>
                      <p className="text-xs text-indigo-400">{activity.deal}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <a href="/admin/deals" className="block w-full px-4 py-3 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-500 transition-colors">
                Review Pending Deals
              </a>
              <a href="/deals/new" className="block w-full px-4 py-3 bg-gray-800 text-gray-200 text-center rounded-lg hover:bg-gray-700 transition-colors">
                Submit New Deal
              </a>
              <a href="/matching" className="block w-full px-4 py-3 bg-gray-800 text-gray-200 text-center rounded-lg hover:bg-gray-700 transition-colors">
                View CDE Matches
              </a>
              <a href="/admin/reports" className="block w-full px-4 py-3 bg-gray-800 text-gray-200 text-center rounded-lg hover:bg-gray-700 transition-colors">
                Generate Reports
              </a>
            </div>
          </div>
        </div>

        {/* Deal Pipeline */}
        <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-100">Deal Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4 text-center">
              {[
                { stage: 'Intake', count: 23, color: 'bg-gray-600' },
                { stage: 'Scoring', count: 18, color: 'bg-yellow-600' },
                { stage: 'Matching', count: 12, color: 'bg-blue-600' },
                { stage: 'Due Diligence', count: 8, color: 'bg-purple-600' },
                { stage: 'Closed', count: 66, color: 'bg-green-600' },
              ].map((stage) => (
                <div key={stage.stage}>
                  <div className={`${stage.color} rounded-lg py-4 mb-2`}>
                    <p className="text-2xl font-bold text-white">{stage.count}</p>
                  </div>
                  <p className="text-sm text-gray-400">{stage.stage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
