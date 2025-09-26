import { Component, ReactNode } from "react";
import { Engine, Scene, ArcRotateCamera } from "babylonjs";

export interface IVFXPreviewPanelProps {
	scene: Scene | null;
	engine: Engine | null;
	camera: ArcRotateCamera | null;
	onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

export class VFXPreviewPanel extends Component<IVFXPreviewPanelProps> {
	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full bg-background">
				{/* Canvas container */}
				<div className="flex-1 relative">
					<canvas
						ref={(r) => this.props.onCanvasRef(r)}
						className="absolute inset-0 w-full h-full bg-background"
					/>
					
					{/* Overlay info */}
					<div className="absolute top-4 left-4 bg-primary-foreground/95 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground">
						<div className="font-semibold mb-1">VFX Preview</div>
						<div>Scene: {this.props.scene ? 'Loaded' : 'Not loaded'}</div>
						<div>Engine: {this.props.engine ? 'Running' : 'Stopped'}</div>
					</div>
				</div>
			</div>
		);
	}
}
