import { Component, ReactNode } from "react";
import { AiOutlinePlus } from "react-icons/ai";

import { Button } from "../../../../ui/shadcn/ui/button";

import { registerUndoRedo } from "../../../../tools/undoredo";

import { EditorAnimation } from "../../animation";

import { EditorAnimationParticleItem } from "./item";
import { ISpsAnimatable } from "../../../windows/vfx/types";
import { SpsAnimation } from "../../../windows/vfx/sps-animation-types";

export interface IEditorAnimationParticlesPanelProps {
	animatable: ISpsAnimatable | null;
	animationEditor: EditorAnimation;
}

export class EditorAnimationParticlesPanel extends Component<IEditorAnimationParticlesPanelProps> {
	public render(): ReactNode {
		if (this.props.animatable) {
			return this._getParticlesList(this.props.animatable);
		}

		return this._getEmpty();
	}

	private _getEmpty(): ReactNode {
		return <div className="flex justify-center items-center text-center font-semibold text-xl w-96 h-full">No object selected.</div>;
	}

	private _getParticlesList(animatable: ISpsAnimatable): ReactNode {
		return (
			<div className="flex flex-col w-96 h-full">
				<div className="flex justify-between items-center w-full h-10 p-2">
					<div className="font-thin text-muted-foreground">({animatable.counter} particles)</div>

					<Button variant="ghost" className="w-8 h-8 p-1" onClick={() => this.addParticle()}>
						<AiOutlinePlus className="w-5 h-5" />
					</Button>
				</div>

				<div className="flex flex-col w-full">
					{new Array(animatable.counter).fill(0).map((_, index) => (
						<EditorAnimationParticleItem
							key={`${animatable.mesh.name}_${index}`}
							particleId={index}
							animationEditor={this.props.animationEditor}
							onRemove={(animation) => this._handleRemoveParticle(animation)}
						/>
					))}
				</div>
			</div>
		);
	}

	/**
	 * Shows a prompt to add a new particle to the animatable object.
	 * Aka. animate a property on the currently selected animatable.
	 */
	public async addParticle(): Promise<unknown> {
		const animatable = this.props.animatable;
		if (!animatable) {
			return;
		}

		const animation = new SpsAnimation(animatable.counter);

		registerUndoRedo({
			undo: () => {
				const index = animatable.animations?.indexOf(animation) ?? -1;
				if (index !== -1) {
					animatable.animations?.splice(index, 1);
					animatable.counter--;
				}
			},
			redo: () => {
				animatable.animations?.push(animation);
				animatable.counter++;
			},
			executeRedo: true,
		});

		this.props.animationEditor.forceUpdate();
	}

	private _handleRemoveParticle(animation: SpsAnimation): void {
		const animatable = this.props.animatable;
		if (!animatable) {
			return;
		}

		const index = animatable.animations?.indexOf(animation) ?? -1;
		if (index === -1) {
			return;
		}

		registerUndoRedo({
			executeRedo: true,
			undo: () => {
				animatable.animations?.splice(index, 0, animation);
				animatable.counter++;
			},
			redo: () => {
				animatable.animations?.splice(index, 1);
				animatable.counter--;
			},
		});

		this.props.animationEditor.forceUpdate();
	}
}
