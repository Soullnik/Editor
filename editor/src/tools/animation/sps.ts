import { Scene, Animation } from "babylonjs";

/**
 * Interface for SPS animation manager
 */
export interface ISPSAnimationManager {
	beginDirectAnimation(animatable: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number): void;
	stopAnimation(animatable: any): void;
	stopAllAnimations(): void;
	setCurrentTime(time: number, animatable?: any): void;
	play(): void;
	stop(): void;
	dispose(): void;
}

/**
 * Manager class for handling SPS particle animations
 */
export class SPSAnimationManager implements ISPSAnimationManager {
	private _scene: Scene;
	private _activeAnimations: Map<string, { animatable: any; from: number; to: number; loop: boolean; speedRatio: number }> = new Map();
	private _onBeforeRenderObserver: any = null;
	private _currentTime: number = 0;
	private _isPlaying: boolean = false;
	private _lastUpdateTime: number = 0;
	private _updateThrottle: number = 16; // 60 FPS = 16ms между обновлениями

	constructor(scene: Scene) {
		this._scene = scene;
		this._setupRenderLoop();
	}

	public beginDirectAnimation(animatable: any, _animations: Animation[], from: number, to: number, loop: boolean = false, speedRatio: number = 1.0): void {
		if (animatable.getClassName?.() === "CustomSolidParticle") {
			const key = this._getAnimationKey(animatable);
			this._activeAnimations.set(key, { animatable, from, to, loop, speedRatio });
			
			// Устанавливаем updateParticle функцию для SPS системы
			if (animatable._sps && animatable._sps.updateParticle) {
				this._setupUpdateParticle(animatable._sps);
			}
		}
	}

	public stopAnimation(animatable: any): void {
		const key = this._getAnimationKey(animatable);
		this._activeAnimations.delete(key);
		
		// Сбрасываем анимации частицы к начальному состоянию
		if (animatable.getClassName?.() === "CustomSolidParticle" && animatable.animations) {
			animatable.animations.forEach((animation: Animation) => {
				const keys = animation.getKeys();
				if (keys.length > 0) {
					// Берем значение из первого ключа (начальное состояние)
					const initialValue = keys[0].value;
					this._setParticleProperty(animatable, animation.targetProperty, initialValue);
				}
			});
			
			// Обновляем SPS систему
			if (animatable._sps && animatable._sps.setParticles) {
				animatable._sps.setParticles();
			}
		}
	}

	public setCurrentTime(time: number, animatable?: any): void {
		this._currentTime = time;
		
		// Throttle updates to improve performance
		const now = performance.now();
		if (now - this._lastUpdateTime >= this._updateThrottle) {
			this._lastUpdateTime = now;
			this._updateAnimations();
		}
	}

	public play(): void {
		this._isPlaying = true;
	}

	public stopAllAnimations(): void {
		// Сбрасываем все активные анимации к начальному состоянию
		this._activeAnimations.forEach((animationData) => {
			const animatable = animationData.animatable;
			if (animatable.getClassName?.() === "CustomSolidParticle" && animatable.animations) {
				animatable.animations.forEach((animation: Animation) => {
					const keys = animation.getKeys();
					if (keys.length > 0) {
						const initialValue = keys[0].value;
						this._setParticleProperty(animatable, animation.targetProperty, initialValue);
					}
				});
				
				// Обновляем SPS систему
				if (animatable._sps && animatable._sps.setParticles) {
					animatable._sps.setParticles();
				}
			}
		});
		
		this._activeAnimations.clear();
	}

	public stop(): void {
		this._isPlaying = false;
	}

	private _getAnimationKey(animatable: any): string {
		if (animatable.getClassName?.() === "CustomSolidParticle") {
			return `particle_${animatable.id}`;
		}
		return `unknown_${Math.random()}`;
	}

	private _setupUpdateParticle(sps: any): void {
		// Сохраняем оригинальную функцию updateParticle если она есть
		const originalUpdateParticle = sps.updateParticle;
		
		sps.updateParticle = (particle: any) => {
			// Вызываем оригинальную функцию если она есть
			if (originalUpdateParticle) {
				originalUpdateParticle(particle);
			}
			
			// Применяем анимации к частице
			this._applyAnimationsToParticle(particle);
		};
	}

	private _applyAnimationsToParticle(particle: any): void {
		if (!particle.animations || particle.animations.length === 0) {
			return;
		}

		// Проверяем есть ли активная анимация для этой частицы
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
				if (animationTime < 0) {
					targetTime = from;
				} else {
					targetTime = to;
				}
			}
		} else {
			targetTime = from + animationTime;
		}

		particle.animations.forEach((animation: Animation) => {
			const value = animation.evaluate(targetTime);
			if (value !== undefined) {
				this._setParticleProperty(particle, animation.targetProperty, value);
			}
		});
	}

	private _setupRenderLoop(): void {
		this._onBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
			if (this._isPlaying) {
				this._currentTime += 1 / 60; // 60 FPS
				this._updateAnimations();
			}
		});
	}

	private _updateAnimations(): void {
		// Обновляем все SPS системы которые имеют активные анимации
		this._activeAnimations.forEach((animationData) => {
			if (animationData.animatable._sps && animationData.animatable._sps.setParticles) {
				animationData.animatable._sps.setParticles();
			}
		});
	}

	private _setParticleProperty(particle: any, property: string, value: any): void {
		(particle as any)[property] = value;
	}

	public dispose(): void {
		if (this._onBeforeRenderObserver) {
			this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
		}
		this._activeAnimations.clear();
	}
}

