import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { ContextMenu, ContextMenuItem, ContextMenuContent, ContextMenuTrigger, ContextMenuSeparator } from "../../../../ui/shadcn/ui/context-menu";
import { FaMagic } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";
import { toast } from "sonner";
import { Vector3, MeshBuilder, SolidParticleSystem, ParticleSystem, GPUParticleSystem, Mesh } from "babylonjs";
import { loadImportedParticleSystemFile, loadImportedParticleSystemFileFromJSON } from "../../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";
import { VFXComponent, IVFXCPUParticleSystem, IVFXGPUParticleSystem, IVFXSolidParticleSystem, IVFXComponent, IVFXComponentsPanelProps } from "../types";
import { isGPUParticleSystem } from "../../../../tools/guards/particles";

export class VFXComponentsPanel extends Component<IVFXComponentsPanelProps> {
	public render(): ReactNode {
		const { search, selectedComponent } = this.props.vfxEditor.state;

		return (
			<div className="flex flex-col w-full h-full">
				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input placeholder="Search components..." value={search} onChange={(e) => this.props.vfxEditor.setState({ search: e.target.value })} className="h-8 text-xs" />
				</div>

				{/* Components List */}
				<div className="flex-1 flex flex-col">
					{/* Components */}
					<div className="flex-shrink-0">
						{this._getFilteredComponents().map((component) => (
							<ContextMenu key={component.id}>
								<ContextMenuTrigger>
									<div
										className={`
											flex items-center gap-2 p-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200
											${selectedComponent?.id === component.id ? "bg-primary/20" : ""}
										`}
										onClick={() => this.props.vfxEditor.setState({ selectedComponent: component })}
									>
										<div className={`w-3 h-3 rounded-full ${component.active ? "bg-green-500" : "bg-gray-400"}`} />
										{this._getComponentIcon(component.type)}
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate">{component.name}</div>
											<div className="text-xs text-muted-foreground truncate">{component.type}</div>
										</div>
									</div>
								</ContextMenuTrigger>
								<ContextMenuContent>
									<ContextMenuItem onClick={() => this.props.vfxEditor.setState({ selectedComponent: component })}>Select</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuItem onClick={() => this.props.vfxEditor.removeComponent(component.id)} className="text-red-500">
										Delete
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						))}
					</div>

					{/* Empty space for right-click */}
					<div
						className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground"
						onDragOver={(ev) => ev.preventDefault()}
						onDrop={(ev) => this._handleDrop(ev)}
					>
						{!this._getFilteredComponents().length && (
							<>
								<FaMagic className="w-8 h-8 mb-2" />
								<div className="text-sm">No components found</div>
								<div className="text-xs">Drag and drop an asset to add a component</div>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}

	private _getFilteredComponents(): VFXComponent[] {
		const { vfxData, search } = this.props.vfxEditor.state;
		if (!vfxData) {
			return [];
		}

		const allComponents: VFXComponent[] = [...vfxData.cpuParticles, ...vfxData.gpuParticles, ...vfxData.sps, ...vfxData.particleSystemSets];

		return allComponents.filter((component) => component.name.toLowerCase().includes(search.toLowerCase()) || component.type.toLowerCase().includes(search.toLowerCase()));
	}

	private _getComponentIcon(type: string): ReactNode {
		switch (type) {
			case "cpu_particle_system":
			case "solid_particle_system":
				return <GiSparkles className="w-4 h-4 text-yellow-500" />;
			case "gpu_particle_system":
				return <GiSparkles className="w-4 h-4 text-blue-500" />;
			case "particle_system_set":
				return <GiSparkles className="w-4 h-4 text-purple-500" />;
			default:
				return <MdOutlineQuestionMark className="w-4 h-4 text-gray-500" />;
		}
	}

	private _handleDrop(ev: React.DragEvent<HTMLDivElement>): void {
		console.log("handleDrop");
		const assets = ev.dataTransfer.getData("assets");
		if (assets) {
			this._handleAssetsDropped(ev);
		}
	}

	private async _handleAssetsDropped(ev: React.DragEvent<HTMLDivElement>): Promise<void> {
		const assets = ev.dataTransfer.getData("assets");
		if (!assets) {
			return;
		}
		try {
			const assetPaths = JSON.parse(assets) as string[];
			for (const absolutePath of assetPaths) {
				const component = await this._processAssetFile(absolutePath);
				if (component) {
					// Add the new component to VFX data
					const { vfxData } = this.props.vfxEditor.state;
					if (vfxData) {
						const updatedVfxData = { ...vfxData };

						// Add component to appropriate array based on type
						switch (component.type) {
							case "cpu_particle_system":
								updatedVfxData.cpuParticles = [...vfxData.cpuParticles, component as IVFXCPUParticleSystem];
								break;
							case "gpu_particle_system":
								updatedVfxData.gpuParticles = [...vfxData.gpuParticles, component as IVFXGPUParticleSystem];
								break;
							case "solid_particle_system":
								updatedVfxData.sps = [...vfxData.sps, component as IVFXSolidParticleSystem];
								break;
							default:
								console.warn(`Unknown component type: ${component.type}`);
								break;
						}

						updatedVfxData.modified = new Date().toISOString();
						this.props.vfxEditor.setState({ vfxData: updatedVfxData, selectedComponent: component });
					}
				}
			}
		} catch (error) {
			console.error("Failed to parse dropped assets:", error);
			toast.error("Failed to process dropped assets");
		}
	}

	private async _processAssetFile(absolutePath: string): Promise<VFXComponent | null> {
		const { vfxData, scene } = this.props.vfxEditor.state;
		if (!vfxData || !scene) return null;

		const extension = absolutePath.toLowerCase().split(".").pop();
		if (!extension) return null;

		try {
			switch (extension) {
				case "glb":
				case "babylon":
					return await this._createSPSFromMesh(absolutePath);

				case "json":
					return await this._createParticleSystemFromJSON(absolutePath);

				case "npss":
					return await this._createParticleSystemFromNPSS(absolutePath);

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

	private async _createSPSFromMesh(absolutePath: string): Promise<IVFXSolidParticleSystem | null> {
		console.log("createSPSFromMesh", absolutePath);
		const { vfxData, scene } = this.props.vfxEditor.state;
		if (!vfxData || !scene) return null;

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
			babylonSPS: null as unknown as SolidParticleSystem,
		};

		// Load mesh using existing import function
		try {
			const result = await loadImportedSceneFile(scene, absolutePath);
			console.log(result);
			if (result && result.meshes.length > 0) {
				// Use the first mesh as template
				const templateMesh = result.meshes[0] as Mesh;
				templateMesh.isVisible = false; // Hide template mesh

				// Create Solid Particle System
				const sps = new SolidParticleSystem(componentName, scene, {
					useModelMaterial: true,
				});

				// Add shape to SPS
				sps.addShape(templateMesh, component.particleCount);
				sps.buildMesh();

				// Initialize particles
				sps.initParticles = () => {
					for (let i = 0; i < sps.nbParticles; i++) {
						const particle = sps.particles[i];
						particle.position = new Vector3((Math.random() - 0.5) * 2, Math.random() * 0.5, (Math.random() - 0.5) * 2);
						particle.scaling = new Vector3(1, 1, 1);
						particle.rotation = new Vector3(0, 0, 0);
					}
				};

				sps.initParticles();
				sps.setParticles();

				// Store SPS in component properties
				component.babylonSPS = sps;

				toast.success(`Created SPS component: ${componentName}`);
				return component;
			} else {
				throw new Error("No meshes loaded from file");
			}
		} catch (error) {
			console.error("Failed to create SPS from mesh:", error);
			toast.error(`Failed to create SPS from ${fileName}`);
			return null;
		}
	}

	private _createBaseComponent(absolutePath: string, componentName: string): IVFXComponent {
		return {
			id: `particle_${Date.now()}`,
			type: "cpu_particle_system", // Will be updated after loading
			name: componentName,
			active: true,
			filePath: absolutePath,
		};
	}

	private async _createParticleSystemFromJSON(absolutePath: string): Promise<VFXComponent | null> {
		const { vfxData, scene } = this.props.vfxEditor.state;
		if (!vfxData || !scene) return null;

		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		// Load particle system using existing import function
		try {
			// Create a temporary mesh as emitter for the particle system
			const tempMesh = MeshBuilder.CreateBox("tempEmitter", { size: 0.1 }, scene);
			tempMesh.isVisible = false;

			// Load particle system using the existing function
			const particleSystem = await loadImportedParticleSystemFileFromJSON(scene, tempMesh, absolutePath);

			if (particleSystem) {
				// Create properly typed component based on particle system type
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

				// Update name from particle system
				finalComponent.name = particleSystem.name || componentName;

				// Stop the particle system initially
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

	private async _createParticleSystemFromNPSS(absolutePath: string): Promise<VFXComponent | null> {
		const { vfxData, scene } = this.props.vfxEditor.state;
		if (!vfxData || !scene) return null;

		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".npss", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		// Load NPSS file using existing import function
		try {
			// Create a temporary mesh as emitter for the particle system
			const tempMesh = MeshBuilder.CreateBox("tempEmitter", { size: 0.1 }, scene);
			tempMesh.isVisible = false;

			// Load particle system using the existing function
			await loadImportedParticleSystemFile(scene, tempMesh, absolutePath);

			// Find the created particle system
			const particleSystem = scene.particleSystems.find((ps: any) => ps.name.includes(componentName) || ps.name.includes(fileName.replace(".npss", "")));

			if (particleSystem) {
				// Create properly typed component based on particle system type
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

				// Update name from particle system
				finalComponent.name = particleSystem.name || componentName;

				// Stop the particle system initially
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
