import { Component, ReactNode } from "react";
import { ISPSParticleAnimation } from "../../types";
import { SPSSAnimationEditor } from "../sps-animation-editor";
import { SPSSAnimationKeyframe } from "./sps-keyframe";

export interface ISPSAnimationTimelineItemProps {
	animation: ISPSParticleAnimation;
	scale: number;
	currentTime: number;
	animationEditor: SPSSAnimationEditor;
}

export class SPSSAnimationTimelineItem extends Component<ISPSAnimationTimelineItemProps> {
	public render(): ReactNode {
		const { animation, scale } = this.props;

		return (
			<div className="relative h-12 border-b border-border">
				{/* Track label */}
				<div className="absolute left-0 top-0 h-full w-32 bg-muted/30 flex items-center px-2 border-r border-border">
					<span className="text-xs font-medium truncate">
						{animation.property}.{animation.component}
					</span>
				</div>

				{/* Track content */}
				<div className="ml-32 h-full relative bg-background">
					{/* Keyframes */}
					{animation.keyframes.map((keyframe, index) => (
						<SPSSAnimationKeyframe
							key={index}
							keyframe={keyframe}
							animation={animation}
							scale={scale}
							onKeyframeChange={(newKeyframe) => this._updateKeyframe(index, newKeyframe)}
							onKeyframeDelete={() => this._deleteKeyframe(index)}
						/>
					))}

					{/* Track line */}
					<div className="absolute top-1/2 left-0 right-0 h-[1px] bg-foreground/20" />

					{/* Add keyframe area */}
					<div className="absolute inset-0 cursor-crosshair" onClick={(ev) => this._addKeyframeAtPosition(ev)} />
				</div>
			</div>
		);
	}

	private _updateKeyframe(index: number, newKeyframe: any): void {
		const { animation } = this.props;
		const updatedKeyframes = [...animation.keyframes];
		updatedKeyframes[index] = { ...updatedKeyframes[index], ...newKeyframe };

		// TODO: Update animation keyframes
		console.log("Update keyframe:", animation.id, index, newKeyframe);
	}

	private _deleteKeyframe(index: number): void {
		const { animation } = this.props;
		const updatedKeyframes = animation.keyframes.filter((_, i) => i !== index);

		// TODO: Update animation keyframes
		console.log("Delete keyframe:", animation.id, index);
	}

	private _addKeyframeAtPosition(ev: React.MouseEvent<HTMLDivElement>): void {
		const { animation, scale } = this.props;
		const rect = ev.currentTarget.getBoundingClientRect();
		const x = ev.clientX - rect.left;
		const time = x / scale;

		// Clamp time between 0 and 1
		const clampedTime = Math.max(0, Math.min(1, time));

		// Create new keyframe
		const newKeyframe = {
			time: clampedTime,
			value: 0, // Default value
			easing: "linear" as const,
		};

		// Add keyframe and sort by time
		const updatedKeyframes = [...animation.keyframes, newKeyframe].sort((a, b) => a.time - b.time);

		// TODO: Update animation keyframes
		console.log("Add keyframe:", animation.id, newKeyframe);
	}
}
