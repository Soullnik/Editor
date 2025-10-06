import { toast } from "sonner";
import { GPUParticleSystem, ParticleSystem, Scene, Mesh, ParticleSystemSet, AbstractMesh, Tools } from "babylonjs";
import { loadImportedParticleSystemFile } from "../../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";
import { VFXComponent, IVFXSolidParticleSystem, IVFXGPUParticleSystem, IVFXCPUParticleSystem, IVFXComponent, IVFXNodeParticleSystem } from "../types";
import { CustomSolidParticleSystem } from "../../../../project/add/particles";
import { UniqueNumber } from "../../../../tools/tools";


export function createBaseVFXComponent(absolutePath: string, componentName: string, type: VFXComponent["type"]): IVFXComponent {
	return {
		id: `${componentName}_${Date.now()}`,
		type: type,
		name: componentName,
		active: true,
		filePath: absolutePath,
	};
}

export async function createParticleSystemFromNPSS(absolutePath: string, scene: Scene, targetMesh: AbstractMesh): Promise<IVFXNodeParticleSystem | null> {
	const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = createBaseVFXComponent(absolutePath, componentName, "node_particle_system") as IVFXNodeParticleSystem;
		try {
			const particleSystem = await loadImportedParticleSystemFile(scene, targetMesh, absolutePath) as ParticleSystemSet;
			if (!particleSystem) {
				throw new Error("Particle system not found after loading");
			}
			baseComponent.babylonSystem = particleSystem;
			baseComponent.name = componentName;
			particleSystem.systems.forEach((particleSystem) => {
				particleSystem.stop();
			});
			return baseComponent;	
		} catch (error) {
			toast.error(`Failed to create particle system from ${fileName}`);
			return null;
		}
}

export async function createParticleSystemFromGPUPS(absolutePath: string, scene: Scene, targetMesh: AbstractMesh): Promise<IVFXGPUParticleSystem | null> {
	const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = createBaseVFXComponent(absolutePath, componentName, "gpu_particle_system") as IVFXGPUParticleSystem;
		try {
			const particleSystem = await loadImportedParticleSystemFile(scene, targetMesh, absolutePath) as GPUParticleSystem;
			if (!particleSystem) {
				throw new Error("Particle system not found after loading");
			}
			baseComponent.babylonSystem = particleSystem ;
			baseComponent.name = particleSystem.name || componentName;
			particleSystem.stop();
			return baseComponent;	
		} catch (error) {
			toast.error(`Failed to create particle system from ${fileName}`);
			return null;
		}
}

export async function createParticleSystemFromCPUPS(absolutePath: string, scene: Scene, targetMesh: AbstractMesh): Promise<IVFXCPUParticleSystem | null> {
	const fileName = absolutePath.split("/").pop() || "cpu_particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = createBaseVFXComponent(absolutePath, componentName, "cpu_particle_system") as IVFXCPUParticleSystem;

		try {
			const particleSystem = await loadImportedParticleSystemFile(scene, targetMesh, absolutePath) as ParticleSystem;
				if (!particleSystem) {
					throw new Error("Particle system not found after loading");
				}
				baseComponent.babylonSystem = particleSystem ;
				baseComponent.name = particleSystem.name || componentName;
				particleSystem.stop();
				return baseComponent;	
		} catch (error) {
			toast.error(`Failed to create particle system from ${fileName}`);
			return null;
		}
}

export async function createSolidParticleSystemFromMesh(absolutePath: string, scene: Scene, targetMesh: AbstractMesh): Promise<IVFXSolidParticleSystem | null> {
	const fileName = absolutePath.split("/").pop() || "mesh";
	const componentName = fileName.replace(/\.(glb)$/i, "");

	const component = createBaseVFXComponent(absolutePath, componentName, "solid_particle_system") as IVFXSolidParticleSystem;

	try {
		const result = await loadImportedSceneFile(scene, absolutePath);
		if (result && result.meshes.length > 0) {
			const rootMesh: Mesh = result.meshes[0] as Mesh;
			const templateMesh: Mesh = result.meshes[1] as Mesh;
			const sps = new CustomSolidParticleSystem(componentName, scene, { useModelMaterial: true, expandable: true });
			sps.addShape(templateMesh, 1);
			const mesh = sps.buildMesh();
			mesh.receiveShadows = false;
			mesh.id = Tools.RandomId();
			mesh.uniqueId = UniqueNumber.Get();
			mesh.parent = targetMesh;
			component.babylonSystem = sps;
			rootMesh.dispose(false, false);
			toast.success(`Created Solid Particle System: ${componentName}`);
			return component;
		}
		throw new Error("No meshes loaded from file");
	} catch (error) {
		toast.error(`Failed to create Solid Particle System: ${fileName}`);
		return null;
	}
}
