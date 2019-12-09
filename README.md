# solvemedia.js

A JavaScript wrapper to get a captcha from SolveMedia's API and verify the user's answer.

# READ THIS

You probably shouldn't use solvemedia.js as a solution for a serious project. While it may be easy to use, it doesn't have applications for any framework nor pre-made forms, so if you're considering using this on the client-side, maybe just use [SolveMedia's API](https://portal.solvemedia.com/portal/help/pub/implement). Take this more as a little fun package to easily get captchas and mess with them. Nevertheless, this package is not insecure at all since it directly uses SolveMedia's API.

## How to get your API Keys

First, register and login at [SolveMedia](https://solvemedia.com/). If you didn't get redirected to the [Portal](https://portal.solvemedia.com/), go there. Then, hover over **Configure** and press **Sites**. Press **New Site** and put some junk info in. It doesn't matter. Now, you should see your "website" on the list. Press the **Keys** button and there you'll see your *Challenge Key* and your *Verification Key*. If you can't get this to work, contact me on Discord `SantiagoMG#4289`.

# Installation

```
npm install solvemedia.js
```

# Usage

## Initialization

```javascript
const SolveMediaJS = require("solvemedia.js")

SolveMediaJS.login({

    "challengeKey": < Challenge Key Here >,
    "verificationKey": < Verification Key Here >

})
```

## Getting the Captcha image Object

```javascript
const captcha = SolveMediaJS.getCaptcha()
// => returns Object {
//     "url": < Captcha image URL >
//     "getBuffer": function getBuffer
//     "verify": function verify
// }
```

### Make a Decision

SolveMedia's API works in a way that once a captcha image URL has been requested, it can no longer be requested (it can, but it will show an image that says "media error"). That's why you'll have to choose between getting the `url` or executing `getBuffer` to get the image buffer. Take in account bots could request the URL so unless you're showing the image DIRECTLY to the user, the best option is probably to get the buffer.

## Verifying the user's answer

Once you've shown the captcha image to the user, it's time to verify their answer. Use the `verify` method to do that.

# API

## SolveMediaJS.login()

Set your SolveMedia API keys.

### Usage

```javascript
SolveMediaJS.login({

    "challengeKey": challengeKey,
    "verificationKey": verificationKey

})
```

### Types

`challengeKey`: string
`verificationKey`: string

### Return value

`undefined`

## SolveMediaJS.getCaptcha()

Get the captcha image and verification function.

### Usage

```javascript
SolveMediaJS.getCaptcha()
```
