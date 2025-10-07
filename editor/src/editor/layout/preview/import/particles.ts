import { readJSON } from "fs-extra";

import { Scene, ParticleSystemSet, AbstractMesh, NodeParticleSystemSet, ParticleSystem, GPUParticleSystem } from "babylonjs";
import { extname } from "path";

export async function loadImportedParticleSystemFile(
	scene: Scene,
	targetMesh: AbstractMesh,
	absolutePath: string
): Promise<ParticleSystemSet | GPUParticleSystem | ParticleSystem | null> {
	const data = await readJSON(absolutePath);
	const ext = extname(absolutePath).toLowerCase();

	switch (ext) {
		case ".npss":
			const npe = NodeParticleSystemSet.Parse(data);
			const particleSystemSet = await npe.buildAsync(scene, false);
			particleSystemSet.emitterNode = targetMesh;
			particleSystemSet.systems.forEach((particleSystem) => {
				particleSystem.sourceParticleSystemSetId = data.id;
			});
			particleSystemSet.start();
			return particleSystemSet;
		case ".gpups":
			const gpuParticleSystem = GPUParticleSystem.Parse(data, scene, "");
			gpuParticleSystem.emitter = targetMesh;
			gpuParticleSystem.sourceParticleSystemSetId = data.id;
			gpuParticleSystem.start();
			return gpuParticleSystem;
		case ".cpups":
			const particleSystem = ParticleSystem.Parse(data, scene, "");
			particleSystem.emitter = targetMesh;
			particleSystem.sourceParticleSystemSetId = data.id;
			particleSystem.start();
			return particleSystem;
		default:
			return null;
	}
}
