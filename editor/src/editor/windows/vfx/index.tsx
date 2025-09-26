import { ipcRenderer } from "electron";
import { readJSON, writeJSON, pathExists } from "fs-extra";

import { toast } from "sonner";

import { Component, ReactNode } from "react";
import { Actions, IJsonModel, Layout, Model, TabNode } from "flexlayout-react";

import { 
	Engine, 
	Scene, 
	ArcRotateCamera, 
	Vector3, 
	Color3, 
	Color4,
	MeshBuilder,
	SolidParticleSystem
} from "babylonjs";

import { ToolbarComponent } from "../../../ui/toolbar";
import { Button } from "../../../ui/shadcn/ui/button";

import { Toaster } from "../../../ui/shadcn/ui/sonner";

import { waitNextAnimationFrame } from "../../../tools/tools";
import { loadImportedParticleSystemFile, loadImportedParticleSystemFileFromJSON } from "../../layout/preview/import/particles";
import { loadImportedSceneFile } from "../../layout/preview/import/import";

import { IVFXFile, VFXNodeType } from "../../layout/assets-browser/items/vfx-types";

import { FaPlay, FaStop } from "react-icons/fa";
import { GridMaterial } from "babylonjs-materials";

import { VFXComponentsPanel, VFXPreviewPanel, VFXInspectorPanel } from "./components";

import layoutModel from "./layout.json";

export interface IVFXEditorWindowProps {
	filePath: string;
}

export interface IVFXEditorWindowState {
	vfxData: IVFXFile | null;
	selectedComponent: any;
	playing: boolean;
	scene: Scene | null;
	engine: Engine | null;
	camera: ArcRotateCamera | null;
	search: string;
}

export default class VFXEditorWindow extends Component<IVFXEditorWindowProps, IVFXEditorWindowState> {
	private _canvasRef: HTMLCanvasElement | null = null;
	private _layoutRef: Layout | null = null;
	private _model: Model = Model.fromJson(layoutModel as any);
	private _components: Record<string, React.ReactNode> = {};

	public constructor(props: IVFXEditorWindowProps) {
		super(props);

		this.state = {
			vfxData: null,
			selectedComponent: null,
			playing: false,
			scene: null,
			engine: null,
			camera: null,
			search: "",
		};

		// Try to load saved layout
		try {
			const layoutData = JSON.parse(localStorage.getItem("vfx-editor-layout") as string);
			if (layoutData.version === "1.0.0") {
				this._model = Model.fromJson(layoutData);
			}
		} catch (e) {
			// Use default layout
			this._model = Model.fromJson(layoutModel as any);
		}

		// Initialize components
		this._initializeComponents();
	}

