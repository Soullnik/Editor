import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../animation";
import { SolidParticle } from "babylonjs";

export interface IEditorAnimationParticleItemProps {
	particle: SolidParticle;
	animationEditor: EditorAnimation;
}

export class EditorAnimationParticleItem extends Component<IEditorAnimationParticleItemProps> {
	public render(): ReactNode {
		return (
			<div
				onClick={() => this.props.animationEditor.setState({ selectedParticle: this.props.particle })}
				className={`
                    flex justify-between items-center w-full h-10 p-2 ring-accent ring-1
                    ${this.props.animationEditor.state.selectedParticle === this.props.particle ? "bg-secondary" : ""}
                    transition-all duration-300 ease-in-out
                `}
			>
				<div>{this.props.particle.id}</div>
			</div>
		);
	}
}
