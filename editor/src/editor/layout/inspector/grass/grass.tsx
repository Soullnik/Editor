import { Component, DragEvent, ReactNode } from "react";

import { GiMaterialsScience } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";

import { AbstractMesh, Mesh, Material, Vector2, Vector3, Tools } from "babylonjs";

import { Editor } from "../../../main";

import { registerUndoRedo } from "../../../../tools/undoredo";
import { UniqueNumber } from "../../../../tools/tools";
import { setMeshMetadataNotSerializable, setMeshMetadataNotVisibleInGraph } from "../../../../tools/mesh/metadata";

import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { Button } from "../../../../ui/shadcn/ui/button";

import { grassConfiguration } from "./configuration";
import { loadMaterialFromPath, createDefaultGrassMaterial } from "./material";
import { createSingleMeshGrass } from "./geometry";
import { PreviewManager } from "./preview";

export interface IEditorGrassInspectorProps {
	editor: Editor;
}

export interface IEditorGrassInspectorState {
	assetDragOver: boolean;
	material: Material | null;
}

export class EditorGrassInspector extends Component<IEditorGrassInspectorProps, IEditorGrassInspectorState> {
	private _mouseMoveListener: ((event: MouseEvent) => void) | null = null;
	private _mouseDownListener: ((event: MouseEvent) => void) | null = null;
	private _mouseUpListener: ((event: MouseEvent) => void) | null = null;

	private _previewManager: PreviewManager | null = null;
	private _mouseDownPosition: Vector2 = Vector2.Zero();

	private static _lastPickPosition: Vector3 | null = null;
	private static _lastPickedNormal: Vector3 | null = null;
	private static _lastPickedMesh: AbstractMesh | null = null;

