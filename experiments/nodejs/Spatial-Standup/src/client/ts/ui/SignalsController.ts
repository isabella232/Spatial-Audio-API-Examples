import '../../css/signals.scss';
import { Point3D } from "hifi-spatial-audio";
import SignalSmile from '../../images/signals/smile.png';
import SignalHandRaised from '../../images/signals/handRaised.png';
import SignalParty from '../../images/signals/party.png';
import SignalHeart from '../../images/signals/heart.png';
import SignalJoy from '../../images/signals/joy.png';
import SignalInterrobang from '../../images/signals/interrobang.png';
import Signal100 from '../../images/signals/100.png';
import SignalClap from '../../images/signals/clap.png';
import SoundSmile from '../../audio/smile.mp3';
import SoundHandRaised01 from '../../audio/handRaised01.mp3';
import SoundHandRaised02 from '../../audio/handRaised02.mp3';
import SoundParty from '../../audio/party.mp3';
import SoundHeart from '../../audio/heart.mp3';
import SoundJoy from '../../audio/joy.mp3';
import SoundInterrobang from '../../audio/interrobang.mp3';
import Sound10001 from '../../audio/10001.mp3';
import Sound10002 from '../../audio/10002.mp3';
import SoundClap01 from '../../audio/clap01.wav';
import SoundClap02 from '../../audio/clap02.wav';
import SoundClap03 from '../../audio/clap03.wav';
import SoundClap04 from '../../audio/clap04.wav';
import SoundClap05 from '../../audio/clap05.wav';
import SoundClap06 from '../../audio/clap06.wav';
import SoundClap07 from '../../audio/clap07.wav';
import SoundClap08 from '../../audio/clap08.wav';
import SoundClap09 from '../../audio/clap09.wav';
import SoundClap10 from '../../audio/clap10.wav';
import SoundClap11 from '../../audio/clap11.wav';
import SoundClap12 from '../../audio/clap12.wav';
import SoundClap13 from '../../audio/clap13.wav';
import SoundClap14 from '../../audio/clap14.wav';
import SoundClap15 from '../../audio/clap15.wav';
import SoundClap16 from '../../audio/clap16.wav';
import { EasingFunctions, Utilities } from "../utilities/Utilities";
import { AVATAR, PARTICLES, SIGNALS } from "../constants/constants";
import { connectionController, howlerController, localSoundsController, particleController, uiThemeController, userDataController, webSocketConnectionController } from "..";
import { Particle } from "./ParticleController";
declare var HIFI_SPACE_NAME: string;

export interface Signal {
    name: string;
    label: string;
    buttonEl: HTMLButtonElement;
    currentRelativeOrWorldPositionM: Point3D;
    targetRelativeOrWorldPositionM: Point3D;
    dimensionsM: Point3D;
    dimensionsMEnd: Point3D;
    opacityEnd: number;
    imageSRC: string;
    lifespanMS: number;
    sounds?: Array<string>;
    volume: number;
    particleInterval: NodeJS.Timer;
    numParticles: number;
    intervalMS: number;
}

export interface SignalParams {
    name: string;
    parentAvatarVisitIDHash?: string;
    emitsSound: boolean;
}

export class SignalsController {
    topBar: HTMLDivElement;
    toggleSignalButtonContainerButton: HTMLButtonElement;
    pauseSignalButton: HTMLButtonElement;
    activeSignalButton: HTMLButtonElement;
    normalModeCanvas: HTMLCanvasElement;
    signalButtonContainer: HTMLDivElement;
    toggleSoundsCheckbox: HTMLInputElement;
    activeSignal: Signal;
    supportedSignals: Map<string, Signal>;

