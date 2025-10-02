import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { toast } from "sonner";
import { Mesh, Scene } from "babylonjs";
import { VFXComponent, IVFXEmitterMesh, IVFXFile } from "../types";
import { VFXEmitterSection } from "./VFXEmitterSection";
import { VFXComponentList } from "./VFXComponentList";
import { AssetProcessor } from "../utils/asset-processor";
import { EmitterManager } from "../utils/emitter-manager";
import { ComponentFilter } from "../utils/component-filter";

export interface IVFXComponentsPanelState {
	// State is now managed by EmitterManager
}

export interface IVFXComponentsPanelProps {
	vfxData: IVFXFile | null;
	selectedComponent: VFXComponent | null;
	search: string;
	scene: Scene | null;
	onSearchChange: (search: string) => void;
	onComponentSelect: (component: VFXComponent) => void;
	onComponentRemove: (id: string) => void;
	onComponentAdded: (component: VFXComponent) => void;
	onComponentRemoved?: (id: string) => void; // Callback for cleanup
}

export class VFXComponentsPanel extends Component<IVFXComponentsPanelProps, IVFXComponentsPanelState> {
	private _emitterManager: EmitterManager;

	public constructor(props: IVFXComponentsPanelProps) {
		super(props);
		this._emitterManager = new EmitterManager();
	}

	public componentDidUpdate(prevProps: IVFXComponentsPanelProps): void {
		// Create default emitter when scene becomes available
		if (!prevProps.scene && this.props.scene && !this._emitterManager.getEmitterMesh()) {
			this._emitterManager.createDefaultEmitter(this.props.scene);
			this.forceUpdate();
		}
	}

	public componentWillUnmount(): void {
		this._emitterManager.dispose();
	}

	public render(): ReactNode {
		const { selectedComponent, search } = this.props;
		const filteredComponents = ComponentFilter.getFilteredComponents(this.props.vfxData, search);

		return (
			<div className="flex flex-col w-full h-full">
				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input placeholder="Search components..." value={search} onChange={(e) => this.props.onSearchChange(e.target.value)} className="h-8 text-xs" />
				</div>

				{/* Emitter Section */}
				<div className="p-3 border-b border-border">
					<div className="text-xs font-medium text-muted-foreground mb-2">Emitter</div>
					<VFXEmitterSection
						emitterMesh={this._emitterManager.getEmitterMesh()}
						onEmitterSelect={() => this._selectEmitter()}
						onEmitterUpdate={(newMesh) => this._updateEmitterMesh(newMesh)}
						scene={this.props.scene}
					/>
				</div>

				{/* Components List */}
				<VFXComponentList
					components={filteredComponents}
					selectedComponent={selectedComponent}
					onComponentSelect={this.props.onComponentSelect}
					onComponentRemove={(id) => this._handleComponentRemove(id)}
					onComponentRemoved={this.props.onComponentRemoved}
					onDrop={(ev) => this._handleDrop(ev)}
				/>
			</div>
		);
	}

	private _updateEmitterMesh(newRootMesh: Mesh): void {
		this._emitterManager.updateEmitterMesh(newRootMesh);
		this.forceUpdate();
	}

	private _selectEmitter(): void {
		const emitterMesh = this._emitterManager.getEmitterMesh();
		if (emitterMesh) {
			const emitterComponent: IVFXEmitterMesh = {
				id: "emitter-mesh",
				name: emitterMesh.name,
				active: emitterMesh.isEnabled(),
				type: "emitter_mesh",
				babylonMesh: emitterMesh,
			};

			this.props.onComponentSelect(emitterComponent);
		}
	}

	private _handleComponentRemove(componentId: string): void {
		this._emitterManager.cleanupEmitter(componentId);
		this.props.onComponentRemove(componentId);
	}

	private _handleDrop(ev: React.DragEvent<HTMLDivElement>): void {
		const assets = ev.dataTransfer.getData("assets");
		if (assets && this._emitterManager.getEmitterMesh()) {
			this._handleAssetsDropped(ev);
		}
	}

	private async _handleAssetsDropped(ev: React.DragEvent<HTMLDivElement>): Promise<void> {
		const assets = ev.dataTransfer.getData("assets");
		if (!assets) {
			return;
		}
		try {
			const assetPaths = JSON.parse(assets) as string[];
			for (const absolutePath of assetPaths) {
				const component = await AssetProcessor.processAssetFile(absolutePath, this.props.scene!, (componentId) =>
					this._emitterManager.createIndividualEmitter(componentId, this.props.scene!)
				);
				if (component) {
					this.props.onComponentAdded(component);
				}
			}
		} catch (error) {
			console.error("Failed to parse dropped assets:", error);
			toast.error("Failed to process dropped assets");
		}
	}
}
