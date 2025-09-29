import { Component, ReactNode } from "react";
import { Scene, Engine } from "babylonjs";

export interface IVFXPreviewPanelProps {
	scene: Scene | null;
	engine: Engine | null;
	onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

export class VFXPreviewPanel extends Component<IVFXPreviewPanelProps> {
	public render(): ReactNode {
		const { scene, engine } = this.props;

		return (
			<div className="flex flex-col w-full h-full bg-background overflow-hidden">
				{/* Canvas container */}
				<div className="flex-1 relative overflow-hidden">
					<canvas ref={(r) => this.props.onCanvasRef(r)} className="absolute inset-0 w-full h-full bg-background" style={{ display: "block" }} />

					{/* Overlay info */}
					<div className="absolute top-4 left-4 bg-primary-foreground/95 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground pointer-events-none">
						<div className="font-semibold mb-1">VFX Preview</div>
						<div>Scene: {scene ? "Loaded" : "Not loaded"}</div>
						<div>Engine: {engine ? "Running" : "Stopped"}</div>
					</div>
				</div>
			</div>
		);
	}
}
