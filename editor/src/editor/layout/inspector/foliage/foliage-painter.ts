import { Mesh, PointerInfo, PointerEventTypes, Matrix, Vector3, Quaternion, AbstractMesh, Epsilon, PickingInfo, TransformNode, Scalar, Ray, GroundMesh, Nullable } from "babylonjs";

import { Editor } from "../../../main";

import { registerUndoRedo } from "../../../../tools/undoredo";

import { foliageConfiguration } from "./configuration";

/**
 * Defines the possible types for the painting tool.
 * - `add`: allows to add/remove painted thin instances.
 * - `scale`: allows to rescale existing thin instances.
 */
export type FoliageToolType = "add" | "scale";

const vectorTen = new Vector3(10, 10, 10);
const meshScale = Vector3.Zero();
const absoluteNormal = Vector3.Up();
const absolutePosition = Vector3.Zero();
const targetScaling = Vector3.Zero();
const targetPosition = Vector3.Zero();
const targetRotation = Quaternion.Identity();
const scaling = Vector3.Zero();
const position = Vector3.Zero();
const rotation = Quaternion.Identity();
const translation = Vector3.Zero();
const targetScaledPosition = Vector3.Zero();

export class FoliagePainter {
	/**
	 * Defines the count of meshes added as thin instances.
	 */
	public density: number = foliageConfiguration.density;
	/**
	 * Defines the minimum distance the painted thin instance should be compared to all other
	 * of the current list of active meshes.
	 */
	public distance: number = foliageConfiguration.distance;

	/**
	 * Defines wether or not painting is done maintaining the mouse pointer down.
	 */
	public holdToPaint: boolean = foliageConfiguration.holdToPaint;

	/**
	 * Defines the reference to the vector applied for the random scaling
	 * as minumum values for X, Y and Z.
	 */
	public randomScalingMin: number = foliageConfiguration.randomScalingMin;
	/**
	 * Defines the reference to the vector applied for the random scaling
	 * as maximum values for X, Y and Z.
	 */
	public randomScalingMax: number = foliageConfiguration.randomScalingMax;

	/**
	 * Defines the scaling factor applied on added thin instances.
	 * @default Vector3.One()
	 */
	public scalingFactor: Vector3 = Vector3.One().scale(foliageConfiguration.scalingFactor);

	/**
	 * Defines the reference to the vector applied for the random rotation
	 * as minimum values for X, Y and Z.
	 */
	public randomRotationMin: Vector3 = Vector3.FromArray(foliageConfiguration.randomRotationMin);
	/**
	 * Defines the reference to the vector applied for the random rotation
	 * as maximum values for X, Y and Z.
	 */
	public randomRotationMax: Vector3 = Vector3.FromArray(foliageConfiguration.randomRotationMax);

	/**
	 * Defines the type of tool used when painting thin instances.
	 * - `add`: allows to add/remove painted thin instances.
	 * - `scale`: allows to rescale existing thin instances.
	 */
	public toolType: FoliageToolType = foliageConfiguration.toolType;

	/**
	 * Defines the vector applied on the scale of the existing thin instances in the radius of
	 * the tool in case the tool type is equal to `scale`.
	 */
	public rescaleValue: Vector3 = new Vector3(foliageConfiguration.rescaleValue, foliageConfiguration.rescaleValue, foliageConfiguration.rescaleValue);

	/** @hidden */
	public _selectedMeshes: Mesh[] = [];

	private _targetMesh: Nullable<AbstractMesh> = null;
	private _lastRenderId: number = -1;
	private _removing: boolean = false;
	private _isPointerDown: boolean = false;
	private _pick: Nullable<PickingInfo> = null;
	private _rotationMatrix = Matrix.Identity();
	private _size: number = foliageConfiguration.brushRadius;
	private _tempTransformNode: TransformNode;
	private _editedWorldMatrices: Matrix[] = [];
	private _existingWorldMatrices: Map<Mesh, Matrix[]> = new Map<Mesh, Matrix[]>();

	/**
	 * Constructor.
	 * @param editor the editor reference.
	 */
	public constructor(private _editor: Editor) {
		this._tempTransformNode = new TransformNode("foliage-transform-node", this._editor.layout.preview.scene);
	}

	/**
	 * Gets the minimum distance that should be checked between existing thin instances to
	 * determine if the current instance can be painted or not.
	 */
	public get size(): number {
		return this._size;
	}

	/**
	 * Sets the minimum distance that should be checked between existing thin instances to
	 * determine if the current instance can be painted or not.
	 */
	public set size(distance: number) {
		this._size = distance;
	}

	/**
	 * Disposes the painting tool.
	 */
	public dispose(): void {
		this._tempTransformNode.dispose();
	}

