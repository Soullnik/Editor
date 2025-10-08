import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { toast } from "sonner";
import { Mesh, Scene } from "babylonjs";
import { VFXComponent, IVFXFile, IVFXEmitterMesh } from "../types";
import { VFXEmitterSection } from "./VFXEmitterSection";
import { VFXComponentList } from "./VFXComponentList";
import { extname } from "path";
import {
	createBaseVFXComponent,
	createParticleSystemFromCPUPS,
	createParticleSystemFromGPUPS,
	createParticleSystemFromNPSS,
	createSolidParticleSystemFromMesh,
} from "../utils/create";
import { showConfirm } from "../../../../ui/dialog";
import { EditorInspectorNumberField } from "../../../layout/inspector/fields/number";

export interface IVFXComponentsPanelState {
	search: string;
}

export interface IVFXComponentsPanelProps {
	vfxData: IVFXFile | null;
	selectedComponent: VFXComponent | null;
	scene: Scene | null;
	onSelect: (component: VFXComponent) => void;
	onRemove: (component: VFXComponent) => void;
	onAdd: (component: VFXComponent) => void;
}

export class VFXComponentsPanel extends Component<IVFXComponentsPanelProps, IVFXComponentsPanelState> {
	private _rootEmitterComponent: IVFXEmitterMesh | null = null;

	public constructor(props: IVFXComponentsPanelProps) {
		super(props);
		this.state = {
			search: "",
		};
	}

	public componentDidUpdate(prevProps: IVFXComponentsPanelProps): void {
		if (!prevProps.scene && this.props.scene && !this._rootEmitterComponent) {
			this._createRootEmitterComponent();
			this.forceUpdate();
		}
	}

	public componentWillUnmount(): void {
		this._rootEmitterComponent?.babylonSystem.dispose();
	}

	public render(): ReactNode {
		const { selectedComponent } = this.props;
		const { search } = this.state;
		const filteredComponents = this._getFilteredComponents(this.props.vfxData, search);

		return (
			<div className="flex flex-col w-full h-full">
				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input placeholder="Search components..." value={search} onChange={(e) => this.setState({ search: e.target.value })} className="h-8 text-xs" />
				</div>

				{/* Emitter Section */}
				<div className="p-3 border-b border-border">
					<div className="text-xs font-medium text-muted-foreground mb-2">Emitter</div>
					<VFXEmitterSection
						component={this._rootEmitterComponent}
						selectedComponent={selectedComponent}
						onSelect={(component) => this.props.onSelect(component)}
						onUpdate={(newMesh) => this._updateEmitterMesh(newMesh)}
						scene={this.props.scene}
					/>
				</div>

				{/* Components List */}
				<VFXComponentList
					components={filteredComponents}
					selectedComponent={selectedComponent}
					onSelect={(component) => this.props.onSelect(component)}
					onRemove={(component) => this._handleComponentRemove(component)}
					onDrop={(ev) => this._handleDrop(ev)}
				/>
			</div>
		);
	}

	private _createRootEmitterComponent(): void {
		const rootMesh = new Mesh("VFX_Emitter_Root", this.props.scene);
		this._rootEmitterComponent = createBaseVFXComponent(rootMesh.name, rootMesh.name, "emitter_mesh") as IVFXEmitterMesh;
		this._rootEmitterComponent.babylonSystem = rootMesh;
		this._rootEmitterComponent.babylonSystem.isVisible = false;
		this.props.onSelect(this._rootEmitterComponent);
	}

	private _updateEmitterMesh(newRootMesh: Mesh): void {
		if (!this._rootEmitterComponent) {
			return;
		}
		this.props.vfxData?.components.forEach((component) => {
			if (component.type === "solid_particle_system") {
				component.babylonSystem.mesh.parent = newRootMesh;
			}
			if (component.type === "gpu_particle_system") {
				component.babylonSystem.emitter = newRootMesh;
			}
			if (component.type === "cpu_particle_system") {
				component.babylonSystem.emitter = newRootMesh;
			}
			if (component.type === "node_particle_system") {
				component.babylonSystem.emitterNode = newRootMesh;
			}
		});
		this._rootEmitterComponent.babylonSystem.dispose();
		this._rootEmitterComponent.babylonSystem = newRootMesh;
		this.forceUpdate();
	}

	private _handleComponentRemove(component: VFXComponent): void {
		this.props.onRemove(component);
	}

	private _handleDrop(ev: React.DragEvent<HTMLDivElement>): void {
		const assets = ev.dataTransfer.getData("assets");
		if (assets && this._rootEmitterComponent) {
			this._handleAssetsDropped(ev);
		}
	}

	private async _handleAssetsDropped(ev: React.DragEvent<HTMLDivElement>): Promise<void> {
		const assets = ev.dataTransfer.getData("assets");
		if (!assets || !this.props.scene || !this._rootEmitterComponent) {
			return;
		}
		try {
			const assetPaths = JSON.parse(assets) as string[];
			for (const absolutePath of assetPaths) {
				const ext = extname(absolutePath).toLowerCase();
				let component: VFXComponent | null = null;
				switch (ext) {
					case ".glb":
						const count = await this._showAddParticleDialog();
						if (count > 0) {
							component = await createSolidParticleSystemFromMesh(absolutePath, this.props.scene, this._rootEmitterComponent.babylonSystem, count);
						}
						break;
					case ".gpups":
						component = await createParticleSystemFromGPUPS(absolutePath, this.props.scene, this._rootEmitterComponent.babylonSystem);
						break;
					case ".cpups":
						component = await createParticleSystemFromCPUPS(absolutePath, this.props.scene, this._rootEmitterComponent.babylonSystem);
						break;
					case ".npss":
						component = await createParticleSystemFromNPSS(absolutePath, this.props.scene, this._rootEmitterComponent.babylonSystem);
						break;
					default:
						toast.warning(`Unsupported file type: ${ext}`);
				}
				if (component) {
					this.props.onAdd(component);
				}
			}
		} catch (error) {
			toast.error("Failed to process dropped assets");
		}
	}

	private _getFilteredComponents(vfxData: IVFXFile | null, search: string): { [key: string]: VFXComponent[] } {
		if (!vfxData) {
			return {};
		}

		const filteredComponents = vfxData.components.filter(
			(component) => component.name.toLowerCase().includes(search.toLowerCase()) || component.type.toLowerCase().includes(search.toLowerCase())
		);

		const groupedComponents: { [key: string]: VFXComponent[] } = {};
		filteredComponents.forEach((component) => {
			if (!groupedComponents[component.type]) {
				groupedComponents[component.type] = [];
			}
			groupedComponents[component.type].push(component);
		});

		return groupedComponents;
	}

	private async _showAddParticleDialog(): Promise<number> {
		const state = {
			count: 1,
		};
		const confirm = await showConfirm(
			"Add Particles",
			<div className="flex flex-col gap-4 p-4">
				<div className="text-sm text-muted-foreground">Add Solid Particle System using mesh</div>
				<div className="flex flex-col gap-2">
					<EditorInspectorNumberField step={1} object={state} property="count" label="Particle Count" />
				</div>
			</div>,
			{
				confirmText: "Add",
				cancelText: "Cancel",
			}
		);

		if (!confirm) {
			return 0;
		}
		return state.count;
	}
}
