import { ipcRenderer } from "electron";
import { readJSON, writeJSON, pathExists } from "fs-extra";

import { toast } from "sonner";

import { Component, ReactNode } from "react";
import { Actions, IJsonModel, Layout, Model, TabNode } from "flexlayout-react";

import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, MeshBuilder } from "babylonjs";

import { Button } from "../../../ui/shadcn/ui/button";
import { Toaster } from "../../../ui/shadcn/ui/sonner";

import { waitNextAnimationFrame } from "../../../tools/tools";

import { VFXComponent, IVFXEditorWindowProps, IVFXEditorWindowState } from "./types";
import { projectConfiguration } from "../../../project/configuration";

import { FaPlay, FaStop } from "react-icons/fa";
import { GridMaterial } from "babylonjs-materials";

import { VFXComponentsPanel, VFXPreviewPanel, VFXInspectorPanel } from "./components";

import layoutModel from "./layout.json";

export default class VFXEditorWindow extends Component<IVFXEditorWindowProps, IVFXEditorWindowState> {
	public canvasRef: HTMLCanvasElement | null = null;
	private _layoutRef: Layout | null = null;
	private _model: Model = Model.fromJson(layoutModel as unknown as IJsonModel);
	private _getComponents(): Record<string, React.ReactNode> {
		return {
			components: (
				<VFXComponentsPanel
					vfxData={this.state.vfxData}
					selectedComponent={this.state.selectedComponent}
					search={this.state.search}
					scene={this.state.scene}
					onSearchChange={(search) => this.setState({ search })}
					onComponentSelect={(component) => this.setState({ selectedComponent: component })}
					onComponentRemove={(id) => this.removeComponent(id)}
					onComponentAdded={(component) => this._addComponent(component)}
				/>
			),
			preview: (
				<VFXPreviewPanel
					scene={this.state.scene}
					engine={this.state.engine}
					onCanvasRef={(canvas) => { this.canvasRef = canvas; }}
				/>
			),
			inspector: (
				<VFXInspectorPanel
					selectedComponent={this.state.selectedComponent}
					scene={this.state.scene}
					onComponentPropertyUpdate={(component) => this.setState({ selectedComponent: component })}
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
					<div
						className="flex items-center justify-center w-full h-10 bg-primary-foreground/95 backdrop-blur-sm border-b border-border flex-shrink-0"
						style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
					>
						<div className="flex items-center gap-1 font-semibold text-lg select-none">
							VFX Editor
							<div className="text-sm font-thin">(...{this.props.filePath.substring(this.props.filePath.length - 30)})</div>
						</div>
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

			if (this.state.vfxData) {
				// this.state.vfxData.sps.forEach((sps) => {
				// 	if (sps.babylonSPS) {
				// 		sps.babylonSPS.setParticles();
				// 	}
				// });
				// this.state.vfxData.cpuParticles.forEach((cpuParticle) => {
				// 	if (cpuParticle.babylonSystem) {
				// 		const particleSystem = cpuParticle.babylonSystem;
				// 		if (particleSystem.isStarted() &&
				// 			particleSystem.getActiveCount() === 0 &&
				// 			particleSystem.targetStopDuration > 0) {
				// 				console.log(`Auto-stopped CPU particle system: ${cpuParticle.name}`);
				// 				particleSystem.stop();
				// 		}
				// 	}
				// });
				// this.state.vfxData.gpuParticles.forEach((gpuParticle) => {
				// 	if (gpuParticle.babylonSystem) {
				// 		const particleSystem = gpuParticle.babylonSystem;
				// 		if (particleSystem.isStarted() &&
				// 			particleSystem.getActiveCount() === 0 &&
				// 			particleSystem.targetStopDuration > 0) {
				// 			particleSystem.stop();
				// 			console.log(`Auto-stopped GPU particle system: ${gpuParticle.name}`);
				// 		}
				// 	}
				// });
			}

			scene.render();
		});

		this.setState({ engine, scene, camera });
	}

	public close(): void {
		ipcRenderer.send("window:close");
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
		});
		toast.info("Component removed");
	}

	private _addComponent(component: VFXComponent): void {
		if (!this.state.vfxData) return;

		const updatedVfxData = { ...this.state.vfxData };

		// Add component to appropriate array based on type
		switch (component.type) {
			case "cpu_particle_system":
				updatedVfxData.cpuParticles = [...this.state.vfxData.cpuParticles, component as any];
				break;
			case "gpu_particle_system":
				updatedVfxData.gpuParticles = [...this.state.vfxData.gpuParticles, component as any];
				break;
			case "solid_particle_system":
				updatedVfxData.sps = [...this.state.vfxData.sps, component as any];
				break;
			default:
				console.warn(`Unknown component type: ${component.type}`);
				return;
		}

		updatedVfxData.modified = new Date().toISOString();
		this.setState({ vfxData: updatedVfxData, selectedComponent: component });
	}

	public getAllComponents(): VFXComponent[] {
		if (!this.state.vfxData) return [];
		return [...this.state.vfxData.cpuParticles, ...this.state.vfxData.gpuParticles, ...this.state.vfxData.sps, ...this.state.vfxData.particleSystemSets];
	}

	public play(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: true });
		this.state.vfxData.cpuParticles.forEach((cpuParticle) => {
			if (cpuParticle.active && cpuParticle.babylonSystem) {
				cpuParticle.babylonSystem.start();
			}
		});

		this.state.vfxData.gpuParticles.forEach((gpuParticle) => {
			if (gpuParticle.active && gpuParticle.babylonSystem) {
				gpuParticle.babylonSystem.start();
			}
		});

		toast.success("VFX playback started");
	}

	public stop(): void {
		if (!this.state.vfxData) return;

		this.setState({ playing: false });

		this.state.vfxData.cpuParticles.forEach((cpuParticle) => {
			if (cpuParticle.babylonSystem) {
				cpuParticle.babylonSystem.stop();
			}
		});

		this.state.vfxData.gpuParticles.forEach((gpuParticle) => {
			if (gpuParticle.babylonSystem) {
				gpuParticle.babylonSystem.stop();
			}
		});

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
