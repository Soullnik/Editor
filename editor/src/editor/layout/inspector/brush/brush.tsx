import { Component, ReactNode, DragEvent } from "react";

import { FaSearch, FaPlus, FaTrash } from "react-icons/fa";

import { Mesh, Vector3, StandardMaterial, Texture, Tools, MeshBuilder, Color3 } from "babylonjs";

import { Editor } from "../../../main";

import { Button } from "../../../../ui/shadcn/ui/button";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Checkbox } from "../../../../ui/shadcn/ui/checkbox";

import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorNumberField } from "../fields/number";

import { showAssetBrowserDialog, SceneAssetBrowserDialogMode } from "../../../../ui/scene-asset-browser";
import { computeOrGetThumbnail } from "../../../../tools/assets/thumbnail";
import {
	IBrushThinInstanceGroup,
	createBrushThinInstanceGroup,
	addBrushThinInstance,
	removeBrushThinInstance,
	disposeBrushThinInstanceGroup,
} from "../../../../tools/brush/thin-instances";
import {
	IBrushPaintResult,
	getBrushPositionFromMouse,
	generateBrushPositions,
	eraseBrushArea,
	getRandomBrushRotation,
	getRandomBrushScaling,
} from "../../../../tools/brush/brush-tools";

export interface IBrushAsset {
	id: string;
	name: string;
	type: "mesh" | "image";
	mesh?: Mesh;
	texture?: Texture;
	thumbnail?: string;
	enabled: boolean;
}

export interface IBrushInspectorProps {
	editor: Editor;
}

export interface IBrushInspectorState {
	brushSize: number;
	paintDensity: number;
	eraseDensity: number;
	assets: IBrushAsset[];
	searchQuery: string;
	brushMesh: Mesh | null;
	thinInstanceGroups: Map<string, IBrushThinInstanceGroup>;
	isErasing: boolean;
	assetDragOver: boolean;
}

export class EditorBrushInspector extends Component<IBrushInspectorProps, IBrushInspectorState> {
	private _brushDisk: Mesh | null = null;
	private _isCtrlPressed: boolean = false;
	private _isMouseDown: boolean = false;
	private _lastPaintPosition: Vector3 | null = null;
	private _isActive: boolean = false;

	public constructor(props: IBrushInspectorProps) {
		super(props);

		this.state = {
			brushSize: 1.0,
			paintDensity: 0.5,
			eraseDensity: 0.3,
			assets: [],
			searchQuery: "",
			brushMesh: null,
			thinInstanceGroups: new Map(),
			isErasing: false,
			assetDragOver: false,
		};
	}

	public componentDidMount(): void {
		this._createBrushDisk();
		this._setupEventListeners();
		this._isActive = true;
		
		// Register this brush inspector with the preview
		this.props.editor.layout.preview.setBrushInspector(this);
	}

	public componentWillUnmount(): void {
		this._isActive = false;
		this._cleanup();
		
		// Unregister this brush inspector from the preview
		this.props.editor.layout.preview.setBrushInspector(null);
	}

