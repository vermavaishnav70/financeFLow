jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const jwt = require('jsonwebtoken');
const { prisma } = require('../../src/config/prisma');
const { authenticate, authenticateFreshUser } = require('../../src/middleware/auth');

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('authenticate trusts verified JWT claims without loading the user from Prisma', async () => {
    jwt.verify.mockReturnValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'ADMIN',
      name: 'Jamie',
    });

    const req = {
      headers: {
        authorization: 'Bearer signed-token',
      },
    };
    const res = {};
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'ADMIN',
      name: 'Jamie',
    });
    expect(next).toHaveBeenCalledWith();
  });

  test('authenticateFreshUser revalidates the active user for sensitive operations', async () => {
    jwt.verify.mockReturnValue({
      id: 'user-1',
      email: 'stale@example.com',
      role: 'VIEWER',
      name: 'Old Name',
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'fresh@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      name: 'Fresh Name',
    });

    const req = {
      headers: {
        authorization: 'Bearer signed-token',
      },
    };
    const res = {};
    const next = jest.fn();

    await authenticateFreshUser(req, res, next);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
      },
    });
    expect(req.user).toEqual({
      id: 'user-1',
      email: 'fresh@example.com',
      role: 'ADMIN',
      name: 'Fresh Name',
    });
    expect(next).toHaveBeenCalledWith();
  });
});
