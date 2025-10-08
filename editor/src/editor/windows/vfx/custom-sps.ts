import { SolidParticle, Nullable, SolidParticleSystem, Observer, Scene, AbstractEngine, ModelShape, BoundingInfo, Animation } from "babylonjs";

export class CustomSolidParticle extends SolidParticle {
	animations: Nullable<Array<Animation>>;
	declare _sps: CustomSolidParticleSystem;
	getClassName(): string {
		return "CustomSolidParticle";
	}
}

interface IAnimationData {
	animatable: CustomSolidParticle;
	from: number;
	to: number;
	loop: boolean;
	speedRatio: number;
}

export class CustomSolidParticleSystem extends SolidParticleSystem {
	declare particles: CustomSolidParticle[];
	animations: Nullable<Array<Animation>>;

	// Animation management
	private _activeAnimations: Map<string, IAnimationData> = new Map();
	private _onBeforeRenderObserver: Observer<Scene> | null = null;
	private _currentTime: number = 0;
	private _isPlaying: boolean = false;
	private _engine: AbstractEngine;
	private _deltaTime: number = 0;
	private _needsUpdate: boolean = false;
	private _batchInfo: { startIndex: number; batchSize: number; isUpdating: boolean } | null = null;
	private _batchSize = 1000;
	protected _scene: Scene;

	protected _addParticle(
		idx: number,
		id: number,
		idxpos: number,
		idxind: number,
		model: ModelShape,
		shapeId: number,
		idxInShape: number,
		bInfo?: Nullable<BoundingInfo>,
		storage?: Nullable<[]>
	): SolidParticle {
		const particle = super._addParticle(idx, id, idxpos, idxind, model, shapeId, idxInShape, bInfo, storage) as CustomSolidParticle;
		particle.animations = [];
		particle.getClassName = () => "CustomSolidParticle";
		return particle;
	}

	constructor(name: string, scene: Scene, options?: any) {
		super(name, scene, options);
		this._scene = scene;
		this._engine = scene.getEngine();
		this._setupRenderLoop();
	}

	public start(): void {
		this._isPlaying = true;

		// Setup updateParticle callback
		this._setupUpdateParticle();

		// Initialize batching for large particle counts
		this._initializeBatching();

		// Start animations for all particles
		this.particles.forEach((particle) => {
			if (particle.animations && particle.animations.length > 0) {
				particle.animations.forEach((animation) => {
					const keys = animation.getKeys();
					if (keys.length > 0) {
						const fromFrame = keys[0].frame;
						const toFrame = keys[keys.length - 1].frame;
						this._beginDirectAnimation(particle, [animation], fromFrame, toFrame, false, 1.0);
					}
				});
			}
		});

		// Start mesh animations if any
		if (this.animations && this.animations.length > 0) {
			this.animations.forEach((animation) => {
				const keys = animation.getKeys();
				if (keys.length > 0) {
					const fromFrame = keys[0].frame;
					const toFrame = keys[keys.length - 1].frame;
					this._scene.beginDirectAnimation(this.mesh, [animation], fromFrame, toFrame, false, 1.0);
				}
			});
		}
	}

	public stop(): void {
		this._isPlaying = false;

		// Stop all particle animations
		this._stopAllAnimations();

		// Clear batching info
		this._batchInfo = null;

		// Stop mesh animations
		if (this.mesh) {
			this._scene.stopAnimation(this.mesh);
		}
	}

	public setCurrentTime(time: number): void {
		this._currentTime = time;
		this._needsUpdate = true;
	}

	private _beginDirectAnimation(animatable: CustomSolidParticle, _animations: Animation[], from: number, to: number, loop: boolean = false, speedRatio: number = 1.0): void {
		if (animatable.getClassName() === "CustomSolidParticle") {
			const key = this._getAnimationKey(animatable);
			this._activeAnimations.set(key, { animatable, from, to, loop, speedRatio });
		}
	}

	private _stopAllAnimations(): void {
		for (const animationData of this._activeAnimations.values()) {
			this._resetParticleToInitialState(animationData.animatable);
		}

		this._activeAnimations.clear();
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
		}
	}

	private _setupUpdateParticle(): void {
		this.updateParticle = (particle: CustomSolidParticle): CustomSolidParticle => {
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
		// Use batching for large particle counts
		if (this._batchInfo && this.nbParticles > this._batchSize) {
			this._updateSPSBatch();
		} else {
			// For small particle counts, update all at once
			this.setParticles();
		}
	}

	private _initializeBatching(): void {
		if (this.nbParticles > this._batchSize) {
			this._batchInfo = {
				startIndex: 0,
				batchSize: this._batchSize,
				isUpdating: false,
			};
		}
	}

	private _updateSPSBatch(): void {
		if (!this._batchInfo) {
			return;
		}

		const { startIndex, batchSize } = this._batchInfo;
		const endIndex = Math.min(startIndex + batchSize, this.nbParticles);

		// Update particles in batches
		(this as any).setParticles(startIndex, endIndex, false);

		// Move to next batch
		this._batchInfo.startIndex = endIndex;

		// Reset to beginning when we've processed all particles
		if (endIndex >= this.nbParticles) {
			this._batchInfo.startIndex = 0;
		}
	}

	private _setParticleProperty(particle: CustomSolidParticle, property: string, value: any): void {
		(particle as any)[property] = value;
	}

	public getPerformanceInfo(): { fps: number; activeParticles: number; deltaTime: number } {
		const fps = this._deltaTime > 0 ? Math.round(1 / this._deltaTime) : 0;
		const engineFps = this._engine.getFps();
		return {
			fps: Math.max(fps, engineFps),
			activeParticles: this._activeAnimations.size,
			deltaTime: this._deltaTime,
		};
	}

	public dispose(): void {
		this._onBeforeRenderObserver?.remove();
		this._activeAnimations.clear();
		super.dispose();
	}

	getClassName(): string {
		return "CustomSolidParticleSystem";
	}
}