    constructor() {
        this.activeSignal = undefined;
        this.supportedSignals = new Map();

        this.normalModeCanvas = document.querySelector('.normalModeCanvas');

        this.topBar = document.querySelector(".topBar");

        this.signalButtonContainer = document.createElement("div");
        this.signalButtonContainer.classList.add('signalButtonContainer', 'displayNone');
        this.topBar.parentNode.insertBefore(this.signalButtonContainer, this.topBar.nextSibling);

        let topRightSignalButtonContainer = document.createElement("div");
        topRightSignalButtonContainer.classList.add("topRightSignalButtonContainer");
        this.topBar.appendChild(topRightSignalButtonContainer);

        this.toggleSignalButtonContainerButton = document.createElement("button");
        this.toggleSignalButtonContainerButton.classList.add("toggleSignalButtonContainerButton", "toggleSignalButtonContainerButton--closed");
        this.toggleSignalButtonContainerButton.addEventListener("click", () => {
            this.toggleSignalContainerVisibility();
        });
        topRightSignalButtonContainer.appendChild(this.toggleSignalButtonContainerButton);

        this.addSupportedSignal({
            "name": "smile",
            "label": "Smile emoji",
            "imageSRC": SignalSmile,
            "start": new Point3D({x: AVATAR.RADIUS_M / 2, z: -AVATAR.RADIUS_M / 2}),
            "target": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.15,
                z: 0.15,
            }),
            "lifespanMS": 2500,
            "sounds": [SoundSmile],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 5,
            "intervalMS": 600,
        });
        this.addSupportedSignal({
            "name": "joy",
            "label": "Joy emoji",
            "imageSRC": SignalJoy,
            "start": new Point3D({x: AVATAR.RADIUS_M / 2, z: -AVATAR.RADIUS_M / 2}),
            "target": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.17,
                z: 0.17,
            }),
            "lifespanMS": 1200,
            "sounds": [SoundJoy],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 3,
            "intervalMS": 450,
        });
        this.addSupportedSignal({
            "name": "party",
            "label": "Partying face emoji",
            "imageSRC": SignalParty,
            "start": new Point3D({x: AVATAR.RADIUS_M / 2, z: -AVATAR.RADIUS_M / 2}),
            "target": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.17,
                z: 0.17,
            }),
            "lifespanMS": 1500,
            "sounds": [SoundParty],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 7,
            "intervalMS": 500,
        });
        this.addSupportedSignal({
            "name": "handRaised",
            "label": "Raise your hand",
            "imageSRC": SignalHandRaised,
            "start": new Point3D({x: 0, z: -AVATAR.RADIUS_M}),
            "target": new Point3D({x: 0, z: -AVATAR.RADIUS_M * 1.7}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.3,
                z: 0.3,
            }),
            "lifespanMS": 5500,
            "sounds": [SoundHandRaised01, SoundHandRaised02],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 1,
            "intervalMS": 1200,
        });
        this.addSupportedSignal({
            "name": "clap",
            "label": "Clapping hands emoji",
            "imageSRC": SignalClap,
            "start": new Point3D({x: AVATAR.RADIUS_M / 2, z: -AVATAR.RADIUS_M / 2}),
            "target": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "lifespanMS": 500,
            "sounds": [SoundClap01, SoundClap02, SoundClap03, SoundClap04, SoundClap05, SoundClap06, SoundClap07, SoundClap08, SoundClap09, SoundClap10, SoundClap11, SoundClap12, SoundClap13, SoundClap14, SoundClap15, SoundClap16],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 1,
            "intervalMS": 500,
        });
        this.addSupportedSignal({
            "name": "heart",
            "label": "Heart emoji",
            "imageSRC": SignalHeart,
            "start": new Point3D({x: 0, z: -AVATAR.RADIUS_M / 2}),
            "target": new Point3D({x: 0, z: -AVATAR.RADIUS_M * 1.5}),
            "dimensionsM": new Point3D({
                x: 0.15,
                z: 0.15,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.19,
                z: 0.19,
            }),
            "lifespanMS": 2500,
            "sounds": [SoundHeart],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 3,
            "intervalMS": 500,
        });
        this.addSupportedSignal({
            "name": "interrobang",
            "label": "Interrobang emoji",
            "imageSRC": SignalInterrobang,
            "start": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "target": new Point3D({x: AVATAR.RADIUS_M * 1.2, z: -AVATAR.RADIUS_M * 1.2}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.17,
                z: 0.17,
            }),
            "lifespanMS": 1200,
            "sounds": [SoundInterrobang],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 1,
            "intervalMS": 450,
        });
        this.addSupportedSignal({
            "name": "100",
            "label": "100 emoji",
            "imageSRC": Signal100,
            "start": new Point3D({x: AVATAR.RADIUS_M, z: -AVATAR.RADIUS_M}),
            "target": new Point3D({x: AVATAR.RADIUS_M * 1.2, z: -AVATAR.RADIUS_M * 1.2}),
            "dimensionsM": new Point3D({
                x: 0.23,
                z: 0.23,
            }),
            "dimensionsMEnd": new Point3D({
                x: 0.17,
                z: 0.17,
            }),
            "lifespanMS": 1200,
            "sounds": [Sound10001, Sound10002],
            "volume": 0.35,
            "opacityEnd": 0.0,
            "numParticles": 1,
            "intervalMS": 450,
        });

        let toggleSoundsContainer = document.createElement("div");
        toggleSoundsContainer.classList.add("toggleSoundsContainer");
        this.signalButtonContainer.appendChild(toggleSoundsContainer);

        let toggleSoundsCheckboxLabel = document.createElement("label");
        toggleSoundsCheckboxLabel.setAttribute("for", "toggleSoundsCheckbox");
        toggleSoundsCheckboxLabel.classList.add("toggleSoundsCheckboxLabel");
        toggleSoundsCheckboxLabel.innerHTML = "Emit Sounds";
        toggleSoundsContainer.appendChild(toggleSoundsCheckboxLabel);

        let toggleSoundsSwitchLabel = document.createElement("label");
        toggleSoundsSwitchLabel.classList.add("switch");
        let toggleSoundsSwitchSlider = document.createElement("span");
        toggleSoundsSwitchSlider.classList.add("slider");

        this.toggleSoundsCheckbox = document.createElement("input");
        this.toggleSoundsCheckbox.id = "toggleSoundsCheckbox";
        this.toggleSoundsCheckbox.classList.add("toggleSoundsCheckbox");
        this.toggleSoundsCheckbox.type = "checkbox";
        if (!localStorage.getItem("toggleSoundsEnabled")) {
            localStorage.setItem("toggleSoundsEnabled", "true");
        }
        this.toggleSoundsCheckbox.checked = localStorage.getItem("toggleSoundsEnabled") === "true";
        this.toggleSoundsCheckbox.addEventListener("click", (e) => {
            localStorage.setItem("toggleSoundsEnabled", this.toggleSoundsCheckbox.checked ? "true" : "false");
        });

        toggleSoundsSwitchLabel.appendChild(this.toggleSoundsCheckbox);
        toggleSoundsSwitchLabel.appendChild(toggleSoundsSwitchSlider);

        toggleSoundsContainer.appendChild(toggleSoundsSwitchLabel);
    }

    hideSignalContainer() {
        this.signalButtonContainer.classList.add("displayNone");
        this.toggleSignalButtonContainerButton.classList.add("toggleSignalButtonContainerButton--closed");
        this.toggleSignalButtonContainerButton.classList.remove("toggleSignalButtonContainerButton--open");
    }

    toggleSignalContainerVisibility() {
        if (this.signalButtonContainer.classList.contains("displayNone")) {
            this.signalButtonContainer.classList.remove("displayNone");
            this.toggleSignalButtonContainerButton.classList.remove("toggleSignalButtonContainerButton--closed");
            this.toggleSignalButtonContainerButton.classList.add("toggleSignalButtonContainerButton--open");
        } else {
            this.hideSignalContainer();
        }
    }

    addSupportedSignal({name, label, start, target, dimensionsM, dimensionsMEnd, imageSRC, lifespanMS, sounds, volume, opacityEnd, numParticles, intervalMS}: {name: string, label: string, start: Point3D, target: Point3D, dimensionsM: Point3D, dimensionsMEnd: Point3D, imageSRC: string, lifespanMS: number, sounds?: Array<string>, volume: number, opacityEnd: number, numParticles: number, intervalMS: number}) {
        let buttonEl = document.createElement("button");
        buttonEl.classList.add('signalButton', `signalButton--${name}`);
        buttonEl.setAttribute("aria-label", label);
        buttonEl.addEventListener('click', (e) => {
            this.setActiveSignal(this.supportedSignals.get(name));
        });
        this.signalButtonContainer.appendChild(buttonEl);

        this.supportedSignals.set(name, {
            "name": name,
            "label": label,
            "buttonEl": buttonEl,
            "currentRelativeOrWorldPositionM": start,
            "targetRelativeOrWorldPositionM": target,
            "dimensionsM": dimensionsM,
            "dimensionsMEnd": dimensionsMEnd,
            "imageSRC": imageSRC,
            "lifespanMS": lifespanMS,
            "sounds": sounds,
            "volume": volume,
            "opacityEnd": opacityEnd,
            "numParticles": numParticles,
            "intervalMS": intervalMS,
            "particleInterval": null,
        });
    }

    updateSignalUI() {
        if (this.activeSignal) {
            
        } else {

        }
    }

    setActiveSignal(newSignal: Signal) {
        this.activeSignal = newSignal;
        this.updateSignalUI();

        if (this.activeSignal) {
            this.addActiveSignal();
        }
    }

    toggleActiveSignal(newSignal: Signal) {
        if (this.activeSignal === newSignal) {
            this.setActiveSignal(undefined);
        } else {
            this.setActiveSignal(newSignal);
        }
    }

    playSignalSound(signalName: string) {
        if (!(this.supportedSignals.has(signalName) && this.supportedSignals.get(signalName).sounds)) {
            return;
        }
        
        let sounds = this.supportedSignals.get(signalName).sounds;
        let src = sounds[Math.floor(Math.random() * sounds.length)];

        localSoundsController.playSound({src, volume: this.supportedSignals.get(signalName).volume});
    }

    addParticleWrapper(params: any) {
        if (!this.supportedSignals.has(params.name)) {
            return;
        }

        let localSignalParams = this.supportedSignals.get(params.name);

        particleController.addParticle(new Particle({
            parentAvatarVisitIDHash: params.parentAvatarVisitIDHash,
            currentRelativeOrWorldPositionM: new Point3D(localSignalParams.currentRelativeOrWorldPositionM),
            targetRelativeOrWorldPositionM: new Point3D(localSignalParams.targetRelativeOrWorldPositionM),
            linearVelocityWithTarget: Utilities.getDistanceBetween2DPoints(localSignalParams.currentRelativeOrWorldPositionM.x, localSignalParams.currentRelativeOrWorldPositionM.z, localSignalParams.targetRelativeOrWorldPositionM.x, localSignalParams.targetRelativeOrWorldPositionM.z) / (localSignalParams.lifespanMS / 1000),
            dimensionsM: new Point3D(localSignalParams.dimensionsM),
            dimensionsMEnd: new Point3D(localSignalParams.dimensionsMEnd),
            lifespanMS: localSignalParams.lifespanMS,
            imageSRC: localSignalParams.imageSRC,
            easing: EasingFunctions.easeOutQuad,
            opacityEnd: localSignalParams.opacityEnd,
        }));
    }

    addSignal(params: SignalParams, forcePlaySound = false) {
        if (!params.name) {
            console.error(`Tried to add signal, but signal name was not specified!`);
            return;
        }

        if (!this.supportedSignals.has(params.name)) {
            console.error(`Tried to add signal, but signal name was unsupported!`);
            return;
        }

        this.supportedSignals.forEach((signal) => {
            if (signal.particleInterval) {
                clearInterval(signal.particleInterval);
                signal.particleInterval = null;
            }
        });

        let localSignalParams = this.supportedSignals.get(params.name);

        if (localSignalParams.numParticles > 1) {
            let particleAccount = 0;
            localSignalParams.particleInterval = setInterval(() => {
                particleAccount++;
    
                if (particleAccount >= localSignalParams.numParticles) {
                    clearInterval(localSignalParams.particleInterval);
                    localSignalParams.particleInterval = null;
                    return;
                }
    
                this.addParticleWrapper(params);
            }, localSignalParams.intervalMS);
        }
        this.addParticleWrapper(params);

        let isCloseEnough = false;
        const myUserData = userDataController.myAvatar.myUserData;

        let parentAvatar;
        if (params.parentAvatarVisitIDHash) {
            let allUserData = userDataController.allOtherUserData.concat(userDataController.myAvatar.myUserData);
            parentAvatar = allUserData.find((e) => { return params.parentAvatarVisitIDHash === e.visitIDHash; });
        }

        if (!forcePlaySound && myUserData && myUserData.positionCurrent) {
            if (parentAvatar) {
                let distance = Utilities.getDistanceBetween2DPoints(localSignalParams.targetRelativeOrWorldPositionM.x + parentAvatar.positionCurrent.x, localSignalParams.targetRelativeOrWorldPositionM.z + parentAvatar.positionCurrent.z, myUserData.positionCurrent.x, myUserData.positionCurrent.z);
                isCloseEnough = distance < SIGNALS.NEARBY_DISTANCE_M;
            } else {
                let distance = Utilities.getDistanceBetween2DPoints(localSignalParams.targetRelativeOrWorldPositionM.x, localSignalParams.targetRelativeOrWorldPositionM.z, myUserData.positionCurrent.x, myUserData.positionCurrent.z);
                isCloseEnough = distance < SIGNALS.NEARBY_DISTANCE_M;
            }
        }

        if ((forcePlaySound || isCloseEnough) && params.emitsSound) {
            if (parentAvatar) {
                let sounds = localSignalParams.sounds;

                if (!sounds) {
                    return;
                }
                let src = sounds[Math.floor(Math.random() * sounds.length)];
    
                howlerController.playSound({ src: src, positionM: parentAvatar.positionCurrent, randomSoundRate: true, tag: "environment" });
            } else {
                this.playSignalSound(params.name);
            }
        }
    }

    addActiveSignal() {
        if (!this.activeSignal) {
            return;
        }

        if (!(userDataController.myAvatar.myUserData && userDataController.myAvatar.myUserData.visitIDHash)) {
            console.error(`Tried to add active signal, but we didn't yet have a Visit ID Hash!`);
            return;
        }

        let signal = this.supportedSignals.get(this.activeSignal.name);

        if (!signal) {
            console.error(`Tried to add active signal, but signal was unsupported!`);
            return;
        }

        let signalParams = {
            "name": this.activeSignal.name,
            "parentAvatarVisitIDHash": userDataController.myAvatar.myUserData.visitIDHash,
            "currentRelativeOrWorldPositionM": signal.currentRelativeOrWorldPositionM,
            "targetRelativeOrWorldPositionM": signal.targetRelativeOrWorldPositionM,
            "emitsSound": this.toggleSoundsCheckbox.checked
        };

        this.addSignal(signalParams, true);

        if (webSocketConnectionController) {
            webSocketConnectionController.socket.emit("addParticle", { visitIDHash: userDataController.myAvatar.myUserData.visitIDHash, spaceName: HIFI_SPACE_NAME, particleData: JSON.stringify(signalParams)} );
        }
    }
}
