import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { ContextMenu, ContextMenuItem, ContextMenuContent, ContextMenuTrigger, ContextMenuSeparator } from "../../../../ui/shadcn/ui/context-menu";
import { FaMagic, FaPlus } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";
import { toast } from "sonner";
import { Vector3, MeshBuilder, SolidParticleSystem, ParticleSystem, GPUParticleSystem, Mesh } from "babylonjs";
import { loadImportedParticleSystemFile, loadImportedParticleSystemFileFromJSON } from "../../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";
import { VFXComponent, IVFXSolidParticleSystem, IVFXComponentsPanelProps } from "../types";
import { isGPUParticleSystem } from "../../../../tools/guards/particles";
import { EditorInspectorSectionField } from "../../../layout/inspector/fields/section";

export interface IVFXComponentsPanelState {
	emitterMesh: Mesh | null;
}

export class VFXComponentsPanel extends Component<IVFXComponentsPanelProps, IVFXComponentsPanelState> {
	public constructor(props: IVFXComponentsPanelProps) {
		super(props);
		this.state = {
			emitterMesh: null,
		};
	}

	public componentDidMount(): void {
		// Create default empty emitter mesh on mount
		this._createDefaultEmitter();
	}

	public render(): ReactNode {
		const { selectedComponent, search } = this.props;

		return (
			<div className="flex flex-col w-full h-full">
				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input placeholder="Search components..." value={search} onChange={(e) => this.props.onSearchChange(e.target.value)} className="h-8 text-xs" />
				</div>

				{/* Emitter Section */}
				<div className="p-3 border-b border-border">
					<div className="text-xs font-medium text-muted-foreground mb-2">Emitter</div>
					{this._renderEmitterSection()}
				</div>

				{/* Components List */}
				<div className="flex-1 flex flex-col">
					{/* Components */}
					<div className="flex-shrink-0 space-y-2">
						{Object.entries(this._getFilteredComponents()).map(([type, components]) => (
							<EditorInspectorSectionField 
								key={type} 
								title={this._getTypeDisplayName(type)}
								label={`${components.length}`}
							>
								<div className="space-y-1">
									{components.map((component) => (
										<ContextMenu key={component.id}>
											<ContextMenuTrigger>
												<div
													className={`
														flex items-center gap-2 p-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200 rounded
														${selectedComponent?.id === component.id ? "bg-primary/20" : ""}
													`}
													onClick={() => this.props.onComponentSelect(component)}
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
												<ContextMenuItem onClick={() => this.props.onComponentRemove(component.id)} className="text-red-500">
													Delete
												</ContextMenuItem>
											</ContextMenuContent>
										</ContextMenu>
									))}
								</div>
							</EditorInspectorSectionField>
						))}
					</div>

					{/* Empty space for right-click */}
					<div
						className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground"
						onDragOver={(ev) => ev.preventDefault()}
						onDrop={(ev) => this._handleDrop(ev)}
					>
						{Object.keys(this._getFilteredComponents()).length === 0 && (
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

	private _getFilteredComponents(): { [key: string]: VFXComponent[] } {
		const { vfxData, search } = this.props;
		if (!vfxData) {
			return {};
		}

		const allComponents: VFXComponent[] = [...vfxData.cpuParticles, ...vfxData.gpuParticles, ...vfxData.sps, ...vfxData.particleSystemSets];
		const filteredComponents = allComponents.filter((component) => component.name.toLowerCase().includes(search.toLowerCase()) || component.type.toLowerCase().includes(search.toLowerCase()));

		// Group components by type
		const groupedComponents: { [key: string]: VFXComponent[] } = {};
		filteredComponents.forEach(component => {
			if (!groupedComponents[component.type]) {
				groupedComponents[component.type] = [];
			}
			groupedComponents[component.type].push(component);
		});

		return groupedComponents;
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

	private _getTypeDisplayName(type: string): string {
		switch (type) {
			case "cpu_particle_system":
				return "CPU Particle Systems";
			case "gpu_particle_system":
				return "GPU Particle Systems";
			case "solid_particle_system":
				return "Solid Particle Systems";
			case "particle_system_set":
				return "Particle System Sets";
			default:
				return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + 's';
		}
	}

	private _createDefaultEmitter(): void {
		const { scene } = this.props;
		if (!scene) return;
		const defaultEmitter = new Mesh("VFX_Emitter_Default", scene);
		this._updateEmitterMesh(defaultEmitter);
	}

	private _renderEmitterSection(): ReactNode {
		if (!this.state.emitterMesh) return null;

		return (
			<ContextMenu>
				<ContextMenuTrigger>
					<div
						className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
						onDragOver={(ev) => ev.preventDefault()}
						onDrop={(ev) => this._handleEmitterDrop(ev)}
					>
						<div className="flex items-center gap-2">
							<GiSparkles className="w-4 h-4 text-green-500" />
							<div>
								<div className="text-sm font-medium">{this.state.emitterMesh.name}</div>
								<div className="text-xs text-muted-foreground">Emitter Mesh</div>
							</div>
						</div>
						<div className="text-xs text-muted-foreground/70">
							Right-click to replace or drag mesh
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={() => this._createEmitterMesh("empty")}>
						<FaPlus className="w-3 h-3 mr-2" />
						Replace with Empty Mesh
					</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("box")}>
						<FaPlus className="w-3 h-3 mr-2" />
						Replace with Box Mesh
					</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("sphere")}>
						<FaPlus className="w-3 h-3 mr-2" />
						Replace with Sphere Mesh
					</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("plane")}>
						<FaPlus className="w-3 h-3 mr-2" />
						Replace with Plane Mesh
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem className="text-muted-foreground">
						Drop mesh file to replace
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	}

	private _createEmitterMesh(type: "empty" | "box" | "sphere" | "plane"): void {
		const { scene } = this.props;
		if (!scene) return;
		// Create new emitter mesh
		let newMesh: Mesh;
		switch (type) {
			case "empty":
				newMesh = new Mesh("VFX_Emitter_Empty", scene);
				break;
			case "box":
				newMesh = MeshBuilder.CreateBox("VFX_Emitter_Box", { size: 1 }, scene);
				break;
			case "sphere":
				newMesh = MeshBuilder.CreateSphere("VFX_Emitter_Sphere", { diameter: 1 }, scene);
				break;
			case "plane":
				newMesh = MeshBuilder.CreatePlane("VFX_Emitter_Plane", { size: 1 }, scene);
				break;
		}

		this._updateEmitterMesh(newMesh);

		toast.success(`Created ${type} emitter`);
		this.forceUpdate();
	}

	private _handleEmitterDrop(ev: React.DragEvent<HTMLDivElement>): void {
		const assets = ev.dataTransfer.getData("assets");
		if (!assets) return;

		try {
			const assetPaths = JSON.parse(assets) as string[];
			const meshPath = assetPaths.find(path => 
				path.toLowerCase().endsWith('.glb') || 
				path.toLowerCase().endsWith('.babylon')
			);

			if (meshPath) {
				this._loadEmitterFromFile(meshPath);
			} else {
				toast.warning("Please drop a .glb or .babylon file for emitter");
			}
		} catch (error) {
			console.error("Failed to parse dropped emitter assets:", error);
			toast.error("Failed to process dropped emitter");
		}
	}

	private async _loadEmitterFromFile(absolutePath: string): Promise<void> {
		const { scene } = this.props;
		if (!scene) return;

		try {
			// Load mesh from file
			const result = await loadImportedSceneFile(scene, absolutePath);
			if (result && result.meshes.length > 0) {
				const loadedMesh = result.meshes[0] as Mesh;
				loadedMesh.name = "VFX_Emitter_Imported";
				
				this._updateEmitterMesh(loadedMesh);

				const fileName = absolutePath.split("/").pop() || "mesh";
				toast.success(`Loaded emitter from ${fileName}`);
				this.forceUpdate();
			} else {
				throw new Error("No meshes loaded from file");
			}
		} catch (error) {
			console.error("Failed to load emitter from file:", error);
			toast.error("Failed to load emitter from file");
		}
	}

	private _updateEmitterMesh(loadedMesh: Mesh): void {
		this.state.emitterMesh?.dispose();
		this.setState({ emitterMesh: loadedMesh }, () => {
			this._updateAllParticleSystemsEmitter();
		});
	}

	private _updateAllParticleSystemsEmitter(): void {
		const { vfxData } = this.props;
		if (!vfxData || !this.state.emitterMesh) return;

		// Update CPU particle systems
		vfxData.cpuParticles.forEach(component => {
			if (component.babylonSystem && component.babylonSystem.emitter) {
				component.babylonSystem.emitter = this.state.emitterMesh;
			}
		});

		// Update GPU particle systems
		vfxData.gpuParticles.forEach(component => {
			if (component.babylonSystem && component.babylonSystem.emitter) {
				component.babylonSystem.emitter = this.state.emitterMesh;
			}
		});
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
					// Notify parent about the new component
					this.props.onComponentAdded(component);
				}
			}
		} catch (error) {
			console.error("Failed to parse dropped assets:", error);
			toast.error("Failed to process dropped assets");
		}
	}

