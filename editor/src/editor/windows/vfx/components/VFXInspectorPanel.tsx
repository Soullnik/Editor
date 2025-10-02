import { Component, ReactNode } from "react";
import { IVFXEmitterMesh, VFXComponent } from "../types";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { Switch } from "../../../../ui/shadcn/ui/switch";
import { EditorParticleSystemInspector } from "../../../layout/inspector/particles/particle-system";
import { EditorGPUParticleSystemInspector } from "../../../layout/inspector/particles/gpu-particle-system";
import { EditorSolidParticleSystemInspector } from "../../../layout/inspector/particles/solid-particle-system";
import { EditorMeshInspector } from "../../../layout/inspector/mesh/mesh";
import { Editor } from "../../../main";

export interface IVFXInspectorPanelProps {
	editor: Editor;
	selectedComponent: VFXComponent | null;
	onComponentPropertyUpdate: (component: VFXComponent) => void;
}

export class VFXInspectorPanel extends Component<IVFXInspectorPanelProps> {

	public getInspector(): ReactNode {
		switch (this.props.selectedComponent?.type) {
			case "gpu_particle_system":
				return <EditorGPUParticleSystemInspector editor={this.props.editor} object={this.props.selectedComponent.babylonSystem} />;
			case "cpu_particle_system":
				return <EditorParticleSystemInspector editor={this.props.editor} object={this.props.selectedComponent.babylonSystem} />;
			case "solid_particle_system":
				return <EditorSolidParticleSystemInspector editor={this.props.editor} object={this.props.selectedComponent} />;
			case "emitter_mesh":
				return <EditorMeshInspector editor={this.props.editor} object={this.props.selectedComponent.babylonMesh} />;
			default:
				return (
					<div className="flex flex-col w-full h-full">
						<div className="flex-1 flex items-center justify-center text-muted-foreground">
							<div className="text-center">
								<div className="text-sm">Unsupported component type</div>
								<div className="text-xs">This component type is not supported by the inspector</div>
							</div>
						</div>
					</div>
				);
		}
	}
	
	public render(): ReactNode {
		if (!this.props.selectedComponent) {
			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<div className="text-sm">No component selected</div>
							<div className="text-xs">Select a component to edit its properties</div>
						</div>
					</div>
				</div>
			);
		}

		return this.getInspector();
	}
}
