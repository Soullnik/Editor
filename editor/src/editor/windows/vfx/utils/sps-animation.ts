import { SolidParticleSystem } from "babylonjs";
import { IVFXSolidParticleSystem } from "../types";

/**
 * SPS Animation Utility
 * Handles saving, loading and playing SPS animations
 */
export class SPSAnimationUtility {
	/**
	 * Save current SPS animation state to the component
	 */
	public static saveAnimationState(spsComponent: IVFXSolidParticleSystem): void {
		if (!spsComponent.babylonSPS) return;

		// Create animation settings if they don't exist
		if (!spsComponent.animationSettings) {
			spsComponent.animationSettings = {
				duration: 5000,
				autoReset: true,
				loop: false,
				tracks: []
			};
		}

		// Save the current initParticles and updateParticle functions
		const sps = spsComponent.babylonSPS;
		
		// Store the functions as serializable data
		spsComponent.animationSettings.initParticlesData = this._serializeFunction(sps.initParticles);
		spsComponent.animationSettings.updateParticleData = this._serializeFunction(sps.updateParticle);
		
		// Store current particle states
		spsComponent.animationSettings.initialParticleStates = [];
		for (let i = 0; i < sps.nbParticles; i++) {
			const particle = sps.particles[i];
			spsComponent.animationSettings.initialParticleStates.push({
				position: { x: particle.position.x, y: particle.position.y, z: particle.position.z },
				rotation: { x: particle.rotation.x, y: particle.rotation.y, z: particle.rotation.z },
				scaling: { x: particle.scaling.x, y: particle.scaling.y, z: particle.scaling.z },
				color: { 
					r: particle.color?.r ?? 1, 
					g: particle.color?.g ?? 1, 
					b: particle.color?.b ?? 1, 
					a: particle.color?.a ?? 1 
				}
			});
		}
	}

	/**
	 * Load and apply saved animation state to SPS
	 */
	public static loadAnimationState(spsComponent: IVFXSolidParticleSystem): void {
		if (!spsComponent.babylonSPS || !spsComponent.animationSettings) return;

		const sps = spsComponent.babylonSPS;
		const settings = spsComponent.animationSettings;

		// Restore initParticles function
		if (settings.initParticlesData) {
			sps.initParticles = this._deserializeFunction(settings.initParticlesData, sps) as () => void;
		}

		// Restore updateParticle function
		if (settings.updateParticleData) {
			sps.updateParticle = this._deserializeFunction(settings.updateParticleData, sps) as (particle: any) => any;
		}

		// Restore initial particle states
		if (settings.initialParticleStates) {
			sps.initParticles = () => {
				for (let i = 0; i < sps.nbParticles && i < settings.initialParticleStates!.length; i++) {
					const particle = sps.particles[i];
					const state = settings.initialParticleStates![i];
					
					particle.position.set(state.position.x, state.position.y, state.position.z);
					particle.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
					particle.scaling.set(state.scaling.x, state.scaling.y, state.scaling.z);
					if (particle.color) {
						particle.color.set(state.color.r, state.color.g, state.color.b, state.color.a);
					}
				}
			};
		}
	}

	/**
	 * Start SPS animation playback
	 */
	public static startAnimation(spsComponent: IVFXSolidParticleSystem): void {
		if (!spsComponent.babylonSPS || !spsComponent.animationSettings) return;

		const sps = spsComponent.babylonSPS;
		const settings = spsComponent.animationSettings;

		// Load the saved animation state
		this.loadAnimationState(spsComponent);

		// Initialize particles with saved state
		sps.initParticles();
		sps.setParticles();

		// Make mesh visible
		if (sps.mesh) {
			sps.mesh.isVisible = true;
		}

		// Start animation loop if needed
		if (settings.loop || settings.duration > 0) {
			this._startAnimationLoop(spsComponent);
		}
	}

	/**
	 * Stop SPS animation playback
	 */
	public static stopAnimation(spsComponent: IVFXSolidParticleSystem): void {
		if (!spsComponent.babylonSPS) return;

		const sps = spsComponent.babylonSPS;

		// Stop animation loop
		this._stopAnimationLoop(spsComponent);

		// Reset particles to initial state
		if (spsComponent.animationSettings?.autoReset) {
			sps.rebuildMesh(true);
		}

		// Hide mesh
		if (sps.mesh) {
			sps.mesh.isVisible = false;
		}
	}

	/**
	 * Create SPS with saved animation if it doesn't exist
	 */
	public static ensureSPSExists(spsComponent: IVFXSolidParticleSystem, scene: any): void {
		if (spsComponent.babylonSPS || !spsComponent.templateMesh) return;

		// Create SPS
		spsComponent.babylonSPS = new SolidParticleSystem(
			spsComponent.name, 
			scene, 
			{ useModelMaterial: true }
		);
		
		spsComponent.babylonSPS.addShape(spsComponent.templateMesh, spsComponent.particleCount);
		spsComponent.babylonSPS.buildMesh();

		// Load animation state if available
		if (spsComponent.animationSettings) {
			this.loadAnimationState(spsComponent);
		}
	}

	/**
	 * Serialize a function to a string representation
	 */
	private static _serializeFunction(func: Function): string {
		return func.toString();
	}

	/**
	 * Deserialize a function from string representation
	 */
	private static _deserializeFunction(funcString: string, context: any): Function {
		try {
			// Create a function that has access to the SPS context
			return new Function('sps', 'particle', 'time', `
				${funcString}
			`).bind(context);
		} catch (error) {
			console.warn('Failed to deserialize function:', error);
			return () => {};
		}
	}

	/**
	 * Start animation loop for the SPS
	 */
	private static _startAnimationLoop(spsComponent: IVFXSolidParticleSystem): void {
		if (!spsComponent.babylonSPS) return;

		const sps = spsComponent.babylonSPS;
		const settings = spsComponent.animationSettings!;

		// Store animation start time
		spsComponent._animationStartTime = Date.now();

		// Create animation loop
		spsComponent._animationLoop = () => {
			if (!spsComponent.babylonSPS || !spsComponent._animationStartTime) return;

			const currentTime = Date.now();
			const elapsed = currentTime - spsComponent._animationStartTime;
			const normalizedTime = Math.min(elapsed / settings.duration, 1);

			// Update particles
			sps.setParticles();

			// Check if animation should continue
			if (normalizedTime < 1 || settings.loop) {
				if (normalizedTime >= 1 && settings.loop) {
					// Reset animation
					spsComponent._animationStartTime = currentTime;
					sps.initParticles();
				}
				spsComponent._animationFrameId = requestAnimationFrame(spsComponent._animationLoop!);
			}
		};

		// Start the loop
		spsComponent._animationFrameId = requestAnimationFrame(spsComponent._animationLoop!);
	}

	/**
	 * Stop animation loop for the SPS
	 */
	private static _stopAnimationLoop(spsComponent: IVFXSolidParticleSystem): void {
		if (spsComponent._animationFrameId) {
			cancelAnimationFrame(spsComponent._animationFrameId);
			spsComponent._animationFrameId = undefined;
		}
		spsComponent._animationLoop = undefined;
		spsComponent._animationStartTime = undefined;
	}
}

// Extend the IVFXSolidParticleSystem interface to include animation loop properties
declare module "../types" {
	interface IVFXSolidParticleSystem {
		_animationFrameId?: number;
		_animationLoop?: () => void;
		_animationStartTime?: number;
	}
}
