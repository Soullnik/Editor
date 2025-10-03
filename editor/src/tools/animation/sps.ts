import { Scene, SolidParticle } from "babylonjs";
import { CustomSolidParticle, CustomSolidParticleSystem } from "../../project/add/mesh";

/**
 * Interface for individual particle animation data
 */
export interface IParticleAnimationData {
	particle: CustomSolidParticle;
	from: number;
	to: number;
	loop: boolean;
	speedRatio: number;
	isPlaying: boolean;
}

/**
 * Interface for SPS animation manager
 */
export interface ISPSAnimationManager {
	registerSPS(sps: CustomSolidParticleSystem): void;
	unregisterSPS(sps: CustomSolidParticleSystem): void;
	startSolidParticleAnimation(particle: CustomSolidParticle, from: number, to: number, loop?: boolean, speedRatio?: number): void;
	startSolidParticleSystemAnimation(sps: CustomSolidParticleSystem, from: number, to: number, loop?: boolean, speedRatio?: number): void;
	stopParticleAnimation(particle: CustomSolidParticle): void;
	stopAllParticleAnimations(particle: CustomSolidParticle): void;
	stopAllSPSAnimations(sps: CustomSolidParticleSystem): void;
	setCurrentTime(time: number): void;
	play(): void;
	stop(): void;
	dispose(): void;
}

/**
 * Manager class for handling SPS particle animations
 */
export class SPSAnimationManager implements ISPSAnimationManager {
	private _scene: Scene;
	private _particleAnimations: Map<number, IParticleAnimationData> = new Map();
	private _spsSystems: Map<number, CustomSolidParticleSystem> = new Map();
	private _onBeforeRenderObserver: any = null;
	private _currentTime: number = 0;
	private _isPlaying: boolean = false;

	constructor(scene: Scene) {
		this._scene = scene;
		this._setupRenderLoop();
	}

	public registerSPS(sps: CustomSolidParticleSystem): void {
		this._spsSystems.set(sps.mesh.uniqueId, sps);
	}

	public unregisterSPS(sps: CustomSolidParticleSystem): void {
		const spsId = sps.mesh.uniqueId;
		this._spsSystems.delete(spsId);

		sps.particles.forEach((particle) => {
			this._particleAnimations.delete(particle.id);
		});
	}

	public startSolidParticleAnimation(particle: CustomSolidParticle, from: number, to: number, loop: boolean = false, speedRatio: number = 1.0): void {
		if (!particle.animations || particle.animations.length === 0) {
			console.warn("Particle has no animations to play");
			return;
		}

		const animationData: IParticleAnimationData = {
			particle,
			from,
			to,
			loop,
			speedRatio,
			isPlaying: true,
		};

		this._particleAnimations.set(particle.id, animationData);
	}

	public startSolidParticleSystemAnimation(sps: CustomSolidParticleSystem, from: number, to: number, loop: boolean = false, speedRatio: number = 1.0): void {
		sps.particles.forEach((particle) => {
			this.startSolidParticleAnimation(particle, from, to, loop, speedRatio);
		});
	}

	public stopParticleAnimation(particle: CustomSolidParticle): void {
		this._particleAnimations.delete(particle.id);
	}

	public stopAllParticleAnimations(particle: CustomSolidParticle): void {
		this._particleAnimations.delete(particle.id);
	}

	public stopAllSPSAnimations(sps: CustomSolidParticleSystem): void {
		sps.particles.forEach((particle) => {
			this.stopAllParticleAnimations(particle);
		});
	}

	public setCurrentTime(time: number): void {
		this._currentTime = time;
	}

	public play(): void {
		this._isPlaying = true;
	}

	public stop(): void {
		this._isPlaying = false;
	}

	private _setupRenderLoop(): void {
		this._onBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
			if (this._isPlaying) {
				this._updateAnimations();
			}
		});
	}

	private _updateAnimations(): void {
		this._particleAnimations.forEach((animationData) => {
			if (!animationData.isPlaying) {
				return;
			}
			this._updateParticleAnimation(animationData, this._currentTime);
		});

		this._spsSystems.forEach((sps) => {
			sps.setParticles();
		});
	}

	private _updateParticleAnimation(animationData: IParticleAnimationData, currentTime: number): void {
		const { particle, from, to, loop, speedRatio } = animationData;

		if (!particle.animations || particle.animations.length === 0) {
			return;
		}

		const animationTime = (currentTime - from) * speedRatio;
		const animationDuration = to - from;

		let targetTime = currentTime;

		if (animationTime < 0 || animationTime > animationDuration) {
			if (loop) {
				const loopedTime = animationTime % animationDuration;
				targetTime = from + loopedTime;
			} else {
				return;
			}
		} else {
			targetTime = from + animationTime;
		}

		particle.animations.forEach((animation) => {
			const value = animation._getKeyValue(targetTime);
			if (value !== undefined) {
				this._setParticleProperty(particle, animation.targetProperty, value);
			}
		});
	}

	private _setParticleProperty(particle: SolidParticle, property: string, value: any): void {
		(particle as any)[property] = value;
	}

	public dispose(): void {
		if (this._onBeforeRenderObserver) {
			this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
		}
		this._particleAnimations.clear();
		this._spsSystems.clear();
	}
}
