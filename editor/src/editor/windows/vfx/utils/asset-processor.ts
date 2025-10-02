import { toast } from "sonner";
import { GPUParticleSystem, ParticleSystem, Scene, Mesh } from "babylonjs";
import { loadImportedParticleSystemFile, loadImportedParticleSystemFileFromJSON } from "../../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";
import { VFXComponent, IVFXSolidParticleSystem, IVFXFile } from "../types";
import { isGPUParticleSystem } from "../../../../tools/guards/particles";

export class AssetProcessor {
	/**
	 * Processes a dropped asset file and creates the appropriate VFX component
	 */
	public static async processAssetFile(
		absolutePath: string,
		vfxData: IVFXFile,
		scene: Scene,
		createIndividualEmitter: (componentId: string) => Mesh | null
	): Promise<VFXComponent | null> {
		const extension = absolutePath.toLowerCase().split(".").pop();
		if (!extension) return null;

		try {
			switch (extension) {
				case "glb":
				case "babylon":
					return await this._createSPSFromMesh(absolutePath, extension, scene);

				case "json":
					return await this._createParticleSystemFromJSON(absolutePath, scene, createIndividualEmitter);

				case "npss":
					return await this._createParticleSystemFromNPSS(absolutePath, scene, createIndividualEmitter);

				default:
					toast.warning(`Unsupported file type: .${extension}`);
					return null;
			}
		} catch (error) {
			console.error(`Error processing ${absolutePath}:`, error);
			toast.error(`Failed to process ${absolutePath.split("/").pop()}`);
			return null;
		}
	}

	private static async _createSPSFromMesh(
		absolutePath: string,
		extension: string,
		scene: Scene
	): Promise<IVFXSolidParticleSystem | null> {
		console.log("createSPSFromMesh", absolutePath);

		const fileName = absolutePath.split("/").pop() || "mesh";
		const componentName = fileName.replace(/\.(glb|babylon)$/i, "");

		const component: IVFXSolidParticleSystem = {
			id: `sps_${Date.now()}`,
			type: "solid_particle_system",
			name: componentName,
			active: true,
			filePath: absolutePath,
			particleCount: 7,
			size: 0.1,
			babylonSPS: null,
			animationSettings: {
				duration: 5.0,
				autoReset: true,
				loop: true,
				tracks: [
					{
						property: "scaling",
						component: "x",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 1.0, easing: "ease-out" },
							{ time: 1.0, value: 4.0, easing: "ease-in" }
						]
					},
					{
						property: "scaling",
						component: "y",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0.25, easing: "ease-out" },
							{ time: 1.0, value: 4.0, easing: "ease-in" }
						]
					},
					{
						property: "scaling",
						component: "z",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 1.0, easing: "ease-out" },
							{ time: 1.0, value: 4.0, easing: "ease-in" }
						]
					},
					{
						property: "position",
						component: "y",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0.05, easing: "ease-out" },
							{ time: 1.0, value: 0.25, easing: "ease-in" }
						]
					},
					{
						property: "rotation",
						component: "y",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0, easing: "linear" },
							{ time: 1.0, value: Math.PI * 4, easing: "linear" }
						]
					},
					{
						property: "color",
						component: "r",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0.33, easing: "ease-out" },
							{ time: 1.0, value: 0.0, easing: "ease-in" }
						]
					},
					{
						property: "color",
						component: "g",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0.49, easing: "ease-out" },
							{ time: 1.0, value: 0.0, easing: "ease-in" }
						]
					},
					{
						property: "color",
						component: "b",
						loop: true,
						keyframes: [
							{ time: 0.0, value: 0.88, easing: "ease-out" },
							{ time: 1.0, value: 0.0, easing: "ease-in" }
						]
					}
				]
			}
		};

		try {
			const result = await loadImportedSceneFile(scene, absolutePath);
			console.log(result);
			if (result && result.meshes.length > 0) {
				let templateMesh: Mesh;
				if (extension === 'glb') {
					templateMesh = result.meshes[1] as Mesh;
				} else {
					templateMesh = result.meshes[0] as Mesh;
				}
				templateMesh.isVisible = false;
				
				component.templateMesh = templateMesh;
				
				toast.success(`Loaded mesh for SPS: ${componentName}`);
				return component;
			} else {
				throw new Error("No meshes loaded from file");
			}
		} catch (error) {
			console.error("Failed to load mesh for SPS:", error);
			toast.error(`Failed to load mesh for SPS: ${fileName}`);
			return null;
		}
	}

	private static _createBaseComponent(absolutePath: string, componentName: string): any {
		return {
			id: `particle_${Date.now()}`,
			type: "cpu_particle_system",
			name: componentName,
			active: true,
			filePath: absolutePath,
		};
	}

	private static async _createParticleSystemFromJSON(
		absolutePath: string,
		scene: Scene,
		createIndividualEmitter: (componentId: string) => Mesh | null
	): Promise<VFXComponent | null> {
		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		try {
			const individualEmitter = createIndividualEmitter(baseComponent.id);
			if (!individualEmitter) {
				throw new Error("Failed to create individual emitter");
			}

			const particleSystem = await loadImportedParticleSystemFileFromJSON(scene, individualEmitter, absolutePath);

			if (particleSystem) {
				const isGPU = isGPUParticleSystem(particleSystem);
				const finalComponent: VFXComponent = isGPU
					? {
							...baseComponent,
							type: "gpu_particle_system",
							babylonSystem: particleSystem as GPUParticleSystem,
						}
					: {
							...baseComponent,
							type: "cpu_particle_system",
							babylonSystem: particleSystem as ParticleSystem,
						};

				finalComponent.name = particleSystem.name || componentName;
				particleSystem.stop();

				toast.success(`Created particle system: ${componentName}`);
				return finalComponent;
			} else {
				throw new Error("Particle system not found after loading");
			}
		} catch (error) {
			console.error("Failed to create particle system from JSON:", error);
			toast.error(`Failed to create particle system from ${fileName}`);
			return null;
		}
	}

	private static async _createParticleSystemFromNPSS(
		absolutePath: string,
		scene: Scene,
		createIndividualEmitter: (componentId: string) => Mesh | null
	): Promise<VFXComponent | null> {
		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".npss", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		try {
			const individualEmitter = createIndividualEmitter(baseComponent.id);
			if (!individualEmitter) {
				throw new Error("Failed to create individual emitter");
			}

			await loadImportedParticleSystemFile(scene, individualEmitter, absolutePath);

			const particleSystem = scene.particleSystems.find((ps: any) => 
				ps.name.includes(componentName) || ps.name.includes(fileName.replace(".npss", ""))
			);

			if (particleSystem) {
				const isGPU = isGPUParticleSystem(particleSystem);
				const finalComponent: VFXComponent = isGPU
					? {
							...baseComponent,
							type: "gpu_particle_system",
							babylonSystem: particleSystem as GPUParticleSystem,
						}
					: {
							...baseComponent,
							type: "cpu_particle_system",
							babylonSystem: particleSystem as ParticleSystem,
						};

				finalComponent.name = particleSystem.name || componentName;
				particleSystem.stop();

				toast.success(`Created NPSS particle system: ${componentName}`);
				return finalComponent;
			} else {
				throw new Error("Particle system not found after loading");
			}
		} catch (error) {
			console.error("Failed to create NPSS particle system:", error);
			toast.error(`Failed to create NPSS particle system from ${fileName}`);
			return null;
		}
	}
}
