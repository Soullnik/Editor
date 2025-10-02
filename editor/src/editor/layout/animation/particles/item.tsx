import { Component, ReactNode } from "react";
import { HiOutlineTrash } from "react-icons/hi";

import { SpsAnimation } from "../../../windows/vfx/sps-animation-types";

import { Button } from "../../../../ui/shadcn/ui/button";

import { EditorAnimation } from "../../animation";

export interface IEditorAnimationParticleItemProps {
	animation: SpsAnimation;
	animationEditor: EditorAnimation;

	onRemove: (animation: SpsAnimation) => void;
}

export class EditorAnimationParticleItem extends Component<IEditorAnimationParticleItemProps> {
	public render(): ReactNode {
		return (
			<div
				onMouseLeave={() => this.props.animationEditor.setState({ selectedParticleId: null })}
				onMouseEnter={() => this.props.animationEditor.setState({ selectedParticleId: this.props.animation.particleId })}
				className={`
                    flex justify-between items-center w-full h-10 p-2 ring-accent ring-1
                    ${this.props.animationEditor.state.selectedParticle === this.props.animation ? "bg-secondary" : ""}
                    transition-all duration-300 ease-in-out
                `}
			>
				<div>{this.props.animation.targetProperty}</div>

				<Button
					variant="ghost"
					className={`
                        w-8 h-8 p-1
                        ${this.props.animationEditor.state.selectedAnimation === this.props.animation ? "opacity-100" : "opacity-0"}
                        transition-all duration-300 ease-in-out
                    `}
					onClick={() => this.props.onRemove(this.props.animation)}
				>
					<HiOutlineTrash className="w-5 h-5" />
				</Button>
			</div>
		);
	}
}
