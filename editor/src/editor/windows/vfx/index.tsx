import { ipcRenderer } from "electron";
import "babylonjs-loaders";
import { readJSON, writeJSON, pathExists } from "fs-extra";

import { toast } from "sonner";

import { Component, ReactNode } from "react";
import { Actions, IJsonModel, Layout, Model, TabNode } from "flexlayout-react";

import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, MeshBuilder, DirectionalLight } from "babylonjs";

import { Button } from "../../../ui/shadcn/ui/button";
import { Toaster } from "../../../ui/shadcn/ui/sonner";

import { waitNextAnimationFrame } from "../../../tools/tools";

import { VFXComponent, IVFXEditorWindowProps, IVFXEditorWindowState } from "./types";
import { projectConfiguration } from "../../../project/configuration";

import { FaPlay, FaStop } from "react-icons/fa";
import { GridMaterial } from "babylonjs-materials";

import { VFXComponentsPanel, VFXPreviewPanel, VFXInspectorPanel, VFXAnimationPanel } from "./components";
import { ParticleAnimationManager } from "./utils/particle-animation-manager";

import layoutModel from "./layout.json";
import { isDarwin } from "../../../tools/os";
import { IoCloseOutline } from "react-icons/io5";
import { VscChromeMinimize, VscMultipleWindows } from "react-icons/vsc";
import { Editor } from "../../../export";

export default class VFXEditorWindow extends Component<IVFXEditorWindowProps, IVFXEditorWindowState> {
	public canvasRef: HTMLCanvasElement | null = null;
	private _layoutRef: Layout | null = null;
	private _model: Model = Model.fromJson(layoutModel as unknown as IJsonModel);

	private _mockEditor = {
		state: {
			enableExperimentalFeatures: true,
			projectPath: this.props.filePath,
		},
		layout: {
			preview: {
				scene: null as Scene | null,
			},
			inspector: {
				forceUpdate: () => { this._inspector.forceUpdate(); },
			},
		},
	} as Editor;
	public _components: VFXComponentsPanel;
	public _preview: VFXPreviewPanel;
	private _inspector: VFXInspectorPanel;
	private _animation: VFXAnimationPanel;

	private _getComponents(): Record<string, React.ReactNode> {
		return {
			components: (
				<VFXComponentsPanel
					vfxData={this.state.vfxData}
					selectedComponent={this.state.selectedComponent}
					search={this.state.search}
					scene={this.state.scene}
					onSearchChange={(search) => this.setState({ search })}
					onComponentSelect={(component) => this.setSelectedComponent(component)}
					onComponentRemove={(id) => this.removeComponent(id)}
					onComponentAdded={(component) => this._addComponent(component)}
					ref={(r) => (this._components = r!)}
				/>
			),
			preview: (
				<VFXPreviewPanel
					scene={this.state.scene}
					engine={this.state.engine}
					onCanvasRef={(canvas) => {
						this.canvasRef = canvas;
					}}
					ref={(r) => (this._preview = r!)}
				/>
			),
			inspector: (
				<VFXInspectorPanel
					selectedComponent={this.state.selectedComponent}
					editor={this._mockEditor}
					onComponentPropertyUpdate={(component) => this.setSelectedComponent(component)}
					ref={(r) => (this._inspector = r!)}
				/>
			),
			animation: (
				<VFXAnimationPanel
					selectedComponent={this.state.selectedComponent}
					editor={this._mockEditor}
					scene={this.state.scene}
					onAnimationUpdate={(sps) => this.setSelectedComponent(sps)}
					ref={(r) => (this._animation = r!)}
				/>
			),
		};
	}

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

