import { Component, ReactNode } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { IVFXSolidParticleSystem, ISPSParticle } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { SPSSAnimationEditor } from "../sps-animation-editor";
import { SPSSParticleItem } from "./sps-particle-item";

export interface ISPSAnimationParticlesPanelProps {
	spsComponent: IVFXSolidParticleSystem;
	animationEditor: SPSSAnimationEditor;
}

export class SPSSAnimationParticlesPanel extends Component<ISPSAnimationParticlesPanelProps> {
	public render(): ReactNode {
		const particles = this.props.spsComponent.animationSettings.particles;

		return (
			<div className="flex flex-col w-64 h-full">
				<div className="flex justify-between items-center w-full h-10 p-2">
					<div className="font-thin text-muted-foreground">({particles.length} particles)</div>
					<Button variant="ghost" className="w-8 h-8 p-1" onClick={() => this.addParticle()}>
						<AiOutlinePlus className="w-5 h-5" />
					</Button>
				</div>

				<div className="flex flex-col w-full">
					{particles.map((particle) => (
						<SPSSParticleItem
							key={particle.id}
							particle={particle}
							animationEditor={this.props.animationEditor}
							onRemove={(particle) => this._handleRemoveParticle(particle)}
						/>
					))}
				</div>
			</div>
		);
	}

	/**
	 * Adds a new particle to the SPS animation
	 */
	public addParticle(): void {
		if (!this.props.spsComponent) return;

		const newParticle: ISPSParticle = {
			id: this.props.spsComponent.animationSettings.particles.length,
			name: `Particle ${this.props.spsComponent.animationSettings.particles.length + 1}`,
			enabled: true,
			animations: [],
		};

		this.props.spsComponent.animationSettings.particles.push(newParticle);

		// Update the actual SPS particle count
		if (this.props.spsComponent.babylonSPS) {
			// TODO: Rebuild SPS with new particle count
			console.log("Need to rebuild SPS with new particle count:", this.props.spsComponent.animationSettings.particles.length);
		}

		this.props.animationEditor.forceUpdate();
	}

	private _handleRemoveParticle(particle: ISPSParticle): void {
		if (!this.props.spsComponent) return;

		const index = this.props.spsComponent.animationSettings.particles.findIndex((p) => p.id === particle.id);
		if (index !== -1) {
			this.props.spsComponent.animationSettings.particles.splice(index, 1);
			this.props.animationEditor.forceUpdate();
		}
	}
}