	public render(): ReactNode {
		return (
			<>
				<EditorInspectorSectionField title="Brush Settings">
					<EditorInspectorNumberField
						object={this.state}
						property="brushSize"
						label="Brush Size"
						min={0.1}
						max={10.0}
						step={0.1}
						onChange={() => this._updateBrushSize()}
					/>
					<EditorInspectorNumberField object={this.state} property="paintDensity" label="Paint Density" min={0.0} max={1.0} step={0.01} />
					<EditorInspectorNumberField object={this.state} property="eraseDensity" label="Erase Density" min={0.0} max={1.0} step={0.01} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Assets">
					<div className="flex gap-2 mb-2">
						<div className="relative flex-1">
							<FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<Input
								placeholder="Search assets..."
								value={this.state.searchQuery}
								onChange={(e) => this.setState({ searchQuery: e.target.value })}
								className="pl-8"
							/>
						</div>
					</div>

					<div 
						className={`h-64 overflow-y-auto border-2 border-dashed rounded-lg p-4 transition-colors ${
							this.state.assetDragOver 
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
								: "border-gray-300 dark:border-gray-600"
						}`}
						onDragOver={(e) => this._handleDragOver(e)}
						onDragLeave={(e) => this._handleDragLeave(e)}
						onDrop={(e) => this._handleAssetDrop(e)}
					>
						{this.state.assets.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
								<FaPlus className="w-8 h-8 mb-2" />
								<div className="text-sm text-center">
									Drag and drop assets from the Assets Browser here
								</div>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3">
								{this._getFilteredAssets().map((asset) => (
									<div
										key={asset.id}
										className={`relative flex flex-col items-center p-2 border rounded-lg transition-all duration-200 ${
											asset.enabled 
												? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
												: "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
										}`}
									>
										{/* Checkbox overlay */}
										<div className="absolute top-1 left-1 z-10">
											<Checkbox 
												checked={asset.enabled} 
												onCheckedChange={(checked) => this._toggleAssetEnabled(asset.id, checked as boolean)}
												className="bg-white/80 dark:bg-gray-800/80"
											/>
										</div>
										
										{/* Remove button overlay */}
										<Button 
											variant="ghost" 
											size="sm" 
											onClick={() => this._removeAsset(asset.id)}
											className="absolute top-1 right-1 z-10 w-6 h-6 p-0 bg-white/80 dark:bg-gray-800/80 hover:bg-red-100 dark:hover:bg-red-900/80"
										>
											<FaTrash className="w-3 h-3 text-red-500" />
										</Button>

										{/* Asset preview */}
										<div className="w-16 h-16 mb-2 flex items-center justify-center">
											{asset.thumbnail ? (
												<img 
													src={asset.thumbnail} 
													alt={asset.name} 
													className="w-full h-full object-cover rounded border"
												/>
											) : asset.type === "image" && asset.texture ? (
												<img 
													src={asset.texture.url || asset.texture.name} 
													alt={asset.name} 
													className="w-full h-full object-cover rounded border"
													onError={(e) => {
														// Fallback to placeholder if image fails to load
														const target = e.target as HTMLImageElement;
														target.style.display = 'none';
														const parent = target.parentElement;
														if (parent) {
															parent.innerHTML = `
																<div class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
																	<span class="text-xs text-gray-500 dark:text-gray-400">IMG</span>
																</div>
															`;
														}
													}}
												/>
											) : (
												<div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{asset.type === "mesh" ? "3D" : "IMG"}
													</span>
												</div>
											)}
										</div>

										{/* Asset name */}
										<div className="text-xs text-center font-medium truncate w-full" title={asset.name}>
											{asset.name}
										</div>
										
										{/* Asset type badge */}
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{asset.type}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Painting">
					<div className="text-xs text-gray-500">Hold Ctrl to show brush, Ctrl + Left Click to paint, Ctrl + Shift + Left Click to erase</div>
				</EditorInspectorSectionField>
			</>
		);
	}

	private _createBrushDisk(): void {
		const scene = this.props.editor.layout.preview.scene;
		if (!scene) {
			console.warn("No scene available for brush disk creation");
			return;
		}

		// Create a flat disk for the brush
		this._brushDisk = MeshBuilder.CreateDisc("brushDisk", { radius: 100, tessellation: 32 }, scene);
		this._brushDisk.isVisible = false;
		this._brushDisk.rotation.x = Math.PI / 2; // Make it horizontal
		this._brushDisk.isPickable = false; // Don't interfere with picking
		this._brushDisk.renderingGroupId = 1; // Render on top

		// Create a simple material for the brush
		const brushMaterial = new StandardMaterial("brushMaterial", scene);
		brushMaterial.diffuseColor = new Color3(0.2, 0.8, 1.0); // Blue color
		brushMaterial.alpha = 0.5;
		brushMaterial.backFaceCulling = false;
		brushMaterial.emissiveColor = new Color3(0.1, 0.4, 0.5); // Slight glow
		this._brushDisk.material = brushMaterial;

		console.log("Brush disk created:", this._brushDisk.name, "visible:", this._brushDisk.isVisible);
		this.setState({ brushMesh: this._brushDisk });
	}

	private _setupEventListeners(): void {
		// Keyboard events
		document.addEventListener("keydown", this._handleKeyDown);
		document.addEventListener("keyup", this._handleKeyUp);
	}

	private _cleanup(): void {
		// Remove event listeners
		document.removeEventListener("keydown", this._handleKeyDown);
		document.removeEventListener("keyup", this._handleKeyUp);

		// Dispose brush disk
		if (this._brushDisk) {
			this._brushDisk.dispose();
			this._brushDisk = null;
		}

		// Dispose thin instance groups
		this.state.thinInstanceGroups.forEach((group) => {
			disposeBrushThinInstanceGroup(group);
		});
		this.state.thinInstanceGroups.clear();
	}

	private _handleKeyDown = (e: KeyboardEvent): void => {
		if (!this._isActive) return;
		if (this._isCtrlPressed) return;
		if (e.key === "Control") {
			this._isCtrlPressed = true;
			this.props.editor.layout.preview.scene.activeCamera?.inputs.detachElement();
			if (this._brushDisk) {
				this._brushDisk.isVisible = true;
			}
		}
	};

	private _handleKeyUp = (e: KeyboardEvent): void => {
		if (!this._isActive) return;
		if (!this._isCtrlPressed) return;
		if (e.key === "Control") {
			this._isCtrlPressed = false;
			this.props.editor.layout.preview.scene.activeCamera?.inputs.attachElement();
			if (this._brushDisk) {
				this._brushDisk.isVisible = false;
			}
		}
	};

	public handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
		if (!this._isActive) return false;
		if (!this._isCtrlPressed) return false;
		if (e.button === 0) {
			this._isMouseDown = true;
			if (e.shiftKey) {
				this._startErasing(e.nativeEvent);
			} else {
				this._startPainting(e.nativeEvent);
			}
			return true; // Event was handled by brush inspector
		}
		return false;
	};

	public handleMouseMove = (): boolean => {
		if (!this._isActive) return false;
		
		if (this._isCtrlPressed) {
			console.log("Mouse move with Ctrl pressed, mouse down:", this._isMouseDown);
			// Always update brush position when Ctrl is pressed
			this._updateBrushPositionFromScene();
			
			// Continue painting/erasing if mouse is down
			if (this._isMouseDown) {
				// For now, we'll use a simple approach - check if we have any assets to paint
				// In a real implementation, you'd track the shift key state
				this._continuePaintingFromScene();
			}
			return true; // Event was handled by brush inspector
		}
		return false;
	};

	public handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
		if (!this._isActive) return false;
		
		if (e.button === 0) {
			console.log("Mouse up, stopping painting/erasing");
			this._isMouseDown = false;
			this._stopPainting();
			this._stopErasing();
			return true; // Event was handled by brush inspector
		}
		return false;
	};


	private _updateBrushSize(): void {
		if (this._brushDisk) {
			this._brushDisk.scaling.setAll(this.state.brushSize);
		}
	}

	private _updateBrushPositionFromScene(): void {
		if (!this._brushDisk) {
			console.log("No brush disk available for positioning");
			return;
		}

		const scene = this.props.editor.layout.preview.scene;
		const mouseX = scene.pointerX;
		const mouseY = scene.pointerY;

		// Get brush position from mouse
		const brushResult = getBrushPositionFromMouse(scene, mouseX, mouseY, true);

		if (brushResult) {
			this._brushDisk.position.copyFrom(brushResult.position);
			this._brushDisk.position.y += 0.01; // Slightly above the surface
			console.log("Brush disk positioned at:", this._brushDisk.position.asArray(), "mouse down:", this._isMouseDown);
		} else {
			console.log("No brush position found for mouse:", mouseX, mouseY);
		}
	}


	private _startPainting(e: MouseEvent): void {
		const scene = this.props.editor.layout.preview.scene;
		const canvas = this.props.editor.layout.preview.engine?.getRenderingCanvas();
		if (!canvas) {
			return;
		}

		// Get mouse position relative to canvas
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Get brush position from mouse
		const brushResult = getBrushPositionFromMouse(scene, mouseX, mouseY, true);
		if (brushResult) {
			this._lastPaintPosition = brushResult.position;
			this._paintAtPosition(brushResult);
		}
	}

	private _continuePaintingFromScene(): void {
		const scene = this.props.editor.layout.preview.scene;
		if (!this._lastPaintPosition) {
			return;
		}

		// Get brush position from scene coordinates
		const brushResult = getBrushPositionFromMouse(scene, scene.pointerX, scene.pointerY, true);
		if (brushResult) {
			// Check if we've moved far enough to paint again
			const distance = Vector3.Distance(this._lastPaintPosition, brushResult.position);
			if (distance > this.state.brushSize * 0.1) {
				// Paint every 10% of brush size
				this._lastPaintPosition = brushResult.position;
				this._paintAtPosition(brushResult);
			}
		}
	}


	private _paintAtPosition(brushResult: IBrushPaintResult): void {
		const enabledAssets = this.state.assets.filter((asset) => asset.enabled).map((asset) => asset.id);

		if (enabledAssets.length === 0) {
			return;
		}

		// Generate brush positions
		const positions = generateBrushPositions(brushResult.position, brushResult.normal, this.state.brushSize, this.state.paintDensity);

		// Paint at each position
		positions.forEach((position) => {
			enabledAssets.forEach((assetId) => {
				const group = this.state.thinInstanceGroups.get(assetId);
				if (!group) {
					return;
				}

				// Add some randomness for natural look
				const randomRotation = getRandomBrushRotation();
				const randomScaling = getRandomBrushScaling(1.0, 0.3);

				addBrushThinInstance(group, position, randomRotation, randomScaling);
			});
		});
	}

	private _stopPainting(): void {
		this._lastPaintPosition = null;
	}

	private _startErasing(e: MouseEvent): void {
		const scene = this.props.editor.layout.preview.scene;
		const canvas = this.props.editor.layout.preview.engine?.getRenderingCanvas();
		if (!canvas) {
			return;
		}

		// Get mouse position relative to canvas
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Get brush position from mouse
		const brushResult = getBrushPositionFromMouse(scene, mouseX, mouseY, true);
		if (brushResult) {
			this._lastPaintPosition = brushResult.position;
			this._eraseAtPosition(brushResult);
		}
	}



	private _eraseAtPosition(brushResult: IBrushPaintResult): void {
		eraseBrushArea(brushResult.position, this.state.brushSize, this.state.thinInstanceGroups, this.state.eraseDensity, removeBrushThinInstance);
	}

	private _stopErasing(): void {
		this._lastPaintPosition = null;
	}


	private _getFilteredAssets(): IBrushAsset[] {
		if (!this.state.searchQuery) {
			return this.state.assets;
		}

		return this.state.assets.filter((asset) => asset.name.toLowerCase().includes(this.state.searchQuery.toLowerCase()));
	}


	private _handleDragOver(e: DragEvent<HTMLDivElement>): void {
		e.preventDefault();
		e.stopPropagation();
		
		if (e.dataTransfer.types.includes("assets")) {
			this.setState({ assetDragOver: true });
		}
	}

	private _handleDragLeave(e: DragEvent<HTMLDivElement>): void {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ assetDragOver: false });
	}

