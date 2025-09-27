import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../../layout/animation";
import { Editor } from "../../../main";

export interface IVFXAnimationPanelProps {
	selectedComponent: any;
	scene: any;
}

export class VFXAnimationPanel extends Component<IVFXAnimationPanelProps> {
	private _mockEditor: Editor;
	
	private _animation: EditorAnimation;

	public constructor(props: IVFXAnimationPanelProps) {
		super(props);

		// Create mock editor for animation panel
		this._mockEditor = {
			state: {
				enableExperimentalFeatures: true,
			},
		} as Editor;
	}

	public setEditedObject(object: unknown): void {
		this._animation.setEditedObject(object);
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				<EditorAnimation editor={this._mockEditor} ref={(r) => (this._animation = r!)} />
			</div>
		);
	}
}
