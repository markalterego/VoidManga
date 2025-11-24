import axios from 'axios';
import { setTimeout } from "timers/promises";
import dotenv from 'dotenv';
import open from 'open';
import express from 'express';
import { writeEnv } from '../filehandling/filehandle.js';

dotenv.config();

async function testFetching() {
    console.log('\n>> Fetching... >>');
    // await fetchMangaUpdatesAPI();

    // TODO:
    // - use calculated expiry dates in a way that e.g. when starting app, tokens
    //   are retrieved right away, if either one is old enough, along 
    //   with retrieving mal.file data. Most likely it won't happen but
    //   in case the refresh_token is old, make the user go through the 
    //   authentication process again either right away or later somewhere
    //   else in the app.

    const code_verifier = generateCodeVerifier(); // used for code_challenge
    const authorization_code = await fetchAuthorizationCode(code_verifier); // returns authorization_code
    // <-- define logic which avoids fetching tokens completely if 
    //     authorization_code is not defined
    let tokens = await fetchTokens(code_verifier, authorization_code); // returns access_token + refesh_token
    // as long as refreshTokens is ran at least once a month and older
    // tokens are re-written each time, strictly in theory, the user will
    // never have to go through the authentication process from start again
    // after going through it once
    tokens = await refreshTokens(tokens.REFRESH_TOKEN); // returns access_token + refresh_token
    writeEnv(tokens); // write found tokens to env
}

