const { prisma } = require('../config/prisma');

/**
 * Dashboard Service — Aggregation and analytics logic.
 * Uses Prisma aggregate methods and $queryRaw for complex queries.
 * Dashboard endpoints return system-wide data (not ownership-scoped)
 * because analytics users need the full picture.
 */
const activeRecordsWhere = { isDeleted: false };

async function getOverviewTotals() {
  const [summary] = await prisma.$queryRaw`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0)::float AS total_income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::float AS total_expenses,
      COUNT(*)::int AS total_records,
      COUNT(*) FILTER (WHERE type = 'INCOME')::int AS income_count,
      COUNT(*) FILTER (WHERE type = 'EXPENSE')::int AS expense_count
    FROM financial_records
    WHERE is_deleted = false
  `;

  return {
    totalIncome: summary?.total_income || 0,
    totalExpenses: summary?.total_expenses || 0,
    totalRecords: summary?.total_records || 0,
    incomeCount: summary?.income_count || 0,
    expenseCount: summary?.expense_count || 0,
  };
}

/**
 * Get overview summary: total income, expenses, net balance, record count.
 * @returns {Promise<object>}
 */
async function getOverview() {
  const overview = await getOverviewTotals();

  return {
    ...overview,
    netBalance: overview.totalIncome - overview.totalExpenses,
  };
}

/**
 * Get high-signal financial insights for the dashboard.
 * @returns {Promise<object>}
 */
async function getInsights() {
  const [topExpenseCategory, topIncomeCategory, largestExpense, averageAmount] = await Promise.all([
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { ...activeRecordsWhere, type: 'EXPENSE' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 1,
    }),
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { ...activeRecordsWhere, type: 'INCOME' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 1,
    }),
    prisma.financialRecord.findFirst({
      where: { ...activeRecordsWhere, type: 'EXPENSE' },
      orderBy: { amount: 'desc' },
      select: {
        amount: true,
        category: true,
        date: true,
        description: true,
      },
    }),
    prisma.financialRecord.aggregate({
      where: activeRecordsWhere,
      _avg: { amount: true },
    }),
  ]);

  const overview = await getOverview();
  const savingsRate = overview.totalIncome > 0
    ? Math.round((((overview.totalIncome - overview.totalExpenses) / overview.totalIncome) * 100) * 100) / 100
    : null;

  return {
    topExpenseCategory: topExpenseCategory[0]
      ? {
          category: topExpenseCategory[0].category,
          total: Number(topExpenseCategory[0]._sum.amount || 0),
        }
      : null,
    topIncomeCategory: topIncomeCategory[0]
      ? {
          category: topIncomeCategory[0].category,
          total: Number(topIncomeCategory[0]._sum.amount || 0),
        }
      : null,
    largestExpense: largestExpense
      ? {
          amount: Number(largestExpense.amount || 0),
          category: largestExpense.category,
          date: largestExpense.date,
          description: largestExpense.description,
        }
      : null,
    averageRecordAmount: Number(averageAmount._avg.amount || 0),
    savingsRate,
  };
}

/**
 * Get category-wise breakdown with percentages.
 * @param {string} [type] - Optional filter: INCOME or EXPENSE
 * @returns {Promise<Array>}
 */
async function getCategoryBreakdown(type) {
  const where = { ...activeRecordsWhere };
  if (type) where.type = type;

  const results = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Calculate grand total for percentage computation
  const grandTotal = results.reduce((sum, r) => sum + Number(r._sum.amount || 0), 0);

  return results.map((r) => ({
    category: r.category,
    type: r.type,
    total: Number(r._sum.amount || 0),
    count: r._count,
    percentage: grandTotal > 0
      ? Math.round((Number(r._sum.amount || 0) / grandTotal) * 10000) / 100
      : 0,
  }));
}

/**
 * Get monthly trends for income vs expense over N months.
 * @param {number} [months=12]
 * @returns {Promise<Array>}
 */
async function getMonthlyTrends(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const results = await prisma.$queryRaw`
    SELECT
      TO_CHAR(date, 'YYYY-MM') as month,
      type,
      SUM(amount)::float as total,
      COUNT(*)::int as count
    FROM financial_records
    WHERE is_deleted = false
      AND date >= ${startDate}
    GROUP BY TO_CHAR(date, 'YYYY-MM'), type
    ORDER BY month ASC, type ASC
  `;

  // Transform into monthly objects { month, income, expense, net }
  const monthMap = new Map();

  for (const row of results) {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });
    }
    const entry = monthMap.get(row.month);
    if (row.type === 'INCOME') {
      entry.income = row.total;
      entry.incomeCount = row.count;
    } else {
      entry.expense = row.total;
      entry.expenseCount = row.count;
    }
  }

  return Array.from(monthMap.values()).map((entry) => ({
    ...entry,
    net: entry.income - entry.expense,
  }));
}

/**
 * Get recent activity (latest N records).
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
async function getRecentActivity(limit = 10) {
  return prisma.financialRecord.findMany({
    relationLoadStrategy: 'join',
    where: activeRecordsWhere,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get month-to-month comparison: current month vs previous month with % change.
 * @returns {Promise<object>}
 */
async function getComparison() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const results = await prisma.$queryRaw`
    SELECT
      type,
      COALESCE(SUM(amount) FILTER (
        WHERE date >= ${currentMonthStart}
          AND date <= ${now}
      ), 0)::float AS current_total,
      COUNT(*) FILTER (
        WHERE date >= ${currentMonthStart}
          AND date <= ${now}
      )::int AS current_count,
      COALESCE(SUM(amount) FILTER (
        WHERE date >= ${previousMonthStart}
          AND date <= ${previousMonthEnd}
      ), 0)::float AS previous_total,
      COUNT(*) FILTER (
        WHERE date >= ${previousMonthStart}
          AND date <= ${previousMonthEnd}
      )::int AS previous_count
    FROM financial_records
    WHERE is_deleted = false
      AND date >= ${previousMonthStart}
      AND date <= ${now}
    GROUP BY type
  `;

  // Build summary
  const summary = {
    currentPeriod: { start: currentMonthStart.toISOString().split('T')[0], end: now.toISOString().split('T')[0] },
    previousPeriod: { start: previousMonthStart.toISOString().split('T')[0], end: previousMonthEnd.toISOString().split('T')[0] },
    breakdown: {},
  };

  for (const row of results) {
    const previousTotal = row.previous_total || 0;
    const currentTotal = row.current_total || 0;

    summary.breakdown[row.type] = {
      currentTotal,
      previousTotal,
      currentCount: row.current_count || 0,
      previousCount: row.previous_count || 0,
      percentChange: previousTotal > 0
        ? Math.round((((currentTotal - previousTotal) / previousTotal) * 100) * 100) / 100
        : null,
    };
  }

  return summary;
}

module.exports = {
  getOverview,
  getInsights,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getComparison,
};
