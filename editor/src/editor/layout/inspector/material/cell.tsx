import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { CellMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorCellMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: CellMaterial;
}

export class EditorCellMaterialInspector extends Component<IEditorCellMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="Cell">
					<EditorInspectorColorField label={<div className="w-14">Diffuse</div>} object={material} property="diffuseColor" />
					<EditorInspectorTextureField object={material} title="Diffuse Texture" property="diffuseTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField label="Compute High Level" object={material} property="computeHighLevel" />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
