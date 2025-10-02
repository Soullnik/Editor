import { Component, ReactNode } from "react";
import { ContextMenu, ContextMenuItem, ContextMenuContent, ContextMenuTrigger } from "../../../../ui/shadcn/ui/context-menu";
import { GiSparkles } from "react-icons/gi";
import { toast } from "sonner";
import { MeshBuilder, Mesh, Scene } from "babylonjs";
import { loadImportedSceneFile } from "../../../layout/preview/import/import";

export interface IVFXEmitterSectionProps {
	emitterMesh: Mesh | null;
	onEmitterSelect: () => void;
	onEmitterUpdate: (newMesh: Mesh) => void;
	scene: Scene | null;
}

export class VFXEmitterSection extends Component<IVFXEmitterSectionProps> {
	public render(): ReactNode {
		if (!this.props.emitterMesh) {
			return null;
		}

		return (
			<ContextMenu>
				<ContextMenuTrigger>
					<div
						className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
						onDragOver={(ev) => ev.preventDefault()}
						onDrop={(ev) => this._handleEmitterDrop(ev)}
						onClick={() => this.props.onEmitterSelect()}
					>
						<div className="flex items-center gap-2">
							<GiSparkles className="w-4 h-4 text-green-500" />
							<div>
								<div className="text-sm font-medium">{this.props.emitterMesh.name}</div>
								<div className="text-xs text-muted-foreground">Emitter Mesh</div>
							</div>
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={() => this._createEmitterMesh("empty")}>Replace with Empty Mesh</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("box")}>Replace with Box Mesh</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("sphere")}>Replace with Sphere Mesh</ContextMenuItem>
					<ContextMenuItem onClick={() => this._createEmitterMesh("plane")}>Replace with Plane Mesh</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	}

	private _createEmitterMesh(type: "empty" | "box" | "sphere" | "plane"): void {
		const { scene } = this.props;
		if (!scene) {
			return;
		}

		let newMesh: Mesh;
		switch (type) {
			case "empty":
				newMesh = new Mesh("VFX_Emitter_Empty", scene);
				break;
			case "box":
				newMesh = MeshBuilder.CreateBox("VFX_Emitter_Box", { size: 1 }, scene);
				break;
			case "sphere":
				newMesh = MeshBuilder.CreateSphere("VFX_Emitter_Sphere", { diameter: 1 }, scene);
				break;
			case "plane":
				newMesh = MeshBuilder.CreatePlane("VFX_Emitter_Plane", { size: 1 }, scene);
				break;
		}

		this.props.onEmitterUpdate(newMesh);
		toast.success(`Created ${type} emitter`);
	}

	private _handleEmitterDrop(ev: React.DragEvent<HTMLDivElement>): void {
		const assets = ev.dataTransfer.getData("assets");
		if (!assets) {
			return;
		}

		try {
			const assetPaths = JSON.parse(assets) as string[];
			const meshPath = assetPaths.find((path) => path.toLowerCase().endsWith(".glb") || path.toLowerCase().endsWith(".babylon"));

			if (meshPath) {
				this._loadEmitterFromFile(meshPath);
			} else {
				toast.warning("Please drop a .glb or .babylon file for emitter");
			}
		} catch (error) {
			console.error("Failed to parse dropped emitter assets:", error);
			toast.error("Failed to process dropped emitter");
		}
	}

	private async _loadEmitterFromFile(absolutePath: string): Promise<void> {
		const { scene } = this.props;
		if (!scene) {
			return;
		}

		try {
			const result = await loadImportedSceneFile(scene, absolutePath);
			if (result && result.meshes.length > 0) {
				const loadedMesh = result.meshes[0] as Mesh;
				loadedMesh.name = "VFX_Emitter_Imported";

				this.props.onEmitterUpdate(loadedMesh);

				const fileName = absolutePath.split("/").pop() || "mesh";
				toast.success(`Loaded emitter from ${fileName}`);
			} else {
				throw new Error("No meshes loaded from file");
			}
		} catch (error) {
			console.error("Failed to load emitter from file:", error);
			toast.error("Failed to load emitter from file");
		}
	}
}
