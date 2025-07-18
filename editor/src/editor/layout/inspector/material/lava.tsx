import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { LavaMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorLavaMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: LavaMaterial;
}

export class EditorLavaMaterialInspector extends Component<IEditorLavaMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="Lava">
					<EditorInspectorColorField label="Diffuse Color" object={material} property="diffuseColor" />
					<EditorInspectorTextureField object={material} title="Diffuse Texture" property="diffuseTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorTextureField object={material} title="Noise Texture" property="noiseTexture" onChange={() => this.forceUpdate()} />
					<EditorInspectorColorField label="Fog Color" object={material} property="fogColor" />
					<EditorInspectorNumberField label="Fog Density" object={material} property="fogDensity" min={0} step={0.01} />
					<EditorInspectorNumberField label="Speed" object={material} property="speed" min={0} step={0.01} />
					<EditorInspectorNumberField label="Moving Speed" object={material} property="movingSpeed" min={0} step={0.01} />
					<EditorInspectorNumberField label="Low Frequency Speed" object={material} property="lowFrequencySpeed" min={0} step={0.01} />
					<EditorInspectorSwitchField label="Disable Lighting" object={material} property="disableLighting" />
					<EditorInspectorSwitchField label="Unlit" object={material} property="unlit" />
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={material} property="maxSimultaneousLights" min={1} max={16} step={1} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
