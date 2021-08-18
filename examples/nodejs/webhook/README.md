# Express Webhook Endpoint Example

This is a webserver using NodeJS + Express which behaves as a webhook. It demonstrates how to receive and verify webhook events for a [High Fidelity Spatial Audio App](https://www.highfidelity.com/guides-getting-started-with-spatial-audio-api-documentation-high-fidelity). Webhooks can monitor when users connect and disconnect from any spaces in an app.

## Usage

- `npm` and `node` must be installed and available from the command line in order to run this webserver. This example has been tested with `npm` version 6 and `node` version 14.
- Run `npm install` in this directory to install required dependencies
- Edit `index.js` so the value of `WEBHOOK_SECRET` is the secret you have set for your app in the [High Fidelity Administrative REST API Docs](https://docs.highfidelity.com/rest/latest/index.html#tag/Apps/paths/~1api~1v1~1app~1{app_id}~1settings/post)
- Run `npm run start` in this directory to start the webserver. You should see: "The High Fidelity Webhook Endpoint Example is ready and listening at http://localhost:8080". This webserver will now receive and verify webhook events at `http://localhost:8080/` using the provided `WEBHOOK_SECRET`, and print the results to the console.

In order for a production webserver to receive webhook events, [a webhook must created for the spatial audio app](https://docs.highfidelity.com/rest/latest/index.html#tag/Apps/paths/~1api~1v1~1app~1{app_id}~1settings~1webhooks~1create/post).

## Mock Usage

Once you have set up the webserver, the steps below will show how to send a mock webhook event to the webserver using `curl`

- Stop the webserver if it is running.
- Edit `index.js` and set the value of `WEBHOOK_SECRET` to `fb6f66df-9ace-4764-9d6e-ab786e7bf669`
    - This is a mock secret for this test only, and should not be used for your app.
- Start the webserver in this directory with the command `npm run start`
- In another command line window, run this `curl` command to send a mock webhook event:

    ```
    curl -H "X-HighFidelity-Signature: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..0OjCwGidT8rzXX01xBBLcpRy05nex6i5fqYTz8mecbw " -H "Content-Type: application/json" --data '{"event-type":"connection-change","iat":1629147418,"exp":1660683418,"space-id":"ace3c85a-703b-6cb4-e541-2a140f9087cd","connected-user-count":1,"connection-changes":[{"visit-id-hash":"riH6LPNViJxfGSQ8z37wAf5yYJmuRiReeAAaMO92S1j=","jwt-user-id":"","new-connection-state":"connected"}]}' http://localhost:8080
    ```

    If this mock webhook event is sent before the expiration time, `2022-08-16 20:56:58.420181` (UTC time), you should see the following reply:

    ```
    {"status":"ok"}
    ```

    And the following message will be in your webserver console:

    ```
    Successfully parsed a webhook event from the endpoint:
    {"event-type":"connection-change","iat":1629237185,"exp":1660773185,"space-id":"ace3c85a-703b-6cb4-e541-2a140f9087cd","connected-user-count":1,"connection-changes":[{"visit-id-hash":"riH6LPNViJxfGSQ8z37wAf5yYJmuRiReeAAaMO92S1j=","jwt-user-id":"","new-connection-state":"connected"}]}
    ```

    If this mock webhook event is sent after the expiration time, you should instead see the following reply:

    ```
    {"status":"bad-request"}
    ```

    And the following message will instead be in your webserver console:
    
    ```
    Webhook payload is invalid. Error:
    JWTExpired: "exp" claim timestamp check failed
    ```

    To prevent unauthorized resending of data, webhook events contain this expiration time field (`exp`). Unlike the mock webhook event above, real webhook events expire shortly after they are created.

    For testing purposes only, in `index.js`, `EXPIRATION_TOLERANCE_SECONDS` can be adjusted to alter what webhook events the webserver considers expired.

## Author
Sabrina Shanman
