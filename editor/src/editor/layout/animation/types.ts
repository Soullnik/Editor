import { SolidParticleSystem, IAnimatable, Animation } from "babylonjs";

export class CustomAnimations extends Animation {
	particleId?: number;
	constructor(name: string, targetProperty: string, frameRate: number, type: number, loopMode: number, particleId?: number) {
		super(name, targetProperty, frameRate, type, loopMode);
		this.particleId = particleId;
	}
}

export interface ICustomAnimatable extends IAnimatable {
	animations: CustomAnimations[];
	metadata?: {
		sps?: SolidParticleSystem;
	};
}
