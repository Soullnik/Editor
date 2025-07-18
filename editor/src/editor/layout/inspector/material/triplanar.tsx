import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { TriPlanarMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorTriPlanarMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: TriPlanarMaterial;
}

export class EditorTriPlanarMaterialInspector extends Component<IEditorTriPlanarMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="TriPlanar">
					<EditorInspectorColorField label="Diffuse Color" object={material} property="diffuseColor" />
					<EditorInspectorColorField label="Specular Color" object={material} property="specularColor" />
					<EditorInspectorNumberField label="Specular Power" object={material} property="specularPower" min={0} step={1} />
					<EditorInspectorNumberField label="Tile Size" object={material} property="tileSize" min={0.01} step={0.01} />
					<EditorInspectorTextureField object={material} title="Mix Texture" property="mixTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture X" property="diffuseTextureX" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture Y" property="diffuseTextureY" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Diffuse Texture Z" property="diffuseTextureZ" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Normal Texture X" property="normalTextureX" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Normal Texture Y" property="normalTextureY" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Normal Texture Z" property="normalTextureZ" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
