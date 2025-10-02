import { Mesh, Scene } from "babylonjs";

export class EmitterManager {
	private _emitterMesh: Mesh | null = null;
	private _emitterMap: Map<string, Mesh> = new Map();

	/**
	 * Creates the default root emitter mesh
	 */
	public createDefaultEmitter(scene: Scene): Mesh {
		if (this._emitterMesh) {
			return this._emitterMesh;
		}

		const rootEmitter = new Mesh("VFX_Emitter_Root", scene);
		rootEmitter.isVisible = false;

		this._emitterMesh = rootEmitter;
		return rootEmitter;
	}

	/**
	 * Gets the current root emitter mesh
	 */
	public getEmitterMesh(): Mesh | null {
		return this._emitterMesh;
	}

	/**
	 * Updates the root emitter mesh and reparents all individual emitters
	 */
	public updateEmitterMesh(newRootMesh: Mesh): void {
		// Reparent all individual emitters to the new root
		this._emitterMap.forEach((emitterMesh) => {
			emitterMesh.setParent(newRootMesh);
		});

		// Dispose old root mesh
		this._emitterMesh?.dispose();

		// Set new root mesh
		this._emitterMesh = newRootMesh;
	}

	/**
	 * Creates an individual emitter mesh for a specific component
	 */
	public createIndividualEmitter(componentId: string, scene: Scene): Mesh | null {
		if (!this._emitterMesh) {
			return null;
		}

		// Create individual emitter mesh for this component
		const emitterMesh = new Mesh(`Emitter_${componentId}`, scene);
		emitterMesh.isVisible = false;
		emitterMesh.setParent(this._emitterMesh);

		// Store in map
		this._emitterMap.set(componentId, emitterMesh);

		return emitterMesh;
	}

	/**
	 * Cleans up an individual emitter mesh
	 */
	public cleanupEmitter(componentId: string): void {
		const emitterMesh = this._emitterMap.get(componentId);
		if (emitterMesh) {
			emitterMesh.dispose();
			this._emitterMap.delete(componentId);
		}
	}

	/**
	 * Cleans up all emitters and the root emitter
	 */
	public dispose(): void {
		// Clean up all individual emitters
		this._emitterMap.forEach((emitterMesh) => {
			emitterMesh.dispose();
		});
		this._emitterMap.clear();

		// Clean up root emitter
		this._emitterMesh?.dispose();
		this._emitterMesh = null;
	}
}
