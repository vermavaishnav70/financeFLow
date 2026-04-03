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

jest.mock('../../src/services/record.service', () => ({
  getAllRecords: jest.fn(),
  getRecordById: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { prisma } = require('../../src/config/prisma');
const { errorHandler } = require('../../src/middleware/errorHandler');
const recordService = require('../../src/services/record.service');
const router = require('../../src/routes/record.routes');

// Valid UUIDs for testing
const TEST_RECORD_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

function setAuthenticatedUser(role) {
  jwt.verify.mockReturnValue({
    id: TEST_USER_ID,
    email: `${role.toLowerCase()}@financeflow.com`,
    role,
    name: `${role} User`,
  });
}

function setFreshAuthenticatedUser(role) {
  setAuthenticatedUser(role);
  prisma.user.findUnique.mockResolvedValue({
    id: TEST_USER_ID,
    email: `${role.toLowerCase()}@financeflow.com`,
    role,
    status: 'ACTIVE',
    name: `${role} User`,
  });
}

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function executeRoute(method, path, { headers = {}, body = {}, query = {}, params = {} } = {}) {
  const layer = router.stack.find((entry) => (
    entry.route
    && entry.route.path === path
    && entry.route.methods[method]
  ));

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  const req = {
    method: method.toUpperCase(),
    originalUrl: `/api/v1/records${path === '/' ? '' : `/${params.id}`}`,
    headers,
    body,
    query,
    params,
  };
  const res = createResponse();
  const handlers = layer.route.stack.map((entry) => entry.handle);

  const runHandler = async (index, error) => {
    if (error) {
      errorHandler(error, req, res, () => {});
      return;
    }

    const handler = handlers[index];
    if (!handler) {
      return;
    }

    await new Promise((resolve) => {
      let advanced = false;
      const next = (nextError) => {
        advanced = true;
        resolve(runHandler(index + 1, nextError));
      };

      Promise.resolve(handler(req, res, next))
        .then(() => {
          if (!advanced) {
            resolve();
          }
        })
        .catch(next);
    });
  };

  await runHandler(0);
  return { req, res };
}

describe('record routes access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows analysts to list all records without ownership filtering', async () => {
    recordService.getAllRecords.mockResolvedValue({
      records: [{ id: TEST_RECORD_ID }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    setAuthenticatedUser('ANALYST');

    const { res } = await executeRoute('get', '/', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(recordService.getAllRecords).toHaveBeenCalledWith(
      {
        page: 1,
        limit: 20,
        sortBy: 'date',
        sortOrder: 'desc',
        state: 'active',
      },
      expect.objectContaining({ role: 'ANALYST' })
    );
  });

  test('blocks viewers from listing records', async () => {
    setAuthenticatedUser('VIEWER');

    const { res } = await executeRoute('get', '/', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(res.statusCode).toBe(403);
    expect(recordService.getAllRecords).not.toHaveBeenCalled();
  });

  test('allows analysts to fetch any record by id', async () => {
    recordService.getRecordById.mockResolvedValue({ id: TEST_RECORD_ID });
    setAuthenticatedUser('ANALYST');

    const { res } = await executeRoute('get', '/:id', {
      headers: {
        authorization: 'Bearer valid-token',
      },
      params: { id: TEST_RECORD_ID },
    });

    expect(res.statusCode).toBe(200);
    expect(recordService.getRecordById).toHaveBeenCalledWith(TEST_RECORD_ID);
  });

  test('blocks analysts from creating records', async () => {
    setFreshAuthenticatedUser('ANALYST');

    const { res } = await executeRoute('post', '/', {
      headers: {
        authorization: 'Bearer valid-token',
      },
      body: {
        amount: 1200,
        type: 'INCOME',
        category: 'Salary',
        date: '2026-04-01',
        description: 'Monthly salary',
      },
    });

    expect(res.statusCode).toBe(403);
    expect(recordService.createRecord).not.toHaveBeenCalled();
  });

  test('allows admins to create records', async () => {
    recordService.createRecord.mockResolvedValue({ id: TEST_RECORD_ID });
    setFreshAuthenticatedUser('ADMIN');

    const payload = {
      amount: 1200,
      type: 'INCOME',
      category: 'Salary',
      date: '2026-04-01',
      description: 'Monthly salary',
    };

    const { res } = await executeRoute('post', '/', {
      headers: {
        authorization: 'Bearer valid-token',
      },
      body: payload,
    });

    expect(res.statusCode).toBe(201);
    expect(recordService.createRecord).toHaveBeenCalledWith({
      ...payload,
      date: new Date('2026-04-01'),
    }, TEST_USER_ID);
  });

  test('blocks viewers from updating records', async () => {
    setFreshAuthenticatedUser('VIEWER');

    const { res } = await executeRoute('put', '/:id', {
      headers: {
        authorization: 'Bearer valid-token',
      },
      params: { id: TEST_RECORD_ID },
      body: { category: 'Travel' },
    });

    expect(res.statusCode).toBe(403);
    expect(recordService.updateRecord).not.toHaveBeenCalled();
  });

  test('allows admins to delete records', async () => {
    recordService.deleteRecord.mockResolvedValue({ id: TEST_RECORD_ID });
    setFreshAuthenticatedUser('ADMIN');

    const { res } = await executeRoute('delete', '/:id', {
      headers: {
        authorization: 'Bearer valid-token',
      },
      params: { id: TEST_RECORD_ID },
    });

    expect(res.statusCode).toBe(200);
    expect(recordService.deleteRecord).toHaveBeenCalledWith(TEST_RECORD_ID, TEST_USER_ID);
  });
});
