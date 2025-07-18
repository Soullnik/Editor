import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { WaterMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorInspectorVectorField } from "../fields/vector";
import { EditorMaterialInspectorUtilsComponent } from "./utils";
import { Button } from "../../../../ui/shadcn/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../ui/shadcn/ui/dropdown-menu";
import { IoAddSharp, IoCloseOutline } from "react-icons/io5";

export interface IEditorWaterMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: WaterMaterial;
}

export class EditorWaterMaterialInspector extends Component<IEditorWaterMaterialInspectorProps> {
	public render(): ReactNode {
		const { material } = this.props;
		const scene = material.getScene();
		const renderList = material.getRenderList() || [];
		
		return (
			<>
				<EditorInspectorSectionField title="Material" label={material.getClassName()}>
					<EditorInspectorStringField label="Name" object={material} property="name" />
					<EditorInspectorSwitchField label="Back Face Culling" object={material} property="backFaceCulling" />
					<EditorMaterialInspectorUtilsComponent
						mesh={this.props.mesh}
						material={this.props.material}
					/>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Water">
					<EditorInspectorColorField label="Diffuse Color" object={material} property="diffuseColor" />
					<EditorInspectorColorField label="Specular Color" object={material} property="specularColor" />
					<EditorInspectorNumberField label="Specular Power" object={material} property="specularPower" min={0} step={1} />
					<EditorInspectorTextureField object={material} title="Bump Texture" property="bumpTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorNumberField label="Wind Force" object={material} property="windForce" min={0} step={0.01} />
					<EditorInspectorVectorField label="Wind Direction" object={material} property="windDirection" />
					<EditorInspectorNumberField label="Wave Height" object={material} property="waveHeight" min={0} step={0.01} />
					<EditorInspectorNumberField label="Bump Height" object={material} property="bumpHeight" min={0} step={0.01} />
					<EditorInspectorSwitchField label="Bump Superimpose" object={material} property="bumpSuperimpose" />
					<EditorInspectorSwitchField label="Fresnel Separate" object={material} property="fresnelSeparate" />
					<EditorInspectorSwitchField label="Bump Affects Reflection" object={material} property="bumpAffectsReflection" />
					<EditorInspectorColorField label="Water Color" object={material} property="waterColor" />
					<EditorInspectorNumberField label="Color Blend Factor" object={material} property="colorBlendFactor" min={0} max={1} step={0.01} />
					<EditorInspectorColorField label="Water Color 2" object={material} property="waterColor2" />
					<EditorInspectorNumberField label="Color Blend Factor 2" object={material} property="colorBlendFactor2" min={0} max={1} step={0.01} />
					<EditorInspectorNumberField label="Wave Length" object={material} property="waveLength" min={0} step={0.01} />
					<EditorInspectorNumberField label="Wave Speed" object={material} property="waveSpeed" min={0} step={0.01} />
					<EditorInspectorNumberField label="Wave Count" object={material} property="waveCount" min={1} step={1} />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
					<EditorInspectorSwitchField label="Use World Coordinates For Wave Deformation" object={material} property="useWorldCoordinatesForWaveDeformation" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Render List">
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<span className="text-sm text-white/70">Objects in reflection/refraction:</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="w-8 h-8 !rounded-lg p-0.5">
										<IoAddSharp className="w-4 h-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{scene.meshes
										.filter(mesh => mesh !== this.props.mesh && !renderList.includes(mesh))
										.map((mesh) => (
											<DropdownMenuItem key={mesh.id} onClick={() => this._handleAddToRenderList(mesh)}>
												{mesh.name || mesh.id}
											</DropdownMenuItem>
										))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						
						{renderList.length === 0 ? (
							<div className="text-sm text-white/50 italic">No objects in render list</div>
						) : (
							<div className="flex flex-col gap-1">
								{renderList.map((mesh) => (
									<div key={mesh.id} className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
										<span className="text-sm">{mesh.name || mesh.id}</span>
										<Button 
											variant="ghost" 
											size="sm" 
											className="w-6 h-6 !rounded p-0 hover:bg-destructive/20"
											onClick={() => this._handleRemoveFromRenderList(mesh)}
										>
											<IoCloseOutline className="w-3 h-3" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</EditorInspectorSectionField>
			</>
		);
	}

	private _handleAddToRenderList(mesh: AbstractMesh): void {
		this.props.material.addToRenderList(mesh);
		this.forceUpdate();
	}

	private _handleRemoveFromRenderList(mesh: AbstractMesh): void {
		this.props.material.removeFromRenderList(mesh);
		this.forceUpdate();
	}
} 
