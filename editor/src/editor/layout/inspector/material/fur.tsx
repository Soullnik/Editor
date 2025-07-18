import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { FurMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorInspectorVectorField } from "../fields/vector";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorFurMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: FurMaterial;
}

export class EditorFurMaterialInspector extends Component<IEditorFurMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="Fur">
					<EditorInspectorColorField label="Diffuse Color" object={material} property="diffuseColor" />
					<EditorInspectorTextureField object={material} title="Diffuse Texture" property="diffuseTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Height Texture" property="heightTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorNumberField label="Fur Length" object={material} property="furLength" min={0} step={0.01} />
					<EditorInspectorNumberField label="Fur Angle" object={material} property="furAngle" min={-3.14} max={3.14} step={0.01} />
					<EditorInspectorColorField label="Fur Color" object={material} property="furColor" />
					<EditorInspectorVectorField label="Fur Gravity" object={material} property="furGravity" />
					<EditorInspectorNumberField label="Fur Spacing" object={material} property="furSpacing" min={0} step={1} />
					<EditorInspectorNumberField label="Fur Speed" object={material} property="furSpeed" min={0} step={1} />
					<EditorInspectorNumberField label="Fur Density" object={material} property="furDensity" min={0} step={1} />
					<EditorInspectorNumberField label="Fur Occlusion" object={material} property="furOcclusion" min={0} max={1} step={0.01} />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
					<EditorInspectorSwitchField label="High Level Fur" object={material} property="highLevelFur" />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
