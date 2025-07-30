import { Mesh, MeshBuilder, StandardMaterial, Color3, Vector3 } from "babylonjs";
import { grassConfiguration } from "./configuration";
import { setMeshMetadataNotSerializable, setMeshMetadataNotVisibleInGraph } from "../../../../tools/mesh/metadata";

// Debouncing for update optimization
let updateTimeout: NodeJS.Timeout | null = null;
const UPDATE_DELAY = 16; // ~60 FPS

/**
 * Manages the preview indicator for grass placement
 */
export class PreviewManager {
    private previewIndicator: Mesh | null = null;

    /**
     * Creates a new PreviewManager instance
     * @param scene - The Babylon.js scene
     * @param material - The material for the preview indicator
     */
    constructor(private scene: any, private material: any) {}

    /**
     * Creates a preview indicator (disc) for grass placement
     * @param lastPickPosition - The position where the indicator should be placed
     * @param lastPickedNormal - The normal vector of the surface
     * @returns The created preview indicator mesh
     */
    public createPreviewIndicator(lastPickPosition: Vector3, lastPickedNormal: Vector3): Mesh {
        this.dispose();
        
        const { brushRadius } = grassConfiguration;
        
        // Create indicator (disc)
        this.previewIndicator = MeshBuilder.CreateDisc("grassPreview", {
            radius: brushRadius,
            tessellation: 32
        }, this.scene);
        
        // Rendering settings for preview
        this.previewIndicator.renderingGroupId = 1; // Separate rendering group
        this.previewIndicator.alwaysSelectAsActiveMesh = true; // Always active for picking
        this.previewIndicator.checkCollisions = false; // Disable collisions
        
        // Enhanced material settings for indicator
        const previewMaterial = new StandardMaterial("previewMat", this.scene);
        previewMaterial.alpha = 0.4; // Increased alpha for better visibility
        previewMaterial.diffuseColor = new Color3(0, 0.7, 1); // Brighter blue
        previewMaterial.emissiveColor = new Color3(0, 0.3, 0.6); // Brighter glow
        previewMaterial.backFaceCulling = false;
        previewMaterial.needAlphaBlending = () => true;
        previewMaterial.useAlphaFromDiffuseTexture = false;
        previewMaterial.disableLighting = false; // Enable lighting for better visibility
        previewMaterial.zOffset = 1; // Z offset to avoid z-fighting
        
        this.previewIndicator.material = previewMaterial;
        
        // Position and rotation
        this.updateIndicatorTransform(lastPickPosition, lastPickedNormal);
        
        setMeshMetadataNotSerializable(this.previewIndicator, true);
        setMeshMetadataNotVisibleInGraph(this.previewIndicator, true);
        
        return this.previewIndicator;
    }

    /**
     * Updates the position and rotation of the preview indicator
     * @param position - The new position for the indicator
     * @param normal - The normal vector of the surface
     */
    public updateIndicatorTransform(position: Vector3, normal: Vector3): void {
        if (!this.previewIndicator || !position || !normal) return;
        
        // Increase offset to avoid z-fighting
        const offset = normal.scale(0.05); // Increased from 0.01 to 0.05
        this.previewIndicator.position = position.add(offset);
        
        if (Math.abs(normal.y) > 0.9) {
            this.previewIndicator.rotation.x = -Math.PI / 2;
            this.previewIndicator.rotation.y = 0;
            this.previewIndicator.rotation.z = 0;
        } else {
            const angleY = Math.atan2(normal.x, normal.z);
            this.previewIndicator.rotation.x = -Math.PI / 2;
            this.previewIndicator.rotation.y = angleY;
            this.previewIndicator.rotation.z = 0;
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
            this.performUpdate();
        }, UPDATE_DELAY);
    }

    /**
     * Performs the actual update of the preview indicator
     */
    private performUpdate(): void {
        // Update indicator size when brushRadius changes
        if (this.previewIndicator) {
            const { brushRadius } = grassConfiguration;
            // Create new disc with correct radius
            const newDisc = MeshBuilder.CreateDisc("grassPreviewNew", {
                radius: brushRadius,
                tessellation: 32
            }, this.scene);
            
            // Apply same rendering settings
            newDisc.renderingGroupId = 1;
            newDisc.alwaysSelectAsActiveMesh = true;
            newDisc.checkCollisions = false;
            
            // Copy material and position
            newDisc.material = this.previewIndicator.material;
            newDisc.position = this.previewIndicator.position.clone();
            newDisc.rotation = this.previewIndicator.rotation.clone();
            newDisc.scaling = this.previewIndicator.scaling.clone();
            
            // Set metadata
            setMeshMetadataNotSerializable(newDisc, true);
            setMeshMetadataNotVisibleInGraph(newDisc, true);
            
            // Remove old disc and replace with new one
            this.previewIndicator.dispose(true, false);
            this.previewIndicator = newDisc;
        }
    }

    /**
     * Disposes of the preview indicator and cleans up resources
     */
    public dispose(): void {
        this.previewIndicator?.dispose(true, false);
        this.previewIndicator = null;
        
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
        return this.previewIndicator;
    }

    /**
     * Gets all transformation data from the indicator for grass creation
     * @returns Object containing position, rotation, and scaling data or null if indicator doesn't exist
     */
    public getIndicatorData(): { position: Vector3; rotation: Vector3; scaling: Vector3 } | null {
        if (!this.previewIndicator) return null;
        
        return {
            position: this.previewIndicator.position.clone(),
            rotation: this.previewIndicator.rotation.clone(),
            scaling: this.previewIndicator.scaling.clone()
        };
    }
}
