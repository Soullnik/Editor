import { ipcRenderer } from "electron";
import { readJSON, writeJSON, pathExists } from "fs-extra";

import { toast } from "sonner";

import { Component, ReactNode } from "react";

import { 
	Engine, 
	Scene, 
	ArcRotateCamera, 
	Vector3, 
	Color3, 
	Color4,
	MeshBuilder
} from "babylonjs";

import { ToolbarComponent } from "../../../ui/toolbar";
import { Button } from "../../../ui/shadcn/ui/button";
import { Input } from "../../../ui/shadcn/ui/input";
import { Label } from "../../../ui/shadcn/ui/label";
import { Slider } from "../../../ui/shadcn/ui/slider";
import { Switch } from "../../../ui/shadcn/ui/switch";
import {
	ContextMenu,
	ContextMenuItem,
	ContextMenuContent,
	ContextMenuTrigger,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubTrigger,
	ContextMenuSubContent,
} from "../../../ui/shadcn/ui/context-menu";

import { Toaster } from "../../../ui/shadcn/ui/sonner";

import { waitNextAnimationFrame } from "../../../tools/tools";

import { IVFXFile, VFXNodeType } from "../../layout/assets-browser/items/vfx-types";

import { FaMagic, FaPlay, FaStop } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";
import { GridMaterial } from "babylonjs-materials";

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
	}

	public render(): ReactNode {
		return (
			<>
				<div className="flex flex-col w-screen h-screen">
                    {/* Canvas as background */}
					<canvas
						ref={(r) => (this._canvasRef = r)}
						className="absolute inset-0 w-full h-full bg-background"
						style={{ zIndex: 1 }}
					/>
                    
					<ToolbarComponent>
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 20 }}>
							<div className="flex items-center gap-1 font-semibold text-lg select-none">
								VFX Editor
								<div className="text-sm font-thin">(...{this.props.filePath.substring(this.props.filePath.length - 30)})</div>
							</div>
						</div>
					</ToolbarComponent>

					{/* Toolbar */}
					<div className="flex justify-between items-center w-full h-10 bg-primary-foreground/95 backdrop-blur-sm border-b border-border" style={{ zIndex: 20 }}>
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

					

					{/* UI Panels over canvas */}
					<div className="flex flex-1 w-full h-full relative" style={{ zIndex: 10 }}>
						{/* Left Panel - Components List */}
						<div className="w-80 border-r border-border bg-primary-foreground/95 backdrop-blur-sm pointer-events-auto">
							{this._renderComponentsList()}
						</div>

						{/* Center Panel - Empty space for preview */}
						<div className="flex-1 flex flex-col pointer-events-none">
							{/* Empty space - canvas shows through */}
						</div>

						{/* Right Panel - Inspector */}
						<div className="w-80 border-l border-border bg-primary-foreground/95 backdrop-blur-sm pointer-events-auto">
							{this._renderInspector()}
						</div>
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

		// Initialize Babylon.js scene
		await this._initializeBabylon();

		// Setup IPC listeners
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

	private async _initializeBabylon(): Promise<void> {
		if (!this._canvasRef) return;

		const engine = new Engine(this._canvasRef, true);
		const scene = new Scene(engine);
		scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0);
		scene.ambientColor = new Color3(1, 1, 1);

		// Camera
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

		// // Lights
		// const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
		// hemisphericLight.intensity = 0.6;

		// const directionalLight = new DirectionalLight("directionalLight", new Vector3(-1, -1, -1), scene);
		// directionalLight.intensity = 0.4;

		// Ground
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

		// Render loop
		engine.runRenderLoop(() => {
			engine.resize();
			scene.render();
		});

		this.setState({ engine, scene, camera });
	}

	private _renderComponentsList(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				{/* Header */}
				<div className="flex items-center justify-between p-3 border-b border-border">
					<h3 className="font-semibold text-sm">Components</h3>
				</div>

				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input
						placeholder="Search components..."
						value={this.state.search}
						onChange={(e) => this.setState({ search: e.target.value })}
						className="h-8 text-xs"
					/>
				</div>

				{/* Components List */}
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="flex-1 flex flex-col">
							{/* Components */}
							<div className="flex-shrink-0">
								{this._getFilteredComponents().map((component) => (
									<ContextMenu key={component.id}>
										<ContextMenuTrigger>
											<div
												className={`
													flex items-center gap-2 p-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200
													${this.state.selectedComponent?.id === component.id ? 'bg-primary/20' : ''}
												`}
												onClick={() => this.setState({ selectedComponent: component })}
											>
												<div className={`w-3 h-3 rounded-full ${component.active ? 'bg-green-500' : 'bg-gray-400'}`} />
												{this._getComponentIcon(component.type)}
												<div className="flex-1 min-w-0">
													<div className="text-sm font-medium truncate">{component.name}</div>
													<div className="text-xs text-muted-foreground truncate">{component.type}</div>
												</div>
											</div>
										</ContextMenuTrigger>
										<ContextMenuContent>
											<ContextMenuItem onClick={() => this.setState({ selectedComponent: component })}>
												Select
											</ContextMenuItem>
											<ContextMenuSeparator />
											<ContextMenuItem 
												onClick={() => this._removeComponent(component.id)}
												className="text-red-500"
											>
												Delete
											</ContextMenuItem>
										</ContextMenuContent>
									</ContextMenu>
								))}
							</div>

							{/* Empty space for right-click */}
							<div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
								{!this._getFilteredComponents().length && (
									<>
										<FaMagic className="w-8 h-8 mb-2" />
										<div className="text-sm">No components found</div>
										<div className="text-xs">Right-click to add components</div>
									</>
								)}
							</div>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuSub>
							<ContextMenuSubTrigger className="flex items-center gap-2">
								<GiSparkles className="w-4 h-4" /> Particle Systems
							</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								<ContextMenuItem onClick={() => this._addComponent(VFXNodeType.PARTICLE_SYSTEM)}>
									Particle System
								</ContextMenuItem>
								<ContextMenuItem onClick={() => this._addComponent(VFXNodeType.SOLID_PARTICLE_SYSTEM)}>
									Solid Particle System
								</ContextMenuItem>
							</ContextMenuSubContent>
						</ContextMenuSub>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => this._addComponent(VFXNodeType.ANIMATION)}>
							<FaMagic className="w-4 h-4 mr-2" /> Animation
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</div>
		);
	}

	private _renderInspector(): ReactNode {
		if (!this.state.selectedComponent) {
			return (
				<div className="flex flex-col w-full h-full">
					<div className="p-3 border-b border-border">
						<h3 className="font-semibold text-sm">Properties</h3>
					</div>
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<div className="text-sm">No component selected</div>
							<div className="text-xs">Select a component to edit its properties</div>
						</div>
					</div>
				</div>
			);
		}

		const component = this.state.selectedComponent;
		const properties = component.properties || {};

		return (
			<div className="flex flex-col w-full h-full">
				<div className="p-3 border-b border-border">
					<h3 className="font-semibold text-sm">Properties</h3>
					<div className="text-xs text-muted-foreground mt-1">
						{component.type}
					</div>
				</div>

				<div className="flex-1 overflow-auto p-3 space-y-4">
					{/* Basic Properties */}
					<div className="space-y-2">
						<Label className="text-xs font-medium">Name</Label>
						<Input
							value={component.name}
							onChange={(e) => this._updateComponentProperty('name', e.target.value)}
							className="h-8 text-xs"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-medium">Active</Label>
						<Switch
							checked={component.active}
							onCheckedChange={(checked) => this._updateComponentProperty('active', checked)}
						/>
					</div>

					{/* Component-specific properties */}
					{component.type === VFXNodeType.SOLID_PARTICLE_SYSTEM && (
						<>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Particle Count</Label>
								<Input
									type="number"
									value={properties.particleCount || 100}
									onChange={(e) => this._updateProperty('particleCount', parseInt(e.target.value))}
									className="h-8 text-xs"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Size</Label>
								<Slider
									min={0.01}
									max={1.0}
									step={0.01}
									value={[properties.size || 0.1]}
									onValueChange={(value) => this._updateProperty('size', value[0])}
									className="w-full"
								/>
								<div className="text-xs text-muted-foreground text-center">
									{properties.size || 0.1}
								</div>
							</div>
						</>
					)}

					{component.type === VFXNodeType.PARTICLE_SYSTEM && (
						<>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Emit Rate</Label>
								<Input
									type="number"
									value={properties.emitRate || 100}
									onChange={(e) => this._updateProperty('emitRate', parseInt(e.target.value))}
									className="h-8 text-xs"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Particle Life Time</Label>
								<Slider
									min={0.1}
									max={10.0}
									step={0.1}
									value={[properties.particleLifeTime || 2.0]}
									onValueChange={(value) => this._updateProperty('particleLifeTime', value[0])}
									className="w-full"
								/>
								<div className="text-xs text-muted-foreground text-center">
									{properties.particleLifeTime || 2.0}s
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		);
	}

	public close(): void {
		ipcRenderer.send("window:close");
	}

	private _getFilteredComponents() {
		if (!this.state.vfxData) {
			return [];
		}

		return this.state.vfxData.nodes.filter(component => 
			component.name.toLowerCase().includes(this.state.search.toLowerCase()) ||
			component.type.toLowerCase().includes(this.state.search.toLowerCase())
		);
	}

	private _getComponentIcon(type: VFXNodeType): ReactNode {
		switch (type) {
			case VFXNodeType.PARTICLE_SYSTEM:
			case VFXNodeType.SOLID_PARTICLE_SYSTEM:
				return <GiSparkles className="w-4 h-4 text-yellow-500" />;
			case VFXNodeType.ANIMATION:
				return <FaMagic className="w-4 h-4 text-green-500" />;
			default:
				return <MdOutlineQuestionMark className="w-4 h-4 text-gray-500" />;
		}
	}

	private _updateComponentProperty(property: string, value: any): void {
		const updatedComponent = {
			...this.state.selectedComponent,
			[property]: value
		};
		this.setState({ selectedComponent: updatedComponent });
	}

	private _updateProperty(property: string, value: any): void {
		const updatedComponent = {
			...this.state.selectedComponent,
			properties: {
				...this.state.selectedComponent.properties,
				[property]: value
			}
		};
		this.setState({ selectedComponent: updatedComponent });
	}

	private _play(): void {
		this.setState({ playing: true });
		// TODO: Implement VFX playback
		toast.success("VFX playback started");
	}

	private _stop(): void {
		this.setState({ playing: false });
		// TODO: Implement VFX stop
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

	private _addComponent(type: VFXNodeType): void {
		if (!this.state.vfxData) return;

		const component = {
			id: `component_${Date.now()}`,
			type: type,
			name: `${type}_${this.state.vfxData.nodes.length + 1}`,
			position: { x: 100, y: 100 },
			inputs: [],
			outputs: [],
			properties: this._getDefaultProperties(type),
			active: true,
		};

		const updatedVfxData = {
			...this.state.vfxData,
			nodes: [...this.state.vfxData.nodes, component],
			modified: new Date().toISOString(),
		};

		this.setState({ vfxData: updatedVfxData });
		toast.success(`Added ${type} component`);
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
		});
		toast.info("Component removed");
	}

	// private _updateComponent(component: any): void {
	// 	if (!this.state.vfxData) return;

	// 	const updatedVfxData = {
	// 		...this.state.vfxData,
	// 		nodes: this.state.vfxData.nodes.map(n => n.id === component.id ? component : n),
	// 		modified: new Date().toISOString(),
	// 	};

	// 	this.setState({ 
	// 		vfxData: updatedVfxData,
	// 		selectedComponent: component
	// 	});
	// }

	private _getDefaultProperties(type: VFXNodeType): Record<string, any> {
		switch (type) {
			case VFXNodeType.SOLID_PARTICLE_SYSTEM:
				return {
					particleCount: 100,
					meshType: "box",
					size: 0.1,
					color: { r: 1, g: 1, b: 1 },
					position: { x: 0, y: 0, z: 0 },
					rotation: { x: 0, y: 0, z: 0 },
					scaling: { x: 1, y: 1, z: 1 }
				};
			case VFXNodeType.PARTICLE_SYSTEM:
				return {
					emitRate: 100,
					particleLifeTime: 2.0,
					particleSize: 0.1,
					color1: { r: 1, g: 1, b: 1 },
					color2: { r: 0, g: 0, b: 0 },
					gravity: { x: 0, y: -9.81, z: 0 },
					position: { x: 0, y: 0, z: 0 }
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
