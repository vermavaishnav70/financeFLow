jest.mock('../../src/config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    financialRecord: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/audit.service', () => ({
  logAction: jest.fn(),
}));

const { prisma } = require('../../src/config/prisma');
const recordService = require('../../src/services/record.service');

describe('record service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllRecords batches pagination queries and uses exact category filtering for analyst reads', async () => {
    const recordsQuery = Symbol('recordsQuery');
    const countQuery = Symbol('countQuery');

    prisma.financialRecord.findMany.mockReturnValue(recordsQuery);
    prisma.financialRecord.count.mockReturnValue(countQuery);
    prisma.$transaction.mockResolvedValue([[{ id: 'record-1' }], 1]);

    const result = await recordService.getAllRecords(
      {
        page: 1,
        limit: 20,
        type: 'EXPENSE',
        category: 'Groceries',
      },
      { id: 'user-1', role: 'ANALYST' }
    );

    expect(prisma.financialRecord.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: {
        isDeleted: false,
        type: 'EXPENSE',
        category: 'Groceries',
      },
      skip: 0,
      take: 20,
      orderBy: { date: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    expect(prisma.financialRecord.count).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
        type: 'EXPENSE',
        category: 'Groceries',
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([recordsQuery, countQuery]);
    expect(result).toEqual({
      records: [{ id: 'record-1' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  test('getAllRecords keeps admin reads global as well', async () => {
    const recordsQuery = Symbol('recordsQuery');
    const countQuery = Symbol('countQuery');

    prisma.financialRecord.findMany.mockReturnValue(recordsQuery);
    prisma.financialRecord.count.mockReturnValue(countQuery);
    prisma.$transaction.mockResolvedValue([[{ id: 'record-2' }], 1]);

    await recordService.getAllRecords(
      {
        page: 2,
        limit: 10,
      },
      { id: 'admin-1', role: 'ADMIN' }
    );

    expect(prisma.financialRecord.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: {
        isDeleted: false,
      },
      skip: 10,
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    expect(prisma.financialRecord.count).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([recordsQuery, countQuery]);
  });
});
