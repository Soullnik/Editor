import { VFXComponent, IVFXFile } from "../types";

/**
 * VFX Animation Manager
 * Centralized utility for managing all types of particle animations
 */
export class VFXAnimationManager {
	/**
	 * Start all particle animations in a VFX file
	 */
	public static start(vfxData: IVFXFile): void {
		// Start CPU particle systems
		vfxData.cpuParticles.forEach((cpuParticle) => {
			if (cpuParticle.active && cpuParticle.babylonSystem) {
				cpuParticle.babylonSystem.start();
			}
		});

		// Start GPU particle systems
		vfxData.gpuParticles.forEach((gpuParticle) => {
			if (gpuParticle.active && gpuParticle.babylonSystem) {
				gpuParticle.babylonSystem.start();
			}
		});
	}

	/**
	 * Stop all particle animations in a VFX file
	 */
	public static stop(vfxData: IVFXFile): void {
		// Stop CPU particle systems
		vfxData.cpuParticles.forEach((cpuParticle) => {
			if (cpuParticle.babylonSystem) {
				cpuParticle.babylonSystem.stop();
			}
		});

		// Stop GPU particle systems
		vfxData.gpuParticles.forEach((gpuParticle) => {
			if (gpuParticle.babylonSystem) {
				gpuParticle.babylonSystem.stop();
			}
		});
	}

	/**
	 * Start animation for a specific component
	 */
	public static startComponentAnimation(component: VFXComponent): void {
		switch (component.type) {
			case "cpu_particle_system":
				if (component.active && component.babylonSystem) {
					component.babylonSystem.start();
				}
				break;
			case "gpu_particle_system":
				if (component.active && component.babylonSystem) {
					component.babylonSystem.start();
				}
				break;
		}
	}

	/**
	 * Stop animation for a specific component
	 */
	public static stopComponentAnimation(component: VFXComponent): void {
		switch (component.type) {
			case "cpu_particle_system":
				if (component.babylonSystem) {
					component.babylonSystem.stop();
				}
				break;
			case "gpu_particle_system":
				if (component.babylonSystem) {
					component.babylonSystem.stop();
				}
				break;
		}
	}

	/**
	 * Check if any animations are currently playing
	 */
	public static isAnyAnimationPlaying(vfxData: IVFXFile): boolean {
		// Check CPU particles
		const cpuPlaying = vfxData.cpuParticles.some((cpuParticle) => cpuParticle.babylonSystem && cpuParticle.babylonSystem.isStarted());

		// Check GPU particles
		const gpuPlaying = vfxData.gpuParticles.some((gpuParticle) => gpuParticle.babylonSystem && gpuParticle.babylonSystem.isStarted());

		return cpuPlaying || gpuPlaying;
	}

	/**
	 * Get total number of active components
	 */
	public static getActiveComponentsCount(vfxData: IVFXFile): number {
		return (
			vfxData.cpuParticles.filter((c) => c.active).length + vfxData.gpuParticles.filter((c) => c.active).length + vfxData.particleSystemSets.filter((c) => c.active).length
		);
	}

	/**
	 * Reset all animations to initial state
	 */
	public static reset(vfxData: IVFXFile): void {
		// Reset CPU particles
		vfxData.cpuParticles.forEach((cpuParticle) => {
			if (cpuParticle.babylonSystem) {
				cpuParticle.babylonSystem.stop();
				cpuParticle.babylonSystem.reset();
			}
		});

		// Reset GPU particles
		vfxData.gpuParticles.forEach((gpuParticle) => {
			if (gpuParticle.babylonSystem) {
				gpuParticle.babylonSystem.stop();
				gpuParticle.babylonSystem.reset();
			}
		});
	}
}
