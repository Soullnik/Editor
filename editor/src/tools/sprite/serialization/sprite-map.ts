import { Scene, SpriteMap, Texture } from "babylonjs";
import { readJSON } from "fs-extra";

export async function deserializeSpriteMaps(scene: Scene): Promise<void> {
	const spriteMaps = scene.metadata?.spriteMaps;
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

export interface SerializedSpriteMapData {
  meshId: string;
  name: string;
  atlasPath: string;
  texturePath: string;
  options: SpriteMap["options"];
}

export function serializeSpriteMaps(scene: Scene): SerializedSpriteMapData[] {
	return scene.meshes
		.filter((mesh) => mesh.metadata?.spriteMapRef)
		.map((mesh) => {
			const spriteMap = mesh.metadata.spriteMapRef as SpriteMap;

			return {
				meshId: mesh.id,
				name: spriteMap.name,
				atlasPath: mesh.metadata.spriteMapConfig?.atlasPath,
				texturePath: mesh.metadata.spriteMapConfig?.texturePath,
				options: spriteMap.options,
			};
		});
}
