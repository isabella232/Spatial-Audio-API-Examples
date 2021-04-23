import '../css/main.scss';
import { PathsController } from './ai/PathsController';
import { AVDevicesController } from './avDevices/AVDevicesController';
import { ConnectionController } from './connection/ConnectionController';
import { WebSocketConnectionController } from './connection/WebSocketConnectionController';
import { PhysicsController } from './physics/PhysicsController';
import { TwoDimensionalRenderer } from './render/TwoDimensionalRenderer';
import { ParticleController } from './ui/ParticleController';
import { RoomController } from './ui/RoomController';
import { SignalsController } from './ui/SignalsController';
import { UIController } from "./ui/UIController";
import { UIThemeController } from './ui/UIThemeController';
import { UserInputController } from './ui/UserInputController';
import { WatchPartyController } from './ui/WatchPartyController';
import { UserDataController } from './userData/UserDataController';
import { VideoController } from './video/VideoController';

export const connectionController = new ConnectionController();
export const webSocketConnectionController = new WebSocketConnectionController();
export const avDevicesController = new AVDevicesController();
export const uiController = new UIController();
export const userDataController = new UserDataController();
userDataController.init();
export const roomController = new RoomController();
export const twoDimensionalRenderer = new TwoDimensionalRenderer();
export const watchPartyController = new WatchPartyController();
export const particleController = new ParticleController();
export const signalsController = new SignalsController();
export const videoController = new VideoController();
export const pathsController = new PathsController();
export const physicsController = new PhysicsController();
export const userInputController = new UserInputController();

function addLearnMoreLink() {
    let learnMoreContainer = document.createElement("div");
    learnMoreContainer.classList.add("learnMoreContainer");
    let learnMoreContainer__link = document.createElement("a");
    learnMoreContainer__link.innerHTML = `Learn how to integrate the Spatial Audio API into your app.`;
    learnMoreContainer__link.href = `https://highfidelity.com/api/`;
    learnMoreContainer__link.target = "_blank";
    learnMoreContainer__link.classList.add("learnMoreContainer__link");
    learnMoreContainer.appendChild(learnMoreContainer__link);
    document.body.appendChild(learnMoreContainer);
}

addLearnMoreLink();
twoDimensionalRenderer.updateCanvasDimensions();

export const uiThemeController = new UIThemeController();
