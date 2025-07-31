import { Component, DragEvent, ReactNode } from "react";

import { GiMaterialsScience } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";

import { AbstractMesh, Mesh, Material, Vector2, Vector3 } from "babylonjs";

import { Editor } from "../../../main";

import { registerUndoRedo } from "../../../../tools/undoredo";

import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { Button } from "../../../../ui/shadcn/ui/button";

import { foliageConfiguration } from "./configuration";
import { loadMaterialFromPath, createDefaultGrassMaterial } from "./material";
import { createFoliageInstances, filterMatricesByDistance } from "./geometry";
import { FoliagePreviewManager } from "./preview";

export interface IEditorFoliageInspectorProps {
	editor: Editor;
}

export interface IEditorFoliageInspectorState {
	assetDragOver: boolean;
	material: Material | null;
	selectedMeshes: Mesh[];
}

export class EditorFoliageInspector extends Component<IEditorFoliageInspectorProps, IEditorFoliageInspectorState> {
	private _mouseMoveListener: ((event: MouseEvent) => void) | null = null;
	private _mouseDownListener: ((event: MouseEvent) => void) | null = null;
	private _mouseUpListener: ((event: MouseEvent) => void) | null = null;

	private _previewManager: FoliagePreviewManager | null = null;
	private _mouseDownPosition: Vector2 = Vector2.Zero();

	private static _lastPickPosition: Vector3 | null = null;
	private static _lastPickedNormal: Vector3 | null = null;
	private static _lastPickedMesh: AbstractMesh | null = null;

