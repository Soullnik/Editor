import { Mesh, Vector3, Matrix, Tools, Scene, PBRMaterial, Texture, MeshBuilder } from "babylonjs";

import { UniqueNumber } from "../tools";

export interface IBrushThinInstance {
	id: string;
	position: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
}

export interface IBrushThinInstanceGroup {
	assetId: string;
	assetType: "mesh" | "image";
	sourceMesh: Mesh;
	instances: IBrushThinInstance[];
	matrices: Matrix[];
}

/**
 * Creates a thin instance group for brush painting
 */
export function createBrushThinInstanceGroup(scene: Scene, assetId: string, assetType: "mesh" | "image", sourceMesh?: Mesh, texture?: Texture): IBrushThinInstanceGroup {
	let mesh: Mesh;

	if (assetType === "image" && texture) {
		// Create a plane mesh for image assets
		mesh = MeshBuilder.CreatePlane("brushImagePlane", { size: 1 }, scene);

		// Create PBR material with the texture
		const material = new PBRMaterial("brushImageMaterial", scene);
		material.albedoTexture = texture;
		material.roughness = 0.1;
		material.metallicF0Factor = 0;
		material.alpha = texture.hasAlpha ? 1 : 0;
		material.backFaceCulling = false;

		mesh.material = material;
	} else if (assetType === "mesh" && sourceMesh) {
		// Clone the source mesh for thin instances
		mesh = sourceMesh.clone(`${sourceMesh.name}_brush`, null, false, false);
		mesh.id = Tools.RandomId();
		mesh.uniqueId = UniqueNumber.Get();
	} else {
		throw new Error("Invalid asset type or missing source mesh/texture");
	}

	// Make the source mesh invisible
	mesh.isVisible = false;

	return {
		assetId,
		assetType,
		sourceMesh: mesh,
		instances: [],
		matrices: [],
	};
}

/**
 * Adds a new thin instance to the group
 */
export function addBrushThinInstance(group: IBrushThinInstanceGroup, position: Vector3, rotation?: Vector3, scaling?: Vector3): void {
	const instance: IBrushThinInstance = {
		id: Tools.RandomId(),
		position: position.clone(),
		rotation: rotation?.clone(),
		scaling: scaling?.clone(),
	};

	group.instances.push(instance);

	// Create transformation matrix
	const matrix = Matrix.Identity();

	// Apply translation
	matrix.setTranslation(position);

	// Apply rotation if provided
	if (rotation) {
		const rotationMatrix = Matrix.RotationYawPitchRoll(rotation.y, rotation.x, rotation.z);
		matrix.multiplyToRef(rotationMatrix, matrix);
	}

	// Apply scaling if provided
	if (scaling) {
		const scalingMatrix = Matrix.Scaling(scaling.x, scaling.y, scaling.z);
		matrix.multiplyToRef(scalingMatrix, matrix);
	}

	group.matrices.push(matrix);

	// Update thin instances on the mesh
	updateBrushThinInstances(group);
}

/**
 * Removes a thin instance from the group
 */
export function removeBrushThinInstance(group: IBrushThinInstanceGroup, instanceId: string): void {
	const index = group.instances.findIndex((instance) => instance.id === instanceId);
	if (index === -1) {
		return;
	}

	group.instances.splice(index, 1);
	group.matrices.splice(index, 1);

	updateBrushThinInstances(group);
}

/**
 * Updates the thin instances on the source mesh
 */
export function updateBrushThinInstances(group: IBrushThinInstanceGroup): void {
	if (group.matrices.length === 0) {
		// Clear all thin instances
		group.sourceMesh.thinInstanceSetBuffer("matrix", null, 16, false);
		return;
	}

	// Flatten matrices array
	const flatMatrices = new Float32Array(group.matrices.length * 16);
	for (let i = 0; i < group.matrices.length; i++) {
		const matrix = group.matrices[i];
		for (let j = 0; j < 16; j++) {
			flatMatrices[i * 16 + j] = matrix.m[j];
		}
	}

	// Set the thin instance buffer
	group.sourceMesh.thinInstanceSetBuffer("matrix", flatMatrices, 16, false);
	group.sourceMesh.thinInstanceCount = group.matrices.length;
}

/**
 * Clears all thin instances from the group
 */
export function clearBrushThinInstances(group: IBrushThinInstanceGroup): void {
	group.instances = [];
	group.matrices = [];
	updateBrushThinInstances(group);
}

/**
 * Disposes the thin instance group
 */
export function disposeBrushThinInstanceGroup(group: IBrushThinInstanceGroup): void {
	clearBrushThinInstances(group);
	group.sourceMesh.dispose();
}

/**
 * Gets all thin instance groups for a specific asset type
 */
export function getBrushThinInstanceGroupsByType(groups: Map<string, IBrushThinInstanceGroup>, assetType: "mesh" | "image"): IBrushThinInstanceGroup[] {
	return Array.from(groups.values()).filter((group) => group.assetType === assetType);
}

/**
 * Creates a random rotation for variety in brush painting
 */
export function getRandomBrushRotation(): Vector3 {
	return new Vector3(
		(Math.random() - 0.5) * 0.2, // Small random rotation on X
		Math.random() * Math.PI * 2, // Full rotation on Y
		(Math.random() - 0.5) * 0.2 // Small random rotation on Z
	);
}

/**
 * Creates a random scaling for variety in brush painting
 */
export function getRandomBrushScaling(baseScale: number = 1.0, variation: number = 0.2): Vector3 {
	const scale = baseScale + (Math.random() - 0.5) * variation;
	return new Vector3(scale, scale, scale);
}