	private async _processAssetFile(absolutePath: string): Promise<VFXComponent | null> {
		const { vfxData, scene } = this.props;
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
		const { vfxData, scene } = this.props;
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

	private _createBaseComponent(absolutePath: string, componentName: string): any {
		return {
			id: `particle_${Date.now()}`,
			type: "cpu_particle_system", // Will be updated after loading
			name: componentName,
			active: true,
			filePath: absolutePath,
		};
	}

	private async _createParticleSystemFromJSON(absolutePath: string): Promise<VFXComponent | null> {
		const { vfxData, scene } = this.props;
		if (!vfxData || !scene) return null;

		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".json", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		// Load particle system using existing import function
		try {
			// Use existing emitter (should always exist after componentDidMount)
			if (!this.state.emitterMesh) {
				throw new Error("No emitter mesh available");
			}

			// Load particle system using the existing function
			const particleSystem = await loadImportedParticleSystemFileFromJSON(scene, this.state.emitterMesh, absolutePath);

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
		const { vfxData, scene } = this.props;
		if (!vfxData || !scene) return null;

		const fileName = absolutePath.split("/").pop() || "particles";
		const componentName = fileName.replace(".npss", "");

		const baseComponent = this._createBaseComponent(absolutePath, componentName);

		// Load NPSS file using existing import function
		try {
			// Use existing emitter (should always exist after componentDidMount)
			if (!this.state.emitterMesh) {
				throw new Error("No emitter mesh available");
			}

			// Load particle system using the existing function
			await loadImportedParticleSystemFile(scene, this.state.emitterMesh, absolutePath);

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
