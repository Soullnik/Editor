import { Component, ReactNode } from "react";
import { EditorAnimation } from "../../../layout/animation";
import { Editor } from "../../../main";
import { VFXComponent } from "../types";

export interface IVFXAnimationPanelProps {
	editor: Editor;
	selectedComponent: VFXComponent | null;
}

export class VFXAnimationPanel extends Component<IVFXAnimationPanelProps> {
	private _animation: EditorAnimation;

	public constructor(props: IVFXAnimationPanelProps) {
		super(props);
	}

	public componentDidUpdate(prevProps: IVFXAnimationPanelProps): void {
		if (prevProps.selectedComponent !== this.props.selectedComponent) {
			this._animation.setEditedObject(this.props.selectedComponent?.babylonSystem);
		}
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				<EditorAnimation editor={this.props.editor} ref={(r) => (this._animation = r!)} />
			</div>
		);
	}
}
