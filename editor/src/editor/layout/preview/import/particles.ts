import { readJSON } from "fs-extra";

import { Scene, ParticleSystemSet, AbstractMesh, NodeParticleSystemSet } from "babylonjs";
import { ParticleSystem } from "babylonjs";

export async function loadImportedParticleSystemFile(scene: Scene, targetMesh: AbstractMesh, absolutePath: string): Promise<ParticleSystemSet | null> {
	const data = await readJSON(absolutePath);
	const npe = NodeParticleSystemSet.Parse(data);

	const particleSystemSet = await npe.buildAsync(scene, false);
	particleSystemSet.emitterNode = targetMesh;
	particleSystemSet.systems.forEach((particleSystem) => {
		particleSystem.sourceParticleSystemSetId = data.id;
	});
	particleSystemSet.start();

	return particleSystemSet;
}

export async function loadImportedParticleSystemFileFromJSON(scene: Scene, targetMesh: AbstractMesh, absolutePath: string): Promise<ParticleSystem | null> {
	const data = await readJSON(absolutePath);
	const particleSystem = ParticleSystem.Parse(data, scene, "");

	particleSystem.emitter = targetMesh;
	particleSystem.sourceParticleSystemSetId = data.id;

	return particleSystem;
}
