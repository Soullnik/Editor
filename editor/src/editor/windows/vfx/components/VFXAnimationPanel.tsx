import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../../layout/animation";
import { Editor } from "../../../main";
import { VFXComponent, IVFXSolidParticleSystem } from "../types";
import { SPSSAnimationEditor } from "../animation/sps-animation-editor";

export interface IVFXAnimationPanelProps {
	editor: Editor;
	selectedComponent: VFXComponent | null;
	scene: any;
	onAnimationUpdate?: (sps: VFXComponent) => void;
}

export class VFXAnimationPanel extends Component<IVFXAnimationPanelProps> {
	private _animation: EditorAnimation;
	private _spsAnimation: SPSSAnimationEditor;

	public constructor(props: IVFXAnimationPanelProps) {
		super(props);
	}

	public setEditedObject(object: VFXComponent | null): void {
		// Check if the selected component is an SPS
		if (object && object.type === "solid_particle_system") {
			// Use SPS animation editor
			this._spsAnimation?.setEditedObject(object as IVFXSolidParticleSystem);
		} else {
			// Use standard animation editor
			this._animation?.setEditedObject(object);
		}
	}

	public render(): ReactNode {
		const { selectedComponent } = this.props;

		// Show SPS animation editor for solid particle systems
		if (selectedComponent && selectedComponent.type === "solid_particle_system") {
			return (
				<div className="flex flex-col w-full h-full">
					<SPSSAnimationEditor
						editor={this.props.editor}
						spsComponent={selectedComponent as IVFXSolidParticleSystem}
						onAnimationUpdate={this.props.onAnimationUpdate}
						ref={(r) => (this._spsAnimation = r!)}
					/>
				</div>
			);
		}

		// Show standard animation editor for other components
		return (
			<div className="flex flex-col w-full h-full">
				<EditorAnimation editor={this.props.editor} ref={(r) => (this._animation = r!)} />
			</div>
		);
	}
}
