import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../animation";

import { EditorAnimationParticleItem } from "./item";
import { Mesh, SolidParticle } from "babylonjs";

export interface IEditorAnimationParticlesPanelProps {
	mesh: Mesh;
	particles: SolidParticle[] | null;
	animationEditor: EditorAnimation;
}

export class EditorAnimationParticlesPanel extends Component<IEditorAnimationParticlesPanelProps> {
	public render(): ReactNode {
		if (this.props.particles) {
			return this._getParticlesList(this.props.particles);
		}

		return this._getEmpty();
	}

	private _getEmpty(): ReactNode {
		return <div className="flex justify-center items-center text-center font-semibold text-xl w-96 h-full">No object selected.</div>;
	}

	private _getParticlesList(particles: SolidParticle[]): ReactNode {
		return (
			<div className="flex flex-col w-96 h-full">
				<div className="flex justify-center items-center w-full h-10 p-2">
					<div className="font-thin text-muted-foreground">({this.props.mesh.name})</div>
				</div>
				<div className="flex justify-between items-center w-full h-10 p-2">
					<div className="font-thin text-muted-foreground">({particles.length} particles)</div>
				</div>
				<div className="flex flex-col w-full">
					{particles.map((particle) => (
						<EditorAnimationParticleItem key={particle.id} particle={particle} animationEditor={this.props.animationEditor} />
					))}
				</div>
			</div>
		);
	}
}
