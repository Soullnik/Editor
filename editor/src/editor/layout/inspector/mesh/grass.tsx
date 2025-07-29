import { Component, ReactNode } from "react";
import { AbstractMesh, Mesh } from "babylonjs";

import { Button } from "../../../../ui/shadcn/ui/button";
import { Separator } from "../../../../ui/shadcn/ui/separator";

import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorTextureField } from "../fields/texture";

import { IEditorInspectorImplementationProps } from "../inspector";
import { Grass } from "../../../../tools/grass";
import { GrassShape } from "../../../../tools/grass/grass";
import { Tools } from "babylonjs";
import { UniqueNumber } from "../../../../tools/tools";
import { isPlane, isGrass } from "../../../../tools/guards/nodes";

interface IGrassInspectorState {
	grassInstance: Grass | null;
	isGrassGenerated: boolean;
	bladeCount: number;
	bladeWidth: number;
	bladeHeight: number;
	bladeHeightVariation: number;
	tipBendStrength: number;
	windStrength: number;
	windSpeed: number;
	contrast: number;
	brightness: number;
	opacity: number;
	grassTexture: any; // For texture field
}

export class EditorGrassInspector extends Component<IEditorInspectorImplementationProps<AbstractMesh>, IGrassInspectorState> {
	public static IsSupported(object: unknown): boolean {
		// Support both plane meshes and grass meshes
		return isPlane(object) || isGrass(object);
	}

	public constructor(props: IEditorInspectorImplementationProps<AbstractMesh>) {
		super(props);

		this.state = {
			grassInstance: null,
			isGrassGenerated: false,
			bladeCount: 10000,
			bladeWidth: 0.1,
			bladeHeight: 0.8,
			bladeHeightVariation: 0.6,
			tipBendStrength: 0.1,
			windStrength: 0.3,
			windSpeed: 500.0,
			contrast: 1.0,
			brightness: 0.0,
			opacity: 1.0,
			grassTexture: null,
		};

		// If this is already a grass mesh, initialize with its data
		if (isGrass(this.props.object)) {
			this._initializeFromGrassMesh();
		}
	}

