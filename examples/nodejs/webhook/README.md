# Express Webhook Endpoint Example

This is a webserver using NodeJS + Express which behaves as a webhook. It demonstrates how to receive and verify webhook events for a [High Fidelity Spatial Audio App](https://www.highfidelity.com/guides-getting-started-with-spatial-audio-api-documentation-high-fidelity). Webhooks can monitor when users connect and disconnect from any spaces in an app.

## Setting up the webserver

- `npm` and `node` must be installed and available from the command line in order to run this webserver. This example has been tested with `npm` version 6 and `node` version 14.
- Run `npm install` in this directory to install required dependencies
- Run `npm run start` in this directory to start the webserver. You should see: "The High Fidelity Webhook Endpoint Example is ready and listening at http://localhost:8080". This webserver will now receive and verify webhook events at `http://localhost:8080/` using the the `WEBHOOK_SECRET` variable to validate event signatures, and print the results to the console.

## Notes on setting up the webserver for production

In order for a production webserver to receive webhook events, the server must be publicly accessible to the internet from the port that the server is running on, and the server must be reachable from a public IP address or domain name.

In order for webhook events to be sent to your production webserver, you will need:

- [A High Fidelity Developer Account](https://account.highfidelity.com/dev/account)
- A High Fidelity Spatial Audio App on that account that you would like to receive events for
- [A webhook secret of your choice must be set for your app](https://docs.highfidelity.com/rest/latest/index.html#tag/Apps/paths/~1api~1v1~1app~1{app_id}~1settings/post)
- Use the webhook secret to validate incoming webhook events. If you are using this example, that means you should edit `index.js` so the value of `WEBHOOK_SECRET` is the webhook secret for your app, and then restart the webserver.
- [A webhook must created for the app](https://docs.highfidelity.com/rest/latest/index.html#tag/Apps/paths/~1api~1v1~1app~1{app_id}~1settings~1webhooks~1create/post), using the URL from which your webserver can be reached

## How the webserver works, using some example data

Once you have learned how to set up the High Fidelity Webhook Endpoint Example on your local machine from the default port `8080`, the steps below will show how to send an example webhook event to the webserver using `curl`. This `curl` command works when the `WEBHOOK_SECRET` in `index.js` is set to `aaaaaaaa-1111-bbbb-2222-cccccccccccc` (this is its initial value).

- Start the webserver in this directory with the command `npm run start`
- In another command line window, run this `curl` command, which sends an example webhook event:

    ```
    curl -H "X-HighFidelity-Signature: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..XG_FvBwdqUS9TCTdZBT0htvEeUsuLmwWFwjVPdJdFBI" -H "Content-Type: application/json" --data '{"event-type":"connection-change","iat":1629147418,"exp":1660683418,"space-id":"ace3c85a-703b-6cb4-e541-2a140f9087cd","connected-user-count":1,"connection-changes":[{"visit-id-hash":"riH6LPNViJxfGSQ8z37wAf5yYJmuRiReeAAaMO92S1j=","jwt-user-id":"","new-connection-state":"connected"}]}' http://localhost:8080
    ```

    If this example webhook event is sent before the expiration time, `2022-08-16 20:56:58.420181` (UTC time), you should see the following reply:

    ```
    {"status":"ok"}
    ```

    And the following message will be in your webserver console:

    ```
    Successfully parsed a webhook event from the endpoint:
    {"event-type":"connection-change","iat":1629237185,"exp":1660773185,"space-id":"ace3c85a-703b-6cb4-e541-2a140f9087cd","connected-user-count":1,"connection-changes":[{"visit-id-hash":"riH6LPNViJxfGSQ8z37wAf5yYJmuRiReeAAaMO92S1j=","jwt-user-id":"","new-connection-state":"connected"}]}
    ```

    If this example webhook event is sent after the expiration time, you should instead see the following reply:

    ```
    {"status":"bad-request"}
    ```

    And the following message will instead be in your webserver console:
    
    ```
    Webhook payload is invalid. Error:
    JWTExpired: "exp" claim timestamp check failed
    ```

    To prevent unauthorized resending of data, webhook events contain this expiration time field (`exp`). Unlike the example webhook event above, real webhook events expire shortly after they are created.

    For testing purposes only, in `index.js`, `EXPIRATION_TOLERANCE_SECONDS` can be adjusted to alter what webhook events the webserver considers expired.

## The example webhook event explained

The webhook event in the `curl` command example has two parts: the signature and the JSON payload.

This is the signature of the example webhook event, which appears as an HTTP header in the webhook event:

```
X-HighFidelity-Signature: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..XG_FvBwdqUS9TCTdZBT0htvEeUsuLmwWFwjVPdJdFBI
```

In `index.js`, the function `parseAndValidateWebhookEvent` is used to compare this signature with the JSON payload, using the `WEBHOOK_SECRET`. This signature is a JWT (JSON Web Token) with the base4url-encoded payload removed from the middle, in favor of the JSON payload.

This is the JSON payload, which appears in the request body of the webhook event:

```
{
  "event-type": "connection-change",
  "iat": 1629237185,
  "exp": 1660773185,
  "space-id": "ace3c85a-703b-6cb4-e541-2a140f9087cd",
  "connected-user-count": 1,
  "connection-changes": [
    {
      "visit-id-hash": "riH6LPNViJxfGSQ8z37wAf5yYJmuRiReeAAaMO92S1j=",
      "jwt-user-id": "",
      "new-connection-state": "connected"
    }
  ]
}

```

This particular webhook event is for the first user connecting to a space. Here are the meanings of its fields ("claims" in JWT jargon):

- `event-type` - A value of `connection-change` indicates that this event was fired in response to a user connecting or disconnecting from a space
- `iat` - The creation time of this event, measured in whole seconds since the Unix epoch.
- `exp` - The expiration time of this event, measured in whole seconds since the Unix epoch. JWT implementations will reject this event if this time is in the past.
- `space-id` - The unique ID of the space where the client connection/disconnection occurred
- `connected-user-count` - The new number of connected users after the event
- `connection-changes` - A list of user connects/disconnects for this event
    - `visit-id-hash`- The unique hash of the user's session that connected or disconnected
    - `jwt-user-id` - The user ID string as defined by your app. This string may be empty.
    - `new-connection-state` - Either connected or disconnected

## Author
Sabrina Shanman
