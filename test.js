const sm = require("./index.js")

const challengeKey = "VCLE6A6.a37eCsPBiZkpp3hgHuKiSaMO"
const verificationKey = "e9bWVVC5G7QyIy7yPyBCikV39uDmwkYJ"

sm.login(challengeKey, verificationKey)

var captcha = new sm.Captcha()

captcha.challengeID()
    .then((chid) => {

        console.log(chid)

    })

captcha.url()
    .then((url) => {

        console.log(url.slice(47))

    })
