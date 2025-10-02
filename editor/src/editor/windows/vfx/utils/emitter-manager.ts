import { Mesh, Scene } from "babylonjs";

export class EmitterManager {
	private emitterMesh: Mesh | null = null;
	private emitterMap: Map<string, Mesh> = new Map();

	/**
	 * Creates the default root emitter mesh
	 */
	public createDefaultEmitter(scene: Scene): Mesh {
		if (this.emitterMesh) {
			return this.emitterMesh;
		}

		const rootEmitter = new Mesh("VFX_Emitter_Root", scene);
		rootEmitter.isVisible = false;
		
		this.emitterMesh = rootEmitter;
		return rootEmitter;
	}

	/**
	 * Gets the current root emitter mesh
	 */
	public getEmitterMesh(): Mesh | null {
		return this.emitterMesh;
	}

	/**
	 * Updates the root emitter mesh and reparents all individual emitters
	 */
	public updateEmitterMesh(newRootMesh: Mesh): void {
		// Reparent all individual emitters to the new root
		this.emitterMap.forEach((emitterMesh) => {
			emitterMesh.setParent(newRootMesh);
		});

		// Dispose old root mesh
		this.emitterMesh?.dispose();
		
		// Set new root mesh
		this.emitterMesh = newRootMesh;
	}

	/**
	 * Creates an individual emitter mesh for a specific component
	 */
	public createIndividualEmitter(componentId: string, scene: Scene): Mesh | null {
		if (!this.emitterMesh) {
			return null;
		}

		// Create individual emitter mesh for this component
		const emitterMesh = new Mesh(`Emitter_${componentId}`, scene);
		emitterMesh.isVisible = false;
		emitterMesh.setParent(this.emitterMesh);

		// Store in map
		this.emitterMap.set(componentId, emitterMesh);

		return emitterMesh;
	}

	/**
	 * Cleans up an individual emitter mesh
	 */
	public cleanupEmitter(componentId: string): void {
		const emitterMesh = this.emitterMap.get(componentId);
		if (emitterMesh) {
			emitterMesh.dispose();
			this.emitterMap.delete(componentId);
		}
	}

	/**
	 * Cleans up all emitters and the root emitter
	 */
	public dispose(): void {
		// Clean up all individual emitters
		this.emitterMap.forEach((emitterMesh) => {
			emitterMesh.dispose();
		});
		this.emitterMap.clear();

		// Clean up root emitter
		this.emitterMesh?.dispose();
		this.emitterMesh = null;
	}
}