	public constructor(props: IEditorFoliageInspectorProps) {
		super(props);

		this.state = {
			assetDragOver: false,
			material: null,
			selectedMeshes: [],
		};
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col gap-2 w-full h-full">
				{this._getMaterialDragAndDropComponent()}

				{this.state.material && (
					<EditorInspectorSectionField title="Foliage Options">
						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="density"
							min={1}
							max={100}
							step={1}
							label="Density"
							tooltip="Number of instances to generate per click"
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="distance"
							step={0.1}
							label="Distance"
							tooltip="Minimum distance between instances"
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="brushRadius"
							step={0.1}
							label="Brush Radius"
							tooltip="Radius of the foliage placement area"
							noUndoRedo
							onChange={() => this._updatePreviewIndicator()}
						/>

						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="randomScalingMin"
							step={0.1}
							label="Min Scale"
							tooltip="Minimum random scaling factor"
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="randomScalingMax"
							step={0.1}
							label="Max Scale"
							tooltip="Maximum random scaling factor"
							noUndoRedo
						/>

						<EditorInspectorNumberField
							object={foliageConfiguration}
							property="scalingFactor"
							step={0.1}
							label="Base Scale"
							tooltip="Base scaling factor for all instances"
							noUndoRedo
						/>
					</EditorInspectorSectionField>
				)}

				{this.state.selectedMeshes.length > 0 && (
					<EditorInspectorSectionField title="Selected Meshes">
						<div className="text-sm text-gray-600">{this.state.selectedMeshes.length} mesh(es) selected for foliage</div>
						<Button onClick={() => this.setState({ selectedMeshes: [] })} variant="outline" size="sm">
							Clear Selection
						</Button>
					</EditorInspectorSectionField>
				)}
			</div>
		);
	}

	public async componentDidMount(): Promise<void> {
		// Initialize preview manager
		this._previewManager = new FoliagePreviewManager(this.props.editor.layout.preview.scene, this.state.material!);

		// Setup mouse event listeners
		this._mouseMoveListener = (ev: MouseEvent) => {
			this._handleMouseMove(ev.offsetX, ev.offsetY);
		};

		this._mouseDownListener = (ev: MouseEvent) => {
			this._handleMouseDown(ev);
		};

		this._mouseUpListener = (ev: MouseEvent) => {
			this._handleMouseUp(ev);
		};

		// Add listeners to preview canvas
		const canvas = this.props.editor.layout.preview.scene.getEngine().getRenderingCanvas();
		if (canvas) {
			canvas.addEventListener("mousemove", this._mouseMoveListener);
			canvas.addEventListener("mousedown", this._mouseDownListener);
			canvas.addEventListener("mouseup", this._mouseUpListener);
		}
	}

	public componentWillUnmount(): void {
		// Remove event listeners
		const canvas = this.props.editor.layout.preview.scene.getEngine().getRenderingCanvas();
		if (canvas) {
			canvas.removeEventListener("mousemove", this._mouseMoveListener!);
			canvas.removeEventListener("mousedown", this._mouseDownListener!);
			canvas.removeEventListener("mouseup", this._mouseUpListener!);
		}

		// Dispose preview manager
		this._previewManager?.dispose();
	}

	private _getMaterialDragAndDropComponent(): ReactNode {
		return (
			<EditorInspectorSectionField title="Foliage Material">
				<div
					className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
						this.state.assetDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
					}`}
					onDragOver={(ev) => {
						ev.preventDefault();
						this.setState({ assetDragOver: true });
					}}
					onDragLeave={() => this.setState({ assetDragOver: false })}
					onDrop={this._handleAssetDropped.bind(this)}
				>
					{this.state.material ? (
						<div className="flex flex-col items-center gap-2">
							<GiMaterialsScience className="w-8 h-8 text-green-600" />
							<span className="text-sm font-medium">Material Loaded</span>
							<Button onClick={() => this._resetToDefaultMaterial()} variant="outline" size="sm">
								Reset to Default
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2">
							<MdOutlineQuestionMark className="w-8 h-8 text-gray-400" />
							<span className="text-sm text-gray-600">Drag & drop material file here</span>
							<span className="text-xs text-gray-500">or use default material</span>
							<Button onClick={() => this._resetToDefaultMaterial()} variant="outline" size="sm">
								Use Default
							</Button>
						</div>
					)}
				</div>
			</EditorInspectorSectionField>
		);
	}

	private async _handleAssetDropped(ev: DragEvent<HTMLDivElement>): Promise<void> {
		ev.preventDefault();
		this.setState({ assetDragOver: false });

		const files = ev.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			const path = file.path;

			try {
				const material = await loadMaterialFromPath(path, this.props.editor.layout.preview.scene);
				if (material) {
					this.setState({ material });
				}
			} catch (error) {
				console.error("Failed to load material:", error);
			}
		}
	}

	private _resetToDefaultMaterial(): void {
		const defaultMaterial = createDefaultGrassMaterial(this.props.editor.layout.preview.scene);
		this.setState({ material: defaultMaterial });
	}

	private _disposePreviewIndicator(): void {
		this._previewManager?.dispose();
	}

	private _handleMouseMove(offsetX: number, offsetY: number): void {
		if (!this.state.material || this.state.selectedMeshes.length === 0) {
			this._disposePreviewIndicator();
			return;
		}

		const scene = this.props.editor.layout.preview.scene;
		const pickResult = scene.pick(offsetX, offsetY);

		if (pickResult && pickResult.pickedMesh) {
			EditorFoliageInspector._lastPickPosition = pickResult.pickedPoint!;
			EditorFoliageInspector._lastPickedNormal = pickResult.getNormal(true, true)!;
			EditorFoliageInspector._lastPickedMesh = pickResult.pickedMesh;

			this._updatePreviewPosition();
		} else {
			this._disposePreviewIndicator();
		}
	}

	private _updatePreviewPosition(): void {
		if (EditorFoliageInspector._lastPickPosition && EditorFoliageInspector._lastPickedNormal && this._previewManager) {
			this._previewManager.updateIndicatorTransform(EditorFoliageInspector._lastPickPosition, EditorFoliageInspector._lastPickedNormal);
		}
	}

	private _createPreviewIndicator(): void {
		if (EditorFoliageInspector._lastPickPosition && EditorFoliageInspector._lastPickedNormal && this._previewManager) {
			this._previewManager.createPreviewIndicator(EditorFoliageInspector._lastPickPosition, EditorFoliageInspector._lastPickedNormal);
		}
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
		if (!this.state.material || this.state.selectedMeshes.length === 0) {
			return;
		}

		const distance = Vector2.Distance(this._mouseDownPosition, new Vector2(event.offsetX, event.offsetY));

		if (distance > 2) {
			return;
		}

		this._handleMouseMove(event.offsetX, event.offsetY);

		const indicatorData = this._previewManager?.getIndicatorData();
		if (indicatorData && EditorFoliageInspector._lastPickPosition && EditorFoliageInspector._lastPickedNormal) {
			// Create foliage instances for each selected mesh
			const scene = this.props.editor.layout.preview.scene;

			this.state.selectedMeshes.forEach((sourceMesh) => {
				// Create instances
				const matrices = createFoliageInstances(sourceMesh, EditorFoliageInspector._lastPickPosition!, EditorFoliageInspector._lastPickedNormal!, scene);

				// Filter by distance
				const filteredMatrices = filterMatricesByDistance(matrices, sourceMesh, foliageConfiguration.distance);

				if (filteredMatrices.length > 0) {
					// Add thin instances to the source mesh
					const existingMatrices = sourceMesh.thinInstanceGetWorldMatrices();
					const allMatrices = [...existingMatrices, ...filteredMatrices];

					// Convert to Float32Array for thin instances
					const matrixArray = new Float32Array(allMatrices.length * 16);
					allMatrices.forEach((matrix, index) => {
						matrix.copyToArray(matrixArray, index * 16);
					});

					// Apply to mesh
					sourceMesh.thinInstanceSetBuffer("matrix", matrixArray, 16, true);
					sourceMesh.thinInstanceRefreshBoundingInfo(true, true, true);

					// Setup metadata
					sourceMesh.metadata = {
						...sourceMesh.metadata,
						foliage: {
							instanceCount: allMatrices.length,
							brushRadius: foliageConfiguration.brushRadius,
							density: foliageConfiguration.density,
							distance: foliageConfiguration.distance,
						},
					};

					// Register undo/redo
					registerUndoRedo({
						executeRedo: false,
						undo: () => {
							sourceMesh.thinInstanceSetBuffer("matrix", new Float32Array(existingMatrices.length * 16), 16, true);
							sourceMesh.thinInstanceRefreshBoundingInfo(true, true, true);
						},
						redo: () => {
							sourceMesh.thinInstanceSetBuffer("matrix", matrixArray, 16, true);
							sourceMesh.thinInstanceRefreshBoundingInfo(true, true, true);
						},
					});
				}
			});

			// Refresh graph
			this.props.editor.layout.graph.refresh();
		}
	}
}
