import { Scene, Vector3, Ray, AbstractMesh } from "babylonjs";

import { IBrushThinInstanceGroup } from "./thin-instances";

export interface IBrushSettings {
	size: number;
	paintDensity: number;
	eraseDensity: number;
}

export interface IBrushPaintResult {
	position: Vector3;
	normal: Vector3;
	hitMesh: AbstractMesh | null;
}

/**
 * Performs raycast from camera through mouse position to find intersection point for brush positioning
 */
export function getBrushPositionFromMouse(scene: Scene, mouseX: number, mouseY: number, groundOnly: boolean = false): IBrushPaintResult | null {
	const camera = scene.activeCamera;
	if (!camera) {
		return null;
	}

	// Create ray from camera through mouse position
	const ray = scene.createPickingRay(mouseX, mouseY, null, camera);

	// Perform raycast
	const pickInfo = scene.pickWithRay(ray, (mesh) => {
		// Filter meshes based on groundOnly flag
		if (groundOnly) {
			return mesh.name.toLowerCase().includes("ground") || mesh.name.toLowerCase().includes("plane") || mesh.metadata?.isGround === true;
		}
		return true;
	});

	if (!pickInfo || !pickInfo.hit || !pickInfo.pickedPoint) {
		return null;
	}

	return {
		position: pickInfo.pickedPoint,
		normal: pickInfo.getNormal(true) || Vector3.Up(),
		hitMesh: pickInfo.pickedMesh,
	};
}

/**
 * Generates random positions within brush area for painting
 */
export function generateBrushPositions(center: Vector3, normal: Vector3, brushSize: number, density: number): Vector3[] {
	const positions: Vector3[] = [];
	const numPositions = Math.floor(brushSize * brushSize * density * 10); // Scale factor for reasonable density

	// Create two perpendicular vectors to the normal for the brush plane
	const right = Vector3.Cross(normal, Vector3.Up()).normalize();
	const up = Vector3.Cross(right, normal).normalize();

	for (let i = 0; i < numPositions; i++) {
		// Generate random point in circle
		const angle = Math.random() * Math.PI * 2;
		const radius = Math.sqrt(Math.random()) * brushSize * 0.5; // Square root for uniform distribution

		// Calculate position in brush plane
		const offset = right.scale(radius * Math.cos(angle)).add(up.scale(radius * Math.sin(angle)));
		const position = center.add(offset);

		positions.push(position);
	}

	return positions;
}

/**
 * Paints objects at given positions using thin instances
 */
export function paintBrushPositions(
	positions: Vector3[],
	groups: Map<string, IBrushThinInstanceGroup>,
	enabledAssets: string[],
	addBrushThinInstanceFn: (group: IBrushThinInstanceGroup, position: Vector3, rotation?: Vector3, scaling?: Vector3) => void
): void {
	enabledAssets.forEach((assetId) => {
		const group = groups.get(assetId);
		if (!group) {
			return;
		}

		positions.forEach((position) => {
			// Add some randomness for natural look
			const randomRotation = getRandomBrushRotation();
			const randomScaling = getRandomBrushScaling(1.0, 0.3);

			addBrushThinInstanceFn(group, position, randomRotation, randomScaling);
		});
	});
}

/**
 * Erases objects in brush area
 */
export function eraseBrushArea(
	center: Vector3,
	brushSize: number,
	groups: Map<string, IBrushThinInstanceGroup>,
	eraseDensity: number,
	removeBrushThinInstanceFn: (group: IBrushThinInstanceGroup, instanceId: string) => void
): void {
	groups.forEach((group) => {
		const instancesToRemove: string[] = [];

		group.instances.forEach((instance) => {
			const distance = Vector3.Distance(center, instance.position);
			if (distance <= brushSize * 0.5) {
				// Random chance to erase based on density
				if (Math.random() < eraseDensity) {
					instancesToRemove.push(instance.id);
				}
			}
		});

		// Remove marked instances
		instancesToRemove.forEach((instanceId) => {
			removeBrushThinInstanceFn(group, instanceId);
		});
	});
}

/**
 * Gets all meshes that can be painted on (ground, planes, etc.)
 */
export function getPaintableMeshes(scene: Scene): AbstractMesh[] {
	return scene.meshes.filter((mesh) => {
		// Check if mesh is paintable based on name or metadata
		const name = mesh.name.toLowerCase();
		return name.includes("ground") || name.includes("plane") || name.includes("terrain") || mesh.metadata?.isPaintable === true;
	});
}

/**
 * Finds the closest paintable surface to a given position
 */
export function findClosestPaintableSurface(scene: Scene, position: Vector3, maxDistance: number = 10): IBrushPaintResult | null {
	const paintableMeshes = getPaintableMeshes(scene);
	let closestResult: IBrushPaintResult | null = null;
	let closestDistance = maxDistance;

	paintableMeshes.forEach((mesh) => {
		// Create ray from position downward
		const ray = new Ray(position, Vector3.Down());
		const pickInfo = scene.pickWithRay(ray, (m) => m === mesh);

		if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
			const distance = Vector3.Distance(position, pickInfo.pickedPoint);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestResult = {
					position: pickInfo.pickedPoint,
					normal: pickInfo.getNormal(true) || Vector3.Up(),
					hitMesh: pickInfo.pickedMesh,
				};
			}
		}
	});

	return closestResult;
}

// Helper functions
export function getRandomBrushRotation(): Vector3 {
	return new Vector3((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
}

export function getRandomBrushScaling(baseScale: number = 1.0, variation: number = 0.2): Vector3 {
	const scale = baseScale + (Math.random() - 0.5) * variation;
	return new Vector3(scale, scale, scale);
}
