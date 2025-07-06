import { Scene, SpriteMap, Texture, Mesh } from "babylonjs";

export class SpriteMapOutputMesh extends Mesh {
	declare metadata: {
		spriteMapRef: SpriteMap;
	}
}
/**
 * Returns the JSON representation of the given sprite map.
 * @param mesh defines the reference to the sprite map output mesh object to serialize.
 */
export function serializeSpriteMap(mesh: SpriteMapOutputMesh) {
	console.log(mesh.metadata.spriteMapRef, mesh, mesh)
	const spriteMap = mesh.metadata.spriteMapRef as SpriteMap;
	const options = spriteMap.options;
	
	return {
		  id: mesh.id,
		  name: spriteMap.name,
		  atlasPath: mesh.metadata.spriteMapConfig?.atlasPath ?? "",
		  spriteSheetUrl: spriteMap.spriteSheet.url ?? "",
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
export function parseSpriteMap(scene: Scene, data: any) {
	// const spriteMap = new SpriteMap(data.name, data.atlasPath, data.texturePath, data.options, scene);

	// const outputMesh = (spriteMap as any)._output;
	// outputMesh.name = data.name;
	// outputMesh.id = data.id;
	// outputMesh.metadata ??= {};
	// outputMesh.metadata.editorType = "SpriteMapMesh";
	// outputMesh.metadata.spriteMapRef = spriteMap;

	// return outputMesh;
}
// const data = await readJSON(absolutePath, {
// 	encoding: "utf8",
// });
// const atlasJson = await fetch(data.atlasPath).then(res => res.json());
// const texture = new Texture(data.texturePath, scene);

// const spriteMap = new SpriteMap(
// 	data.name,
// 	atlasJson,
// 	texture,
// 	{
// 		stageSize: Vector2.FromArray(data.options.stageSize),
// 		outputSize: Vector2.FromArray(data.options.outputSize),
// 		outputPosition: Vector3.FromArray(data.options.outputPosition),
// 		baseTile: data.options.baseTile,
// 		flipU: data.options.flipU,
// 	},
// 	scene,
// );

// const outputMesh = (spriteMap as any)._output;
// outputMesh.name = data.name;
// outputMesh.metadata ??= {};
// outputMesh.metadata.editorType = "SpriteMapMesh";
// outputMesh.metadata.spriteMapRef = spriteMap;
// outputMesh.metadata.spriteMapConfig = {
// 	atlasPath: data.atlasPath,
// 	texturePath: data.texturePath,
// 	options: spriteMap.options,
// };

// return spriteMap;
