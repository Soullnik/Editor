import { Scene, Animation, AbstractEngine, Observer } from "babylonjs";
import { CustomSolidParticle, CustomSolidParticleSystem } from "../../project/add/mesh";

interface IAnimationData {
	animatable: CustomSolidParticle;
	from: number;
	to: number;
	loop: boolean;
	speedRatio: number;
}

/**
 * Interface for SPS animation manager
 */
export interface ISPSAnimationManager {
	beginDirectAnimation(animatable: CustomSolidParticle, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number): void;
	stopAnimation(animatable: CustomSolidParticle): void;
	stopAllAnimations(): void;
	setCurrentTime(time: number, animatable?: CustomSolidParticle): void;
	play(): void;
	stop(): void;
	registerMeshWithSPS(mesh: any, sps: CustomSolidParticleSystem): void;
	beginMeshSPSAnimation(mesh: any, currentTime: number, maxFrame: number): void;
	getPerformanceInfo(): { fps: number; activeParticles: number; deltaTime: number };
	dispose(): void;
}

/**
 * Manager class for handling SPS particle animations
 */
export class SPSAnimationManager implements ISPSAnimationManager {
	private readonly _scene: Scene;
	private readonly _activeAnimations: Map<string, IAnimationData> = new Map();
	private _onBeforeRenderObserver: Observer<Scene> | null = null;
	private _currentTime: number = 0;
	private _isPlaying: boolean = false;
	private readonly _engine: AbstractEngine;
	private _deltaTime: number = 0;
	private _needsUpdate: boolean = false;
	private readonly _spsToUpdate: Set<CustomSolidParticleSystem> = new Set();
	private readonly _meshSPSCache: Map<any, CustomSolidParticle[]> = new Map();
	private readonly _spsBatchInfo: Map<CustomSolidParticleSystem, { startIndex: number; batchSize: number; isUpdating: boolean }> = new Map();
	private readonly _batchSize = 1000;

	constructor(scene: Scene) {
		this._scene = scene;
		this._engine = scene.getEngine();
		this._setupRenderLoop();
	}

	public beginDirectAnimation(animatable: CustomSolidParticle, _animations: Animation[], from: number, to: number, loop: boolean = false, speedRatio: number = 1.0): void {
		if (animatable.getClassName() === "CustomSolidParticle") {
			const key = this._getAnimationKey(animatable);
			this._activeAnimations.set(key, { animatable, from, to, loop, speedRatio });
			if (animatable._sps) {
				this._spsToUpdate.add(animatable._sps as CustomSolidParticleSystem);
				this._setupUpdateParticle(animatable._sps as CustomSolidParticleSystem);
				this._initializeBatching(animatable._sps as CustomSolidParticleSystem);
			}
		}
	}

	public stopAnimation(animatable: CustomSolidParticle): void {
		const key = this._getAnimationKey(animatable);
		this._activeAnimations.delete(key);
		if (animatable._sps) {
			this._spsToUpdate.delete(animatable._sps as CustomSolidParticleSystem);
			this._spsBatchInfo.delete(animatable._sps as CustomSolidParticleSystem);
		}
		this._resetParticleToInitialState(animatable);
	}

	public setCurrentTime(time: number, _animatable?: CustomSolidParticle): void {
		this._currentTime = time;
		this._needsUpdate = true;
	}

	public play(): void {
		this._isPlaying = true;
	}

	public stopAllAnimations(): void {
		for (const animationData of this._activeAnimations.values()) {
			this._resetParticleToInitialState(animationData.animatable);
		}

		this._activeAnimations.clear();
		this._spsToUpdate.clear();
		this._spsBatchInfo.clear();
	}

	public stop(): void {
		this._isPlaying = false;
	}

	public registerMeshWithSPS(mesh: any, sps: CustomSolidParticleSystem): void {
		if (sps?.particles) {
			this._meshSPSCache.set(mesh, sps.particles);
		}
	}

	public beginMeshSPSAnimation(mesh: any, _currentTime: number, maxFrame: number): void {
		const particles = this._meshSPSCache.get(mesh);
		if (!particles) {
			return;
		}

		const spsGroups = new Map<any, any[]>();

		particles.forEach((particle) => {
			if (particle.animations && particle.animations.length > 0) {
				const sps = particle._sps;
				if (!spsGroups.has(sps)) {
					spsGroups.set(sps, []);
				}
				spsGroups.get(sps)!.push(particle);
			}
		});

		spsGroups.forEach((particles, _sps) => {
			particles.forEach((particle) => {
				particle.animations.forEach((animation: Animation) => {
					const keys = animation.getKeys();
					const fromFrame = keys[0].frame;
					this.beginDirectAnimation(particle, [animation], fromFrame, maxFrame, false, 1.0);
				});
			});
		});
	}

