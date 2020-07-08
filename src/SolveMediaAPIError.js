const ERROR_MESSAGES = {
    UNKNOWN_ERROR: "Unknown error: {e}",
    // response
    JSON_INVALID: "Response body is not valid JSON.",
    BODY_INCOMPLETE: "Response body does not contain the necessary values.",
    // auth
    AUTH_MISSING: "Credentials are unavailable.",
    CKEY_MISSING: "Challenge key is unavailable.",
    CKEY_INVALID: "Invalid challenge key.",
    VKEY_MISSING: "Verification key is unavailable.",
    VKEY_INVALID: "Invalid verification key.",
    HKEY_MISSING: "Authentication hash key is unavailable.",
    RESPONSE_NOT_AUTHENTIC: "The response is not authentic, or the authentication hash key is invalid.",
    // others
    URL_NOT_CONSUMED: "The image URL has to be consumed before verifying an answer.",
    URL_ALREADY_CONSUMED: "The image URL has already been consumed.",
    IP_INVALID: "Invalid IP address.",
    CHALLENGE_ALREADY_VERIFIED: "This challenge has already been verified.",
    CHALLENGE_INVALID: "Invalid challenge ID.",
    CHALLENGE_EXPIRED: "This challenge has expired."
}

/**
 * Thrown when the response from SolveMedia is either invalid, or returns an error.
 */
module.exports = class SolveMediaAPIError extends Error {
    /**
     * @param {string} message The error message
     * @param {string} code The error code
     */
    constructor(code, unknownErrorMessage) {
        let message = ERROR_MESSAGES[code]
        if (code === "UNKNOWN_ERROR") message = message.replace("{e}", unknownErrorMessage)
        super(message || "Unknown error.")
        this.name = "SolveMediaAPIError"
        this.code = code
    }
}