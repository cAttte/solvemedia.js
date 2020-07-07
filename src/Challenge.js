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
        this.answerChecked = false
        this.userIP = userIP
    }

    async verify(answer) {
        if (!this.auth || !(this.auth instanceof Object))
            throw new AuthorizationError("Credentials unavailable.", "NO_AUTH")
        const { verificationKey, authenticationHashKey } = this.auth
        if (!verificationKey || typeof verificationKey !== "string")
            throw new AuthorizationError("Verification key unavailable.", "MISSING_VKEY")
        if (authenticateResponse && (!authenticationHashKey || typeof authenticationHashKey !== "string"))
            throw new AuthorizationError("Authentication hash key unavailable.", "MISSING_HKEY")
        if (this.answerChecked)
            throw new SolveMediaAPIError("This challenge has already been verified.", "CHALLENGE_ALREADY_VERIFIED")
        if (!this.urlConsumed)
            throw new SolveMediaAPIError("The image URL has to be consumed before verifying an answer.", "URL_NOT_CONSUMED")
        if (!userIP) {
            const R = () => Math.floor(Math.random() * 255)
            userIP = [R(), R(), R(), R()].join(".")
        } else if (typeof userIP !== "string") {
            throw new SolveMediaAPIError("Invalid IP address.", "IP_INVALID")
        }
        const url = this.BASE_VERIFICATION_URL
            + `?privatekey=${this.auth.verificationKey}`
            + `&remoteip=${userIP}`
            + `&challenge=${this.id}`
            + `&response=${encodeURIComponent(answer.toString())}`
        const response = await fetch(url, { method: "POST" })
        const body = await response.text()
        const lines = body.trim().split("\n").map(l => l.trim())
        if (lines.length < 3)
            throw new SolveMediaAPIError("Response body does not contain the necessary values.", "BODY_INCOMPLETE")
        const answerIsValid = lines[0].trim().toLowerCase() === "true"
        const reason = lines[1].trim().toLowerCase()
        const authenticatorHash = lines[2].trim()

        if (authenticateResponse) {
            const hash = crypto
                .createHash("sha1")
                .update(lines[0] + this.id + this.auth.authenticationHashKey)
                .digest("hex")
            if (hash !== authenticatorHash)
                throw new SolveMediaAPIError("The response is not authentic, or the authentication hash key is invalid.", "RESPONSE_NOT_AUTHENTIC")
        }

        if (!answerIsValid && reason !== "wrong answer") {
            if (reason === "already checked")
                throw new SolveMediaAPIError("This challenge has already been verified.", "CHALLENGE_ALREADY_VERIFIED")
            else if (reason === "unknown challenge" || reason === "puzzle not found")
                throw new SolveMediaAPIError("The image URL has to be consumed before verifying an answer.", "URL_NOT_CONSUMED")
            else if (reason === "invalid challenge")
                throw new SolveMediaAPIError("Invalid challenge ID.", "CHALLENGE_INVALID")
            else if (reason === "invalid remoteip")
                throw new SolveMediaAPIError("Invalid IP address.", "IP_INVALID")
            else if (reason === "puzzle expired")
                throw new SolveMediaAPIError("This challenge has expired.", "CHALLENGE_EXPIRED")
            else
                throw new SolveMediaAPIError(`Unknown error: "${reason}."`, "UNKNOWN_ERROR")
        }

        this.answerChecked = true
        return answerIsValid
    }
}