import { Scene, SolidParticleSystem, SolidParticle } from "babylonjs";
import { CustomAnimations } from "../types";

export interface ISPSAnimationData {
	particleId: number;
	animation: CustomAnimations;
	startFrame: number;
	endFrame: number;
	loopMode: number;
	speedRatio: number;
	isPlaying: boolean;
}

export class SPSAnimationManager {
	private _scene: Scene;
	private _activeAnimations: Map<number, ISPSAnimationData[]> = new Map();
	private _spsSystems: Map<number, SolidParticleSystem> = new Map();
	private _onBeforeRenderObserver: any = null;
	private _currentTime: number = 0;

	constructor(scene: Scene) {
		this._scene = scene;
		this._setupRenderLoop();
	}

	/**
	 * Registers an SPS system for animation management
	 */
	public registerSPS(sps: SolidParticleSystem): void {
		this._spsSystems.set(sps.mesh.uniqueId, sps);
	}

	/**
	 * Starts animation for a specific particle in an SPS system
	 */
	public startParticleAnimation(
		sps: SolidParticleSystem,
		particleId: number,
		animation: CustomAnimations,
		startFrame: number,
		endFrame: number,
		loopMode: number = 0,
		speedRatio: number = 1.0
	): void {
		const spsId = sps.mesh.uniqueId;

		if (!this._activeAnimations.has(spsId)) {
			this._activeAnimations.set(spsId, []);
		}

		const animationData: ISPSAnimationData = {
			particleId,
			animation,
			startFrame,
			endFrame,
			loopMode,
			speedRatio,
			isPlaying: true,
		};

		// Remove existing animation for this particle and property
		const existingAnimations = this._activeAnimations.get(spsId)!;
		const existingIndex = existingAnimations.findIndex((a) => a.particleId === particleId && a.animation.targetProperty === animation.targetProperty);

		if (existingIndex !== -1) {
			existingAnimations.splice(existingIndex, 1);
		}

		existingAnimations.push(animationData);
	}

	/**
	 * Sets the current animation time (called by timeline)
	 */
	public setCurrentTime(time: number): void {
		this._currentTime = time;
	}

	private _setupRenderLoop(): void {
		this._onBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
			this._updateAnimations();
		});
	}

	private _updateAnimations(): void {
		this._activeAnimations.forEach((animations, spsId) => {
			const sps = this._spsSystems.get(spsId);
			if (!sps) {
				return;
			}

			animations.forEach((animationData) => {
				if (!animationData.isPlaying) {
					return;
				}
				this._updateParticleAnimation(sps, animationData, this._currentTime);
			});

			// Update SPS particles
			sps.setParticles();
		});
	}

	private _updateParticleAnimation(sps: SolidParticleSystem, animationData: ISPSAnimationData, currentTime: number): void {
		const particle = sps.getParticleById(animationData.particleId);
		if (!particle) {
			return;
		}

		const { animation, startFrame, endFrame, speedRatio } = animationData;

		// Calculate animation progress
		const animationTime = (currentTime - startFrame) * speedRatio;
		const animationDuration = endFrame - startFrame;

		if (animationTime < 0 || animationTime > animationDuration) {
			// Handle loop modes
			if (animationData.loopMode === 1) {
				// Loop
				const loopedTime = animationTime % animationDuration;
				this._applyAnimationToParticle(particle, animation, startFrame + loopedTime);
			} else if (animationData.loopMode === 2) {
				// Ping-pong
				const pingPongTime = animationTime % (animationDuration * 2);
				const normalizedTime = pingPongTime < animationDuration ? pingPongTime : animationDuration * 2 - pingPongTime;
				this._applyAnimationToParticle(particle, animation, startFrame + normalizedTime);
			}
			return;
		}

		this._applyAnimationToParticle(particle, animation, startFrame + animationTime);
	}

	private _applyAnimationToParticle(particle: SolidParticle, animation: CustomAnimations, time: number): void {
		const keys = animation.getKeys();
		if (keys.length === 0) {
			return;
		}

		// Find the appropriate keyframes
		let keyIndex = 0;
		for (let i = 0; i < keys.length - 1; i++) {
			if (time >= keys[i].frame && time <= keys[i + 1].frame) {
				keyIndex = i;
				break;
			}
		}

		if (keyIndex >= keys.length - 1) {
			// Use last keyframe
			this._setParticleProperty(particle, animation.targetProperty, keys[keys.length - 1].value);
			return;
		}

		// Interpolate between keyframes
		const currentKey = keys[keyIndex];
		const nextKey = keys[keyIndex + 1];

		const t = (time - currentKey.frame) / (nextKey.frame - currentKey.frame);
		const interpolatedValue = this._interpolateValue(currentKey.value, nextKey.value, t, animation.dataType);

		this._setParticleProperty(particle, animation.targetProperty, interpolatedValue);
	}

	private _interpolateValue(startValue: any, endValue: any, t: number, dataType: number): any {
		// Handle different animation data types
		switch (dataType) {
			case 0: // Float
				return startValue + (endValue - startValue) * t;
			case 1: // Vector3
				return {
					x: startValue.x + (endValue.x - startValue.x) * t,
					y: startValue.y + (endValue.y - startValue.y) * t,
					z: startValue.z + (endValue.z - startValue.z) * t,
				};
			case 2: // Vector2
				return {
					x: startValue.x + (endValue.x - startValue.x) * t,
					y: startValue.y + (endValue.y - startValue.y) * t,
				};
			case 3: // Quaternion
				return startValue.slerp(endValue, t);
			case 4: // Color3
				return {
					r: startValue.r + (endValue.r - startValue.r) * t,
					g: startValue.g + (endValue.g - startValue.g) * t,
					b: startValue.b + (endValue.b - startValue.b) * t,
				};
			case 5: // Color4
				return {
					r: startValue.r + (endValue.r - startValue.r) * t,
					g: startValue.g + (endValue.g - startValue.g) * t,
					b: startValue.b + (endValue.b - startValue.b) * t,
					a: startValue.a + (endValue.a - startValue.a) * t,
				};
			default:
				return endValue;
		}
	}

	private _setParticleProperty(particle: SolidParticle, property: string, value: any): void {
		// Set the property on the particle
		(particle as any)[property] = value;
	}

	/**
	 * Cleanup method
	 */
	public dispose(): void {
		if (this._onBeforeRenderObserver) {
			this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
		}
		this._activeAnimations.clear();
		this._spsSystems.clear();
	}
}
