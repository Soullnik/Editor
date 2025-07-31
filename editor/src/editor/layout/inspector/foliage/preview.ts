import { Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, Material, Scene } from "babylonjs";
import { foliageConfiguration } from "./configuration";
import { setMeshMetadataNotSerializable, setMeshMetadataNotVisibleInGraph } from "../../../../tools/mesh/metadata";

// Debouncing for update optimization
let updateTimeout: NodeJS.Timeout | null = null;
const UPDATE_DELAY = 16; // ~60 FPS

/**
 * Manages the preview indicator for foliage placement
 */
export class FoliagePreviewManager {
	private _previewIndicator: Mesh | null = null;

	/**
	 * Creates a new FoliagePreviewManager instance
	 * @param scene - The Babylon.js scene
	 * @param material - The material for the preview indicator
	 */
	constructor(
		private _scene: Scene,
		private _material: Material
	) {}

	/**
	 * Creates a preview indicator (disc) for foliage placement
	 * @param lastPickPosition - The position where the indicator should be placed
	 * @param lastPickedNormal - The normal vector of the surface
	 * @returns The created preview indicator mesh
	 */
	public createPreviewIndicator(lastPickPosition: Vector3, lastPickedNormal: Vector3): Mesh {
		this.dispose();

		const { brushRadius } = foliageConfiguration;

		// Create indicator (disc)
		this._previewIndicator = MeshBuilder.CreateDisc(
			"foliagePreview",
			{
				radius: brushRadius,
				tessellation: 32,
			},
			this._scene
		);

		// Rendering settings for preview
		this._previewIndicator.renderingGroupId = 1; // Separate rendering group
		this._previewIndicator.alwaysSelectAsActiveMesh = true; // Always active for picking
		this._previewIndicator.checkCollisions = false; // Disable collisions

		// Enhanced material settings for indicator
		const previewMaterial = new StandardMaterial("foliagePreviewMat", this._scene);
		previewMaterial.alpha = 0.4; // Increased alpha for better visibility
		previewMaterial.diffuseColor = new Color3(0, 0.7, 0.3); // Green color for foliage
		previewMaterial.emissiveColor = new Color3(0, 0.3, 0.1); // Green glow
		previewMaterial.backFaceCulling = false;
		previewMaterial.needAlphaBlending = () => true;
		previewMaterial.useAlphaFromDiffuseTexture = false;
		previewMaterial.disableLighting = false; // Enable lighting for better visibility
		previewMaterial.zOffset = 1; // Z offset to avoid z-fighting

		this._previewIndicator.material = previewMaterial;

		// Position and rotation
		this.updateIndicatorTransform(lastPickPosition, lastPickedNormal);

		setMeshMetadataNotSerializable(this._previewIndicator, true);
		setMeshMetadataNotVisibleInGraph(this._previewIndicator, true);

		return this._previewIndicator;
	}

	/**
	 * Updates the position and rotation of the preview indicator
	 * @param position - The new position for the indicator
	 * @param normal - The normal vector of the surface
	 */
	public updateIndicatorTransform(position: Vector3, normal: Vector3): void {
		if (!this._previewIndicator || !position || !normal) {
			return;
		}

		// Increase offset to avoid z-fighting
		const offset = normal.scale(0.05); // Increased from 0.01 to 0.05
		this._previewIndicator.position = position.add(offset);

		if (Math.abs(normal.y) > 0.9) {
			this._previewIndicator.rotation.x = -Math.PI / 2;
			this._previewIndicator.rotation.y = 0;
			this._previewIndicator.rotation.z = 0;
		} else {
			const angleY = Math.atan2(normal.x, normal.z);
			this._previewIndicator.rotation.x = -Math.PI / 2;
			this._previewIndicator.rotation.y = angleY;
			this._previewIndicator.rotation.z = 0;
		}
	}

	/**
	 * Schedules an optimized update with debouncing
	 */
	public scheduleUpdate(): void {
		if (updateTimeout) {
			clearTimeout(updateTimeout);
		}

		updateTimeout = setTimeout(() => {
			this._performUpdate();
		}, UPDATE_DELAY);
	}

	/**
	 * Performs the actual update of the preview indicator
	 */
	private _performUpdate(): void {
		// Update indicator size when brushRadius changes
		if (this._previewIndicator) {
			const { brushRadius } = foliageConfiguration;
			// Create new disc with correct radius
			const newDisc = MeshBuilder.CreateDisc(
				"foliagePreviewNew",
				{
					radius: brushRadius,
					tessellation: 32,
				},
				this._scene
			);

			// Apply same rendering settings
			newDisc.renderingGroupId = 1;
			newDisc.alwaysSelectAsActiveMesh = true;
			newDisc.checkCollisions = false;

			// Copy material and position
			newDisc.material = this._previewIndicator.material;
			newDisc.position = this._previewIndicator.position.clone();
			newDisc.rotation = this._previewIndicator.rotation.clone();
			newDisc.scaling = this._previewIndicator.scaling.clone();

			// Set metadata
			setMeshMetadataNotSerializable(newDisc, true);
			setMeshMetadataNotVisibleInGraph(newDisc, true);

			// Remove old disc and replace with new one
			this._previewIndicator.dispose(true, false);
			this._previewIndicator = newDisc;
		}
	}

	/**
	 * Disposes of the preview indicator and cleans up resources
	 */
	public dispose(): void {
		this._previewIndicator?.dispose(true, false);
		this._previewIndicator = null;

		// Clear timeout
		if (updateTimeout) {
			clearTimeout(updateTimeout);
			updateTimeout = null;
		}
	}

	/**
	 * Gets the current preview indicator mesh
	 * @returns The preview indicator mesh or null if not created
	 */
	public getIndicator(): Mesh | null {
		return this._previewIndicator;
	}

	/**
	 * Gets all transformation data from the indicator for foliage creation
	 * @returns Object containing position, rotation, and scaling data or null if indicator doesn't exist
	 */
	public getIndicatorData(): { position: Vector3; rotation: Vector3; scaling: Vector3 } | null {
		if (!this._previewIndicator) {
			return null;
		}

		return {
			position: this._previewIndicator.position.clone(),
			rotation: this._previewIndicator.rotation.clone(),
			scaling: this._previewIndicator.scaling.clone(),
		};
	}
}
