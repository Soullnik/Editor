import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { TerrainMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorTerrainMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: TerrainMaterial;
}

export class EditorTerrainMaterialInspector extends Component<IEditorTerrainMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="Terrain">
					<EditorInspectorColorField label="Diffuse Color" object={material} property="diffuseColor" />
					<EditorInspectorColorField label="Specular Color" object={material} property="specularColor" />
					<EditorInspectorNumberField label="Specular Power" object={material} property="specularPower" min={0} step={1} />
					<EditorInspectorTextureField object={material} title="Mix Texture" property="mixTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture 1" property="diffuseTexture1" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture 2" property="diffuseTexture2" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture 3" property="diffuseTexture3" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Bump Texture 1" property="bumpTexture1" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Bump Texture 2" property="bumpTexture2" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Bump Texture 3" property="bumpTexture3" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
