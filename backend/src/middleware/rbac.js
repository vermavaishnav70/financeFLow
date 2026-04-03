const { can } = require('../permissions');
const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware factory.
 * Uses centralized permission map to check access.
 *
 * @param {string} resource - Resource name (records, dashboard, users)
 * @param {string} action - Action name (read, create, update, delete, etc.)
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/records', authenticate, authorize('records', 'create'), controller);
 */
const authorize = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!can(req.user.role, resource, action)) {
        throw ApiError.forbidden(
          `Role '${req.user.role}' does not have '${action}' permission on '${resource}'`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize };
