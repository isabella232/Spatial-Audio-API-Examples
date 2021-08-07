const fetch = require('node-fetch');
const { default: SignJWT } = require('jose/jwt/sign');
const { jwtVerify } = require('jose/jwt/verify');
const { JWTExpired } = require('jose/util/errors');
const express = require('express');
const crypto = require('crypto');

// This is your "webhook-secret" as you have set from the High Fidelity REST API. Do not share this string.
const WEBHOOK_SECRET = "aaaaaaaa-1111-bbbb-2222-cccccccccccc";
const WEBHOOK_SECRET_KEY = crypto.createSecretKey(Buffer.from(WEBHOOK_SECRET, "utf8"));
// This is your test webhook endpoint URL as you have created on Pipedream, which will allow you to test receiving webhook events from your High Fidelity Spatial Audio app. Do not share this URL.
const PIPEDREAM_WEBHOOK_ENDPOINT = "https://aaaabbbbaaaabbbbaaaabbbbaaaabbbb.m.pipedream.net";
// This is your API key as obtained from your Pipedream account settings. Do not share this string.
const PIPEDREAM_AUTHORIZATION_TOKEN = "aaaabbbbaaaabbbbaaaabbbbaaaabbbb";
// Poll received webhook events from the remote Pipedream endpoint at this frequency.
const PIPEDREAM_POLL_RATE_SECONDS = 60;
// If set to a positive number, this server will accept expired webhook events this many seconds expired. This should be 0 on production servers. For testing purposes only, such as to replay webhook events, set to a large number (ex: 9999999999).
const EXPIRATION_TOLERANCE_SECONDS = 0;

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.json());

const FAKE_SECRET_KEY = crypto.createSecretKey(Buffer.from("fake_secret_aaaabbbbaaaabbbbaaaabbbb", "utf8"));
async function validateWebhookEvent(payload, hifiSignature) {
    try {
        let fakeJWT = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .sign(FAKE_SECRET_KEY);

        let realWebhookEventJWT = hifiSignature.split(".")[0] + "." +
            fakeJWT.split(".")[1] + "." +
            hifiSignature.split(".")[2];
        await jwtVerify(realWebhookEventJWT, WEBHOOK_SECRET_KEY, {"clockTolerance": EXPIRATION_TOLERANCE_SECONDS});

        return true;
    } catch (error) {
        console.error(`Webhook payload is invalid. Error:\n${error}`);
    }
    return false;
}

function getRecomputedClientData(statsPerSpace) {
    let statsPerSpaceClientData = [];
    for (let spaceStats of Object.values(statsPerSpace)) {
        let spaceStatsClientData = {
            "space-id": spaceStats.spaceID,
            "connected-user-count": spaceStats.connectedUserCount,
            "unique-session-count": Object.values(spaceStats.visitIdHashesSeen).length
        };
        statsPerSpaceClientData.push(spaceStatsClientData);
    }
    return statsPerSpaceClientData;
}

let statsPerSpaceClientData = [];
let statsPerSpace = {};

// This processes webhook events and stores them in statsPerSpace
async function processWebhookEvent(headers, payload, recomputeClientData) {
    if (!headers["x-highfidelity-signature"]) {
        // This can happen if the user is sending their own requests to the webhook
        console.error("Webhook event header is invalid. Missing signature: x-highfidelity-signature");
        return false;
    }
    if ((await validateWebhookEvent(payload, headers["x-highfidelity-signature"])) &&
            payload["event-type"] === "connection-change") {
        let spaceID = payload["space-id"];
        let spaceStats = statsPerSpace[spaceID];
        if (spaceStats === undefined) {
            spaceStats = {};
            spaceStats.connectedUserCount = 0;
            spaceStats.visitIdHashesSeen = {};
            spaceStats.latestEvent = 0;
            spaceStats.spaceID = spaceID;
            statsPerSpace[spaceID] = spaceStats;
        }
        if (spaceStats.latestEvent <= payload["iat"]) {
            spaceStats.connectedUserCount = payload["connected-user-count"];
            spaceStats.latestEvent = payload["iat"];
        }
        for (let connectionChange of payload["connection-changes"]) {
            spaceStats.visitIdHashesSeen[connectionChange["visit-id-hash"]] = true;
        }

        if (recomputeClientData) {
            statsPerSpaceClientData = getRecomputedClientData(statsPerSpace);
        }
        return true;
    }
    return false;
}

