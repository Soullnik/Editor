import { Component, ReactNode } from "react";
import { ISPSParticle } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { SPSSAnimationEditor } from "../sps-animation-editor";

export interface ISPSParticleItemProps {
	particle: ISPSParticle;
	animationEditor: SPSSAnimationEditor;
	onRemove: (particle: ISPSParticle) => void;
}

export class SPSSParticleItem extends Component<ISPSParticleItemProps> {
	public render(): ReactNode {
		const { particle } = this.props;
		const isSelected = this.props.animationEditor.state.selectedParticle === particle.id;

		return (
			<div
				className={`flex items-center gap-2 p-2 hover:bg-primary/10 transition-colors cursor-pointer ${isSelected ? "bg-primary/20" : ""}`}
				onClick={() => this._selectParticle()}
			>
				<div className={`w-3 h-3 rounded-full ${particle.enabled ? "bg-green-500" : "bg-gray-400"}`} />
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium truncate">{particle.name}</div>
					<div className="text-xs text-muted-foreground truncate">{particle.animations.length} animations</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						this._toggleEnabled();
					}}
					className="text-xs px-2 py-1 h-6"
				>
					{particle.enabled ? "Disable" : "Enable"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						this._removeParticle();
					}}
					className="text-xs px-2 py-1 h-6 text-red-500 hover:text-red-700"
				>
					Remove
				</Button>
			</div>
		);
	}

	private _selectParticle(): void {
		this.props.animationEditor.setSelectedParticle(this.props.particle.id);
	}

	private _toggleEnabled(): void {
		// TODO: Implement particle enable/disable
		console.log("Toggle particle enabled:", this.props.particle.id);
	}

	private _removeParticle(): void {
		this.props.onRemove(this.props.particle);
	}
}