	public constructor(props: IEditorGrassInspectorProps) {
		super(props);

		this.state = {
			assetDragOver: false,
			material: null,
		};
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col gap-2 w-full h-full">
				{this._getMaterialDragAndDropComponent()}

				{this.state.material && (
					<EditorInspectorSectionField title="Options">
						<EditorInspectorNumberField
							object={grassConfiguration}
							property="bladeCount"
							min={1}
							max={100000}
							step={100}
							label="Blade Count"
							tooltip="Number of grass blades to generate. Higher values create denser grass but may impact performance. No limit applied."
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={grassConfiguration}
							property="bladeWidth"
							step={0.01}
							label="Blade Width"
							tooltip="Width of individual grass blades. Controls how thick each blade appears."
							noUndoRedo
						/>
						<EditorInspectorNumberField
							object={grassConfiguration}
							property="bladeHeight"
							step={0.1}
							label="Blade Height"
							tooltip="Height of individual grass blades. Controls how tall the grass appears."
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={grassConfiguration}
							property="brushRadius"
							step={0.1}
							label="Brush Radius"
							tooltip="Radius of the grass placement area. Controls how large the grass patch will be when placed."
							noUndoRedo
							onChange={() => this._updatePreviewIndicator()}
						/>
						<EditorInspectorNumberField
							object={grassConfiguration}
							property="heightVariation"
							step={0.1}
							label="Height Variation"
							tooltip="Random height variation factor. Higher values create more varied grass blade heights for natural appearance."
							noUndoRedo
						/>
						<EditorInspectorNumberField
							object={grassConfiguration}
							property="tipBendStrength"
							step={0.1}
							label="Tip Bend Strength"
							tooltip="Strength of the tip bending effect. Controls how much grass blades bend at their tips for realistic appearance."
							noUndoRedo
						/>
					</EditorInspectorSectionField>
				)}
			</div>
		);
	}

	public async componentDidMount(): Promise<void> {
		const canvas = this.props.editor.layout.preview.engine.getRenderingCanvas()!;

		canvas.addEventListener(
			"mousemove",
			(this._mouseMoveListener = (ev) => {
				this._handleMouseMove(ev.offsetX, ev.offsetY);
			})
		);

		canvas.addEventListener(
			"pointerdown",
			(this._mouseDownListener = (ev) => {
				this._handleMouseDown(ev);
			})
		);

		canvas.addEventListener(
			"pointerup",
			(this._mouseUpListener = (ev) => {
				this._handleMouseUp(ev);
			})
		);

		this.props.editor.layout.preview.setState({ pickingEnabled: false });

		// Load existing material or create default
		const scene = this.props.editor.layout.preview.scene;
		if (grassConfiguration.materialPath) {
			const material = await loadMaterialFromPath(grassConfiguration.materialPath, scene);
			this.setState({ material });
		} else {
			const material = createDefaultGrassMaterial(scene);
			this.setState({ material });
		}
	}

	public componentWillUnmount(): void {
		const canvas = this.props.editor.layout.preview.engine.getRenderingCanvas()!;

		canvas.removeEventListener("mousemove", this._mouseMoveListener!);
		canvas.removeEventListener("pointerdown", this._mouseDownListener!);
		canvas.removeEventListener("pointerup", this._mouseUpListener!);

		this.props.editor.layout.preview.setState({ pickingEnabled: true });

		this._disposePreviewIndicator();
	}

	private _getMaterialDragAndDropComponent(): ReactNode {
		return (
			<div
				className={`
                    flex gap-2 w-full h-24 rounded-lg
                    ${this.state.assetDragOver ? "bg-secondary" : ""}
                    transition-all duration-300 ease-in-out
                `}
				onDragOver={(ev) => {
					ev.preventDefault();
					this.setState({ assetDragOver: true });
				}}
				onDrop={(ev) => this._handleAssetDropped(ev)}
				onDragLeave={() => this.setState({ assetDragOver: false })}
			>
				<div
					className={`
                        flex justify-center items-center w-24 h-24 rounded-lg
                        ${grassConfiguration.materialPath ? "bg-secondary" : "bg-accent"}
                        transition-all duration-300 ease-in-out
                    `}
				>
					{!grassConfiguration.materialPath && <MdOutlineQuestionMark className="w-8 h-8" />}
					{grassConfiguration.materialPath && <GiMaterialsScience className="w-8 h-8" />}
				</div>

				<div className="flex flex-1 flex-col gap-2 justify-center items-center">
					<div className="text-xl font-semibold text-center w-full">
						{this.state.material?.name ?? "No material set"}
						{this.state.material && !grassConfiguration.materialPath && (
							<span className="text-sm text-muted-foreground ml-2">(Default)</span>
						)}
					</div>
					<div className="font-thin">
						{this.state.material ? (
							<div className="text-center">
								Hover to preview, Click to place grass.
								{!grassConfiguration.materialPath && (
									<div className="text-xs text-muted-foreground mt-1">
										Drag and drop a material to replace default
									</div>
								)}
							</div>
						) : (
							"Drag and drop a material asset here."
						)}
					</div>
					{grassConfiguration.materialPath && (
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => this._resetToDefaultMaterial()}
							className="mt-2"
						>
							Reset to Default
						</Button>
					)}
				</div>
			</div>
		);
	}

	private async _handleAssetDropped(ev: DragEvent<HTMLDivElement>): Promise<void> {
		this.setState({ assetDragOver: false });

		const assets = ev.dataTransfer.getData("assets");
		if (!assets) {
			return;
		}

		const assetAbsolutePath = JSON.parse(assets)[0] as string;
		const extension = assetAbsolutePath.split('.').pop()?.toLowerCase();

		if (extension !== "material") {
			return;
		}

		const scene = this.props.editor.layout.preview.scene;
		const material = await loadMaterialFromPath(assetAbsolutePath, scene);
		this.setState({ material });
		grassConfiguration.materialPath = assetAbsolutePath;
	}

	private _resetToDefaultMaterial(): void {
		// Clear the material path
		grassConfiguration.materialPath = "";

		// Create new default material
		const scene = this.props.editor.layout.preview.scene;
		const material = createDefaultGrassMaterial(scene);
		this.setState({ material });
	}

	private _disposePreviewIndicator(): void {
		this._previewManager?.dispose();
		this._previewManager = null;
	}

	private _handleMouseMove(offsetX: number, offsetY: number): void {
		if (!this.state.material) {
			return;
		}

		const scene = this.props.editor.layout.preview.scene;
		const pick = scene.pick(
			offsetX,
			offsetY,
			(m) => {
				return m !== this._previewManager?.getIndicator() && !m.metadata?.grass && m.isVisible && m.isEnabled();
			},
			false
		);

		if (pick.pickedMesh && pick.pickedPoint) {
			EditorGrassInspector._lastPickedMesh = pick.pickedMesh;
			EditorGrassInspector._lastPickedNormal = pick.getNormal(true, true);
			EditorGrassInspector._lastPickPosition = pick.pickedPoint.clone();

			// Create preview on first mouse movement
			if (!this._previewManager) {
				this._createPreviewIndicator();
			} else {
				this._updatePreviewPosition();
			}
		}
	}

	private _updatePreviewPosition(): void {
		if (!EditorGrassInspector._lastPickPosition || !this._previewManager) {
			return;
		}

		// Update indicator position and rotation
		this._previewManager.updateIndicatorTransform(
			EditorGrassInspector._lastPickPosition,
			EditorGrassInspector._lastPickedNormal!
		);
	}

	private _createPreviewIndicator(): void {
		if (!EditorGrassInspector._lastPickPosition || !this.state.material) {
			return;
		}

		const scene = this.props.editor.layout.preview.scene;
		this._previewManager = new PreviewManager(scene, this.state.material);
		this._previewManager.createPreviewIndicator(
			EditorGrassInspector._lastPickPosition,
			EditorGrassInspector._lastPickedNormal!
		);
	}

	private _updatePreviewIndicator(): void {
		// Optimized update with debouncing
		if (this._previewManager) {
			this._previewManager.scheduleUpdate();
		}
	}

	private _handleMouseDown(ev: MouseEvent): void {
		this._mouseDownPosition.set(ev.offsetX, ev.offsetY);
	}

	private _handleMouseUp(event: MouseEvent): void {
		if (!this.state.material) {
			return;
		}

		const distance = Vector2.Distance(this._mouseDownPosition, new Vector2(event.offsetX, event.offsetY));

		if (distance > 2) {
			return;
		}

		this._handleMouseMove(event.offsetX, event.offsetY);

		const indicatorData = this._previewManager?.getIndicatorData();
		if (indicatorData) {
			// Create actual grass when placing, using data from indicator
			const scene = this.props.editor.layout.preview.scene;
			
			// Clone material for this grass mesh to avoid disposal issues
			const clonedMaterial = this.state.material?.clone("grass_material_" + Tools.RandomId());
			if (!clonedMaterial) {
				console.warn("Failed to clone material for grass");
				return;
			}
			
			const grassMesh = createSingleMeshGrass(scene, clonedMaterial);
			if (grassMesh) {
				grassMesh.name = "Grass";
				grassMesh.id = Tools.RandomId();
				grassMesh.uniqueId = UniqueNumber.Get();
				
				// Copy position and scaling from indicator
				grassMesh.position = indicatorData.position;
				grassMesh.scaling = indicatorData.scaling;
				
				// Compensate indicator rotation for vertical grass
				grassMesh.rotation.x = indicatorData.rotation.x + Math.PI / 2;
				grassMesh.rotation.y = indicatorData.rotation.y;
				grassMesh.rotation.z = indicatorData.rotation.z;

				// Setup shadows like standard meshes
				grassMesh.receiveShadows = true;
				
				// Add to shadow maps for all lights
				scene.lights.forEach((light) => {
					light.getShadowGenerator()?.getShadowMap()?.renderList?.push(grassMesh);
				});

				grassMesh.metadata = {
					grass: {
						bladeCount: grassConfiguration.bladeCount,
						bladeWidth: grassConfiguration.bladeWidth,
						bladeHeight: grassConfiguration.bladeHeight,
						brushRadius: grassConfiguration.brushRadius,
						heightVariation: grassConfiguration.heightVariation,
						tipBendStrength: grassConfiguration.tipBendStrength,
						meshId: EditorGrassInspector._lastPickedMesh?.id,
						position: EditorGrassInspector._lastPickPosition?.asArray(),
						normal: EditorGrassInspector._lastPickedNormal?.asArray(),
					},
				};

				setMeshMetadataNotSerializable(grassMesh, false);
				setMeshMetadataNotVisibleInGraph(grassMesh, false);

				registerUndoRedo({
					executeRedo: false,
					undo: () => scene.removeMesh(grassMesh),
					redo: () => scene.addMesh(grassMesh),
				});

				// Follow standard mesh creation pattern
				this.props.editor.layout.graph.refresh().then(() => {
					this.props.editor.layout.graph.setSelectedNode(grassMesh);
				});

				// Set in inspector and gizmo like standard meshes
				this.props.editor.layout.inspector.setEditedObject(grassMesh);
				this.props.editor.layout.preview.gizmo.setAttachedNode(grassMesh);
			}
		}
	}
} 
