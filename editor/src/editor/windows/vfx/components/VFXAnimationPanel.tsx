import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../../layout/animation";
import { Editor } from "../../../main";
import { VFXComponent } from "../types";

export interface IVFXAnimationPanelProps {
	editor: Editor;
	selectedComponent: VFXComponent | null;
	scene: any;
	onAnimationUpdate?: (sps: VFXComponent) => void;
}

export class VFXAnimationPanel extends Component<IVFXAnimationPanelProps> {
	private _animation: EditorAnimation;

	public constructor(props: IVFXAnimationPanelProps) {
		super(props);
	}

	public setEditedObject(object: VFXComponent | null): void {
		this._animation.setEditedObject(object);
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				<EditorAnimation editor={this.props.editor} ref={(r) => (this._animation = r!)} />
			</div>
		);
	}
}
