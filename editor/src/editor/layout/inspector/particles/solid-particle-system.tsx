import { Component, ReactNode } from "react";

import { IoPlay, IoStop, IoRefresh } from "react-icons/io5";

import { SolidParticleSystem } from "babylonjs";

import { Button } from "../../../../ui/shadcn/ui/button";

import { isSolidParticleSystem } from "../../../../tools/guards/particles";

import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorVectorField } from "../fields/vector";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorTextureField } from "../fields/texture";

import { IEditorInspectorImplementationProps } from "../inspector";

export interface IEditorSolidParticleSystemInspectorState {
	started: boolean;
}

export class EditorSolidParticleSystemInspector extends Component<IEditorInspectorImplementationProps<SolidParticleSystem>, IEditorSolidParticleSystemInspectorState> {
	/**
	 * Returns whether or not the given object is supported by this inspector.
	 * @param object defines the object to check.
	 * @returns true if the object is supported by this inspector.
	 */
	public static IsSupported(object: unknown): boolean {
		return isSolidParticleSystem(object);
	}

	public constructor(props: IEditorInspectorImplementationProps<SolidParticleSystem>) {
		super(props);

		this.state = {
			started: props.object.nbParticles > 0,
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

					<EditorInspectorStringField
						label="Name"
						object={this.props.object}
						property="name"
						onChange={() => this.forceUpdate()}
					/>
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

						<Button onClick={() => this.props.object.rebuildMesh(true)} className="w-10 h-10 bg-muted/50 !rounded-lg p-0.5">
							<IoRefresh className="w-6 h-6" strokeWidth={1} color="red" />
						</Button>
					</div>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Particles">
					<EditorInspectorNumberField
						object={this.props.object}
						property="nbParticles"
						label="Particle Count"
						min={0}
					/>

					<EditorInspectorNumberField
						object={this.props.object}
						property="counter"
						label="Counter"
						min={0}
					/>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Transforms">
					<EditorInspectorVectorField object={this.props.object.mesh} property="position" label="Position" />
					<EditorInspectorVectorField object={this.props.object.mesh} property="rotation" label="Rotation" />
					<EditorInspectorVectorField object={this.props.object.mesh} property="scaling" label="Scaling" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Materials">
					<EditorInspectorTextureField hideLevel hideSize object={this.props.object.mesh} property="material.diffuseTexture" title="Diffuse Texture" />
					<EditorInspectorTextureField hideLevel hideSize object={this.props.object.mesh} property="material.normalTexture" title="Normal Texture" />
					<EditorInspectorTextureField hideLevel hideSize object={this.props.object.mesh} property="material.emissiveTexture" title="Emissive Texture" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Visibility">
					<EditorInspectorSwitchField object={this.props.object} property="billboard" label="Billboard" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="recomputeNormals" label="Recompute Normals" onChange={() => this.forceUpdate()} />
					
					<EditorInspectorNumberField
						object={this.props.object}
						property="isAlwaysVisible"
						label="Always Visible"
						min={0}
						max={1}
						step={1}
						onChange={() => this.forceUpdate()}
					/>

					<EditorInspectorNumberField
						object={this.props.object}
						property="isVisibilityBoxLocked"
						label="Visibility Box Locked"
						min={0}
						max={1}
						step={1}
						onChange={() => this.forceUpdate()}
					/>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Performance">
					<EditorInspectorSwitchField object={this.props.object} property="computeParticleRotation" label="Compute Particle Rotation" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="computeParticleColor" label="Compute Particle Color" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="computeParticleTexture" label="Compute Particle Texture" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="computeParticleVertex" label="Compute Particle Vertex" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="computeBoundingBox" label="Compute Bounding Box" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="depthSortParticles" label="Depth Sort Particles" onChange={() => this.forceUpdate()} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Multi-Material">
					<EditorInspectorSwitchField object={this.props.object} property="multimaterialEnabled" label="Multi-Material Enabled" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="useModelMaterial" label="Use Model Material" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="autoUpdateSubMeshes" label="Auto Update Sub-Meshes" onChange={() => this.forceUpdate()} />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Advanced">
					<EditorInspectorSwitchField object={this.props.object} property="expandable" label="Expandable" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="_particlesIntersect" label="Particle Intersection" onChange={() => this.forceUpdate()} />
					<EditorInspectorSwitchField object={this.props.object} property="_bSphereOnly" label="Bounding Sphere Only" onChange={() => this.forceUpdate()} />
					
					<EditorInspectorNumberField
						object={this.props.object}
						property="_bSphereRadiusFactor"
						label="Bounding Sphere Radius Factor"
						min={0.1}
						max={2.0}
						step={0.1}
						onChange={() => this.forceUpdate()}
					/>
				</EditorInspectorSectionField>
			</>
		);
	}

	private _handleStartOrStop(): void {
		if (this.state.started) {
			// For SPS, we can't really "stop" particles, but we can hide them
			this.props.object.mesh.setEnabled(false);
			this.setState({
				started: false,
			});
		} else {
			// For SPS, we can "start" by enabling the mesh
			this.props.object.mesh.setEnabled(true);
			this.setState({
				started: true,
			});
		}
	}
}
