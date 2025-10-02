import { toast } from "sonner";
import { GPUParticleSystem, ParticleSystem, Scene, Mesh, SolidParticleSystem, Vector3, Color4 } from "babylonjs";
import { loadImportedParticleSystemFile, loadImportedParticleSystemFileFromJSON } from "../../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";
import { VFXComponent, IVFXSolidParticleSystem } from "../types";
import { isGPUParticleSystem } from "../../../../tools/guards/particles";

export class AssetProcessor {
	/**
	 * Processes a dropped asset file and creates the appropriate VFX component
	 */
	public static async processAssetFile(absolutePath: string, _scene: Scene, createIndividualEmitter: (componentId: string) => Mesh | null): Promise<VFXComponent | null> {
		const extension = absolutePath.toLowerCase().split(".").pop();
		if (!extension) {
			return null;
		}

		try {
			switch (extension) {
				case "glb":
				case "babylon":
					return await this._createSPSFromMesh(absolutePath, extension, _scene);

				case "json":
					return await this._createParticleSystemFromJSON(absolutePath, _scene, createIndividualEmitter);

				case "npss":
					return await this._createParticleSystemFromNPSS(absolutePath, _scene, createIndividualEmitter);

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

	private static async _createSPSFromMesh(absolutePath: string, extension: string, scene: Scene): Promise<IVFXSolidParticleSystem | null> {
		console.log("createSPSFromMesh", absolutePath);

		const fileName = absolutePath.split("/").pop() || "mesh";
		const componentName = fileName.replace(/\.(glb|babylon)$/i, "");

		const component: IVFXSolidParticleSystem = {
			id: `sps_${Date.now()}`,
			type: "solid_particle_system",
			name: componentName,
			active: true,
			filePath: absolutePath,
			particleCount: 1,
			size: 0.1,
			babylonSPS: null,
			isAnimating: false,
			currentAnimationTime: 0,
			selectedParticleId: null,
			animationSettings: {
				duration: 1.0,
				autoReset: false,
				loop: false,
				particles: [
					{
						id: 0,
						name: "Particle 1",
						enabled: true,
						animations: [],
					},
				],
			},
		};

		try {
			const result = await loadImportedSceneFile(scene, absolutePath);
			console.log(result);
			if (result && result.meshes.length > 0) {
				let templateMesh: Mesh;
				if (extension === "glb") {
					templateMesh = result.meshes[1] as Mesh;
				} else {
					templateMesh = result.meshes[0] as Mesh;
				}
				templateMesh.isVisible = false;

				const sps = new SolidParticleSystem(componentName, scene, { useModelMaterial: true });
				sps.addShape(templateMesh, component.particleCount);
				sps.buildMesh();

				sps.initParticles = () => {
					for (let i = 0; i < sps.nbParticles; i++) {
						const particle = sps.particles[i];
						particle.position = new Vector3(0, 0, 0);
						particle.scaling = new Vector3(1.0, 1.0, 1.0);
						particle.rotation = new Vector3(0, 0, 0);
						particle.color = new Color4(1.0, 1.0, 1.0, 1.0);
					}
				};

				sps.initParticles();
				sps.setParticles();
				component.particleCount = sps.nbParticles;
				component.templateMesh = templateMesh;
				component.babylonSPS = sps;

				toast.success(`Created SPS: ${componentName} with ${component.particleCount} particles`);
				return component;
			}
			throw new Error("No meshes loaded from file");
		} catch (error) {
			console.error("Failed to create SPS:", error);
			toast.error(`Failed to create SPS: ${fileName}`);
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
			}
			throw new Error("Particle system not found after loading");
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

			const particleSystem = scene.particleSystems.find((ps: any) => ps.name.includes(componentName) || ps.name.includes(fileName.replace(".npss", "")));

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
			}
			throw new Error("Particle system not found after loading");
		} catch (error) {
			console.error("Failed to create NPSS particle system:", error);
			toast.error(`Failed to create NPSS particle system from ${fileName}`);
			return null;
		}
	}
}
