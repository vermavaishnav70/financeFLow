const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const auditService = require('./audit.service');

/**
 * Financial Record Service — CRUD + role-scoped access.
 */
const recordWithCreatorInclude = {
  creator: {
    select: { id: true, name: true, email: true },
  },
};

/**
 * Create a new financial record (admin only).
 * @param {object} data - { amount, type, category, date, description }
 * @param {string} userId - Creator's user ID
 * @returns {Promise<object>}
 */
async function createRecord(data, userId) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        description: data.description || null,
        createdBy: userId,
      },
      include: recordWithCreatorInclude,
    });

    await auditService.logAction(tx, {
      action: 'CREATE',
      entity: 'record',
      entityId: record.id,
      performedBy: userId,
      after: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        description: record.description,
      },
    });

    return record;
  });
}

/**
 * Get all records (paginated, filtered, role-scoped).
 * @param {object} filters - { page, limit, state, type, category, startDate, endDate, minAmount, maxAmount, search, sortBy, sortOrder }
 * @param {object} requestingUser - Authenticated user context
 * @returns {Promise<{ records, total, page, limit, totalPages }>}
 */
async function getAllRecords(filters, requestingUser) {
  const {
    page = 1,
    limit = 20,
    state = 'active',
    type,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  if (state !== 'active' && requestingUser?.role !== 'ADMIN') {
    throw ApiError.forbidden('Only admins can view deleted records');
  }

  const where = {};

  if (state === 'active') {
    where.isDeleted = false;
  } else if (state === 'deleted') {
    where.isDeleted = true;
  }

  if (type) where.type = type;
  if (category) where.category = category;

  // Date range filtering
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};
    if (minAmount !== undefined) where.amount.gte = minAmount;
    if (maxAmount !== undefined) where.amount.lte = maxAmount;
  }

  // Search in description
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const orderBy = { [sortBy]: sortOrder };

  const [records, total] = await prisma.$transaction([
    prisma.financialRecord.findMany({
      relationLoadStrategy: 'join',
      where,
      skip,
      take: limit,
      orderBy,
      include: recordWithCreatorInclude,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single record by ID.
 * Record-level access is enforced by route RBAC.
 * @param {string} id
 * @returns {Promise<object>}
 */
async function getRecordById(id) {
  const record = await prisma.financialRecord.findUnique({
    relationLoadStrategy: 'join',
    where: { id },
    include: recordWithCreatorInclude,
  });

  if (!record || record.isDeleted) {
    throw ApiError.notFound('Record not found');
  }

  return record;
}

/**
 * Update a financial record (admin only).
 * @param {string} id
 * @param {object} data - { amount?, type?, category?, date?, description? }
 * @param {string} performedBy - Admin user ID
 * @returns {Promise<object>}
 */
async function updateRecord(id, data, performedBy) {
  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    throw ApiError.notFound('Record not found');
  }

  // Prepare update data
  const updateData = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.description !== undefined) updateData.description = data.description;

  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.update({
      where: { id },
      data: updateData,
      include: recordWithCreatorInclude,
    });

    await auditService.logAction(tx, {
      action: 'UPDATE',
      entity: 'record',
      entityId: id,
      performedBy,
      before: {
        amount: existing.amount,
        type: existing.type,
        category: existing.category,
        date: existing.date,
        description: existing.description,
      },
      after: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        description: record.description,
      },
    });

    return record;
  });
}

/**
 * Soft delete a financial record (admin only).
 * @param {string} id
 * @param {string} performedBy
 * @returns {Promise<object>}
 */
async function deleteRecord(id, performedBy) {
  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    throw ApiError.notFound('Record not found');
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.update({
      where: { id },
      data: { isDeleted: true },
    });

    await auditService.logAction(tx, {
      action: 'DELETE',
      entity: 'record',
      entityId: id,
      performedBy,
      before: {
        amount: existing.amount,
        type: existing.type,
        category: existing.category,
        isDeleted: false,
      },
      after: { isDeleted: true },
    });

    return record;
  });
}

/**
 * Restore a soft-deleted record (admin only).
 * @param {string} id
 * @param {string} performedBy
 * @returns {Promise<object>}
 */
async function recoverRecord(id, performedBy) {
  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Record not found');
  }

  if (!existing.isDeleted) {
    throw ApiError.badRequest('Record is already active');
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.update({
      where: { id },
      data: { isDeleted: false },
      include: recordWithCreatorInclude,
    });

    await auditService.logAction(tx, {
      action: 'UPDATE',
      entity: 'record',
      entityId: id,
      performedBy,
      before: { isDeleted: true },
      after: { isDeleted: false },
    });

    return record;
  });
}

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  recoverRecord,
};
