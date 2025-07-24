import { Component, ReactNode } from "react";
import { Bone } from "babylonjs";
import { IEditorInspectorImplementationProps } from "../inspector";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorVectorField } from "../fields/vector";
import { Button } from "../../../../ui/shadcn/ui/button";
import { isBone } from "../../../../tools/guards/nodes";

export class EditorBoneInspector extends Component<IEditorInspectorImplementationProps<Bone>> {
    public static IsSupported(object: unknown): boolean {
        return isBone(object);
    }

    public render(): ReactNode {
        const bone = this.props.object;
        return (
            <>
                <EditorInspectorSectionField title="Common" >
                    <EditorInspectorStringField label="Name" object={bone} property="name" />
                    <EditorInspectorNumberField label="Index" object={bone} property="_index" />
                    <EditorInspectorNumberField label="Length" object={bone} property="length" />
                </EditorInspectorSectionField>

                < EditorInspectorSectionField title="Transforms" >
                    <EditorInspectorVectorField label="Position" object={bone} property="position" />
                    <EditorInspectorVectorField label="Rotation" object={bone} property="rotation" />
                    <EditorInspectorVectorField label="Scaling" object={bone} property="scaling" />
                </EditorInspectorSectionField>

                < Button onClick={() => bone.returnToRest()}> Return To Rest </Button>
                < Button onClick={() => bone.setCurrentPoseAsRest()}> Set Current Pose As Rest </Button>
            </>
        );
    }
}
