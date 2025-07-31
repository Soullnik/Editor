/**
 * Configuration object for foliage painting parameters
 */
export const foliageConfiguration = {
	/** Radius of the foliage placement area */
	brushRadius: 100,
	/** Number of instances to generate per click */
	density: 1,
	/** Minimum distance between instances */
	distance: 1,
	/** Whether to paint continuously while holding mouse */
	holdToPaint: true,
	/** Minimum random scaling factor */
	randomScalingMin: 0.8,
	/** Maximum random scaling factor */
	randomScalingMax: 1.2,
	/** Base scaling factor for all instances */
	scalingFactor: 1.0,
	/** Minimum random rotation in radians (X, Y, Z) */
	randomRotationMin: [0, -Math.PI, 0],
	/** Maximum random rotation in radians (X, Y, Z) */
	randomRotationMax: [0, Math.PI, 0],
	/** Tool type: "add" for adding instances, "scale" for scaling existing */
	toolType: "add" as "add" | "scale",
	/** Scaling value for scale tool */
	rescaleValue: 0.01,
	/** Path to the material file (empty for default material) */
	materialPath: "",
}; 
