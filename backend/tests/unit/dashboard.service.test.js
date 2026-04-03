jest.mock('../../src/config/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    financialRecord: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../../src/config/prisma');
const dashboardService = require('../../src/services/dashboard.service');

describe('dashboard service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getOverview computes totals from a single summary query', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        total_income: 1200,
        total_expenses: 450,
        total_records: 7,
        income_count: 3,
        expense_count: 4,
      },
    ]);

    const result = await dashboardService.getOverview();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totalIncome: 1200,
      totalExpenses: 450,
      totalRecords: 7,
      incomeCount: 3,
      expenseCount: 4,
      netBalance: 750,
    });
  });

  test('getCategoryBreakdown uses one grouped query and computes percentages in memory', async () => {
    prisma.financialRecord.groupBy.mockResolvedValue([
      {
        category: 'Salary',
        type: 'INCOME',
        _sum: { amount: 1000 },
        _count: 2,
      },
      {
        category: 'Groceries',
        type: 'EXPENSE',
        _sum: { amount: 500 },
        _count: 3,
      },
    ]);

    const result = await dashboardService.getCategoryBreakdown();

    expect(prisma.financialRecord.groupBy).toHaveBeenCalledWith({
      by: ['category', 'type'],
      where: { isDeleted: false },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });
    expect(result).toEqual([
      {
        category: 'Salary',
        type: 'INCOME',
        total: 1000,
        count: 2,
        percentage: 66.67,
      },
      {
        category: 'Groceries',
        type: 'EXPENSE',
        total: 500,
        count: 3,
        percentage: 33.33,
      },
    ]);
  });

  test('getRecentActivity requests creator data with join loading to avoid N+1 user fetches', async () => {
    prisma.financialRecord.findMany.mockResolvedValue([{ id: 'record-1' }]);

    const result = await dashboardService.getRecentActivity(5);

    expect(prisma.financialRecord.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    expect(result).toEqual([{ id: 'record-1' }]);
  });
});
