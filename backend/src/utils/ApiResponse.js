/**
 * Standardized API response helper.
 * Ensures all endpoints return a consistent JSON envelope.
 */
class ApiResponse {
  /**
   * Send a success response.
   * @param {import('express').Response} res
   * @param {number} statusCode
   * @param {string} message
   * @param {*} data
   * @param {object} [meta] - Pagination metadata
   */
  static success(res, statusCode, message, data, meta = null) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res, message, data) {
    return ApiResponse.success(res, 201, message, data);
  }

  static ok(res, message, data, meta) {
    return ApiResponse.success(res, 200, message, data, meta);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