	/**
	 * This function is called on a pointer event is trigerred on the main scene in the editor.
	 * @param info defines the reference to the pointer event informations.
	 */
	public onPointerEvent(info: PointerInfo): void {
		switch (info.type) {
			case PointerEventTypes.POINTERDOWN:
				return this._handlePointerDown(info);
			case PointerEventTypes.POINTERMOVE:
				return this._handlePointerMove();
			case PointerEventTypes.POINTERWHEEL:
				return this._handlePointerWheel(info);
			case PointerEventTypes.POINTERUP:
				return this._handlePointerUp();
		}
	}

	/**
	 * Called on the Control key (or Command key) is released. This is the where
	 * the painting tool should be removed here.
	 */
	public onControlKeyReleased(): void {
		this._isPointerDown = false;
		this._selectedMeshes.forEach((m) => (m.isPickable = true));
		this._targetMesh = null;
	}

	/**
	 * Sets the list of all active meshes.
	 * @param meshes defines the list of meshes to create thin instances.
	 */
	public setMeshes(meshes: Mesh[]): void {
		this._selectedMeshes.forEach((m) => (m.isPickable = true));
		this._selectedMeshes = meshes;

		this._existingWorldMatrices.clear();
		this._selectedMeshes.forEach((m) => {
			if (m.metadata?.thinInstanceCount) {
				m.thinInstanceCount = m.metadata.thinInstanceCount;
				delete m.metadata.thinInstanceCount;
			}

			this._existingWorldMatrices.set(m, m.thinInstanceGetWorldMatrices());
		});

		this._editor.layout.graph.refresh();
	}

	/**
	 * Called on the pointer is down.
	 */
	private _handlePointerDown(info: PointerInfo): void {
		this._isPointerDown = true;
		this._removing = info.event.button === 2;

		this._selectedMeshes.forEach((m) => {
			if (m.metadata?.thinInstanceCount) {
				m.thinInstanceCount = m.metadata.thinInstanceCount;
				delete m.metadata.thinInstanceCount;
			}
		});
	}

	/**
	 * Called on the pointer moves and painting tool is enabled.
	 */
	private _handlePointerMove(): void {
		const renderId = this._editor.layout.preview.scene.getRenderId();
		if (renderId === this._lastRenderId) {
			return;
		}

		this._lastRenderId = renderId;
		this._selectedMeshes.forEach((m) => (m.isPickable = false));

		if (this._selectedMeshes.length) {
			const x = this._editor.layout.preview.scene.pointerX;
			const y = this._editor.layout.preview.scene.pointerY;

			if (this._isPointerDown && this._targetMesh) {
				this._pick = this._editor.layout.preview.scene.pick(x, y, (m) => m === this._targetMesh, false, this._editor.layout.preview.scene.activeCamera);
			} else {
				this._pick = this._editor.layout.preview.scene.pick(x, y, undefined, false, this._editor.layout.preview.scene.activeCamera);
			}

			if (this._pick) {
				if (this._pick.pickedMesh) {
					this._targetMesh ??= this._pick.pickedMesh;
					if (this._isPointerDown && this._pick.pickedMesh !== this._targetMesh) {
						return;
					}
				}

				if (this._isPointerDown && this.holdToPaint) {
					this._paint();
				}
			}
		}
	}

	/**
	 * Called on the pointer wheel is moving and tool is enabled.
	 */
	private _handlePointerWheel(info: PointerInfo): void {
		const event = info.event as WheelEvent;
		const delta = event.deltaY * -0.001;

		const distance = Math.max(Epsilon, this._size + delta);
		this.size = distance;
		this._handlePointerMove();
	}

	/**
	 * Called on the pointer is up and painting tool is enabled.
	 */
	private _handlePointerUp(): void {
		this._isPointerDown = false;

		if (!this.holdToPaint && this._pick?.pickedPoint && this._pick.pickedMesh) {
			this._paint();
		}

		this._onPaintEnd();
	}

	/**
	 * Paints the thin instance at the current position of the cloned mesh.
	 */
	private _paint(): void {
		if (this.toolType === "add") {
			return this._addOrRemove();
		}

		if (this.toolType === "scale") {
			return this._rescale();
		}
	}

	/**
	 * Rescales the thin instances. Called on the tool type is equal to `scale`.
	 */
	private _rescale(): void {
		const radius = this._size * 0.5;

		this._selectedMeshes.forEach((m) => {
			if (!m.thinInstanceCount) {
				return;
			}

			const targetMatrix = this._getFinalMatrix(m, this._pick!.pickedPoint!, Vector3.Up());
			targetMatrix.decompose(targetScaling, targetRotation, targetPosition);

			const matrices = this._existingWorldMatrices.get(m)!;

			for (let i = 0, len = matrices.length; i < len; ++i) {
				const matrix = matrices[i];

				matrix.getTranslationToRef(translation);
				targetScaledPosition.copyFrom(targetPosition);

				if (Vector3.Distance(targetScaledPosition.multiplyInPlace(m.scaling), translation.multiplyInPlace(m.scaling)) < radius) {
					matrix.decompose(scaling, rotation, position);

					if (this._removing) {
						scaling.subtractInPlace(this.rescaleValue);
					} else {
						scaling.addInPlace(this.rescaleValue);
					}

					Matrix.ComposeToRef(scaling, rotation, position, matrix);
				}
			}

			this._configureMeshMatrices(m, matrices);
		});
	}

