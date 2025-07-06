import { Vector3, Vector2, Scene, SpriteMap, Texture, AbstractMesh } from "babylonjs";
import { readJSON } from "fs-extra";

export async function deserializeSpriteMaps(scene: Scene): Promise<void> {
	const spriteMaps = scene.metadata?.spriteMaps;
	console.log(spriteMaps);
	if (!spriteMaps?.length) {return;}

	for (const spriteMapData of spriteMaps) {
		const mesh = scene.getMeshById(spriteMapData.meshId);
		if (!mesh) {continue;}

		const atlasJson = await readJSON(spriteMapData.atlasPath);
		const texture = new Texture(spriteMapData.texturePath, scene);

		const spriteMap = new SpriteMap(
			spriteMapData.name,
			atlasJson,
			texture,
			spriteMapData.options,
			scene
		);

		mesh.metadata ??= {};
		mesh.metadata.spriteMapRef = spriteMap;
		mesh.metadata.spriteMapConfig = {
			atlasPath: spriteMapData.atlasPath,
			texturePath: spriteMapData.texturePath,
			options: spriteMapData.options,
		};

		mesh.getClassName = () => "SpriteMapOutputMesh";
	}
}

export interface ISerializedSpriteMapData {
	meshId: string;
	name: string;
	atlasPath: string;
	texturePath: string;
	options: {
	  stageSize: [number, number];
	  flipU: boolean;
	  baseTile: number;
	  outputSize: [number, number];
	  outputPosition: [number, number, number];
	};
  }

export function serializeSpriteMap(mesh: AbstractMesh): ISerializedSpriteMapData {
	const spriteMap = mesh.metadata.spriteMapRef as SpriteMap;
	const options = spriteMap.options;
  
	return {
		  meshId: mesh.id,
		  name: spriteMap.name,
		  atlasPath: mesh.metadata.spriteMapConfig?.atlasPath,
		  texturePath: mesh.metadata.spriteMapConfig?.texturePath,
		  options: {
			stageSize: options.stageSize?.asArray() ?? [1, 1],
			flipU: options.flipU ?? false,
			baseTile: options.baseTile ?? 0,
			outputSize: options.outputSize?.asArray() ?? [1, 1],
			outputPosition: options.outputPosition?.asArray() ?? [0, 0, 0],
		  }
	};
}

export async function applyImportedSpriteMapFile(scene: Scene, data: any): Promise<SpriteMap> {
	console.log(data);
	const atlasJson = await fetch(data.atlasPath).then(res => res.json());
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
	outputMesh.metadata ??= {};
	outputMesh.metadata.editorType = "SpriteMapMesh";
	outputMesh.metadata.spriteMapRef = spriteMap;
	outputMesh.metadata.spriteMapConfig = {
		atlasPath: data.atlasPath,
		texturePath: data.texturePath,
		options: spriteMap.options,
	};

	return spriteMap;
}
