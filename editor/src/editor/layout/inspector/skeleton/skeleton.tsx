import { Component, ReactNode } from "react";
import { Skeleton } from "babylonjs";
import { IEditorInspectorImplementationProps } from "../inspector";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorVectorField } from "../fields/vector";
import { Button } from "../../../../ui/shadcn/ui/button";
import { isSkeleton } from "../../../../tools/guards/nodes";

export class EditorSkeletonInspector extends Component<IEditorInspectorImplementationProps<Skeleton>> {
    public static IsSupported(object: unknown): boolean {
        return isSkeleton(object);
    }

    public render(): ReactNode {
        const skeleton = this.props.object;
        return (
            <>
                <EditorInspectorSectionField title="Skeleton" label={skeleton.getClassName()}>
                    <EditorInspectorStringField label="Name" object={skeleton} property="name" />
                </EditorInspectorSectionField>

                <div className="flex gap-2 mt-2">
                    <Button variant="secondary" onClick={() => skeleton.returnToRest()}>
                        Return To Rest
                    </Button>
                    <Button variant="secondary" onClick={() => skeleton.setCurrentPoseAsRest()}>
                        Set Current Pose As Rest
                    </Button>
                    <Button variant="secondary" onClick={() => skeleton.sortBones()}>
                        Sort Bones
                    </Button>
                </div>
            </>
        );
    }
}
