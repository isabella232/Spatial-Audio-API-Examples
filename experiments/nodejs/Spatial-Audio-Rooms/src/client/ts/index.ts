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
import { UserInputController } from './ui/UserInputController';
import { UserDataController } from './userData/UserDataController';
import { VideoController } from './video/VideoController';

export const connectionController = new ConnectionController();
export const webSocketConnectionController = new WebSocketConnectionController();
export const avDevicesController = new AVDevicesController();
export const userDataController = new UserDataController();
export const roomController = new RoomController();
export const uiController = new UIController();
export const twoDimensionalRenderer = new TwoDimensionalRenderer();
export const particleController = new ParticleController();
export const signalsController = new SignalsController();
export const videoController = new VideoController();
export const pathsController = new PathsController();
export const physicsController = new PhysicsController();
export const userInputController = new UserInputController();