async function fetchMangaUpdatesAPI() {
    try {
        const startTime = performance.now(); // starting timing fetch
        const response = await axios.post('https://api.mangaupdates.com/v1/series/search', {
            search: 'frieren',
            stype: 'title',
        },
        {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        console.log(response.data);
        const fetchTimeTaken = Math.round(performance.now()-startTime); // time it took to fetch

        const resultArr = response.data.results; // saving results to array
        resultArr.forEach((value) => {
            let recordsKeys = [], metadataKeys = [];
            let records = [], metadata = [];
            for (const key in value.record) {
                if (typeof value.record[key] === 'object') {
                    for (const key2 in value.record[key]) {
                        if (typeof value.record[key][key2] === 'object') {
                            for (const key3 in value.record[key][key2]) {
                                recordsKeys.push(key3);
                                records.push(value.record[key][key2][key3]);
                            }
                        } else {
                            recordsKeys.push(key2);
                            records.push(value.record[key][key2]);
                        }
                    }
                } else {
                    recordsKeys.push(key);
                    records.push(value.record[key]);
                }
            }
            for (const key in value.metadata) {
                if (typeof value.metadata[key] === 'object') {
                    for (const key2 in value.metadata[key]) {
                        if (typeof value.metadata[key][key2] === 'object') {
                            for (const key3 in value.metadata[key][key2]) {
                                metadataKeys.push(key3);
                                records.push(value.metadata[key][key2][key3]);
                            }
                        } else {
                            metadataKeys.push(key2);
                            records.push(value.metadata[key][key2]);
                        }
                    }
                } else {
                    metadataKeys.push(key);
                    records.push(value.metadata[key]);
                }
            }
            console.log(`\n${value.hit_title}:\n`);
            records.forEach((value,index) => console.log(`> ${recordsKeys[index]} - ${value}`));
            metadata.forEach((value,index) => console.log(`> ${metadataKeys[index]} - ${value}`));
        });

        console.log(`\n> ${fetchTimeTaken}ms`); // logging time taken by fetch
        if (fetchTimeTaken < 200) await setTimeout(200-fetchTimeTaken); // avoiding fetching too often
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

function generateCodeVerifier() {
    // min length 43, max length 128
    // consists of [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    let code_verifier = ''; // code verifier
    const min_length = 43, max_length = 128, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const lengthOfString = Math.floor((Math.random() * (max_length-min_length+1))) + min_length; // num between min-max  
    // generate random length string consisting of allowed characters
    for (let i = 0; i < lengthOfString; i++) {
        code_verifier += chars.charAt(Math.floor(Math.random() * chars.length)); // take random allowed char
    }
    return code_verifier; // return code_verifier
}

async function fetchAuthorizationCode (code_verifier) { 
    /*
    https://myanimelist.net/v1/oauth2/authorize?
    response_type=code <-- required - must be string = 'code'
    &client_id=YOUR_CLIENT_ID <-- required - client id at .env
    &state=YOUR_STATE <-- recommended - honestly idk how this works yet/what's it's purpose...
    &redirect_uri=YOUR_REDIRECT_URI <-- optional - only necessary if multiple uris defined at https://myanimelist.net/apiconfig
    &code_challenge=YOUR_PKCE_CODE_CHALLENGE <-- required - more info at bottom of file
    &code_challenge_method=plain <-- optional/unnecessary - only supports string = 'plain' AND defaults to string = 'plain' when not set, as of 20251123
    HTTP/1.1
    Host: YOUR_HOST_URL

    code_challenge doesn't need to be modified as only plain is currently supported
    plain --> code_challenge = code_verifier 
    */
    let authorization_code = '';
    try {
        const base_url = 'https://myanimelist.net/v1/oauth2/authorize?';
        const params = {
            response_type: 'code',
            client_id: process.env.MAL_API_CLIENT_ID, 
            code_challenge: code_verifier, 
        };
        const url = base_url + new URLSearchParams(params).toString(); // authentication url
        await open(url); // open authorization page in browser
        authorization_code = await waitForCallback(); // waits for callback servers response
    } catch (error) {
        if (error.response) {
            const data = error.response?.data;
            console.error(`\n||\n|| Error: ${error.status}: ${data.error}: ${data.message} ${data.hint}\n||`);            
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
    return authorization_code;
}

async function waitForCallback() {
    // callback server is used solely for receiving the authorization_code 
    // which is sent by MAL after the user has authorized the current "computer"
    // through the authorization page
    const app = express(), server = app.listen(3000);
    return await new Promise((resolve, reject) => {
        // assign 60s timeout on server
        const timeout = globalThis.setTimeout(() => {  
            server.close(() => reject(new Error('timeout 60s')));
        }, 60000);
        // route definition
        app.get('/callback', (req, res) => {
            const query = req.query; // received data
            clearTimeout(timeout); // clear timeout
            // show response on browser
            if (query.code) {
                res.send('Authorization received. You can close this window.');
            } else { 
                res.send(`Error: ${query.error}: ${query.message}`);
            };
            // close server
            server.close(() => {
                query.code ? resolve(query.code): 
                             reject(new Error(`${query.error}: ${query.message}`));
            });
        });
    });
}

async function fetchTokens (code_verifier, authorization_code) {
    /* 
    Scheme 1: the HTTP Basic authentication

    MyAnimeList supports the HTTP Basic authentication scheme as defined in RFC2617 to authenticate with the authorization server.
    client_id is used as the username; client_secret is used as the password.
    (If your client doesn’t have a client secret, client_secret will be an empty.)

    POST https://myanimelist.net/v1/oauth2/token HTTP/1.1
    Host: server.example.com
    Authorization: Basic exampleEXAMPLEeXaMpLeExAmPlE
    Content-Type: application/x-www-form-urlencoded

    client_id=YOUR_CLIENT_ID <-- required - the client id stored at .env
    &grant_type=authorization_code <-- required - has to be set to string = 'authorization_code'
    &code=AUTHORIZATION_CODE <-- required - the authorization_code received at fetchAuthorizationCode
    &redirect_uri=YOUR_REDIRECT_URI <-- optional - doesn't serve a purpose when fetching tokens as redirection doesn't happen
    &code_verifier=YOUR_PKCE_CODE_VERIFIER <-- required - the code_verifier used to create code_challenge (when plain, code_challenge = code_verifier)
    */
    let tokens = {}; 
    try {
        const base_url = 'https://myanimelist.net/v1/oauth2/token';
        const data = new URLSearchParams({
            client_id: process.env.MAL_API_CLIENT_ID,
            grant_type: 'authorization_code',
            code: authorization_code,
            code_verifier: code_verifier
        });
        const response = await axios.post(base_url, data.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        /*
            tokens: {
                token_type: STRING,
                expires_in: NUMBER,
                access_token: STRING,
                refresh_token: STRING
            }
        */
        tokens = response.data;
        // includes token_expires_at for both tokens
        tokens = setTokenExpiryDates(tokens);
    } catch (error) {
        if (error.response) {
            const data = error.response?.data;
            console.error(`\n||\n|| Error: ${error.status}: ${data.error}: ${data.message} ${data.hint}\n||`);            
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    } 
    await setTimeout(100); // avoid rate-limit
    return tokens;
}

async function refreshTokens (refresh_token) {
    // Function is supposed to be used when an access_token
    // has expired. Function takes in a refresh_token and passes
    // it to the .../token endpoint. A successful fetch to the
    // endpoint will return new tokens, the same way as fetchTokens does.
    let tokens = {}; 
    try {
        const base_url = 'https://myanimelist.net/v1/oauth2/token';
        const data = new URLSearchParams({
            client_id: process.env.MAL_API_CLIENT_ID, // required - client_id stored at .env
            grant_type: 'refresh_token', // required - must be string -> 'refresh_token'
            refresh_token: refresh_token // required - must be string -> refresh_token retreived by fetchTokens
        });
        const response = await axios.post(base_url, data.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        /*
            tokens: {
                token_type: STRING,
                expires_in: NUMBER,
                access_token: STRING,
                refresh_token: STRING
            }
        */
        tokens = response.data; 
        // includes token_expires_at for both tokens
        tokens = setTokenExpiryDates(tokens);
    } catch (error) {
        if (error.response) {
            const data = error.response?.data;
            console.error(`\n||\n|| Error: ${error.status}: ${data.error}: ${data.message} ${data.hint}\n||`);            
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    } 
    await setTimeout(100); // avoid rate-limit
    return tokens;
}

function setTokenExpiryDates (tokens) {
    // access_token (at) stuff (expires in ~1 hour)
    const at_expires_at = Date.now() + tokens.expires_in - 300000; // access_token expires at - 5 minutes
    delete tokens.expires_in; // remove unnecessary key-value pair
    delete tokens.token_type; // -||- 
    // refresh_token (rt) stuff (expires in ~1 month)
    const dayInMs = 1000 * 60 * 60 * 24; // day in milliseconds
    const monthInMs = dayInMs * 30; // month in milliseconds
    const rt_expires_at = Date.now() + monthInMs - dayInMs; // refresh_token expires at - 1 day
    // include at + rt with new expires_at dates to tokens
    return tokens = {
        ACCESS_TOKEN: tokens.access_token, // access_token
        ACCESS_TOKEN_EXPIRES_AT: at_expires_at, // time now (utc) + 1 hour - 5 minutes
        REFRESH_TOKEN: tokens.refresh_token, // refresh_token
        REFRESH_TOKEN_EXPIRES_AT: rt_expires_at // time now (utc) + 1 month - 1 day
    }
}
/*
[RFC 7636]

4.1.  Client Creates a Code Verifier

   The client first creates a code verifier, "code_verifier", for each
   OAuth 2.0 [RFC6749] Authorization Request, in the following manner:

   code_verifier = high-entropy cryptographic random STRING using the
   unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
   from Section 2.3 of [RFC3986], with a minimum length of 43 characters
   and a maximum length of 128 characters.

   ABNF for "code_verifier" is as follows.

   code-verifier = 43*128unreserved
   unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
   ALPHA = %x41-5A / %x61-7A
   DIGIT = %x30-39

   NOTE: The code verifier SHOULD have enough entropy to make it
   impractical to guess the value.  It is RECOMMENDED that the output of
   a suitable random number generator be used to create a 32-octet
   sequence.  The octet sequence is then base64url-encoded to produce a
   43-octet URL safe string to use as the code verifier.

4.2.  Client Creates the Code Challenge

   The client then creates a code challenge derived from the code
   verifier by using one of the following transformations on the code
   verifier:

   plain
      code_challenge = code_verifier

   S256
      code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))

   If the client is capable of using "S256", it MUST use "S256", as
   "S256" is Mandatory To Implement (MTI) on the server.  Clients are
   permitted to use "plain" only if they cannot support "S256" for some
   technical reason and know via out-of-band configuration that the
   server supports "plain".

   The plain transformation is for compatibility with existing
   deployments and for constrained environments that can't use the S256
   transformation.


[RFC 3986]

2.3.  Unreserved Characters

   Characters that are allowed in a URI but do not have a reserved
   purpose are called unreserved.  These include uppercase and lowercase
   letters, decimal digits, hyphen, period, underscore, and tilde.

      unreserved  = ALPHA / DIGIT / "-" / "." / "_" / "~"
   
   URIs that differ in the replacement of an unreserved character with
   its corresponding percent-encoded US-ASCII octet are equivalent: they
   identify the same resource.  However, URI comparison implementations
   do not always perform normalization prior to comparison (see Section
   6).  For consistency, percent-encoded octets in the ranges of ALPHA
   (%41-%5A and %61-%7A), DIGIT (%30-%39), hyphen (%2D), period (%2E),
   underscore (%5F), or tilde (%7E) should not be created by URI
   producers and, when found in a URI, should be decoded to their
   corresponding unreserved characters by URI normalizers.


- Understanding OAuth 2.0 -

So you do the steps, you get an authorization token which you use once
to receive an access token along with a refresh token. Until the access 
token expires etc. you can use that token to communicate with the api. 
When the former expires, you then use the refresh token solely for the 
purpose for getting new tokens that you can again use for a limited
period of time. You only start the whole process again from the beginning 
in case you don't get a new refresh_token at least once a month, as that
is the amount of time it takes for a refresh_token to expire.
*/

export { testFetching };