async function fetchPipedreamSourceID() {
    let requestPath = "https://api.pipedream.com/v1/users/me/sources";
    console.log("GET " + requestPath);
    const response = await fetch(requestPath, {
        headers: { "Authorization": `Bearer ${PIPEDREAM_AUTHORIZATION_TOKEN}` }
    });
    let responseJSON = await response.json();

    let id = undefined;
    for (let datum of Object.values(responseJSON["data"])) {
        let config = datum["configured_props"];
        if (!config) {
            continue;
        }
        let httpConfig = config["http"];
        if (!httpConfig) {
            continue;
        }
        let endpointURL = httpConfig["endpoint_url"];
        if (endpointURL && endpointURL === PIPEDREAM_WEBHOOK_ENDPOINT) {
            id = datum["id"];
            break;
        }
    }
    return id;
}

let lastPipedreamEventID = undefined;

async function pollPipedreamEvents(pipedreamSourceID) {
    let requestPath = `https://api.pipedream.com/v1/sources/${pipedreamSourceID}/event_summaries?expand=event&limit=100`
    // Only parse events after lastPipedreamEventID, if it is defined
    if (lastPipedreamEventID !== undefined) {
        requestPath += `&after=${lastPipedreamEventID}`
    }
    const response = await fetch(requestPath, {
        headers: { "Authorization": `Bearer ${PIPEDREAM_AUTHORIZATION_TOKEN}` }
    });
    console.log("GET " + requestPath);
    let responseJSON = await response.json();

    let webhookEvents = [];
    try {
        if (responseJSON["page_info"]["count"] > 0) {
            for (let datum of Object.values(responseJSON["data"])) {
                webhookEvents.push({
                    "headers": datum["event"]["headers"],
                    "body": datum["event"]["body"]
                });
            }

            // Update our memory of the last webhook event we have processed
            lastPipedreamEventID = responseJSON["page_info"]["end_cursor"];
        }
    } catch (error) {
        console.error(`Unable to parse data from Pipedream. Error:\n${error}`);
        return;
    }

    if (webhookEvents.length > 0) {
        let numWebhooksParsed = 0;
        console.log(`Received ${webhookEvents.length} candidate webhook events from Pipedream`);
        for (let webhookEvent of webhookEvents) {
            let webhookProcessed = await processWebhookEvent(webhookEvent["headers"], webhookEvent["body"], false);
            numWebhooksParsed += webhookProcessed ? 1 : 0;
        }
        if (numWebhooksParsed > 0) {
            statsPerSpaceClientData = getRecomputedClientData(statsPerSpace);
        }
        console.log(`Accepted ${numWebhooksParsed} webhook events from Pipedream`);
    } else {
        console.log(`Already up-to-date on webhook events`);
    }
}

if (EXPIRATION_TOLERANCE_SECONDS > 0) {
    console.log("WARNING: Accepting expired webhook events");
}

// This code queries Pipedream for webhook events it has stored 
fetchPipedreamSourceID().then((pipedreamSourceID) => {
    if (pipedreamSourceID) {
        pollPipedreamEvents(pipedreamSourceID).then(() => {
            setInterval(() => { pollPipedreamEvents(pipedreamSourceID); }, PIPEDREAM_POLL_RATE_SECONDS * 1000);
        });
    }
});

// This renders the stats page
app.get('/', async (req, res) => {
    res.render('index', {
        spaceStatsList: Object.values(statsPerSpaceClientData),
        statsFetchIntervalMs: 5 * 1000
    });
});
// This is queried by the stats page to update space stats
app.get('/space-stats', async(req, res) => {
    res.send({"space-stats-list": Object.values(statsPerSpaceClientData)});
});
// This is an example webhook endpoint that can receive and process webhook events on its own
app.post('/webhook-endpoint', async (req, res) => {
    let webhookProcessed = await processWebhookEvent(req.headers, req.body, true);
    if (webhookProcessed) {
        res.status(200).send({"status": "ok"});
        console.log(`Parsed a webhook event from the endpoint`);
    } else {
        res.status(400).send({"status": "bad-request"});
    }
});

app.listen(PORT, () => {
    console.log(`The High Fidelity Sample App is ready and listening at http://localhost:${PORT}`)
});
