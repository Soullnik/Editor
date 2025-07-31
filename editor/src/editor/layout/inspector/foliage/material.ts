import { Material, Color3, Scene } from "babylonjs";
import { loadImportedMaterial } from "../../preview/import/import";
import { addPBRMaterial } from "../../../../project/add/material";

/**
 * Loads a material from a file path and configures it for grass
 * @param path - Path to the material file
 * @param scene - The Babylon.js scene
 * @returns Promise resolving to the loaded material or null if loading fails
 */
export async function loadMaterialFromPath(path: string, scene: Scene): Promise<Material | null> {
    const data = await import("fs-extra").then(fs => fs.readJSON(path));
    let material = scene.getMaterialById(data.id);
    if (!material) {
        material = await loadImportedMaterial(scene, path);
    }
    if (material) {
        material.backFaceCulling = false;
    }
    return material;
}

/**
 * Creates a default PBR material for grass with green color and appropriate properties
 * @param scene - The Babylon.js scene
 * @returns The created default grass material
 */
export function createDefaultGrassMaterial(scene: Scene): Material {
    const defaultMaterial = addPBRMaterial(scene);
    defaultMaterial.albedoColor = new Color3(0.2, 0.6, 0.1);
    defaultMaterial.metallic = 0.0;
    defaultMaterial.roughness = 0.8;
    defaultMaterial.emissiveColor = new Color3(0, 0.1, 0);
    defaultMaterial.emissiveIntensity = 0.1;
    defaultMaterial.ambientColor = new Color3(0.1, 0.3, 0.05);
    defaultMaterial.backFaceCulling = false;
    return defaultMaterial;
}
