# solvemedia.js

solvemedia.js is a wrapper to get captchas from the SolveMedia API!

# Quick example

A quick example as a CLI (which doesn't really make sense, but you get the idea).

```js
require("dotenv").config()
const open = require("open")
const inquirer = require("inquirer")
const { SolveMediaClient } = require("solvemedia.js")
const solvemedia = new SolveMediaClient()

;(async () => {
    await solvemedia.login(process.env.C_KEY, process.env.V_KEY, process.env.H_KEY)
    const challenge = await solvemedia.getChallenge()
    await challenge.writeImageToFile("./captcha.png")
    await open("./captcha.png")
    const { answer } = await inquirer.prompt([{
        name: "answer",
        message: "Type the content of the captcha:"
    }])
    const verified = await challenge.verify(answer)
    console.log(verified ? "Hello, human!" : "Beep boop!" )
})
```

# Getting your keys!

- Register/login at [SolveMedia](https://www.solvemedia.com/)
- If you aren't already there, go to the [Portal](https://portal.solvemedia.com/portal/)
- Hover over **Configure** and click on **Sites** [[?]](https://i.imgur.com/hzWFReH.png)
- Click on **New Site** [[?]](https://i.imgur.com/cEwb2W8.png)
- Enter whatever you want, and click on **Submit**
- You should now see your site in the list, click **Keys**
- Done! You should see a **Challenge Key**, a **Verification Key**, and an **Authentication Hash Key**!
- I recommend storing your authorization keys in a `.env` file and using a library like [`dotenv`](https://www.npmjs.com/package/dotenv), if your project is open source.

# Using URLs

In SolveMedia, once a client has requested the image of a certain challenge, it will start redirecting following requests to a ["media error" image](https://api-secure.solvemedia.com/media/media-error.gif).

This means that once you used, for example `Challenge#getImageBuffer()`, you won't be able to use `Challenge#writeImageToFile()` or `Challenge#getImageBuffer()` again on the same challenge; they will throw a `SolveMediaAPIError` with error code `IMAGE_USED`.

SolveMedia also requires for the image URL to be used before verifying it; not doing so will throw a `SolveMediaAPIError` with error code `IMAGE_UNUSED`.

# API

```js
const { SolveMediaClient } = require("solvemedia.js")
```

## SolveMediaClient

```js
new SolveMediaClient()
```

### login()

Store and validate your SolveMedia credentials.

#### Parameters

| name                  | description                                                    | type    | default |
|-----------------------|----------------------------------------------------------------|---------|---------|
| challengeKey          | Your challenge key                                             | string  |         |
| verificationKey       | Your verification key                                          | string  | `null`  |
| authenticationHashKey | Your authentication hash key                                   | string  | `null`  |
| validate              | Whether to validate the given key(s) by requesting a challenge | boolean | `true`  |

#### Returns

```
Promise<SolveMediaClient>
```

### getChallenge()

Obtain a challenge/captcha from the SolveMedia API.

#### Parameters

| name   | description                                                    | type    | default              |
|--------|----------------------------------------------------------------|---------|----------------------|
| userIP | The user's IP, to increase/decrease the difficulty accordingly | string  | `null` *(random IP)* |

#### Returns

```
Promise<Challenge>
```

## Challenge

You probably shouldn't initialize this class manually, use `SolveMediaClient#getChallenge()` instead.

```js
new Challenge()
```

### Constructor parameters

| name   | description                       | type   | default |
|--------|-----------------------------------|--------|---------|
| body   | The response body from SolveMedia | string |         |
| auth   | The client's authorization keys   | object |         |
| userIP | The user's IP                     | string |         |

### verify()

Verify the user's answer. *Requires the verification key to be stored.*

#### Parameters

| name                 | description                                                                          | type    | default |
|----------------------|--------------------------------------------------------------------------------------|---------|---------|
| answer               | The user's answer                                                                    | string  |         |
| authenticateResponse | Whether to authenticate SolveMedia's response (requires the authentication hash key) | boolean | `true`  |

#### Returns

```
Promise<boolean>
```

### getImageURL()

Get the URL of the image.

#### Parameters

| name               | description                       | type   | default    |
|--------------------|-----------------------------------|--------|------------|
| options            | Options to personalize the image  | object | `{}`       |
| options.width      | The width of the image            | number | `300`      |
| options.height     | The height of the image           | number | `150`      |
| options.foreground | The foreground color of the image | string | `"000000"` |
| options.background | The background color of the image | string | `"f8f8f8"` |

#### Returns

```
string
```

### getImageBuffer()

Get the image as a buffer.

#### Parameters

| name         | description                                                 | type   | default    |
|--------------|-------------------------------------------------------------|--------|------------|
| imageOptions | Options to personalize the image, passed to `getImageURL()` | object | `{}`       |

#### Returns

```
Promise<Buffer>
```

### writeImageToFile()

Write the image to a file, and consume the URL.

#### Parameters

| name         | description                                                 | type   | default    |
|--------------|-------------------------------------------------------------|--------|------------|
| path         | The path of the new file                                    | string |            |
| imageOptions | Options to personalize the image, passed to `getImageURL()` | object | `{}`       |

#### Returns

```
Promise<WritableStream>
```

## SolveMediaAPIError

Thrown when the response from SolveMedia is either invalid, or contains an error (for example, trying to verify a challenge without consuming its URL). The possible errors are:

- `UNKNOWN_ERROR` (`Unknown error: {...}`)
- `JSON_INVALID` (`Response body is not valid JSON.`)
- `BODY_INCOMPLETE` (`Response body does not contain the necessary values.`)
- `IMAGE_UNUSED` (`The image URL has to be used before verifying an answer.`)
- `IMAGE_USED` (`The image URL has already been used.`)
- `IP_INVALID` (`Invalid IP address.`)
- `CHALLENGE_ALREADY_VERIFIED` (`This challenge has already been verified.`)
- `CHALLENGE_INVALID` (`Invalid challenge ID.`)
- `CHALLENGE_EXPIRED` (`This challenge has expired.`)

### message

The error message.

### code

The error code.

## AuthorizationError *(extends SolveMediaAPIError)*

Thrown when the provided credentials are invalid or unavailable to the client. The possible errors are:

- `AUTH_MISSING` (`Credentials are unavailable.`)
- `CKEY_MISSING` (`Challenge key is unavailable.`)
- `CKEY_INVALID` (`Invalid challenge key.`)
- `VKEY_MISSING` (`Verification key is unavailable.`)
- `VKEY_INVALID` (`Invalid verification key.`)
- `HKEY_MISSING` (`Authentication hash key is unavailable.`)
- `RESPONSE_NOT_AUTHENTIC` (`The response is not authentic, or the authentication hash key is invalid.`)