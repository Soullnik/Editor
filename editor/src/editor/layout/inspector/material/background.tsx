import { Component, ReactNode } from "react";

import { AbstractMesh } from "babylonjs";
import { BackgroundMaterial } from "babylonjs";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorColorField } from "../fields/color";
import { EditorInspectorVectorField } from "../fields/vector";
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
                    <EditorInspectorNumberField label="Alpha" object={this.props.material} property="alpha" min={0} max={1} />

                    <EditorMaterialInspectorUtilsComponent
                        mesh={this.props.mesh}
                        material={this.props.material}
                    />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Primary Colors">
                    <EditorInspectorColorField label="Primary Color" object={this.props.material} property="primaryColor" />
                    <EditorInspectorNumberField label="Primary Color Shadow Level" object={this.props.material} property="primaryColorShadowLevel" min={0} max={1} />
                    <EditorInspectorNumberField label="Primary Color Highlight Level" object={this.props.material} property="primaryColorHighlightLevel" min={0} max={1} />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Textures">
                    <EditorInspectorTextureField
                        object={this.props.material}
                        title="Diffuse Texture"
                        property="diffuseTexture"
                        onChange={() => this.forceUpdate()}
                    />
                    <EditorInspectorTextureField
                        object={this.props.material}
                        title="Reflection Texture"
                        property="reflectionTexture"
                        acceptCubeTexture
                        onChange={() => this.forceUpdate()}
                    />
                    {this.props.material.reflectionTexture && (
                        <EditorInspectorNumberField label="Reflection Blur" object={this.props.material} property="reflectionBlur" min={0} />
                    )}
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Reflection Settings">
                    <EditorInspectorSwitchField label="Reflection Fresnel" object={this.props.material} property="reflectionFresnel" />
                    <EditorInspectorNumberField label="Reflection Amount" object={this.props.material} property="reflectionAmount" min={0} max={1} />
                    <EditorInspectorNumberField label="Reflection Reflectance 0" object={this.props.material} property="reflectionReflectance0" min={0} max={1} />
                    <EditorInspectorNumberField label="Reflection Reflectance 90" object={this.props.material} property="reflectionReflectance90" min={0} max={1} />
                    <EditorInspectorNumberField label="Reflection Falloff Distance" object={this.props.material} property="reflectionFalloffDistance" min={0} />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Opacity & Fresnel">
                    <EditorInspectorSwitchField label="Opacity Fresnel" object={this.props.material} property="opacityFresnel" />
                    <EditorInspectorVectorField label="Scene Center" object={this.props.material} property="sceneCenter" />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Advanced Settings">
                    <EditorInspectorSwitchField label="Use RGB Color" object={this.props.material} property="useRGBColor" />
                    <EditorInspectorSwitchField label="Enable Noise" object={this.props.material} property="enableNoise" />
                    <EditorInspectorSwitchField label="Switch to BGR" object={this.props.material} property="switchToBGR" />
                    <EditorInspectorNumberField label="Shadow Level" object={this.props.material} property="shadowLevel" min={0} max={1} />
                    <EditorInspectorNumberField label="Max Simultaneous Lights" object={this.props.material} property="maxSimultaneousLights" min={1} max={16} step={1} />
                    <EditorInspectorSwitchField label="Shadow Only" object={this.props.material} property="shadowOnly" />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Field of View">
                    <EditorInspectorSwitchField label="Use Equirectangular FOV" object={this.props.material} property="useEquirectangularFOV" />
                    <EditorInspectorNumberField label="FOV Multiplier" object={this.props.material} property="fovMultiplier" min={0} max={2} />
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Ground Projection">
                    <EditorInspectorSwitchField label="Enable Ground Projection" object={this.props.material} property="enableGroundProjection" />
                    {this.props.material.enableGroundProjection && (
                        <>
                            <EditorInspectorNumberField label="Projected Ground Radius" object={this.props.material} property="projectedGroundRadius" min={0} />
                            <EditorInspectorNumberField label="Projected Ground Height" object={this.props.material} property="projectedGroundHeight" />
                        </>
                    )}
                </EditorInspectorSectionField>

                <EditorInspectorSectionField title="Camera Settings">
                    <EditorInspectorSwitchField label="Camera Tone Mapping Enabled" object={this.props.material} property="cameraToneMappingEnabled" />
                    <EditorInspectorSwitchField label="Camera Color Curves Enabled" object={this.props.material} property="cameraColorCurvesEnabled" />
                    <EditorInspectorSwitchField label="Camera Color Grading Enabled" object={this.props.material} property="cameraColorGradingEnabled" />
                    <EditorInspectorNumberField label="Camera Exposure" object={this.props.material} property="cameraExposure" />
                    <EditorInspectorNumberField label="Camera Contrast" object={this.props.material} property="cameraContrast" />
                </EditorInspectorSectionField>
            </>
        );
    }
}
