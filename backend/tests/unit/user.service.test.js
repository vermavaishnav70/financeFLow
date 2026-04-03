jest.mock('../../src/config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/audit.service', () => ({
  logAction: jest.fn(),
}));

const { prisma } = require('../../src/config/prisma');
const userService = require('../../src/services/user.service');

describe('user service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMe returns the authenticated profile without a database read', () => {
    expect(
      userService.getMe({
        id: 'user-1',
        name: 'Jamie',
        email: 'jamie@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
      })
    ).toEqual({
      id: 'user-1',
      name: 'Jamie',
      email: 'jamie@example.com',
      role: 'ADMIN',
    });
  });

  test('getAllUsers batches the list and count queries in a Prisma transaction', async () => {
    const usersQuery = Symbol('usersQuery');
    const countQuery = Symbol('countQuery');

    prisma.user.findMany.mockReturnValue(usersQuery);
    prisma.user.count.mockReturnValue(countQuery);
    prisma.$transaction.mockResolvedValue([[{ id: 'user-1' }], 1]);

    const result = await userService.getAllUsers({
      page: 2,
      limit: 10,
      status: 'ACTIVE',
      role: 'ADMIN',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', role: 'ADMIN' },
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', role: 'ADMIN' },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([usersQuery, countQuery]);
    expect(result).toEqual({
      users: [{ id: 'user-1' }],
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    });
  });
});
