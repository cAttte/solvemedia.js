const crypto = require("crypto")
const fs = require("fs")
const fetch = require("node-fetch")
const SolveMediaAPIError = require("./SolveMediaAPIError")
const AuthorizationError = require("./AuthorizationError")

/**
 * Don't initialize this class manually, use `SolveMediaClient#getChallenge()` instead.
 */
module.exports = class Challenge {
    static BASE_VERIFICATION_URL = "http://verify.solvemedia.com/papi/verify"
    static BASE_IMAGE_URL = "https://api-secure.solvemedia.com/papi/media"
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
            throw new SolveMediaAPIError("JSON_INVALID")
        }
        const result = body.ACChallengeResult
        if (!result)
            throw new SolveMediaAPIError("BODY_INCOMPLETE")
        if (result.fail === "invalid ckey")
            throw new AuthorizationError("CKEY_INVALID")
        else if (result.fail === "no ckey specified")
            throw new AuthorizationError("CKEY_MISSING")
        else if (result.fail)
            throw new SolveMediaAPIError("UNKNOWN_ERROR", result.fail)
        if (!result.chid)
            throw new SolveMediaAPIError("BODY_INCOMPLETE")
        this.auth = auth
        this.id = result.chid
        this.imageURL = this.constructor.BASE_IMAGE_URL + this.id
        this.imageUsed = false
        this.answerChecked = false
        this.userIP = userIP
    }

    /**
     * Verify the user's answer
     * @param {String} answer The user's answer
     * @param {Boolean?} authenticateResponse Whether to authenticate the server's response
     * @returns {Promise<Boolean>} Whether the answer is correct or not
     */
    async verify(answer, authenticateResponse = true) {
        if (!this.auth || !(this.auth instanceof Object))
            throw new AuthorizationError("AUTH_MISSING")
        const { verificationKey, authenticationHashKey } = this.auth
        if (!verificationKey || typeof verificationKey !== "string")
            throw new AuthorizationError("VKEY_MISSING")
        if (authenticateResponse && (!authenticationHashKey || typeof authenticationHashKey !== "string"))
            throw new AuthorizationError("HKEY_MISSING")
        if (this.answerChecked)
            throw new SolveMediaAPIError("CHALLENGE_ALREADY_VERIFIED")
        if (!this.imageUsed)
            throw new SolveMediaAPIError("IMAGE_UNUSED")
        if (!this.userIP) {
            const R = () => Math.floor(Math.random() * 255)
            this.userIP = [R(), R(), R(), R()].join(".")
        } else if (typeof this.userIP !== "string") {
            throw new SolveMediaAPIError("IP_INVALID")
        }
        const url = this.constructor.BASE_VERIFICATION_URL
            + `?privatekey=${encodeURIComponent(this.auth.verificationKey)}`
            + `&remoteip=${encodeURIComponent(this.userIP)}`
            + `&challenge=${encodeURIComponent(this.id)}`
            + `&response=${encodeURIComponent(answer.toString())}`
        const response = await fetch(url, { method: "POST" })
        const body = await response.text()
        const lines = body.trim().split("\n").map(l => l.trim())
        if (lines.length < 3)
            throw new SolveMediaAPIError("BODY_INCOMPLETE")
        const answerIsValid = lines[0].trim().toLowerCase() === "true"
        const reason = lines[1].trim().toLowerCase()
        const authenticatorHash = lines[2].trim()

        if (authenticateResponse) {
            const hash = crypto
                .createHash("sha1")
                .update(lines[0] + this.id + this.auth.authenticationHashKey)
                .digest("hex")
            if (hash !== authenticatorHash)
                throw new SolveMediaAPIError("RESPONSE_NOT_AUTHENTIC")
        }

        if (!answerIsValid && reason !== "wrong answer") {
            if (reason === "already checked")
                throw new SolveMediaAPIError("CHALLENGE_ALREADY_VERIFIED")
            else if (reason === "unknown challenge" || reason === "puzzle not found")
                throw new SolveMediaAPIError("IMAGE_UNUSED")
            else if (reason === "invalid challenge")
                throw new SolveMediaAPIError("CHALLENGE_INVALID")
            else if (reason === "invalid remoteip")
                throw new SolveMediaAPIError("IP_INVALID")
            else if (reason === "puzzle expired")
                throw new SolveMediaAPIError("CHALLENGE_EXPIRED")
            else
                throw new SolveMediaAPIError("UNKNOWN_ERROR", reason)
        }

        this.answerChecked = true
        return answerIsValid
    }

    /**
     * Get the URL of the image.
     * @param {Object?} options Options to personalize the image, may not work as expected
     * @param {Number?} options.width The width of the image
     * @param {Number?} options.height The height of the image
     * @param {String?} options.foreground The foreground color of the image
     * @param {String?} options.background The background color of the image
     * @returns {String} The URL
     */
    getImageURL({ width = 300, height = 150, foreground = "000000", background = "f8f8f8" } = {}) {
        if (this.imageUsed)
            throw new SolveMediaAPIError("IMAGE_USED")
        return this.constructor.BASE_IMAGE_URL
            + `?c=${this.id}`
            + `;w=${width}`
            + `;h=${height}`
            + `;fg=${foreground}`
            + `;bg=${background}`
    }

    /**
     * Get a buffer of the image.
     * @param {Object?} imageOptions Options to personalize the image, passed to `getImageURL()`
     * @returns {Buffer} The buffer
     */
    async getImageBuffer(imageOptions) {
        const url = this.getImageURL(imageOptions)
        const response = await fetch(url)
        if (response.url.endsWith("media-error.gif"))
            throw new SolveMediaAPIError("IMAGE_USED")
        this.imageUsed = true
        const buffer = await response.buffer()
        return buffer
    }

    /**
     * Write the image to a file.
     * @param {String} path The path of the new file
     * @param {Object?} imageOptions Options to personalize the image, passed to `getImageURL()`
     * @returns {Promise<WritableStream>} The write stream of the created file
     */
    async writeImageToFile(path, imageOptions) {
        if (!path) throw new TypeError("File path not specified.")
        const url = this.getImageURL(imageOptions)
        const stream = fs.createWriteStream(path)
        const response = await fetch(url)
        if (response.url.endsWith("media-error.gif"))
            throw new SolveMediaAPIError("IMAGE_USED")
        this.imageUsed = true
        response.body.pipe(stream)
        return stream
    }
}