	private async _handleAssetDrop(e: DragEvent<HTMLDivElement>): Promise<void> {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ assetDragOver: false });

		const data = e.dataTransfer.getData("assets");
		if (!data) {
			return;
		}

		try {
			const assetPaths = JSON.parse(data) as string[];
			
			for (const assetPath of assetPaths) {
				await this._addAssetFromPath(assetPath);
			}
		} catch (error) {
			console.error("Failed to parse dropped assets:", error);
		}
	}

	private async _addAssetFromPath(assetPath: string): Promise<void> {
		const extension = assetPath.split('.').pop()?.toLowerCase();
		
		if (!extension) {
			return;
		}

		// Handle mesh files
		if (['x', 'b3d', 'dae', 'glb', 'gltf', 'fbx', 'stl', 'lwo', 'dxf', 'obj', '3ds', 'ms3d', 'blend', 'babylon'].includes(extension)) {
			await this._addMeshAssetFromPath(assetPath);
		}
		// Handle image files
		else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension)) {
			await this._addImageAssetFromPath(assetPath);
		}
	}

	private async _addMeshAssetFromPath(assetPath: string): Promise<void> {
		try {
			// For now, we'll use the existing dialog approach
			// In a real implementation, you'd load the mesh directly from the path
			const result = await showAssetBrowserDialog(this.props.editor, {
				multiSelect: false,
				filter: SceneAssetBrowserDialogMode.Meshes,
			});

			const selectedMesh = result.selectedMeshes[0];
			if (!selectedMesh) {
				result.container.dispose();
				return;
			}

			const asset: IBrushAsset = {
				id: Tools.RandomId(),
				name: selectedMesh.name,
				type: "mesh",
				mesh: selectedMesh,
				enabled: true,
			};

			// Generate thumbnail
			try {
				const thumbnail = await computeOrGetThumbnail(this.props.editor, {
					type: "mesh",
					absolutePath: assetPath,
				});
				asset.thumbnail = thumbnail || undefined;
			} catch (e) {
				console.warn("Failed to generate thumbnail:", e);
				// Fallback to a simple icon representation
				asset.thumbnail = undefined;
			}

			// Create thin instance group for the mesh
			const thinInstanceGroup = createBrushThinInstanceGroup(this.props.editor.layout.preview.scene, asset.id, "mesh", selectedMesh);

			const newThinInstanceGroups = new Map(this.state.thinInstanceGroups);
			newThinInstanceGroups.set(asset.id, thinInstanceGroup);

			this.setState({
				assets: [...this.state.assets, asset],
				thinInstanceGroups: newThinInstanceGroups,
			});

			result.container.dispose();
		} catch (e) {
			console.error("Failed to add mesh asset:", e);
		}
	}

	private async _addImageAssetFromPath(assetPath: string): Promise<void> {
		try {
			const scene = this.props.editor.layout.preview.scene;
			const texture = new Texture(assetPath, scene);

			const asset: IBrushAsset = {
				id: Tools.RandomId(),
				name: assetPath.split("/").pop() || "Unknown",
				type: "image",
				texture: texture,
				enabled: true,
			};

			// Generate thumbnail
			try {
				const thumbnail = await computeOrGetThumbnail(this.props.editor, {
					type: "material",
					absolutePath: assetPath,
				});
				asset.thumbnail = thumbnail || undefined;
			} catch (e) {
				console.warn("Failed to generate thumbnail:", e);
				// For images, we can use the texture itself as a fallback
				asset.thumbnail = undefined;
			}

			// Create thin instance group for the image
			const thinInstanceGroup = createBrushThinInstanceGroup(this.props.editor.layout.preview.scene, asset.id, "image", undefined, texture);

			const newThinInstanceGroups = new Map(this.state.thinInstanceGroups);
			newThinInstanceGroups.set(asset.id, thinInstanceGroup);

			this.setState({
				assets: [...this.state.assets, asset],
				thinInstanceGroups: newThinInstanceGroups,
			});
		} catch (e) {
			console.error("Failed to add image asset:", e);
		}
	}

	private _toggleAssetEnabled(assetId: string, enabled: boolean): void {
		this.setState({
			assets: this.state.assets.map((asset) => (asset.id === assetId ? { ...asset, enabled } : asset)),
		});
	}

	private _removeAsset(assetId: string): void {
		// Dispose thin instance group
		const group = this.state.thinInstanceGroups.get(assetId);
		if (group) {
			disposeBrushThinInstanceGroup(group);
		}

		const newThinInstanceGroups = new Map(this.state.thinInstanceGroups);
		newThinInstanceGroups.delete(assetId);

		this.setState({
			assets: this.state.assets.filter((asset) => asset.id !== assetId),
			thinInstanceGroups: newThinInstanceGroups,
		});
	}
}