	private _getAnimationKey(animatable: CustomSolidParticle): string {
		return `particle_${animatable.id}`;
	}

	private _resetParticleToInitialState(animatable: CustomSolidParticle): void {
		if (animatable.getClassName() === "CustomSolidParticle" && animatable.animations) {
			for (const animation of animatable.animations) {
				const keys = animation.getKeys();
				if (keys.length > 0) {
					const initialValue = keys[0].value;
					this._setParticleProperty(animatable, animation.targetProperty, initialValue);
				}
			}

			if (animatable._sps?.setParticles) {
				animatable._sps.setParticles();
			}
		}
	}

	private _setupUpdateParticle(sps: CustomSolidParticleSystem): void {
		sps.updateParticle = (particle: CustomSolidParticle): CustomSolidParticle => {
			this._applyAnimationsToParticle(particle);
			return particle;
		};
	}

	private _applyAnimationsToParticle(particle: CustomSolidParticle): void {
		if (!particle.animations?.length) {
			return;
		}

		const key = this._getAnimationKey(particle);
		const animationData = this._activeAnimations.get(key);

		if (!animationData) {
			return;
		}

		const { from, to, loop, speedRatio } = animationData;
		const animationTime = (this._currentTime - from) * speedRatio;
		const animationDuration = to - from;

		let targetTime = this._currentTime;

		if (animationTime < 0 || animationTime > animationDuration) {
			if (loop) {
				const loopedTime = animationTime % animationDuration;
				targetTime = from + loopedTime;
			} else {
				targetTime = animationTime < 0 ? from : to;
			}
		} else {
			targetTime = from + animationTime;
		}

		for (const animation of particle.animations) {
			const value = animation.evaluate(targetTime);
			if (value !== undefined) {
				this._setParticleProperty(particle, animation.targetProperty, value);
			}
		}
	}

	private _setupRenderLoop(): void {
		this._onBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
			if (this._isPlaying) {
				this._deltaTime = this._scene.getEngine().getDeltaTime() / 1000;
				this._currentTime += this._deltaTime;
				this._needsUpdate = true;
			}

			if (this._needsUpdate) {
				this._updateAnimationsInRenderLoop();
				this._needsUpdate = false;
			}
		});
	}

	private _updateAnimationsInRenderLoop(): void {
		for (const sps of this._spsToUpdate) {
			const batchInfo = this._spsBatchInfo.get(sps);

			if (batchInfo && sps.nbParticles > this._batchSize) {
				this._updateSPSBatch(sps, batchInfo);
			} else {
				sps.setParticles();
			}
		}
	}

	private _initializeBatching(sps: CustomSolidParticleSystem): void {
		if (sps.nbParticles > this._batchSize) {
			this._spsBatchInfo.set(sps, {
				startIndex: 0,
				batchSize: this._batchSize,
				isUpdating: false,
			});
		}
	}

	private _updateSPSBatch(sps: CustomSolidParticleSystem, batchInfo: { startIndex: number; batchSize: number; isUpdating: boolean }): void {
		const { startIndex, batchSize } = batchInfo;
		const endIndex = Math.min(startIndex + batchSize, sps.nbParticles);

		(sps as any).setParticles(startIndex, endIndex, false);

		batchInfo.startIndex = endIndex;

		if (endIndex >= sps.nbParticles) {
			batchInfo.startIndex = 0;
		}
	}

	private _setParticleProperty(particle: CustomSolidParticle, property: string, value: any): void {
		particle[property] = value;
	}

	private _getTotalActiveParticles(): number {
		return this._activeAnimations.size;
	}

	public getPerformanceInfo(): { fps: number; activeParticles: number; deltaTime: number } {
		const fps = this._deltaTime > 0 ? Math.round(1 / this._deltaTime) : 0;
		const engineFps = this._engine.getFps();
		return {
			fps: Math.max(fps, engineFps),
			activeParticles: this._getTotalActiveParticles(),
			deltaTime: this._deltaTime,
		};
	}

	public dispose(): void {
		this._onBeforeRenderObserver?.remove();
		this._activeAnimations.clear();
		this._meshSPSCache.clear();
		this._spsToUpdate.clear();
		this._spsBatchInfo.clear();
	}
}
