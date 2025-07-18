import { Component, ReactNode } from "react";
import { AbstractMesh } from "babylonjs";
import { GridMaterial } from "babylonjs-materials";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorInspectorVectorField } from "../fields/vector";
import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorGridMaterialInspectorProps {
    mesh?: AbstractMesh;
    material: GridMaterial;
}

export class EditorGridMaterialInspector extends Component<IEditorGridMaterialInspectorProps> {
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

				<EditorInspectorSectionField title="Grid">
					<EditorInspectorColorField label="Main Color" object={material} property="mainColor" />
					<EditorInspectorColorField label="Line Color" object={material} property="lineColor" />
					<EditorInspectorNumberField label="Grid Ratio" object={material} property="gridRatio" min={0.01} step={0.01} />
					<EditorInspectorVectorField label="Grid Offset" object={material} property="gridOffset" />
					<EditorInspectorNumberField label="Major Unit Frequency" object={material} property="majorUnitFrequency" min={1} step={1} />
					<EditorInspectorNumberField label="Minor Unit Visibility" object={material} property="minorUnitVisibility" min={0} max={1} step={0.01} />
					<EditorInspectorNumberField label="Opacity" object={material} property="opacity" min={0} max={1} step={0.01} />
					<EditorInspectorSwitchField label="Antialias" object={material} property="antialias" />
					<EditorInspectorSwitchField label="PreMultiply Alpha" object={material} property="preMultiplyAlpha" />
					<EditorInspectorSwitchField label="Use Max Line" object={material} property="useMaxLine" />
					<EditorInspectorTextureField object={material} title="Opacity Texture" property="opacityTexture" onChange={() => this.forceUpdate()} />
				</EditorInspectorSectionField>
			</>
		);
	}
} 