	public render(): ReactNode {
		const isGrassMesh = isGrass(this.props.object);

		return (
			<EditorInspectorSectionField title={isGrassMesh ? "Grass Properties" : "Grass System"}>
				{!isGrassMesh ? (
					// Plane mesh - show generation interface
					<div className="flex flex-col gap-4">
						<div className="text-sm text-white/70 mb-2">
							Configure grass parameters and generate grass on this plane mesh.
						</div>
						
						{/* Grass Geometry */}
						<div className="space-y-2">
							<div className="text-sm font-medium">Geometry</div>
							<EditorInspectorNumberField
								label="Blade Count"
								object={this.state}
								property="bladeCount"
								min={100}
								max={1000000}
								step={100}
							/>
							<EditorInspectorNumberField
								label="Blade Width"
								object={this.state}
								property="bladeWidth"
								min={0.01}
								max={1.0}
								step={0.01}
							/>
							<EditorInspectorNumberField
								label="Blade Height"
								object={this.state}
								property="bladeHeight"
								min={0.1}
								max={5.0}
								step={0.1}
							/>
							<EditorInspectorNumberField
								label="Height Variation"
								object={this.state}
								property="bladeHeightVariation"
								min={0.0}
								max={2.0}
								step={0.1}
							/>
							<EditorInspectorNumberField
								label="Tip Bend Strength"
								object={this.state}
								property="tipBendStrength"
								min={0.0}
								max={1.0}
								step={0.01}
							/>
						</div>

						<Separator />

						{/* Wind Animation */}
						<div className="space-y-2">
							<div className="text-sm font-medium">Wind Animation</div>
							<EditorInspectorNumberField
								label="Wind Strength"
								object={this.state}
								property="windStrength"
								min={0.0}
								max={2.0}
								step={0.1}
							/>
							<EditorInspectorNumberField
								label="Wind Speed"
								object={this.state}
								property="windSpeed"
								min={10.0}
								max={2000.0}
								step={10.0}
							/>
						</div>

						<Separator />

						{/* Visual Parameters */}
						<div className="space-y-2">
							<div className="text-sm font-medium">Visual</div>
							<EditorInspectorNumberField
								label="Contrast"
								object={this.state}
								property="contrast"
								min={0.1}
								max={3.0}
								step={0.1}
							/>
							<EditorInspectorNumberField
								label="Brightness"
								object={this.state}
								property="brightness"
								min={-1.0}
								max={1.0}
								step={0.1}
							/>
							<EditorInspectorNumberField
								label="Opacity"
								object={this.state}
								property="opacity"
								min={0.0}
								max={1.0}
								step={0.1}
							/>
							<EditorInspectorTextureField
								title="Grass Texture"
								object={this.state}
								property="grassTexture"
								onChange={() => this.forceUpdate()}
							/>
						</div>

						<Separator />

						<Button 
							variant="default" 
							onClick={() => this._generateGrass()}
							className="w-full"
						>
							Generate Grass
						</Button>
					</div>
				) : (
					// Grass mesh - show runtime properties
					<div className="flex flex-col gap-4">
						<div className="flex gap-2">
							<Button 
								variant="destructive" 
								onClick={() => this._removeGrass()}
								className="w-full"
							>
								Remove Grass
							</Button>
						</div>

						<Separator />

						{/* Runtime Parameters */}
						<div className="space-y-2">
							<div className="text-sm font-medium">Wind Animation</div>
							<EditorInspectorNumberField
								label="Wind Strength"
								object={this.state}
								property="windStrength"
								min={0.0}
								max={2.0}
								step={0.1}
								onChange={() => this._updateWindParameters()}
							/>
							<EditorInspectorNumberField
								label="Wind Speed"
								object={this.state}
								property="windSpeed"
								min={10.0}
								max={2000.0}
								step={10.0}
								onChange={() => this._updateWindParameters()}
							/>
						</div>

						<Separator />

						<div className="space-y-2">
							<div className="text-sm font-medium">Visual Properties</div>
							<EditorInspectorNumberField
								label="Contrast"
								object={this.state}
								property="contrast"
								min={0.1}
								max={3.0}
								step={0.1}
								onChange={() => this._updateVisualParameters()}
							/>
							<EditorInspectorNumberField
								label="Brightness"
								object={this.state}
								property="brightness"
								min={-1.0}
								max={1.0}
								step={0.1}
								onChange={() => this._updateVisualParameters()}
							/>
							<EditorInspectorNumberField
								label="Opacity"
								object={this.state}
								property="opacity"
								min={0.0}
								max={1.0}
								step={0.1}
								onChange={() => this._updateVisualParameters()}
							/>
							<EditorInspectorTextureField
								title="Grass Texture"
								object={this.state}
								property="grassTexture"
								onChange={() => this._updateTexture()}
							/>
						</div>
					</div>
				)}
			</EditorInspectorSectionField>
		);
	}

	private _initializeFromGrassMesh(): void {
		const grassMesh = this.props.object as Mesh;
		const metadata = grassMesh.metadata;
		
		if (metadata) {
			this.setState({
				bladeCount: metadata.bladeCount || 10000,
				windStrength: metadata.windStrength || 0.3,
				windSpeed: metadata.windSpeed || 500.0,
				contrast: metadata.contrast || 1.0,
				brightness: metadata.brightness || 0.0,
				opacity: metadata.opacity || 1.0,
				grassTexture: null, // Will be set from material if available
			});
		}
	}

