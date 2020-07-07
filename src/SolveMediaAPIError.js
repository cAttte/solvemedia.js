/**
 * Thrown when the response from SolveMedia is either invalid, or returns an error.
 */
module.exports = class SolveMediaAPIError extends Error {
    /**
     * @param {string} message The error message
     * @param {string} code The error code
     */
    constructor(message, code) {
        super(message)
        this.name = "SolveMediaAPIError"
        this.code = code
    }
}