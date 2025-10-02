import { Component, ReactNode } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { IVFXSolidParticleSystem, ISPSParticleAnimation } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { SPSSAnimationEditor } from "../sps-animation-editor";
import { SPSSAnimationTrackItem } from "./sps-track-item";
import { showAddSPSTrackPrompt } from "./sps-add-track";

export interface ISPSAnimationTracksPanelProps {
	spsComponent: IVFXSolidParticleSystem;
	animationEditor: SPSSAnimationEditor;
}

export class SPSSAnimationTracksPanel extends Component<ISPSAnimationTracksPanelProps> {
	public render(): ReactNode {
		const selectedParticle = this.props.animationEditor.state.selectedParticle;
		if (selectedParticle === null) {
			return this._getEmpty();
		}

		const particle = this.props.spsComponent.animationSettings.particles.find((p) => p.id === selectedParticle);
		if (!particle) {
			return this._getEmpty();
		}

		return (
			<div className="flex flex-col w-96 h-full">
				<div className="flex justify-between items-center w-full h-10 p-2">
					<div className="font-thin text-muted-foreground">({particle.animations.length} tracks)</div>
					<Button variant="ghost" className="w-8 h-8 p-1" onClick={() => this.addTrack()}>
						<AiOutlinePlus className="w-5 h-5" />
					</Button>
				</div>

				<div className="flex flex-col w-full">
					{particle.animations.map((animation, index) => (
						<SPSSAnimationTrackItem
							key={`${animation.property}_${animation.component}_${index}`}
							animation={animation}
							animationEditor={this.props.animationEditor}
							onRemove={(animation) => this._handleRemoveTrack(animation)}
						/>
					))}
				</div>
			</div>
		);
	}

	private _getEmpty(): ReactNode {
		return <div className="flex justify-center items-center text-center font-semibold text-xl w-96 h-full">No particle selected.</div>;
	}

	/**
	 * Shows a prompt to add a new track to the selected particle
	 */
	public async addTrack(): Promise<void> {
		const selectedParticle = this.props.animationEditor.state.selectedParticle;
		if (selectedParticle === null) return;

		const animation = await showAddSPSTrackPrompt();
		if (!animation) {
			return;
		}

		const particle = this.props.spsComponent.animationSettings.particles.find((p) => p.id === selectedParticle);
		if (particle) {
			particle.animations.push(animation);
			this.props.animationEditor.forceUpdate();
		}
	}

	private _handleRemoveTrack(animation: ISPSParticleAnimation): void {
		const selectedParticle = this.props.animationEditor.state.selectedParticle;
		if (selectedParticle === null) return;

		const particle = this.props.spsComponent.animationSettings.particles.find((p) => p.id === selectedParticle);
		if (particle) {
			const index = particle.animations.findIndex((a) => a.id === animation.id);
			if (index !== -1) {
				particle.animations.splice(index, 1);
				this.props.animationEditor.forceUpdate();
			}
		}
	}
}
