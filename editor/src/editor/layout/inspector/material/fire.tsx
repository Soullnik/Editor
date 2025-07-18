import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { FireMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorFireMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: FireMaterial;
}

export class EditorFireMaterialInspector extends Component<IEditorFireMaterialInspectorProps> {
	public render(): ReactNode {
		const { material } = this.props;
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

				<EditorInspectorSectionField title="Fire">
					<EditorInspectorColorField label="Diffuse" object={material} property="diffuseColor" />
					<EditorInspectorTextureField object={material} title="Diffuse Texture" property="diffuseTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Distortion Texture" property="distortionTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Opacity Texture" property="opacityTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorNumberField label="Speed" object={material} property="speed" min={0} step={0.01} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
