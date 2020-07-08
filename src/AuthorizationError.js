const SolveMediaAPIError = require("./SolveMediaAPIError")

/**
 * Thrown when the provided credentials are invalid or unavailable to the client.
 */
module.exports = class AuthorizationError extends SolveMediaAPIError {
    /**
     * @param {String} code The error code
     */
    constructor(code) {
        super(code)
        this.name = "AuthorizationError"
    }
}