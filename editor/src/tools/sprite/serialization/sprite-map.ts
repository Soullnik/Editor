import { Vector2, Vector3, Scene, SpriteMap, Texture } from "babylonjs";
import { readJSON } from "fs-extra";
import { SpriteMapOutputMesh } from "../../guards/nodes";




/**
 * Returns the JSON representation of the given sprite map.
 * @param mesh defines the reference to the sprite map output mesh object to serialize.
 */
export function serializeSpriteMap(mesh: SpriteMapOutputMesh) {
	if(!mesh.metadata.spriteMapRef || !mesh.metadata.spriteMapConfig || mesh.metadata.type !== "SpriteMapMesh") {
		throw new Error("Sprite map output mesh is not valid");
	}

	const spriteMap = mesh.metadata.spriteMapRef as SpriteMap;
	const options = spriteMap.options;
	
	return {
		  id: mesh.id,
		  name: spriteMap.name,
		  type: mesh.metadata.type,
		  atlasPath: mesh.metadata.spriteMapConfig?.atlasPath ?? "",
		  texturePath: mesh.metadata.spriteMapConfig.texturePath ?? "",
		  options: {
			stageSize: options.stageSize?.asArray() ?? [1, 1],
			flipU: options.flipU ?? false,
			baseTile: options.baseTile ?? 0,
			outputSize: options.outputSize?.asArray() ?? [1, 1],
			outputPosition: options.outputPosition?.asArray() ?? [0, 0, 0],
		  }
	};
}
	
/**
 * Returns a new instance of SpriteMap from the given JSON representation.
 * @param scene defines the reference to the scene.
 * @param data defines the JSON representation of the sprite map to parse.
 */
export async function parseSpriteMap(scene: Scene, data: any) {
	if( data.type !== "SpriteMapMesh" || !data.atlasPath || !data.texturePath || !data.options ) {
		throw new Error("Invalid sprite map data");
	}

	const atlasJson = await readJSON(data.atlasPath);
	const texture = new Texture(data.texturePath, scene);

	const spriteMap = new SpriteMap(
		data.name,
		atlasJson,
		texture,
		{
			stageSize: Vector2.FromArray(data.options.stageSize),
			outputSize: Vector2.FromArray(data.options.outputSize),
			outputPosition: Vector3.FromArray(data.options.outputPosition),
			baseTile: data.options.baseTile,
			flipU: data.options.flipU,
		},
		scene,
	);

	const outputMesh = (spriteMap as any)._output;
	outputMesh.name = data.name;
	outputMesh.id = data.id;
	outputMesh.metadata ??= {};
	outputMesh.metadata.type = data.type;
	outputMesh.metadata.spriteMapRef = spriteMap;
	outputMesh.metadata.spriteMapConfig = {
		atlasPath: data.atlasPath,
		texturePath: data.texturePath,
		options: spriteMap.options,
	};

	return spriteMap;
}

