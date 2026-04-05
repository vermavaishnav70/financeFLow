import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend,
} from 'recharts';
import { DashboardSkeleton } from '../components/LoadingState';

const PIE_COLORS = ['#1f7a5a', '#d97745', '#0e7490', '#c65445', '#6f8f3d', '#9f5f80', '#d4a017', '#3c6e71'];

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

function TrendBadge({ value }) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return <span className="trend-badge neutral">No comparison yet</span>;
  }

  const numericValue = Number(value);

  const toneClass = numericValue > 0 ? 'positive' : numericValue < 0 ? 'negative' : 'neutral';
  const symbol = numericValue > 0 ? '↑' : numericValue < 0 ? '↓' : '•';

  return (
    <span className={`trend-badge ${toneClass}`}>
      {symbol} {Math.abs(numericValue).toFixed(1)}%
    </span>
  );
}

function MetricCard({ label, value, trend, tone }) {
  return (
    <div className="card metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-meta">
        <span className="metric-value" style={{ color: tone }}>{formatCurrency(value)}</span>
        <TrendBadge value={trend} />
      </div>
    </div>
  );
}

function InsightCard({ label, value, detail }) {
  return (
    <div className="card metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={{ fontSize: '1.55rem' }}>{value}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{detail}</span>
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [ovRes, insightsRes, trendsRes, compRes, catRes, recRes] = await Promise.all([
          fetch(`${ENV.API_BASE_URL}/dashboard/overview`, { headers }),
          fetch(`${ENV.API_BASE_URL}/dashboard/insights`, { headers }),
          fetch(`${ENV.API_BASE_URL}/dashboard/trends`, { headers }),
          fetch(`${ENV.API_BASE_URL}/dashboard/comparison`, { headers }),
          fetch(`${ENV.API_BASE_URL}/dashboard/categories`, { headers }),
          fetch(`${ENV.API_BASE_URL}/dashboard/recent`, { headers }),
        ]);

        if (ovRes.ok) setOverview((await ovRes.json()).data);
        if (insightsRes.ok) setInsights((await insightsRes.json()).data);
        if (trendsRes.ok) setTrends((await trendsRes.json()).data || []);
        if (compRes.ok) {
          const compData = (await compRes.json()).data;

          const incCur = compData.breakdown?.INCOME?.currentTotal || 0;
          const incPrev = compData.breakdown?.INCOME?.previousTotal || 0;
          const expCur = compData.breakdown?.EXPENSE?.currentTotal || 0;
          const expPrev = compData.breakdown?.EXPENSE?.previousTotal || 0;

          const netCur = incCur - expCur;
          const netPrev = incPrev - expPrev;
          let netChange = null;
          if (netPrev !== 0) {
            netChange = ((netCur - netPrev) / Math.abs(netPrev)) * 100;
          }

          setComparison({
            incomeChange: compData.breakdown?.INCOME?.percentChange,
            expenseChange: compData.breakdown?.EXPENSE?.percentChange,
            netChange: netChange
          });
        }
        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (recRes.ok) setRecent((await recRes.json()).data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [token]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const pieData = categories
    .slice(0, 8)
    .map((category) => ({ name: category.category, value: Number(category.total) }));

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <span className="eyebrow">Overview</span>
          <h1>Money movement at a glance.</h1>
          <p className="page-subtitle">
            Monitor income, expenses, and balance shifts in a cleaner command view built for quick decisions.
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Total income"
          value={overview?.totalIncome}
          trend={comparison?.incomeChange}
          tone="var(--success-color)"
        />
        <MetricCard
          label="Total expenses"
          value={overview?.totalExpenses}
          trend={comparison?.expenseChange}
          tone="var(--danger-color)"
        />
        <MetricCard
          label="Net balance"
          value={overview?.netBalance}
          trend={comparison?.netChange}
          tone="var(--text-primary)"
        />
      </div>

      {insights && (
        <div className="metrics-grid">
          <InsightCard
            label="Top expense category"
            value={insights.topExpenseCategory?.category || 'No data'}
            detail={insights.topExpenseCategory ? formatCurrency(insights.topExpenseCategory.total) : 'No expense records yet'}
          />
          <InsightCard
            label="Top income category"
            value={insights.topIncomeCategory?.category || 'No data'}
            detail={insights.topIncomeCategory ? formatCurrency(insights.topIncomeCategory.total) : 'No income records yet'}
          />
          <InsightCard
            label="Average record amount"
            value={formatCurrency(insights.averageRecordAmount)}
            detail={insights.savingsRate === null ? 'Savings rate unavailable' : `${Math.abs(insights.savingsRate).toFixed(1)}% savings rate`}
          />
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel chart-panel span-7">
          <div className="panel-header">
            <div className="panel-title">
              <h3>Financial trends</h3>
              <p>Monthly income and expense movement over time.</p>
            </div>
          </div>

          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <LineTooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '18px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="income" stroke="var(--success-color)" strokeWidth={3} dot={false} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="var(--danger-color)" strokeWidth={3} dot={false} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No trend data available yet.</div>
          )}
        </section>

        <section className="panel chart-panel span-5">
          <div className="panel-header">
            <div className="panel-title">
              <h3>Category breakdown</h3>
              <p>Top categories contributing to your totals.</p>
            </div>
          </div>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="48%" innerRadius={64} outerRadius={108} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="var(--bg-elevated)" strokeWidth={2} />
                  ))}
                </Pie>
                <PieTooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '18px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No category data available yet.</div>
          )}
        </section>

        <section className="panel table-shell span-12">
          <div className="panel-header" style={{ padding: '1.25rem 1.25rem 0' }}>
            <div className="panel-title">
              <h3>Recent transactions</h3>
              <p>The latest activity across the workspace.</p>
            </div>
          </div>

          {recent.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((record, index) => (
                    <tr key={`${record.id || record.date}-${index}`}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${record.type === 'INCOME' ? 'success' : 'danger'}`}>{record.type}</span>
                      </td>
                      <td>{record.category}</td>
                      <td className={`amount ${record.type === 'INCOME' ? 'income' : 'expense'}`}>
                        {formatCurrency(record.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No recent transactions yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}
