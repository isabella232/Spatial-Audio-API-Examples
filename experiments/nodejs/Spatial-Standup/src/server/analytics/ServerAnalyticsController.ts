const { Client } = require('pg')
const auth = require('../../../auth.json');
const googleServiceAccountCreds = require('../../../google-service-account.json');
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const { google } = require('googleapis');
const googleSheets = google.sheets('v4');

export enum ServerAnalyticsEventCategory {
    ServerStartup = "Server Started Up",
    SlackBotAdded = "Slack Bot Added",
    SlackBotInstallerInfoCollected = "Slack Bot Installer Info Collected",
    SlackBotAdminInfoCollected = "Slack Bot Admin Info Collected",
    SlackBotUsed = "Slack Bot Used",
    UserConnected = "User Connected",
    UserDisconnected = "User Disconnected",
}

export class ServerStartupEvent {
    constructor() { }
}
export class SlackBotAddedEvent {
    teamName: string;
    teamID: string;
    
    constructor(teamName: string, teamID: string) {
        this.teamName = teamName;
        this.teamID = teamID;
    }
}
export class SlackBotInstallerInfoCollectedEvent {
    info: any;

    constructor(info: any) {
        this.info = info;
    }
}
export class SlackBotAdminInfoCollectedEvent {
    info: any;

    constructor(info: any) {
        this.info = info;
    }
}
export class SlackBotUsedEvent {
    user_id: string;
    team_id: string;
    containedExplicitRoomName: boolean;

    constructor(user_id: string, team_id: string, containedExplicitRoomName: boolean) {
        this.user_id = user_id;
        this.team_id = team_id;
        this.containedExplicitRoomName = containedExplicitRoomName;
    }
}
export class UserConnectedOrDisconnectedEvent {
    spaceName: string;
    userUUID: string;
    sessionStartTimestamp: number;

    constructor(spaceName: string, userUUID: string, sessionStartTimestamp: number) {
        this.spaceName = spaceName;
        this.userUUID = userUUID;
        this.sessionStartTimestamp = sessionStartTimestamp;
    }
}

export class ServerAnalyticsController {
    postgresClient: any;
    googleJWTClient: any;
    googleJWTClientAuthorizationFailed: boolean = false;
    googleJWTClientAuthorized: boolean = false;
    googleStartupRequests: Array<Array<any>> = [];

    constructor() {
        if (!(auth.ANALYTICS_POSTGRES_DB_USER && auth.ANALYTICS_POSTGRES_DB_HOST && auth.ANALYTICS_POSTGRES_DB_DATABASE && auth.ANALYTICS_POSTGRES_DB_PASSWORD && auth.ANALYTICS_POSTGRES_DB_PORT)) {
            console.warn(`No PostgreSQL auth credentials! Analytics will not be logged to PostgreSQL.`);
        } else {
            // You must have already created the database specified by "database" here.
            let clientAuth = {
                user: auth.ANALYTICS_POSTGRES_DB_USER,
                host: auth.ANALYTICS_POSTGRES_DB_HOST,
                database: auth.ANALYTICS_POSTGRES_DB_DATABASE,
                password: auth.ANALYTICS_POSTGRES_DB_PASSWORD,
                port: auth.ANALYTICS_POSTGRES_DB_PORT,
            };
            this.postgresClient = new Client(clientAuth);

            this.connectToDB();
        }

        if (!(auth.ANALYTICS_GOOGLE_SHEET_ID && auth.ANALYTICS_GOOGLE_SHEET_ID.length > 0)) {
            this.googleJWTClientAuthorizationFailed = true;
            console.warn(`No \`auth.ANALYTICS_GOOGLE_SHEET_ID\`! Analytics will not be logged to Google Sheets.`);
        } else if (!(googleServiceAccountCreds && googleServiceAccountCreds.client_email && googleServiceAccountCreds.private_key)) {
            this.googleJWTClientAuthorizationFailed = true;
            console.warn(`No "googleServiceAccountCreds"! Analytics will not be logged to Google Sheets.`);
        } else {
            this.googleJWTClient = new google.auth.JWT(
                googleServiceAccountCreds.client_email,
                null,
                googleServiceAccountCreds.private_key,
                GOOGLE_SCOPES);
            this.googleJWTClient.authorize(async (err: any, tokens: any) => {
                if (err) {
                    this.googleJWTClientAuthorizationFailed = true;
                    console.error(`Couldn't authorize with Google. Error:\n${JSON.stringify(err)}`);
                    return;
                } else {
                    this.googleJWTClientAuthorized = true;
                    console.log("Successfully authorized with Google!");

                    this.googleStartupRequests.forEach(async (request) => {
                        this.logEventGoogleSheets(<ServerAnalyticsEventCategory>request[0], request[1]);
                    });
                    this.googleStartupRequests = [];
                }
            });
        }
    }

