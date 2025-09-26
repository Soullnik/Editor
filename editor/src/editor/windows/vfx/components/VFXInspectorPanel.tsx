import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { Slider } from "../../../../ui/shadcn/ui/slider";
import { Switch } from "../../../../ui/shadcn/ui/switch";
import { EditorParticleSystemInspector } from "../../../layout/inspector/particles/particle-system";
import { VFXNodeType } from "../../../layout/assets-browser/items/vfx-types";

export interface IVFXInspectorPanelProps {
	selectedComponent: any;
	scene: any; // Babylon.js Scene
	onComponentPropertyUpdate: (property: string, value: any) => void;
	onPropertyUpdate: (property: string, value: any) => void;
}

export class VFXInspectorPanel extends Component<IVFXInspectorPanelProps> {
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

		const component = this.props.selectedComponent;
		const properties = component.properties || {};

		// Use EditorParticleSystemInspector for particle systems
		if (component.type === VFXNodeType.PARTICLE_SYSTEM && component.properties.babylonSystem) {
			// Create a more complete mock editor object
			const mockEditor = {
				layout: {
					preview: {
						scene: this.props.scene,
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

			return (
				<div className="flex flex-col w-full h-full">
					<div className="flex-1 overflow-auto">
						<EditorParticleSystemInspector editor={mockEditor as any} object={component.properties.babylonSystem} />
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
						<Input value={component.name} onChange={(e) => this.props.onComponentPropertyUpdate("name", e.target.value)} className="h-8 text-xs" />
					</div>

					<div className="space-y-2">
						<Label className="text-xs font-medium">Active</Label>
						<Switch checked={component.active} onCheckedChange={(checked) => this.props.onComponentPropertyUpdate("active", checked)} />
					</div>

					{/* Component-specific properties */}
					{component.type === VFXNodeType.SOLID_PARTICLE_SYSTEM && (
						<>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Particle Count</Label>
								<Input
									type="number"
									value={properties.particleCount || 100}
									onChange={(e) => this.props.onPropertyUpdate("particleCount", parseInt(e.target.value))}
									className="h-8 text-xs"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">Size</Label>
								<Slider
									min={0.01}
									max={1.0}
									step={0.01}
									value={[properties.size || 0.1]}
									onValueChange={(value) => this.props.onPropertyUpdate("size", value[0])}
									className="w-full"
								/>
								<div className="text-xs text-muted-foreground text-center">{properties.size || 0.1}</div>
							</div>
						</>
					)}
				</div>
			</div>
		);
	}
}
