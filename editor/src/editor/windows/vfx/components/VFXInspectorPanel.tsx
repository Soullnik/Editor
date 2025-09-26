import { Component, ReactNode } from "react";
import { IVFXInspectorPanelProps } from "../types";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { Slider } from "../../../../ui/shadcn/ui/slider";
import { Switch } from "../../../../ui/shadcn/ui/switch";
import { EditorParticleSystemInspector } from "../../../layout/inspector/particles/particle-system";
import { EditorGPUParticleSystemInspector } from "../../../layout/inspector/particles/gpu-particle-system";

export class VFXInspectorPanel extends Component<IVFXInspectorPanelProps> {
	public render(): ReactNode {
		const { selectedComponent, scene } = this.props;
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

		// Use appropriate inspector for particle systems
		if ((component.type === "cpu_particle_system" || component.type === "gpu_particle_system") && component.babylonSystem) {
			// Create a more complete mock editor object
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
			};

			// Check if it's a GPU particle system
			if (component.type === "gpu_particle_system") {
				return (
					<div className="flex flex-col w-full h-full">
						<div className="flex-1 overflow-auto">
							<EditorGPUParticleSystemInspector editor={mockEditor as any} object={component.babylonSystem as any} />
						</div>
					</div>
				);
			} else {
				// Use CPU particle system inspector
				return (
					<div className="flex flex-col w-full h-full">
						<div className="flex-1 overflow-auto">
							<EditorParticleSystemInspector editor={mockEditor as any} object={component.babylonSystem as any} />
						</div>
					</div>
				);
			}
		}

		// Special handling for SPS
		if (component.type === "solid_particle_system") {
			const spsComponent = component as any; // Cast to access SPS-specific properties
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

						{/* SPS-specific properties */}
						<div className="space-y-2">
							<Label className="text-xs font-medium">Particle Count</Label>
							<Input
								type="number"
								value={spsComponent.particleCount || 100}
								onChange={(e) => {
									const updatedComponent = {
										...component,
										particleCount: parseInt(e.target.value),
									};
									this.props.onComponentPropertyUpdate(updatedComponent);
								}}
								className="h-8 text-xs"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-xs font-medium">Size</Label>
							<Slider
								min={0.01}
								max={1.0}
								step={0.01}
								value={[spsComponent.size || 0.1]}
								onValueChange={(value) => {
									const updatedComponent = {
										...component,
										size: value[0],
									};
									this.props.onComponentPropertyUpdate(updatedComponent);
								}}
								className="w-full"
							/>
							<div className="text-xs text-muted-foreground text-center">{spsComponent.size || 0.1}</div>
						</div>
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