	/**
	 * Called when the user tries to add or removes instances.
	 * Called on the tool type is equal to `add`.
	 */
	private _addOrRemove(): void {
		// Remove
		if (this._removing) {
			return this._selectedMeshes.forEach((m) => {
				this._remove(m, this._pick!.pickedPoint!);
			});
		}

		// Add
		const randomPoint = Vector3.Zero();
		const map = new Map<Mesh, Matrix[]>();
		const center = this._pick!.pickedPoint!.clone();

		for (let d = 0; d < this.density; ++d) {
			randomPoint.set(
				Scalar.RandomRange(center.x - this._size * 0.5, center.x + this._size * 0.5),
				center.y,
				Scalar.RandomRange(center.z - this._size * 0.5, center.z + this._size * 0.5)
			);

			this._add(randomPoint, map);
		}

		map.forEach((matrices, mesh) => {
			this._editedWorldMatrices.push.apply(this._editedWorldMatrices, matrices);

			const m = this._existingWorldMatrices.get(mesh)!;
			m.push.apply(m, matrices);

			this._configureMeshMatrices(mesh, m);
		});
	}

	/**
	 * Adds a thin instance at the given position.
	 */
	private _add(center: Vector3, map: Map<Mesh, Matrix[]>): unknown {
		const mesh = this._selectedMeshes[(this._selectedMeshes.length * Math.random()) >> 0];

		// Random pick
		if (this._targetMesh!.getClassName() === "GroundMesh") {
			const ground = this._targetMesh as GroundMesh;
			ground._maxX = ground._width * 0.5;
			ground._maxZ = ground._height * 0.5;

			absoluteNormal.copyFrom(ground.getNormalAtCoordinates(center.x, center.z));
			absolutePosition.set(center.x, ground.getHeightAtCoordinates(center.x, center.z), center.z);
		} else {
			const ray = Ray.CreateNewFromTo(this._editor.layout.preview.scene.activeCamera!.globalPosition, center);
			ray.direction.multiplyInPlace(vectorTen);

			this._pick = this._editor.layout.preview.scene.pickWithRay(ray, (m) => m === this._targetMesh, false);
			if (!this._pick?.pickedPoint) {
				return;
			}

			absolutePosition.copyFrom(this._pick!.pickedPoint);

			// Absolute normal
			const normal = this._pick.getNormal(true, true);
			if (!normal) {
				return;
			}

			absoluteNormal.copyFrom(normal);
		}

		if (!map.get(mesh)) {
			map.set(mesh, []);
		}

		const existingWorldMatrices = this._existingWorldMatrices.get(mesh)!;

		if (!mesh.thinInstanceCount) {
			mesh.setAbsolutePosition(absolutePosition);
			mesh.thinInstanceAddSelf(false);

			const matrix = mesh.thinInstanceGetWorldMatrices()[0];

			existingWorldMatrices.push(matrix);
			return map.get(mesh)!.push(matrix);
		}

		// Compose matrix
		const targetMatrix = this._getFinalMatrix(mesh, absolutePosition, absoluteNormal);
		targetMatrix.decompose(targetScaling, targetRotation, targetPosition);

		// Search in existing meshes
		const found = this._selectedMeshes.find((m) => {
			const matrices = this._existingWorldMatrices.get(m)!;

			for (let len = matrices.length, i = len - 1; i >= 0; --i) {
				const matrix = matrices[i];

				matrix.getTranslationToRef(translation);
				targetScaledPosition.copyFrom(targetPosition);

				if (Vector3.Distance(targetScaledPosition.multiplyInPlace(mesh.scaling), translation.multiplyInPlace(mesh.scaling)) < this.distance) {
					return m;
				}
			}

			return null;
		});

		if (found) {
			return;
		}

		map.get(mesh)!.push(targetMatrix);
		existingWorldMatrices.push(targetMatrix);
	}

