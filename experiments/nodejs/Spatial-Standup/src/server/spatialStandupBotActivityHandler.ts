import { TurnContext, MessageFactory, TeamsActivityHandler, CardFactory, ActionTypes, TeamsInfo, TeamsChannelAccount, TeamsPagedMembersResult } from 'botbuilder';
import * as crypto from "crypto";
import { analyticsController } from '.';
import { ServerAnalyticsEventCategory, TeamsBotAddedEvent, TeamsBotMemberInfoCollectedEvent, TeamsBotUsedEvent } from './analytics/ServerAnalyticsController';

export class SpatialStandupBotActivityHandler extends TeamsActivityHandler {
    constructor() {
        super();

        this.onInstallationUpdate(async (context: TurnContext, next: any) => {
            if (context.activity.action && context.activity.action === "add") {
                await this.installedHandler(context);
            }
            await next();
        });

        this.onMessage(async (context: TurnContext, next: any) => {
            TurnContext.removeRecipientMention(context.activity);
            switch (context.activity.text.trim().toLowerCase()) {
                case 'hello':
                case 'hi':
                case 'hey':
                    await this.greetUser(context);
                    break;
                case 'help':
                    await this.helpHandler(context);
                    break;
                case 'standup':
                    await this.postSSULink(context);
                    break;
                default:
                    break;
            }
            await next();
        });
    }

    async installedHandler(context: TurnContext) {
        const card = CardFactory.heroCard(
            `Hi, I'm the Spatial Standup bot! 🤖`,
            `Thank you for adding me to your Teams organization!<br><br>Any member of this Team can mention me (@Spatial Standup) then type "standup" to generate a unique link to High Fidelity's Spatial Standup, where you and your team can collaborate via spatial audio and video in a comfortable environment.<br><br><strong>The generated link is unique to the Teams channel in which you mention me and type "standup".</strong> If you share the Spatial Standup Room link elsewhere, others will be able to join that Room.`,
            null,
            [
                {
                    type: ActionTypes.MessageBack,
                    title: 'Generate Spatial Standup Link',
                    value: undefined,
                    text: 'standup'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'More Information',
                    value: 'https://spatialstandup.com'
                }
            ]);
        const replyActivity = {
            attachments: [card]
        }
        await context.sendActivity(replyActivity);

        let teamInfo = await TeamsInfo.getTeamDetails(context);
        let teamName = teamInfo && teamInfo.name ? teamInfo.name : "Unknown Team Name";
        let teamID = teamInfo && teamInfo.id ? teamInfo.id : "Unknown Team ID";
        analyticsController.logEvent(ServerAnalyticsEventCategory.TeamsBotAdded, new TeamsBotAddedEvent(teamName, teamID));

        let continuationToken;
        let members: Array<TeamsChannelAccount> = [];
        do {
            let pagedMembers: TeamsPagedMembersResult = await TeamsInfo.getPagedMembers(context, 100, continuationToken);
            continuationToken = pagedMembers.continuationToken;
            members.push(...pagedMembers.members);
        } while (continuationToken !== undefined);

        members.forEach((member: any) => {
            member["teamID"] = teamID;
            let memberKeys = Object.keys(member);
            for (let i = memberKeys.length - 1; i > 0; i--) {
                if (!(memberKeys[i] === "teamID" || memberKeys[i] === "id" || memberKeys[i] === "email" || memberKeys[i] === "name")) {
                    delete member[memberKeys[i]];
                }
            }
        });

        analyticsController.logEvent(ServerAnalyticsEventCategory.TeamsBotMemberInfoCollected, new TeamsBotMemberInfoCollectedEvent(members));
    }

    async helpHandler(context: TurnContext) {
        const card = CardFactory.heroCard(
            `Hi, I'm the Spatial Standup bot! 🤖`,
            `Mention me (@Spatial Standup) then type "standup" to generate a unique link to High Fidelity's Spatial Standup, where you and your team can collaborate via spatial audio and video in a comfortable environment.<br><br><strong>The generated link is unique to the Teams channel in which you mention me and type "standup".</strong> If you share the Spatial Standup Room link elsewhere, others will be able to join that Room.`,
            null,
            [
                {
                    type: ActionTypes.MessageBack,
                    title: 'Generate Spatial Standup Link',
                    value: undefined,
                    text: 'standup'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'More Information',
                    value: 'https://spatialstandup.com'
                }
            ]);
        const replyActivity = {
            attachments: [card]
        }
        await context.sendActivity(replyActivity);
    }

    /**
     * Say hello and @ mention the current user.
     */
    async greetUser(context: TurnContext) {
        const greetings = ["Hi", "Hey", "Greetings"];
        const punctuation = [".", "!"];
        const replyActivity = MessageFactory.text(`${greetings[Math.floor(Math.random() * greetings.length)]}, ${context.activity.from.name}${punctuation[Math.floor(Math.random() * punctuation.length)]}`);

        await context.sendActivity(replyActivity);
    }

    async postSSULink(context: TurnContext) {
        let teamsTeamId = "Unknown Team ID";
        let teamsChannelId = "Unknown Channel ID";
        let teamsUserAADObjectId = "Unknown User AAD Object ID";
        if (context.activity.conversation && context.activity.conversation.conversationType === "personal") {
            teamsTeamId = "Personal Conversation";
            teamsChannelId = context.activity.conversation.id;
        } else if (context.activity.channelData && context.activity.channelData.team && context.activity.channelData.team.id && context.activity.channelData.channel && context.activity.channelData.channel.id) {
            teamsTeamId = context.activity.channelData.team.id;
            teamsChannelId = context.activity.channelData.channel.id;
        } else {
            await context.sendActivity(MessageFactory.text(`I couldn't determine your Team or Channel. Please mention me (@Spatial Standup) from within a Team conversation!`));
            return;
        }

        if (context.activity.from && context.activity.from.aadObjectId) {
            teamsUserAADObjectId = context.activity.from.aadObjectId;
        }

        let isHiFiEmployee = false;
        if (teamsTeamId.indexOf("vgYOaN2SMZX7t-mw5jU6qm77fT18Ej4GzxjwkQ0twvw1") > -1) {
            isHiFiEmployee = true;
        }

        let stringToHash = `${teamsTeamId}/${teamsChannelId}`;
        let hash = crypto.createHash('md5').update(stringToHash).digest('hex');
        let spaceURL;
        if (isHiFiEmployee) {
            spaceURL = `https://standup-staging.highfidelity.com/${hash}/`;
        } else {
            spaceURL = `https://standup.highfidelity.com/${hash}/`;
        }

        analyticsController.logEvent(ServerAnalyticsEventCategory.TeamsBotUsed, new TeamsBotUsedEvent(teamsUserAADObjectId, teamsTeamId, isHiFiEmployee, hash));

        const card = CardFactory.heroCard(
            `Join ${context.activity.from.name} in this channel's Spatial Standup Room.`,
            null,
            [
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Join Spatial Standup',
                    value: spaceURL
                }
            ]);
        const replyActivity = {
            attachments: [card]
        }
        await context.sendActivity(replyActivity);
    }
}
