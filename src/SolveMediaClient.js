const fetch = require("node-fetch")

const AuthorizationError = require("./AuthorizationError")
const Challenge = require("./Challenge")

/**
 * The client used for interacting with the API.
 */
module.exports = class SolveMediaClient {
    BASE_CHALLENGE_URL = "https://api-secure.solvemedia.com/papi/_challenge.js?k="
    constructor() {
        this.auth = {
            challengeKey: null,
            verificationKey: null,
            authenticationHashKey: null,
            validated: false
        }
    }

    /**
     * Store and validate your SolveMedia credentials.
     * @param {String} challengeKey Your challenge key
     * @param {String?} verificationKey Your verification key
     * @param {String?} authenticationHashKey Your authentication hash key
     * @param {Boolean?} validate Whether to validate the provided credentials by requesting a captcha
     */
    async login(challengeKey, verificationKey = null, authenticationHashKey = null, validate = true) {
        if (!challengeKey)
            throw new AuthorizationError("CKEY_MISSING")
        if (!verificationKey)
            verificationKey = null
        if (!authenticationHashKey)
            authenticationHashKey = null

        this.auth = {
            challengeKey,
            verificationKey,
            authenticationHashKey,
        }
        if (validate) {
            const challenge = await this.getChallenge()
            const authenticate = Boolean(this.auth.authenticationHashKey)
            const randomResponse = Math.random().toString().slice(2)
            if (verificationKey) {
                await challenge.getImageBuffer()
                await challenge.verify(randomResponse, authenticate)
            }
        }
        return this
    }

    /**
     * Obtain a challenge/captcha from the SolveMedia API.
     * @param {String} userIP The IP of the user
     * @returns {Promise<Challenge>} The challenge
     */
    async getChallenge(userIP = null) {
        if (!this.auth)
            throw new AuthorizationError("AUTH_MISSING")
        if (!this.auth.challengeKey)
            throw new AuthorizationError("CKEY_MISSING")
        const url = this.BASE_CHALLENGE_URL + this.auth.challengeKey
        const response = await fetch(url)
        const body = await response.text()
        return new Challenge(body, this.auth, userIP)
    }
}