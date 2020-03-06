const got = require("got")

var keys = {

    "challenge": null,
    "verification": null

}

exports.login = (challengeKey, verificationKey) => {

    if (!challengeKey) throw new Error("Challenge key not specified.")
    if (!verificationKey) throw new Error("Verification key not specified.")

    keys.challenge = challengeKey
    keys.verification = verificationKey

}

exports.Captcha = class {

    constructor(cKey) {

        if (!cKey) {
            cKey = keys.challenge
        }

        function getCaptcha() {
            return new Promise((resolve, reject) => {

                const captchaURL = "https://api-secure.solvemedia.com/papi/_challenge.js?k=" + keys.challenge
                got(captchaURL)
                    .then((response) => {

                        try {
                            response.body = JSON.parse(response.body).ACChallengeResult
                        } catch {
                            throw new Error("SolveMedia's response could not be parsed.")
                        }

                        if (response.body.fail) {
                            if (response.body.fail == "invalid ckey") {
                                throw new Error("Invalid challenge key.")
                            } else if (response.body.fail == "no ckey specified") {
                                throw new Error("Challenge key not specified.")
                            }
                            throw new Error("SolveMedia API Error: " + response.body.fail)
                        }

                        if (!response.body.chid) {
                            throw new Error("SolveMedia's response does not contain the Challenge ID.")
                        }

                        resolve(response.body.chid)

                    })

            })

        }

        var challengeID = ""
        this.challengeID = () => {

            return new Promise((resolve, reject) => {

                if (!challengeID) {

                    getCaptcha()
                        .then((id) => {
                            console.log("didn't exist, generating one")
                            challengeID = id
                            resolve(challengeID)
                        })

                } else {

                    console.log("already existed")

                    resolve(challengeID)

                }

            })

        }

        console.log("challgen id::::" + challengeID)

        this.url = () => {

            console.log("hehehe " + challengeID)

            return new Promise((resolve, reject) => {

                this.challengeID().then((challengeID) => {

                    resolve(`https://api-secure.solvemedia.com/papi/media?c=${challengeID};w=300;h=150;fg=000000;bg=f8f8f8`)

                })

            })

        }

        this.buffer = () => {

            return new Promise((resolve, reject) => {

                getCaptcha().then((challengeID) => {

                    resolve("asd")

                })

            })

        }

    }

}
