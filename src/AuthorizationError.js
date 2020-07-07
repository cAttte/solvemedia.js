const SolveMediaAPIError = require("./SolveMediaAPIError")

/**
 * Thrown when the provided credentials are invalid or unavailable to the client.
 */
module.exports = class AuthorizationError extends SolveMediaAPIError {
    /**
     * @param {String} message The error message
     * @param {String} code The error code
     */
    constructor(message, code) {
        super(message, code)
        this.name = "AuthorizationError"
    }
}