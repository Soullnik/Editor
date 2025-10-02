import { Component, ReactNode } from "react";

import { IoPlay, IoStop, IoRefresh } from "react-icons/io5";

import { Button } from "../../../../ui/shadcn/ui/button";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorMeshInspector } from "../mesh/mesh";

import { IEditorInspectorImplementationProps } from "../inspector";
import { IVFXSolidParticleSystem } from "../../../windows/vfx/types";

export interface IEditorSolidParticleSystemInspectorState {
	started: boolean;
}

export class EditorSolidParticleSystemInspector extends Component<IEditorInspectorImplementationProps<IVFXSolidParticleSystem>, IEditorSolidParticleSystemInspectorState> {
	/**
	 * Returns whether or not the given object is supported by this inspector.
	 * @param object defines the object to check.
	 * @returns true if the object is supported by this inspector.
	 */
	public static IsSupported(object: unknown): boolean {
		return (object as any)?.type === "solid_particle_system";
	}

	public constructor(props: IEditorInspectorImplementationProps<IVFXSolidParticleSystem>) {
		super(props);

		this.state = {
			started: props.object.babylonSPS !== null,
		};
	}

	public render(): ReactNode {
		return (
			<>
				<EditorInspectorSectionField title="Common">
					<div className="flex justify-between items-center px-2 py-2">
						<div className="w-1/2">Type</div>
						<div className="text-white/50">SolidParticleSystem</div>
					</div>

					<EditorInspectorStringField label="Name" object={this.props.object} property="name" onChange={() => this.forceUpdate()} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Actions">
					<div className="flex justify-center items-center gap-2">
						<Button
							onClick={() => this._handleStartOrStop()}
							className={`
                                w-10 h-10 bg-muted/50 !rounded-lg p-0.5
                                ${this.state.started ? "!bg-red-500/35" : "hover:!bg-green-500/35"}
                                transition-all duration-300 ease-in-out
                            `}
						>
							{this.state.started ? <IoStop className="w-6 h-6" strokeWidth={1} color="red" /> : <IoPlay className="w-6 h-6" strokeWidth={1} color="green" />}
						</Button>

						<Button onClick={() => this.props.object.babylonSPS?.rebuildMesh(true)} className="w-10 h-10 bg-muted/50 !rounded-lg p-0.5">
							<IoRefresh className="w-6 h-6" strokeWidth={1} color="red" />
						</Button>
					</div>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Particles">
					<EditorInspectorNumberField object={this.props.object} property="particleCount" label="Particle Count" min={0} />

					<EditorInspectorNumberField object={this.props.object} property="size" label="Size" min={0} step={0.1} />
				</EditorInspectorSectionField>

				{this.props.object.templateMesh && (
					<EditorInspectorSectionField title="Template Mesh">
						<div className="flex flex-col w-full h-full">
							<div className="flex-1 overflow-auto">
								<EditorMeshInspector editor={this.props.editor} object={this.props.object.templateMesh} />
							</div>
						</div>
					</EditorInspectorSectionField>
				)}

				{this.props.object.babylonSPS && (
					<EditorInspectorSectionField title="SPS Properties">
						<EditorInspectorNumberField object={this.props.object.babylonSPS} property="nbParticles" label="Active Particles" min={0} />
					</EditorInspectorSectionField>
				)}
			</>
		);
	}

	private _handleStartOrStop(): void {
		if (this.state.started) {
			this.setState({
				started: false,
			});
		} else {
			this.setState({
				started: true,
			});
		}
	}
}
