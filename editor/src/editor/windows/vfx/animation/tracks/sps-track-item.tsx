import { Component, ReactNode } from "react";
import { ISPSParticleAnimation } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { SPSSAnimationEditor } from "../sps-animation-editor";

export interface ISPSAnimationTrackItemProps {
	animation: ISPSParticleAnimation;
	animationEditor: SPSSAnimationEditor;
	onRemove: (animation: ISPSParticleAnimation) => void;
}

export class SPSSAnimationTrackItem extends Component<ISPSAnimationTrackItemProps> {
	public render(): ReactNode {
		const { animation } = this.props;
		const isSelected = this.props.animationEditor.state.selectedAnimation?.id === animation.id;

		return (
			<div
				className={`flex items-center gap-2 p-2 hover:bg-primary/10 transition-colors cursor-pointer ${isSelected ? "bg-primary/20" : ""}`}
				onClick={() => this._selectAnimation()}
			>
				<div className={`w-3 h-3 rounded-full ${animation.enabled ? "bg-green-500" : "bg-gray-400"}`} />
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium truncate">
						{animation.property}.{animation.component}
					</div>
					<div className="text-xs text-muted-foreground truncate">{animation.keyframes.length} keys</div>
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
					{animation.enabled ? "Disable" : "Enable"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						this._removeAnimation();
					}}
					className="text-xs px-2 py-1 h-6 text-red-500 hover:text-red-700"
				>
					Remove
				</Button>
			</div>
		);
	}

	private _selectAnimation(): void {
		this.props.animationEditor.setSelectedAnimation(this.props.animation);
	}

	private _toggleEnabled(): void {
		// TODO: Implement animation enable/disable
		console.log("Toggle animation enabled:", this.props.animation.id);
	}

	private _removeAnimation(): void {
		this.props.onRemove(this.props.animation);
	}
}