	/**
	 * Called on the user wants to remove existing thin instances.
	 */
	private _remove(mesh: Mesh, absolutePosition: Vector3): void {
		const targetMatrix = this._getFinalMatrix(mesh, absolutePosition, Vector3.Up());
		targetMatrix.decompose(targetScaling, targetRotation, targetPosition);

		const radius = this._size * 0.5;

		this._selectedMeshes.forEach((m) => {
			if (!m.thinInstanceCount) {
				return;
			}

			const matrices = this._existingWorldMatrices.get(m)!;

			for (let i = 0, len = matrices.length; i < len; ++i) {
				const matrix = matrices[i];

				matrix.getTranslationToRef(translation);
				targetScaledPosition.copyFrom(targetPosition);

				if (Vector3.Distance(targetScaledPosition.multiplyInPlace(mesh.scaling), translation.multiplyInPlace(mesh.scaling)) < radius) {
					matrices.splice(i, 1);
					this._editedWorldMatrices.push(matrices[i]);

					--i;
					--len;
				}
			}

			this._configureMeshMatrices(m, matrices);
		});
	}

	private _getFinalMatrix(mesh: Mesh, absolutePosition: Vector3, absoluteNormal: Vector3): Matrix {
		this._tempTransformNode.lookAt(absoluteNormal, 0, Math.PI * 0.5, 0);
		this._tempTransformNode.computeWorldMatrix(true);

		const sourceAbsolutePosition = mesh.getAbsolutePosition();
		const sourceAbsoluteRotation = mesh.absoluteRotationQuaternion;

		const absoluteRotation = this._tempTransformNode.absoluteRotationQuaternion;

		// Rotation
		const randomRotation = Quaternion.FromEulerAngles(
			Math.random() * (this.randomRotationMax.x - this.randomRotationMin.x + this.randomRotationMin.x),
			Math.random() * (this.randomRotationMax.y - this.randomRotationMin.y + this.randomRotationMin.y),
			Math.random() * (this.randomRotationMax.z - this.randomRotationMin.z + this.randomRotationMin.z)
		);

		const rotation = Quaternion.Inverse(sourceAbsoluteRotation).multiply(absoluteRotation).multiply(randomRotation);

		sourceAbsoluteRotation.toRotationMatrix(this._rotationMatrix);

		mesh.getWorldMatrix().decompose(meshScale);

		// Translation
		const translation = absolutePosition.subtract(sourceAbsolutePosition).divide(meshScale);
		const transformedTranslation = Vector3.TransformCoordinates(translation, this._rotationMatrix.invert());

		// Scaling
		const randomScalingValue = Math.random() * (this.randomScalingMax - this.randomScalingMin) + this.randomScalingMin;

		const randomScaling = meshScale
			.add(new Vector3(randomScalingValue * mesh.scaling.x, randomScalingValue * mesh.scaling.y, randomScalingValue * mesh.scaling.z))
			.multiplyInPlace(this.scalingFactor);

		const scaling = randomScaling.divide(meshScale);

		return Matrix.Compose(scaling, rotation, transformedTranslation);
	}

	/**
	 * Called on the user stopped painting.
	 */
	private _onPaintEnd(): void {
		if (!this._editedWorldMatrices.length) {
			return;
		}

		const removed = this._removing;
		const selectedMeshes = this._selectedMeshes.slice(0);
		const editedWorldMatrices = this._editedWorldMatrices.slice(0);
		const worldMatrices = selectedMeshes.map((sm) => sm.thinInstanceGetWorldMatrices().slice(0));

		registerUndoRedo({
			executeRedo: false,
			undo: () => {
				selectedMeshes.forEach((sm, i) => {
					const matrices = !removed ? worldMatrices[i].slice(0) : worldMatrices[i].concat(editedWorldMatrices);

					if (!removed) {
						editedWorldMatrices.forEach((m) => {
							const index = matrices.findIndex((m2) => m.equals(m2));
							if (index !== -1) {
								matrices.splice(index, 1);
							}
						});
					}

					const array = this._getArrayFromMatrices(matrices);

					sm.thinInstanceSetBuffer("matrix", array);
					sm.getLODLevels().forEach((lod) => {
						lod.mesh?.thinInstanceSetBuffer("matrix", array);
					});
				});
			},
			redo: () => {
				selectedMeshes.forEach((sm, i) => {
					const array = this._getArrayFromMatrices(worldMatrices[i]);

					sm.thinInstanceSetBuffer("matrix", array);
					sm.getLODLevels().forEach((lod) => {
						lod.mesh?.thinInstanceSetBuffer("matrix", array);
					});
				});
			},
		});

		this._editedWorldMatrices.splice(0);
	}

	/**
	 * Transforms the given matrices array to a float32 array.
	 */
	private _getArrayFromMatrices(matrices: Matrix[]): Nullable<Float32Array> {
		if (!matrices.length) {
			return null;
		}

		const array = new Float32Array(matrices.length * 16);
		matrices.forEach((m, i) => m.copyToArray(array, i * 16));

		return array;
	}

	private _configureMeshMatrices(mesh: Mesh, matrices: Matrix[]): void {
		const array = this._getArrayFromMatrices(matrices);
		mesh.thinInstanceSetBuffer("matrix", array, 16, true);
	}
}
