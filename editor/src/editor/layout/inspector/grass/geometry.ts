import { Mesh, VertexData, Vector3, Tools } from "babylonjs";
import { grassConfiguration } from "./configuration";
import { UniqueNumber } from "../../../../tools/tools";

/**
 * Creates a single mesh containing all grass blades
 * @param scene - The Babylon.js scene to create the mesh in
 * @param material - The material to apply to the grass mesh
 * @returns The created grass mesh or null if creation fails
 */
export function createSingleMeshGrass(scene: any, material: any): Mesh | null {
    const { bladeCount, bladeWidth, bladeHeight, heightVariation, brushRadius, tipBendStrength } = grassConfiguration;
    const actualBladeCount = bladeCount; // No limit - use exact bladeCount value
    
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let bladeIndex = 0;
    const VERTEX_COUNT = 7;
    
    for (let i = 0; i < actualBladeCount; i++) {
        const blade = generateBlade(i, bladeWidth, bladeHeight, heightVariation, brushRadius, tipBendStrength);
        blade.verts.forEach((vert) => {
            positions.push(...vert.pos);
            uvs.push(...vert.uv);
            colors.push(...vert.color);
        });
        blade.indices.forEach((index) => indices.push(index + bladeIndex * VERTEX_COUNT));
        bladeIndex++;
    }
    
    if (positions.length === 0 || indices.length === 0) {
        console.warn("Invalid grass geometry - no vertices or indices generated");
        return null;
    }
    
    const grassMesh = new Mesh("grass", scene);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.uvs = uvs;
    vertexData.colors = colors;
    vertexData.indices = indices;
    vertexData.applyToMesh(grassMesh);
    
    // Setup geometry IDs like standard meshes
    if (grassMesh.geometry) {
        grassMesh.geometry.id = Tools.RandomId();
        grassMesh.geometry.uniqueId = UniqueNumber.Get();
    }
    
    if (material) {
        grassMesh.material = material;
    }
    
    return grassMesh;
}

/**
 * Generates a single grass blade with vertices and indices
 * @param index - The blade index for unique positioning
 * @param bladeWidth - Width of the grass blade
 * @param bladeHeight - Height of the grass blade
 * @param heightVariation - Random height variation factor
 * @param brushRadius - Radius of the grass placement area
 * @param tipBendStrength - Strength of the tip bending effect
 * @returns Object containing vertices and indices for the blade
 */
function generateBlade(index: number, bladeWidth: number, bladeHeight: number, heightVariation: number, brushRadius: number, tipBendStrength: number) {
    const safeBladeWidth = Math.max(bladeWidth, 0.01);
    const safeBladeHeight = Math.max(bladeHeight, 0.1);
    const safeHeightVariation = Math.max(heightVariation, 0);
    const safeBrushRadius = Math.max(brushRadius, 0.1);
    const safeTipBendStrength = Math.max(tipBendStrength, 0);
    
    const height = safeBladeHeight + Math.random() * safeHeightVariation;
    const radius = safeBrushRadius * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    const center = new Vector3(x, 0, z);
    const yaw = Math.random() * Math.PI * 2;
    const yawUnitVec = new Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const tipBend = Math.random() * Math.PI * 2;
    const tipBendStrengthRandom = (Math.random() - 0.5) * safeTipBendStrength;
    const tipBendUnitVec = new Vector3(
        Math.sin(tipBend) * tipBendStrengthRandom,
        0,
        -Math.cos(tipBend) * tipBendStrengthRandom
    );
    
    const bl = center.add(yawUnitVec.scale(safeBladeWidth / 2));
    const br = center.add(yawUnitVec.scale(-(safeBladeWidth / 2)));
    const ml1 = center.add(yawUnitVec.scale(safeBladeWidth * 0.4));
    const mr1 = center.add(yawUnitVec.scale(-(safeBladeWidth * 0.4)));
    ml1.y += height * 0.25;
    mr1.y += height * 0.25;
    const ml2 = center.add(yawUnitVec.scale(safeBladeWidth * 0.2));
    const mr2 = center.add(yawUnitVec.scale(-(safeBladeWidth * 0.2)));
    ml2.y += height * 0.75;
    mr2.y += height * 0.75;
    const tc = center.add(tipBendUnitVec);
    tc.y += height;
    
    const uv = [
        convertRange(center.x, -safeBrushRadius, safeBrushRadius, 0, 1),
        convertRange(center.z, -safeBrushRadius, safeBrushRadius, 0, 1),
    ];
    
    const verts = [
        { pos: bl.asArray(), uv: uv, color: [0.0, 0.0, 0.0] },
        { pos: br.asArray(), uv: uv, color: [0.0, 0.0, 0.0] },
        { pos: ml1.asArray(), uv: uv, color: [0.25, 0.25, 0.25] },
        { pos: mr1.asArray(), uv: uv, color: [0.25, 0.25, 0.25] },
        { pos: ml2.asArray(), uv: uv, color: [0.75, 0.75, 0.75] },
        { pos: mr2.asArray(), uv: uv, color: [0.75, 0.75, 0.75] },
        { pos: tc.asArray(), uv: uv, color: [1.0, 1.0, 1.0] },
    ];
    
    const indices = [
        index * 7, index * 7 + 1, index * 7 + 2,
        index * 7 + 2, index * 7 + 1, index * 7 + 3,
        index * 7 + 2, index * 7 + 3, index * 7 + 4,
        index * 7 + 4, index * 7 + 3, index * 7 + 5,
        index * 7 + 4, index * 7 + 5, index * 7 + 6,
    ];
    
    return { verts, indices };
}

/**
 * Converts a value from one range to another
 * @param val - The value to convert
 * @param oldMin - Minimum value of the original range
 * @param oldMax - Maximum value of the original range
 * @param newMin - Minimum value of the new range
 * @param newMax - Maximum value of the new range
 * @returns The converted value in the new range
 */
function convertRange(val: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
    return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}