	public render(): ReactNode {
		return (
			<>
				<div className="flex flex-col w-screen h-screen">
					<ToolbarComponent>
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1">
							<div className="flex items-center gap-1 font-semibold text-lg select-none">
								VFX Editor
								<div className="text-sm font-thin">(...{this.props.filePath.substring(this.props.filePath.length - 30)})</div>
							</div>
						</div>
					</ToolbarComponent>

					{/* Toolbar */}
					<div className="flex justify-between items-center w-full h-10 bg-primary-foreground/95 backdrop-blur-sm border-b border-border z-1">
						<div className="flex gap-2 items-center pl-3">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => this._play()}
								disabled={this.state.playing}
								className="h-8 px-2"
							>
								<FaPlay className="w-3 h-3 mr-1" />
								Play
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => this._stop()}
								disabled={!this.state.playing}
								className="h-8 px-2"
							>
								<FaStop className="w-3 h-3 mr-1" />
								Stop
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => this._save()}
								className="h-8 px-2"
							>
								Save
							</Button>
						</div>
						<div className="text-xs text-muted-foreground pr-3">
							{this.state.vfxData?.nodes?.length || 0} components
							{this.state.vfxData && ` (${this.state.vfxData.name})`}
						</div>
					</div>

					{/* FlexLayout */}
					<div className="flex-1 w-full h-full">
						<Layout 
							model={this._model} 
							ref={(r) => (this._layoutRef = r)} 
							factory={(n) => this._layoutFactory(n)} 
							onModelChange={(m) => this._saveLayout(m)} 
						/>
					</div>
				</div>

				<Toaster />
			</>
		);
	}

	public async componentDidMount(): Promise<void> {
		// Force dark theme
		if (!document.body.classList.contains("dark")) {
			document.body.classList.add("dark");
		}

		// Load VFX data
		if (!(await pathExists(this.props.filePath))) {
			toast.error("VFX file does not exist");
			// Create empty VFX data as fallback
			const emptyVfxData: IVFXFile = {
				name: "New VFX Effect",
				version: "1.0.0",
				description: "Empty VFX effect",
				nodes: [],
				connections: [],
				settings: {
					duration: 5000,
					loop: false,
					preview: true,
					quality: 'medium'
				},
				created: new Date().toISOString(),
				modified: new Date().toISOString(),
				author: "Editor",
				tags: []
			};
			this.setState({ vfxData: emptyVfxData });
		} else {
			try {
				const vfxData = await readJSON(this.props.filePath);
				
				// Ensure VFX data has the correct structure
				if (!vfxData.nodes) {
					vfxData.nodes = [];
				}
				if (!vfxData.connections) {
					vfxData.connections = [];
				}
				if (!vfxData.settings) {
					vfxData.settings = {
						duration: 5000,
						loop: false,
						preview: true,
						quality: 'medium'
					};
				}
				
				this.setState({ vfxData });
			} catch (error) {
				console.error("Failed to load VFX data:", error);
				toast.error("Failed to load VFX file");
				// Create empty VFX data as fallback
				const emptyVfxData: IVFXFile = {
					name: "New VFX Effect",
					version: "1.0.0",
					description: "Empty VFX effect",
					nodes: [],
					connections: [],
					settings: {
						duration: 5000,
						loop: false,
						preview: true,
						quality: 'medium'
					},
					created: new Date().toISOString(),
					modified: new Date().toISOString(),
					author: "Editor",
					tags: []
				};
				this.setState({ vfxData: emptyVfxData });
			}
		}

		await this._initializeScene();

		// Update components after scene initialization
		this._updateComponents();

		ipcRenderer.on("save", () => this._save());
		ipcRenderer.on("editor:close-window", () => this.close());

		await waitNextAnimationFrame();
	}

	public componentWillUnmount(): void {
		if (this.state.scene) {
			this.state.scene.dispose();
		}
		if (this.state.engine) {
			this.state.engine.dispose();
		}
	}

	private _initializeComponents(): void {
		this._updateComponents();
	}

	private _updateComponents(): void {
		this._components = {
			components: (
				<VFXComponentsPanel
					vfxData={this.state.vfxData}
					search={this.state.search}
					selectedComponent={this.state.selectedComponent}
					onSearchChange={(search) => this.setState({ search }, () => this._updateComponents())}
					onComponentSelect={(component) => this.setState({ selectedComponent: component }, () => this._updateComponents())}
					onComponentRemove={(id) => this._removeComponent(id)}
					onDrop={(ev) => this._handleDrop(ev)}
				/>
			),
			preview: (
				<VFXPreviewPanel
					scene={this.state.scene}
					engine={this.state.engine}
					camera={this.state.camera}
					onCanvasRef={(canvas) => (this._canvasRef = canvas)}
				/>
			),
			inspector: (
				<VFXInspectorPanel
					selectedComponent={this.state.selectedComponent}
					onComponentPropertyUpdate={(property, value) => this._updateComponentProperty(property, value)}
					onPropertyUpdate={(property, value) => this._updateProperty(property, value)}
				/>
			),
		};
	}

	private _layoutFactory(node: TabNode): ReactNode {
		const componentName = node.getComponent();
		if (!componentName) {
			return <div>Error, see console...</div>;
		}

		const component = this._components[componentName];
		if (!component) {
			setTimeout(() => {
				this._layoutRef?.props.model.doAction(Actions.deleteTab(componentName));
			}, 0);

			return <div>Error, see console...</div>;
		}

		return component;
	}

	private _saveLayout(model: Model): void {
		const layoutData = model.toJson() as IJsonModel & {
			version: string;
		};

		layoutData.version = "1.0.0";
		localStorage.setItem("vfx-editor-layout", JSON.stringify(layoutData));
	}

	private async _initializeScene(): Promise<void> {
		if (!this._canvasRef) return;

		const engine = new Engine(this._canvasRef, true);
		const scene = new Scene(engine);
		scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0);
		scene.ambientColor = new Color3(1, 1, 1);

		const camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), scene);
		camera.doNotSerialize = true;
		camera.lowerRadiusLimit = 3;
		camera.upperRadiusLimit = 10;
		camera.wheelPrecision = 20;
		camera.minZ = 0.001;
		camera.attachControl(false);
		camera.useFramingBehavior = true;
		camera.wheelDeltaPercentage = 0.01;
		camera.pinchDeltaPercentage = 0.01;

        const groundMaterial = new GridMaterial("groundMaterial", scene);
        groundMaterial.majorUnitFrequency = 2;
        groundMaterial.minorUnitVisibility = 0.1;
        groundMaterial.gridRatio = 0.5;
        groundMaterial.backFaceCulling = false;
        groundMaterial.mainColor = new Color3(1, 1, 1);
        groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
        groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
        groundMaterial.opacity = 0.5;

        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
        ground.material = groundMaterial;

		engine.runRenderLoop(() => {
			engine.resize();
			
			// Update SPS particles
			if (this.state.vfxData) {
				this.state.vfxData.nodes.forEach(node => {
					if (node.type === VFXNodeType.SOLID_PARTICLE_SYSTEM && node.properties.babylonSPS) {
						node.properties.babylonSPS.setParticles();
					}
				});
			}
			
			scene.render();
		});

		this.setState({ engine, scene, camera });
	}



	public close(): void {
		ipcRenderer.send("window:close");
	}


	private _updateComponentProperty(property: string, value: any): void {
		const updatedComponent = {
			...this.state.selectedComponent,
			[property]: value
		};
		this.setState({ selectedComponent: updatedComponent }, () => {
			this._updateComponents();
		});
	}

	private _updateProperty(property: string, value: any): void {
		const updatedComponent = {
			...this.state.selectedComponent,
			properties: {
				...this.state.selectedComponent.properties,
				[property]: value
			}
		};
		this.setState({ selectedComponent: updatedComponent }, () => {
			this._updateComponents();
		});
	}

	private _play(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: true });

		// Start all particle systems and SPS
		this.state.vfxData.nodes.forEach(node => {
			if (node.active) {
				if (node.type === VFXNodeType.PARTICLE_SYSTEM && node.properties.babylonSystem) {
					node.properties.babylonSystem.start();
				}
				// SPS doesn't need start/stop, it's always running
			}
		});

		toast.success("VFX playback started");
	}

	private _stop(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: false });

		// Stop all particle systems
		this.state.vfxData.nodes.forEach(node => {
			if (node.type === VFXNodeType.PARTICLE_SYSTEM && node.properties.babylonSystem) {
				node.properties.babylonSystem.stop();
			}
		});

		toast.info("VFX playback stopped");
	}

	private async _save(): Promise<void> {
		if (!this.state.vfxData) {
			return;
		}

		try {
			await writeJSON(this.props.filePath, this.state.vfxData, { spaces: 4 });
			toast.success("VFX saved");
			ipcRenderer.send("editor:asset-updated", "vfx", this.state.vfxData);
		} catch (error) {
			console.error("Failed to save VFX:", error);
			toast.error("Failed to save VFX file");
		}
	}

	private _handleDrop(ev: React.DragEvent<HTMLDivElement>): void {
        const assets = ev.dataTransfer.getData("assets");
        if (assets) {
            return this._handleAssetsDropped(ev);
        }
	}

    private _handleAssetsDropped(ev: React.DragEvent<HTMLDivElement>): void {
        const assets = ev.dataTransfer.getData("assets");
        if (!assets) {
            return;
        }
        try {
            const assetPaths = JSON.parse(assets) as string[];
            assetPaths.forEach(async (absolutePath) => {
                await this._processAssetFile(absolutePath);
            });
        } catch (error) {
            console.error("Failed to parse dropped assets:", error);
            toast.error("Failed to process dropped assets");
        }
    }

    private async _processAssetFile(absolutePath: string): Promise<void> {
        if (!this.state.vfxData || !this.state.scene) return;

        const extension = absolutePath.toLowerCase().split('.').pop();
        if (!extension) return;

        try {
            switch (extension) {
                case "glb":
                case "babylon":
                    await this._createSPSFromMesh(absolutePath);
                    break;
                
                case "json":
                    await this._createParticleSystemFromJSON(absolutePath);
                    break;
                
                case "npss":
                    await this._createParticleSystemFromNPSS(absolutePath);
                    break;
                
                case "png":
                case "jpg":
                case "jpeg":
                case "svg":
                case "webp":
                case "bmp":
                    // Textures are now handled by EditorParticleSystemInspector
                    toast.info("Textures can be assigned through the particle system inspector");
                    break;
                
                default:
                    toast.warning(`Unsupported file type: .${extension}`);
                    break;
            }
        } catch (error) {
            console.error(`Error processing ${absolutePath}:`, error);
            toast.error(`Failed to process ${absolutePath.split('/').pop()}`);
        }
    }

    private async _createSPSFromMesh(absolutePath: string): Promise<void> {
        if (!this.state.vfxData || !this.state.scene) return;

        const fileName = absolutePath.split('/').pop() || 'mesh';
        const componentName = fileName.replace(/\.(glb|babylon)$/i, '');

        const component = {
            id: `sps_${Date.now()}`,
            type: VFXNodeType.SOLID_PARTICLE_SYSTEM,
            name: componentName,
            position: { x: 100, y: 100 },
            inputs: [],
            outputs: [],
            properties: {
                ...this._getDefaultProperties(VFXNodeType.SOLID_PARTICLE_SYSTEM),
                filePath: absolutePath,
                particleCount: 1,
                useModelMaterial: true,
                meshLoaded: false,
                babylonSPS: null as any,
            },
            active: true,
        };

        // Load mesh using existing import function
        try {
            const result = await loadImportedSceneFile(this.state.scene, absolutePath);
            
            if (result && result.meshes.length > 0) {
                // Use the first mesh as template
                const templateMesh = result.meshes[0];
                templateMesh.isVisible = false; // Hide template mesh

                // Create Solid Particle System
                const sps = new SolidParticleSystem(componentName, this.state.scene, {
                    useModelMaterial: true
                });

                // Add shape to SPS
                sps.addShape(templateMesh as any, component.properties.particleCount);
                sps.buildMesh();

                // Initialize particles
                sps.initParticles = () => {
                    for (let i = 0; i < sps.nbParticles; i++) {
                        const particle = sps.particles[i];
                        particle.position = new Vector3(
                            (Math.random() - 0.5) * 2,
                            Math.random() * 0.5,
                            (Math.random() - 0.5) * 2
                        );
                        particle.scaling = new Vector3(1, 1, 1);
                        particle.rotation = new Vector3(0, 0, 0);
                    }
                };

                sps.initParticles();
                sps.setParticles();

                // Store SPS in component properties
                component.properties.babylonSPS = sps;
                component.properties.meshLoaded = true;

                const updatedVfxData = {
                    ...this.state.vfxData,
                    nodes: [...this.state.vfxData.nodes, component],
                    modified: new Date().toISOString(),
                };

				this.setState({ vfxData: updatedVfxData, selectedComponent: component }, () => {
					this._updateComponents();
				});
				toast.success(`Created SPS component: ${componentName}`);
            } else {
                throw new Error("No meshes loaded from file");
            }
        } catch (error) {
            console.error("Failed to create SPS from mesh:", error);
            toast.error(`Failed to create SPS from ${fileName}`);
        }
    }

    private async _createParticleSystemFromJSON(absolutePath: string): Promise<void> {
        if (!this.state.vfxData || !this.state.scene) return;

        const fileName = absolutePath.split('/').pop() || 'particles';
        const componentName = fileName.replace('.json', '');

        const component = {
            id: `particle_${Date.now()}`,
            type: VFXNodeType.PARTICLE_SYSTEM,
            name: componentName,
            position: { x: 100, y: 100 },
            inputs: [],
            outputs: [],
            properties: {
                filePath: absolutePath,
                babylonSystem: null as any,
            },
            active: true,
        };

        // Load particle system using existing import function
        try {
            // Create a temporary mesh as emitter for the particle system
            const tempMesh = MeshBuilder.CreateBox("tempEmitter", { size: 0.1 }, this.state.scene);
            tempMesh.isVisible = false;
            
            // Load particle system using the existing function
            const particleSystem = await loadImportedParticleSystemFileFromJSON(this.state.scene, tempMesh, absolutePath);
            
            if (particleSystem) {
                // Update component properties
                component.properties.babylonSystem = particleSystem;

                // Stop the particle system initially
                particleSystem.stop();

                const updatedVfxData = {
                    ...this.state.vfxData,
                    nodes: [...this.state.vfxData.nodes, component],
                    modified: new Date().toISOString(),
                };

                this.setState({ vfxData: updatedVfxData, selectedComponent: component }, () => {
					this._updateComponents();
				});
                toast.success(`Created particle system: ${componentName}`);
            } else {
                throw new Error("Particle system not found after loading");
            }
        } catch (error) {
            console.error("Failed to create particle system from JSON:", error);
            toast.error(`Failed to create particle system from ${fileName}`);
        }
    }

    private async _createParticleSystemFromNPSS(absolutePath: string): Promise<void> {
        if (!this.state.vfxData || !this.state.scene) return;

        const fileName = absolutePath.split('/').pop() || 'particles';
        const componentName = fileName.replace('.npss', '');

        const component = {
            id: `particle_${Date.now()}`,
            type: VFXNodeType.PARTICLE_SYSTEM,
            name: componentName,
            position: { x: 100, y: 100 },
            inputs: [],
            outputs: [],
            properties: {
                filePath: absolutePath,
                isNPSS: true,
                babylonSystem: null as any,
            },
            active: true,
        };

        // Load NPSS file using existing import function
        try {
            // Create a temporary mesh as emitter for the particle system
            const tempMesh = MeshBuilder.CreateBox("tempEmitter", { size: 0.1 }, this.state.scene);
            tempMesh.isVisible = false;
            
            // Load particle system using the existing function
            await loadImportedParticleSystemFile(this.state.scene, tempMesh, absolutePath);
            
            // Find the created particle system
            const particleSystem = this.state.scene.particleSystems.find(ps => ps.name.includes(componentName) || ps.name.includes(fileName.replace('.npss', '')));
            
            if (particleSystem) {
                // Update component properties
                component.properties.babylonSystem = particleSystem;

                // Stop the particle system initially
                particleSystem.stop();

                const updatedVfxData = {
                    ...this.state.vfxData,
                    nodes: [...this.state.vfxData.nodes, component],
                    modified: new Date().toISOString(),
                };

                this.setState({ vfxData: updatedVfxData, selectedComponent: component }, () => {
					this._updateComponents();
				});
                toast.success(`Created NPSS particle system: ${componentName}`);
            } else {
                throw new Error("Particle system not found after loading");
            }
        } catch (error) {
            console.error("Failed to create NPSS particle system:", error);
            toast.error(`Failed to create NPSS particle system from ${fileName}`);
        }
    }

	private _removeComponent(id: string): void {
		if (!this.state.vfxData) return;

		const updatedVfxData = {
			...this.state.vfxData,
			nodes: this.state.vfxData.nodes.filter(n => n.id !== id),
			connections: this.state.vfxData.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id),
			modified: new Date().toISOString(),
		};

		this.setState({ 
			vfxData: updatedVfxData,
			selectedComponent: this.state.selectedComponent?.id === id ? null : this.state.selectedComponent
		}, () => {
			this._updateComponents();
		});
		toast.info("Component removed");
	}

	private _getDefaultProperties(type: VFXNodeType): Record<string, any> {
		switch (type) {
			case VFXNodeType.SOLID_PARTICLE_SYSTEM:
				return {
					particleCount: 100,
					size: 0.1,
				};
			case VFXNodeType.PARTICLE_SYSTEM:
				return {
					// Properties are now managed by EditorParticleSystemInspector
				};
			case VFXNodeType.ANIMATION:
				return {
					duration: 1000,
					loop: false,
					property: "position",
					keys: []
				};
			default:
				return {};
		}
	}
}
