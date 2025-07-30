import { Component, ReactNode } from "react";

import { BackgroundMaterial, AbstractMesh } from "babylonjs";

import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorTextureField } from "../fields/texture";
import { EditorInspectorSectionField } from "../fields/section";

import { EditorMaterialInspectorUtilsComponent } from "./utils";

export interface IEditorBackgroundMaterialInspectorProps {
	mesh?: AbstractMesh;
	material: BackgroundMaterial;
}

export class EditorBackgroundMaterialInspector extends Component<IEditorBackgroundMaterialInspectorProps> {
	public constructor(props: IEditorBackgroundMaterialInspectorProps) {
		super(props);
	}

	public render(): ReactNode {
		return (
			<>
				<EditorInspectorSectionField title="Material" label={this.props.material.getClassName()}>
					<EditorInspectorStringField label="Name" object={this.props.material} property="name" />
					<EditorInspectorSwitchField label="Back Face Culling" object={this.props.material} property="backFaceCulling" />
					<EditorInspectorSwitchField label="Switch To BGR" object={this.props.material} property="switchToBGR" />
					<EditorInspectorSwitchField label="Use RGB Color" object={this.props.material} property="useRGBColor" />
					<EditorInspectorSwitchField label="Enable Noise" object={this.props.material} property="enableNoise" />
					<EditorInspectorSwitchField label="Shadow Only" object={this.props.material} property="shadowOnly" />

					<EditorMaterialInspectorUtilsComponent mesh={this.props.mesh} material={this.props.material} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Primary Colors">
					<EditorInspectorColorField label={<div className="w-14">Primary Color</div>} object={this.props.material} property="primaryColor" />
					<EditorInspectorNumberField label="Primary Color Shadow Level" object={this.props.material} property="primaryColorShadowLevel" min={0} max={1} />
					<EditorInspectorNumberField label="Primary Color Highlight Level" object={this.props.material} property="primaryColorHighlightLevel" min={0} max={1} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Textures">
					<EditorInspectorTextureField acceptCubeTexture object={this.props.material} title="Reflection Texture" property="reflectionTexture" onChange={() => this.forceUpdate()}>
						{this.props.material.reflectionTexture && (
							<EditorInspectorNumberField label="Reflection Blur" object={this.props.material} property="reflectionBlur" min={0} max={1} />
						)}
					</EditorInspectorTextureField>

					<EditorInspectorTextureField object={this.props.material} title="Diffuse Texture" property="diffuseTexture" onChange={() => this.forceUpdate()} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Reflection Settings">
					<EditorInspectorSwitchField label="Reflection Fresnel" object={this.props.material} property="reflectionFresnel" />
					<EditorInspectorNumberField label="Reflection Amount" object={this.props.material} property="reflectionAmount" min={0} max={1} />
					<EditorInspectorNumberField label="Reflection Reflectance 0" object={this.props.material} property="reflectionReflectance0" min={0} max={1} />
					<EditorInspectorNumberField label="Reflection Reflectance 90" object={this.props.material} property="reflectionReflectance90" min={0} max={1} />
					<EditorInspectorNumberField label="Reflection Falloff Distance" object={this.props.material} property="reflectionFalloffDistance" min={0} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Opacity Settings">
					<EditorInspectorSwitchField label="Opacity Fresnel" object={this.props.material} property="opacityFresnel" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Shadow Settings">
					<EditorInspectorNumberField label="Shadow Level" object={this.props.material} property="shadowLevel" min={0} max={1} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Scene Settings">
					<EditorInspectorNumberField label="Scene Center X" object={this.props.material} property="sceneCenter.x" />
					<EditorInspectorNumberField label="Scene Center Y" object={this.props.material} property="sceneCenter.y" />
					<EditorInspectorNumberField label="Scene Center Z" object={this.props.material} property="sceneCenter.z" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="FOV Settings">
					<EditorInspectorSwitchField label="Use Equirectangular FOV" object={this.props.material} property="useEquirectangularFOV" />
					<EditorInspectorNumberField label="FOV Multiplier" object={this.props.material} property="fovMultiplier" min={0} max={2} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Ground Projection">
					<EditorInspectorSwitchField label="Enable Ground Projection" object={this.props.material} property="enableGroundProjection" />
					<EditorInspectorNumberField label="Projected Ground Radius" object={this.props.material} property="projectedGroundRadius" min={0} />
					<EditorInspectorNumberField label="Projected Ground Height" object={this.props.material} property="projectedGroundHeight" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Lighting">
					<EditorInspectorNumberField label="Max Simultaneous Lights" object={this.props.material} property="maxSimultaneousLights" min={1} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Camera Settings">
					<EditorInspectorSwitchField label="Camera Color Curves Enabled" object={this.props.material} property="cameraColorCurvesEnabled" />
					<EditorInspectorSwitchField label="Camera Color Grading Enabled" object={this.props.material} property="cameraColorGradingEnabled" />
					<EditorInspectorSwitchField label="Camera Tone Mapping Enabled" object={this.props.material} property="cameraToneMappingEnabled" />
					<EditorInspectorNumberField label="Camera Exposure" object={this.props.material} property="cameraExposure" />
					<EditorInspectorNumberField label="Camera Contrast" object={this.props.material} property="cameraContrast" />
					<EditorInspectorTextureField object={this.props.material} title="Camera Color Grading Texture" property="cameraColorGradingTexture" />
				</EditorInspectorSectionField>
			</>
		);
	}
}
