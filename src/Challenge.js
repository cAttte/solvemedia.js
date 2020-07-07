const SolveMediaAPIError = require("./SolveMediaAPIError")
const AuthorizationError = require("./AuthorizationError")

/**
 * Don't initialize this class manually, use `SolveMediaClient#getChallenge()` instead.
 */
module.exports = class Challenge {
    static BASE_VERIFICATION_URL = "http://verify.solvemedia.com/papi/verify"
    static BASE_IMAGE_URL = "https://api-secure.solvemedia.com/papi/media?c="
    /**
     * @param {String} body The body of the response by the SolveMedia API
     * @param {Object} auth The authorization keys
     * @param {String} auth.challengeKey Your challenge key
     * @param {String?} auth.verificationKey Your verification key
     * @param {String?} auth.authenticationHashKey Your authentication hash key
     * @param {String?} userIP The user's IP
     */
    constructor(body, auth, userIP) {
        try {
            body = JSON.parse(body)
        } catch (e) {
            throw new SolveMediaAPIError("Response body is not valid JSON.", "JSON_INVALID")
        }
        const result = body.ACChallengeResult
        if (!result)
            throw new SolveMediaAPIError("Response body does not contain the necessary values.", "BODY_INCOMPLETE")
        if (result.fail === "invalid ckey")
            throw new AuthorizationError("Invalid challenge key.", "INVALID_CKEY")
        else if (result.fail === "no ckey specified")
            throw new AuthorizationError("Challenge key not specified.", "NO_CKEY")
        else if (result.fail)
            throw new SolveMediaAPIError(`Unknown error: "${result.fail}."`, "UNKNOWN_ERROR")
        if (!result.chid)
            throw new SolveMediaAPIError("Response body does not contain the necessary values.", "BODY_INCOMPLETE")
        this.auth = auth
        this.id = result.chid
        this.imageURL = this.constructor.BASE_IMAGE_URL + this.id
        this.urlConsumed = false
        this.verified = false
    }
}