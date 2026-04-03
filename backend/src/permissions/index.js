/**
 * Centralized Permission Map
 *
 * Single source of truth for all RBAC checks in the system.
 *
 * Structure: PERMISSIONS[role][resource] = [allowed actions]
 */

const PERMISSIONS = {
  VIEWER: {
    records: [],
    dashboard: ['recent', 'overview', 'categories', 'trends', 'comparison', 'insights'],
    users: ['readSelf'],
  },
  ANALYST: {
    records: ['read'],
    dashboard: ['recent', 'overview', 'categories', 'trends', 'comparison', 'insights'],
    users: ['readSelf'],
  },
  ADMIN: {
    records: ['read', 'create', 'update', 'delete'],
    dashboard: ['recent', 'overview', 'categories', 'trends', 'comparison', 'insights'],
    users: ['readSelf', 'read', 'create', 'update', 'delete'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource.
 * @param {string} role - User role (VIEWER, ANALYST, ADMIN)
 * @param {string} resource - Resource name (records, dashboard, users)
 * @param {string} action - Action name (read, create, update, delete, etc.)
 * @returns {boolean}
 */
function can(role, resource, action) {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

/**
 * Get all permissions for a given role.
 * @param {string} role
 * @returns {object}
 */
function getPermissions(role) {
  return PERMISSIONS[role] || {};
}

module.exports = { PERMISSIONS, can, getPermissions };
