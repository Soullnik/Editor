import { Component, ReactNode } from "react";
import { extname } from "path/posix";

import { Mesh, SolidParticleSystem } from "babylonjs";

import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { waitNextAnimationFrame } from "../../../../tools/tools";
import { showConfirm } from "../../../../ui/dialog";
import { isMesh } from "../../../../tools/guards/nodes";
import { loadImportedSceneFile } from "../../preview/import/import";

export interface IMeshSPSInspectorProps {
	object: Mesh;
}

export interface IMeshSPSInspectorState {
	sps: SolidParticleSystem;
	dragOver: boolean;
}

export class MeshSPSInspector extends Component<IMeshSPSInspectorProps, IMeshSPSInspectorState> {
	public constructor(props: IMeshSPSInspectorProps) {
		super(props);

		this.state = {
			sps: props.object.metadata.sps as SolidParticleSystem,
			dragOver: false,
		};
	}

	public render(): ReactNode {
		if (!this.state.sps) {
			return null;
		}

		return (
			<EditorInspectorSectionField title="SPS">
				<EditorInspectorNumberField readOnly object={this.state.sps} property="nbParticles" label="Particle Count" />

				<div
					onDrop={(e) => this._handleMeshDrop(e)}
					onDragLeave={() => this.setState({ dragOver: false })}
					onDragOver={(ev) => this._handleMeshDragOver(ev)}
					className={`flex flex-col justify-center items-center w-full p-4 rounded-lg border-[1px] border-secondary-foreground/35 border-dashed ${this.state.dragOver ? "bg-secondary-foreground/35" : ""} transition-all duration-300 ease-in-out`}
				>
					<div className="text-center">
						<div className="text-xl mb-2">Add Particles</div>
						<div className="text-sm text-muted-foreground mb-2">Drop mesh from graph or assets</div>
					</div>
				</div>
			</EditorInspectorSectionField>
		);
	}

	private async _handleMeshDrop(ev: React.DragEvent<HTMLDivElement>): Promise<void> {
		ev.preventDefault();
		ev.stopPropagation();

		this.setState({
			dragOver: false,
		});

		const assets = ev.dataTransfer.getData("assets");
		if (assets) {
			return this._handleAssetDropped(assets);
		}

		const graphNode = ev.dataTransfer.getData("graph/node");
		if (graphNode) {
			return this._handleNodeDropped(graphNode);
		}
	}

	private _handleMeshDragOver(ev: React.DragEvent<HTMLDivElement>): void {
		ev.preventDefault();
		ev.stopPropagation();

		this.setState({
			dragOver: true,
		});
	}

	private async _handleAssetDropped(assets: string): Promise<void> {
		const absolutePaths = JSON.parse(assets) as string[];

		if (!Array.isArray(absolutePaths)) {
			return;
		}

		for (const absolutePath of absolutePaths) {
			await waitNextAnimationFrame();
			const extension = extname(absolutePath).toLowerCase();

			if (extension === ".babylon" || extension === ".glb" || extension === ".gltf") {
				await this._loadMeshFromAsset(absolutePath);
			}
		}
	}

	private async _handleNodeDropped(nodes: string): Promise<void> {
		const nodeIds = JSON.parse(nodes) as string[];

		if (!Array.isArray(nodeIds)) {
			return;
		}

		for (const nodeId of nodeIds) {
			await waitNextAnimationFrame();
			await this._loadMeshFromNode(nodeId);
		}
	}

	private async _loadMeshFromAsset(absolutePath: string): Promise<void> {
		try {
			const result = await loadImportedSceneFile(this.props.object.getScene(), absolutePath);
			console.log(result);
			if (result && result.meshes.length > 0) {
				const disposedMesh = result.meshes[0] as Mesh;
				const mesh = result.meshes[1] as Mesh;
				this._showAddParticleDialog(mesh, disposedMesh);
			}
		} catch (error) {
			console.error("Failed to load mesh from asset:", error);
		}
	}

	private async _loadMeshFromNode(nodeId: string): Promise<void> {
		const scene = this.props.object.getScene();
		const node = scene.getNodeById(nodeId);

		if (isMesh(node)) {
			await this._showAddParticleDialog(node);
		}
	}

	private async _showAddParticleDialog(mesh: Mesh, disposedMesh?: Mesh): Promise<void> {
		const state = {
			count: 1,
		};
		const confirm = await showConfirm(
			"Add Particles",
			<div className="flex flex-col gap-4 p-4">
				<div className="text-sm text-muted-foreground">
					Add particles using mesh: <strong>{this.props.object.name}</strong>
				</div>
				<div className="flex flex-col gap-2">
					<EditorInspectorNumberField step={1} object={state} property="count" label="Particle Count" />
				</div>
			</div>,
			{
				confirmText: "Add",
				cancelText: "Cancel",
			}
		);

		if (confirm) {
			this.state.sps.addShape(mesh, state.count);
			const particle = this.state.sps.particles.find((p) => p.props?.isDefault);
			if (particle) {
				const removed = this.state.sps.removeParticles(particle.idx, particle.idx);
				console.log(removed);
			}
			this.state.sps.buildMesh();
			if (disposedMesh) {
				disposedMesh.dispose();
			}
			this.forceUpdate();
		}
	}
}
