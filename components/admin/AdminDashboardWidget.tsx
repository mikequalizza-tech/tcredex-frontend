'use client';

interface DashboardStats {
  totalUsers: number;
  activeDeals: number;
  pendingMatches: number;
  closedThisMonth: number;
  totalRevenue: number;
}

interface AdminDashboardWidgetProps {
  stats?: DashboardStats;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  activeDeals: 0,
  pendingMatches: 0,
  closedThisMonth: 0,
  totalRevenue: 0,
};

export default function AdminDashboardWidget({ stats = defaultStats }: AdminDashboardWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const widgets = [
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-sky-900/50 border-sky-600', textColor: 'text-sky-400' },
    { label: 'Active Deals', value: stats.activeDeals, color: 'bg-indigo-900/50 border-indigo-600', textColor: 'text-indigo-400' },
    { label: 'Pending Matches', value: stats.pendingMatches, color: 'bg-orange-900/50 border-orange-600', textColor: 'text-orange-400' },
    { label: 'Closed This Month', value: stats.closedThisMonth, color: 'bg-green-900/50 border-green-600', textColor: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <div 
            key={widget.label}
            className={`p-4 border rounded-xl shadow ${widget.color}`}
          >
            <h3 className="text-sm font-medium text-gray-400">{widget.label}</h3>
            <p className={`text-3xl font-bold mt-2 ${widget.textColor}`}>
              {widget.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue widget - full width */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-600 rounded-xl">
        <h3 className="text-sm font-medium text-gray-400">Total Platform Revenue</h3>
        <p className="text-4xl font-bold text-white mt-2">
          {formatCurrency(stats.totalRevenue)}
        </p>
      </div>
    </div>
  );
}
