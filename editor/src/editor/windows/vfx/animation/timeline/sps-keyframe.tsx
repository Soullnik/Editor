import { Component, ReactNode } from "react";
import { ISPSAnimationKeyframe, ISPSParticleAnimation } from "../../types";

export interface ISPSAnimationKeyframeProps {
	keyframe: ISPSAnimationKeyframe;
	animation: ISPSParticleAnimation;
	scale: number;
	onKeyframeChange: (newKeyframe: Partial<ISPSAnimationKeyframe>) => void;
	onKeyframeDelete: () => void;
}

export class SPSSAnimationKeyframe extends Component<ISPSAnimationKeyframeProps> {
	public render(): ReactNode {
		const { keyframe, scale } = this.props;
		const left = keyframe.time * scale;

		return (
			<div
				className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-primary rounded cursor-pointer hover:bg-primary/80 transition-colors border border-primary-foreground/20"
				style={{ left: `${left}px` }}
				onMouseDown={(ev) => this._handleMouseDown(ev)}
				onContextMenu={(ev) => this._handleContextMenu(ev)}
			/>
		);
	}

	private _handleMouseDown(ev: React.MouseEvent<HTMLDivElement>): void {
		ev.stopPropagation();

		const startX = ev.clientX;
		const startTime = this.props.keyframe.time;

		let mouseMoveListener: (event: globalThis.MouseEvent) => void;
		let mouseUpListener: (event: globalThis.MouseEvent) => void;

		document.body.addEventListener(
			"mousemove",
			(mouseMoveListener = (ev) => {
				const deltaX = ev.clientX - startX;
				const deltaTime = deltaX / this.props.scale;
				const newTime = Math.max(0, Math.min(1, startTime + deltaTime));

				this.props.onKeyframeChange({ time: newTime });
			})
		);

		document.body.addEventListener(
			"mouseup",
			(mouseUpListener = (ev) => {
				document.body.removeEventListener("mousemove", mouseMoveListener);
				document.body.removeEventListener("mouseup", mouseUpListener);
			})
		);
	}

	private _handleContextMenu(ev: React.MouseEvent<HTMLDivElement>): void {
		ev.preventDefault();
		ev.stopPropagation();

		// TODO: Show context menu with options like "Delete", "Edit Value", etc.
		// For now, just delete on right click
		this.props.onKeyframeDelete();
	}
}