	private _generateGrass(): void {
		const mesh = this.props.object as Mesh;
		
		// Get mesh bounds for grass distribution
		const boundingInfo = mesh.getBoundingInfo();
		const size = Math.max(boundingInfo.boundingBox.maximumWorld.x - boundingInfo.boundingBox.minimumWorld.x,
							 boundingInfo.boundingBox.maximumWorld.z - boundingInfo.boundingBox.minimumWorld.z);
		
		const grass = new Grass(this.props.editor.layout.preview.scene, {
			planeSize: size,
			planeWidth: size,
			planeHeight: size,
			shape: 'square',
			bladeCount: this.state.bladeCount,
			bladeWidth: this.state.bladeWidth,
			bladeHeight: this.state.bladeHeight,
			bladeHeightVariation: this.state.bladeHeightVariation,
			tipBendStrength: this.state.tipBendStrength,
			windStrength: this.state.windStrength,
			windSpeed: this.state.windSpeed,
			materialOptions: {
				contrast: this.state.contrast,
				brightness: this.state.brightness,
				opacity: this.state.opacity,
				textureUrl: this.state.grassTexture || undefined,
			}
		});

		const grassMesh = grass.getMesh();
		
		// Set unique ID and metadata
		grassMesh.id = Tools.RandomId();
		grassMesh.uniqueId = UniqueNumber.Get();
		grassMesh.name = `${mesh.name}_Grass`;
		grassMesh.metadata = {
			type: "Grass",
			originalMeshId: mesh.id,
			bladeCount: this.state.bladeCount,
			planeSize: size,
			planeWidth: size,
			planeHeight: size,
			shape: 'square',
			tipBendStrength: this.state.tipBendStrength,
		};
		
		// Position grass at mesh position
		grassMesh.position = mesh.position.clone();
		grassMesh.rotation = mesh.rotation.clone();
		grassMesh.scaling = mesh.scaling.clone();
		grassMesh.parent = mesh.parent;
		
		// Hide original mesh
		mesh.isVisible = false;
		
		// Update state
		this.setState({
			grassInstance: grass,
			isGrassGenerated: true
		});
		
		// Update editor
		this.props.editor.layout.graph.refresh().then(() => {
			this.props.editor.layout.graph.setSelectedNode(grassMesh);
		});
		this.props.editor.layout.inspector.setEditedObject(grassMesh);
		this.props.editor.layout.preview.gizmo.setAttachedNode(grassMesh);
	}

	private _regenerateGrass(): void {
		if (this.state.grassInstance) {
			this.state.grassInstance.dispose();
		}
		this._generateGrass();
	}

	private _removeGrass(): void {
		if (isGrass(this.props.object)) {
			// For grass meshes, we need to find and show the original plane
			const grassMesh = this.props.object as Mesh;
			const metadata = grassMesh.metadata;
			
			if (metadata?.originalMeshId) {
				// Find original mesh in scene
				const originalMesh = this.props.editor.layout.preview.scene.getMeshByID(metadata.originalMeshId);
				if (originalMesh) {
					originalMesh.isVisible = true;
					
					// Dispose grass mesh
					grassMesh.dispose();
					
					// Update editor to show original mesh
					this.props.editor.layout.graph.refresh();
					this.props.editor.layout.inspector.setEditedObject(originalMesh);
					this.props.editor.layout.preview.gizmo.setAttachedNode(originalMesh);
					return;
				}
			}
			
			// If we can't find original mesh, just dispose the grass
			grassMesh.dispose();
			this.props.editor.layout.graph.refresh();
		} else {
			// For plane meshes with generated grass
			if (this.state.grassInstance) {
				this.state.grassInstance.dispose();
			}
			
			// Show original mesh
			this.props.object.isVisible = true;
			
			this.setState({
				grassInstance: null,
				isGrassGenerated: false
			});
			
			// Update editor
			this.props.editor.layout.graph.refresh();
			this.props.editor.layout.inspector.setEditedObject(this.props.object);
			this.props.editor.layout.preview.gizmo.setAttachedNode(this.props.object);
		}
	}

	private _updateWindParameters(): void {
		if (isGrass(this.props.object)) {
			// For grass meshes, we need to find the grass instance
			const grassMesh = this.props.object as Mesh;
			// TODO: Implement grass instance retrieval from mesh
			// For now, we'll need to store grass instance reference
		} else if (this.state.grassInstance) {
			this.state.grassInstance.setWindParameters(this.state.windStrength, this.state.windSpeed);
		}
	}

	private _updateVisualParameters(): void {
		if (isGrass(this.props.object)) {
			// For grass meshes, we need to find the grass instance
			const grassMesh = this.props.object as Mesh;
			// TODO: Implement grass instance retrieval from mesh
		} else if (this.state.grassInstance) {
			this.state.grassInstance.setVisualParameters(this.state.contrast, this.state.brightness, this.state.opacity);
		}
	}

	private _updateTexture(): void {
		if (isGrass(this.props.object)) {
			// For grass meshes, we need to find the grass instance
			const grassMesh = this.props.object as Mesh;
			// TODO: Implement grass instance retrieval from mesh
		} else if (this.state.grassInstance && this.state.grassTexture) {
			this.state.grassInstance.setTextureUrl(this.state.grassTexture);
		}
	}
}