		try {
			const layoutData = JSON.parse(localStorage.getItem("vfx-editor-layout") as string);
			if (layoutData.version === "1.0.0") {
				this._model = Model.fromJson(layoutData);
			}
		} catch (e) {
			this._model = Model.fromJson(layoutModel as unknown as IJsonModel);
		}
	}

	public render(): ReactNode {
		return (
			<>
				<div className="flex flex-col w-screen h-screen">
					<div className="flex items-center w-full h-10 bg-primary-foreground/95 backdrop-blur-sm border-b border-border flex-shrink-0">
						<div className="flex-1 flex items-center justify-center gap-1 font-semibold text-lg select-none electron-draggable">
							VFX Editor
							<div className="text-sm font-thin">(...{this.props.filePath.substring(this.props.filePath.length - 30)})</div>
						</div>

						{(!isDarwin() || process.env.DEBUG) && (
							<div className="flex items-center">
								<Button variant="ghost" className="w-12 aspect-square !p-0 hover:bg-muted" onClick={() => ipcRenderer.send("window:minimize")}>
									<VscChromeMinimize className="w-5 h-5" />
								</Button>

								<Button variant="ghost" className="w-12 aspect-square !p-0 hover:bg-muted" onClick={() => ipcRenderer.send("window:maximize")}>
									<VscMultipleWindows className="w-5 h-5" />
								</Button>

								<Button variant="ghost" className="w-12 aspect-square !p-0 hover:bg-muted" onClick={() => ipcRenderer.send("window:close")}>
									<IoCloseOutline className="w-5 h-5" />
								</Button>
							</div>
						)}
					</div>
					<div className="flex justify-between items-center w-full h-10 bg-primary-foreground/95 backdrop-blur-sm border-b border-border flex-shrink-0 px-3">
						<div className="flex gap-2 items-center">
							<Button variant="ghost" size="sm" onClick={() => this.play()} disabled={this.state.playing} className="h-8 px-2">
								<FaPlay className="w-3 h-3 mr-1" />
								Play
							</Button>
							<Button variant="ghost" size="sm" onClick={() => this.stop()} disabled={!this.state.playing} className="h-8 px-2">
								<FaStop className="w-3 h-3 mr-1" />
								Stop
							</Button>
							<Button variant="ghost" size="sm" onClick={() => this.save()} className="h-8 px-2">
								Save
							</Button>
						</div>
						<div className="text-xs text-muted-foreground">
							{this.getAllComponents().length} components
							{this.state.vfxData && ` (${this.state.vfxData.name})`}
						</div>
					</div>

					<div className="relative flex-1 w-full overflow-hidden">
						<Layout
							model={this._model}
							ref={(r) => {
								this._layoutRef = r;
							}}
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

		// Set project configuration path for texture handling
		projectConfiguration.path = this.props.filePath;

		// Load VFX data
		if (!(await pathExists(this.props.filePath))) {
			toast.error("VFX file does not exist");
			this.close();
			return;
		} else {
			try {
				const vfxData = await readJSON(this.props.filePath);
				if (!vfxData.cpuParticles) vfxData.cpuParticles = [];
				if (!vfxData.gpuParticles) vfxData.gpuParticles = [];
				if (!vfxData.sps) vfxData.sps = [];
				if (!vfxData.particleSystemSets) vfxData.particleSystemSets = [];
				if (!vfxData.connections) {
					vfxData.connections = [];
				}
				if (!vfxData.settings) {
					vfxData.settings = {
						duration: 5000,
						loop: false,
						preview: true,
						quality: "medium",
					};
				}

				this.setState({ vfxData });
			} catch (error) {
				console.error("Failed to load VFX data:", error);
				toast.error("Failed to load VFX file");
				this.close();
				return;
			}
		}

		this._initializeScene();

		ipcRenderer.on("save", () => this.save());
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

	private _layoutFactory(node: TabNode): ReactNode {
		const componentName = node.getComponent();
		if (!componentName) {
			return <div>Error, see console...</div>;
		}

		const components = this._getComponents();
		const component = components[componentName];
		if (!component) {
			setTimeout(() => {
				this._layoutRef?.props.model.doAction(Actions.deleteTab(componentName));
			}, 0);

			return <div>Error, see console...</div>;
		}

		// Add resize listener for preview panel
		if (componentName === "preview") {
			node.setEventListener("resize", () => {
				waitNextAnimationFrame().then(() => {
					if (this.state.engine) {
						this.state.engine.resize();
					}
				});
			});
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

	private _initializeScene(): void {
		if (!this.canvasRef) return;

		const engine = new Engine(this.canvasRef, true);
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

		// Create directional light (sun)
		const sunLight = new DirectionalLight("sun", new Vector3(-1, -1, -1), scene);
		sunLight.intensity = 1.0;
		sunLight.diffuse = new Color3(1, 1, 1);
		sunLight.specular = new Color3(1, 1, 1);

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
			scene.render();
		});

		this._mockEditor.layout.preview.scene = scene;
		
		this.setState({ engine, scene, camera });
	}

	public close(): void {
		ipcRenderer.send("window:close");
	}

	public setSelectedComponent(component: VFXComponent): void {
		this.setState({ selectedComponent: component }, () => {
			// @ts-ignore
			this._animation.setEditedObject(component?.babylonMesh || component?.babylonSystem || component?.babylonSPS || component?.babylonParticleSystemSet);
		});
	}

	public removeComponent(id: string): void {
		if (!this.state.vfxData) return;

		const updatedVfxData = {
			...this.state.vfxData,
			cpuParticles: this.state.vfxData.cpuParticles.filter((c) => c.id !== id),
			gpuParticles: this.state.vfxData.gpuParticles.filter((c) => c.id !== id),
			sps: this.state.vfxData.sps.filter((c) => c.id !== id),
			particleSystemSets: this.state.vfxData.particleSystemSets.filter((c) => c.id !== id),
			modified: new Date().toISOString(),
		};

		this.setState({
			vfxData: updatedVfxData,
			selectedComponent: this.state.selectedComponent?.id === id ? null : this.state.selectedComponent,
		}, () => {
			this._animation.setEditedObject(null);
		});

		toast.info("Component removed");
	}

	private _addComponent(component: VFXComponent): void {
		if (!this.state.vfxData) return;

		const updatedVfxData = { ...this.state.vfxData };

		// Add component to appropriate array based on type
		switch (component.type) {
			case "cpu_particle_system":
				updatedVfxData.cpuParticles = [...this.state.vfxData.cpuParticles, component];
				break;
			case "gpu_particle_system":
				updatedVfxData.gpuParticles = [...this.state.vfxData.gpuParticles, component];
				break;
			case "solid_particle_system":
				updatedVfxData.sps = [...this.state.vfxData.sps, component];
				break;
			default:
				console.warn(`Unknown component type: ${component.type}`);
				return;
		}

		updatedVfxData.modified = new Date().toISOString();
		this.setState({ vfxData: updatedVfxData, selectedComponent: component }, () => {
			this._animation.setEditedObject(component);
		});
	}

	public getAllComponents(): VFXComponent[] {
		if (!this.state.vfxData) return [];
		return [...this.state.vfxData.cpuParticles, ...this.state.vfxData.gpuParticles, ...this.state.vfxData.sps, ...this.state.vfxData.particleSystemSets];
	}

	public play(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: true });
		
		// Start all animations using the animation manager
		ParticleAnimationManager.startAllAnimations(this.state.vfxData, this.state.scene);

		toast.success("VFX playback started");
	}

	public stop(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: false });

		// Stop all animations using the animation manager
		ParticleAnimationManager.stopAllAnimations(this.state.vfxData);

		toast.info("VFX playback stopped");
	}

	public async save(): Promise<void> {
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
}