    async maybeCreateTable() {
        const checkTableText = `SELECT to_regclass('analytics.events');`
        const result = await this.postgresClient.query(checkTableText);

        if (result.rows[0]["to_regclass"] === null) {
            const createTableText = `CREATE TABLE analytics.events
(
    id serial NOT NULL,
    "timestamp" timestamp with time zone,
    category text,
    details text,
    PRIMARY KEY (id)
);`
            await this.postgresClient.query(createTableText);
        }
    }

    async connectToDB() {
        await this.postgresClient.connect();

        await this.maybeCreateTable();

        this.logEvent(ServerAnalyticsEventCategory.ServerStartup);
    }

    async logEventGoogleSheets(category: ServerAnalyticsEventCategory, data: Array<string>) {
        if (this.googleJWTClientAuthorizationFailed) {
            return;
        }

        if (!this.googleJWTClientAuthorized) {
            this.googleStartupRequests.push([category, data]);
            return;
        }

        const request = {
            spreadsheetId: auth.ANALYTICS_GOOGLE_SHEET_ID,
            range: category, // Sheet name
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [data]
            },
            auth: this.googleJWTClient,
        };

        try {
            const response = (await googleSheets.spreadsheets.values.append(request)).data;
            console.log(`Successfully updated Google Sheet with event with category "${category}"!`);
        } catch (err) {
            console.error(`Error: Couldn't update Google Sheet with event with category "${category}". Error:\n${JSON.stringify(err.errors)}`);
        }
    }

    async logEvent(category: ServerAnalyticsEventCategory, details?: any) {
        let dateObj = new Date();
        let detailsText: string;
        let e: any;
        let timestamp = Date.now().toString();
        let googleSheetsDetails: Array<string> = [timestamp];
        let usedCustomGoogleSheetsLogger = false;

        switch (category) {
            case ServerAnalyticsEventCategory.SlackBotAdded:
                e = <SlackBotAddedEvent>details;
                detailsText = `Team Name: ${e.teamName} Team ID: ${e.teamID}`;
                googleSheetsDetails.push(e.teamName, e.teamID);
                break;
            case ServerAnalyticsEventCategory.SlackBotInstallerInfoCollected:
                e = <SlackBotInstallerInfoCollectedEvent>details;
                detailsText = JSON.stringify(e.info);
                googleSheetsDetails.push(e.info.team_id, e.info.id, e.info.real_name, e.info.profile ? e.info.profile.email : "unknown email");
                break;
            case ServerAnalyticsEventCategory.SlackBotAdminInfoCollected:
                e = <SlackBotAdminInfoCollectedEvent>details;
                detailsText = JSON.stringify(e.info);
                e.info.forEach((admin: any) => {
                    googleSheetsDetails = [timestamp, admin.team_id, admin.id, admin.real_name, admin.profile ? admin.profile.email : "unknown email"];
                    this.logEventGoogleSheets(category, googleSheetsDetails);
                });
                usedCustomGoogleSheetsLogger = true;
                break;
            case ServerAnalyticsEventCategory.SlackBotUsed:
                e = <SlackBotUsedEvent>details;

                let isHiFiEmployee = false;
                let slackTeamID = e.team_id;
                if (slackTeamID && slackTeamID === "T025Q3X6R") {
                    isHiFiEmployee = true;
                }

                detailsText = `${isHiFiEmployee ? "HIFI EMPLOYEE " : ""}${e.team_id}/${e.user_id} used the Slack bot.`;

                googleSheetsDetails.push(isHiFiEmployee ? "true" : "false", e.team_id, e.user_id);
                break;
            case ServerAnalyticsEventCategory.UserConnected:
            case ServerAnalyticsEventCategory.UserDisconnected:
                e = <UserConnectedOrDisconnectedEvent>details;
                detailsText = `${e.spaceName}/${e.userUUID}/${e.sessionStartTimestamp}`;
                googleSheetsDetails.push(e.spaceName, e.userUUID, e.sessionStartTimestamp);
                break;
            default:
                if (details) {
                    detailsText = JSON.stringify(details);
                    googleSheetsDetails.push(detailsText);
                }
                break;
        }

        if (detailsText) {
            console.log(`Analytic @ ${dateObj}: ${category}: ${detailsText}`);
            let insertText = `INSERT INTO analytics.events(timestamp, category, details) VALUES ($1, $2, $3);`;
            if (this.postgresClient) {
                await this.postgresClient.query(insertText, [dateObj, category, detailsText]);
            }
        } else {
            console.log(`Analytic @ ${dateObj}: ${category}`);
            let insertText = `INSERT INTO analytics.events(timestamp, category) VALUES ($1, $2);`;
            if (this.postgresClient) {
                await this.postgresClient.query(insertText, [dateObj, category]);
            }
        }

        if (!usedCustomGoogleSheetsLogger) {
            this.logEventGoogleSheets(category, googleSheetsDetails);
        }
    }
}
