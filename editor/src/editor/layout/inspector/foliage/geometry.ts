import { Mesh, Vector3, Quaternion, Matrix, Scalar } from "babylonjs";
import { foliageConfiguration } from "./configuration";

/**
 * Creates thin instances for foliage painting
 * @param sourceMesh - The source mesh to create instances from
 * @param position - The position to place instances
 * @param normal - The surface normal

 * @returns Array of created matrices for thin instances
 */
export function createFoliageInstances(sourceMesh: Mesh, position: Vector3, normal: Vector3): Matrix[] {
	const { density, distance, randomScalingMin, randomScalingMax, scalingFactor, randomRotationMin, randomRotationMax } = foliageConfiguration;

	const matrices: Matrix[] = [];
	const center = position.clone();

	for (let i = 0; i < density; i++) {
		// Generate random position within brush radius
		const randomPoint = new Vector3(
			Scalar.RandomRange(center.x - distance * 0.5, center.x + distance * 0.5),
			center.y,
			Scalar.RandomRange(center.z - distance * 0.5, center.z + distance * 0.5)
		);

		const matrix = generateInstanceMatrix(sourceMesh, randomPoint, normal);
		if (matrix) {
			matrices.push(matrix);
		}
	}

	return matrices;
}

/**
 * Generates a transformation matrix for a single instance
 * @param sourceMesh - The source mesh
 * @param position - The target position
 * @param normal - The surface normal
 * @returns The transformation matrix
 */
function generateInstanceMatrix(sourceMesh: Mesh, position: Vector3, normal: Vector3): Matrix | null {
	const { randomScalingMin, randomScalingMax, scalingFactor, randomRotationMin, randomRotationMax } = foliageConfiguration;

	// Get source mesh properties
	const sourcePosition = sourceMesh.getAbsolutePosition();
	const sourceRotation = sourceMesh.absoluteRotationQuaternion || Quaternion.Identity();
	const sourceScaling = sourceMesh.scaling.clone();

	// Calculate target rotation based on normal
	const targetRotation = calculateRotationFromNormal(normal);

	// Apply random rotation variations
	const randomRotation = Quaternion.FromEulerAngles(
		Scalar.RandomRange(randomRotationMin[0], randomRotationMax[0]),
		Scalar.RandomRange(randomRotationMin[1], randomRotationMax[1]),
		Scalar.RandomRange(randomRotationMin[2], randomRotationMax[2])
	);

	// Combine rotations
	const finalRotation = sourceRotation.multiply(targetRotation).multiply(randomRotation);

	// Calculate random scaling
	const randomScaleFactor = Scalar.RandomRange(randomScalingMin, randomScalingMax);
	const finalScaling = sourceScaling.scale(randomScaleFactor * scalingFactor);

	// Calculate translation
	const translation = position.subtract(sourcePosition);

	// Compose final matrix
	return Matrix.Compose(finalScaling, finalRotation, translation);
}

/**
 * Calculates rotation quaternion from surface normal
 * @param normal - The surface normal vector
 * @returns The rotation quaternion
 */
function calculateRotationFromNormal(normal: Vector3): Quaternion {
	// Create a rotation that aligns the up vector with the normal
	const up = Vector3.Up();
	const rotationAxis = Vector3.Cross(up, normal);

	if (rotationAxis.lengthSquared() < 0.001) {
		// Normal is parallel to up vector
		return Quaternion.Identity();
	}

	rotationAxis.normalize();
	const angle = Math.acos(Vector3.Dot(up, normal));

	return Quaternion.RotationAxis(rotationAxis, angle);
}

/**
 * Checks if a position is too close to existing instances
 * @param position - The position to check
 * @param existingMatrices - Array of existing instance matrices

 * @param minDistance - Minimum distance between instances
 * @returns True if position is valid (not too close)
 */
export function isValidInstancePosition(position: Vector3, existingMatrices: Matrix[], minDistance: number): boolean {
	for (const matrix of existingMatrices) {
		const existingPosition = new Vector3();
		matrix.getTranslationToRef(existingPosition);

		const distance = Vector3.Distance(position, existingPosition);
		if (distance < minDistance) {
			return false;
		}
	}

	return true;
}

/**
 * Filters matrices to remove instances that are too close to each other
 * @param matrices - Array of instance matrices
 * @param sourceMesh - The source mesh
 * @param minDistance - Minimum distance between instances
 * @returns Filtered array of matrices
 */
export function filterMatricesByDistance(matrices: Matrix[], sourceMesh: Mesh, minDistance: number): Matrix[] {
	const filtered: Matrix[] = [];

	for (const matrix of matrices) {
		const position = new Vector3();
		matrix.getTranslationToRef(position);

		if (isValidInstancePosition(position, filtered, minDistance)) {
			filtered.push(matrix);
		}
	}

	return filtered;
}
