import { Component, ReactNode } from "react";
import { IVFXInspectorPanelProps, IVFXEmitterMesh } from "../types";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { Switch } from "../../../../ui/shadcn/ui/switch";
import { EditorParticleSystemInspector } from "../../../layout/inspector/particles/particle-system";
import { EditorGPUParticleSystemInspector } from "../../../layout/inspector/particles/gpu-particle-system";
import { EditorSolidParticleSystemInspector } from "../../../layout/inspector/particles/solid-particle-system";
import { EditorMeshInspector } from "../../../layout/inspector/mesh/mesh";
import { Editor } from "../../../main";

export class VFXInspectorPanel extends Component<IVFXInspectorPanelProps> {
	
	public render(): ReactNode {
		const { selectedComponent, scene } = this.props;
		const mockEditor = {
			layout: {
				preview: {
					scene: scene,
				},
				graph: {
					refresh: () => {
						// Mock refresh function - does nothing in VFX context
						console.log("Graph refresh called (mock)");
					},
				},
			},
			path: null,
			state: {
				projectPath: null,
			},
		} as Editor;

		if (!selectedComponent) {
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

		const component = selectedComponent;

		if (component.type === "gpu_particle_system" && component.babylonSystem) {
			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 overflow-auto">
						<EditorGPUParticleSystemInspector editor={mockEditor} object={component.babylonSystem} />
					</div>
				</div>
			);
		}

		if (component.type === "cpu_particle_system" && component.babylonSystem) {
			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 overflow-auto">
						<EditorParticleSystemInspector editor={mockEditor} object={component.babylonSystem} />
					</div>
				</div>
			);
		}

		if (component.type === "solid_particle_system" && component.babylonSPS) {
			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 overflow-auto">
						<EditorSolidParticleSystemInspector editor={mockEditor} object={component.babylonSPS} />
					</div>
				</div>
			);
		}

		if (component.type === "emitter_mesh") {
			const emitterComponent = component as IVFXEmitterMesh;
			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 overflow-auto">
						<EditorMeshInspector editor={mockEditor} object={emitterComponent.babylonMesh} />
					</div>
				</div>
			);
		}

		// Default inspector for other component types
		return (
			<div className="flex flex-col w-full h-full">
				<div className="flex-1 overflow-auto p-3 space-y-4">
					{/* Basic Properties */}
					<div className="space-y-2">
						<Label className="text-xs font-medium">Name</Label>
						<Input
							value={component.name}
							onChange={(e) => {
								const updatedComponent = { ...component, name: e.target.value };
								this.props.onComponentPropertyUpdate(updatedComponent);
							}}
							className="h-8 text-xs"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-medium">Active</Label>
						<Switch
							checked={component.active}
							onCheckedChange={(checked) => {
								const updatedComponent = { ...component, active: checked };
								this.props.onComponentPropertyUpdate(updatedComponent);
							}}
						/>
					</div>
				</div>
			</div>
		);
	}
}
