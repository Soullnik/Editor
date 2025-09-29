import { Component, ReactNode } from "react";

import { IoPlay, IoStop, IoRefresh } from "react-icons/io5";

import { SolidParticleSystem, Vector3, Color4 } from "babylonjs";

import { Button } from "../../../../ui/shadcn/ui/button";


import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorNumberField } from "../fields/number";
import { EditorInspectorSectionField } from "../fields/section";
import { EditorMeshInspector } from "../mesh/mesh";

import { IEditorInspectorImplementationProps } from "../inspector";
import { IVFXSolidParticleSystem } from "../../../windows/vfx/types";
import { SPSAnimationUtility } from "../../../windows/vfx/utils/sps-animation";

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

						<Button onClick={() => this.props.object.babylonSPS?.rebuildMesh(true)} className="w-10 h-10 bg-muted/50 !rounded-lg p-0.5">
							<IoRefresh className="w-6 h-6" strokeWidth={1} color="red" />
						</Button>
					</div>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Particles">
					<EditorInspectorNumberField
						object={this.props.object}
						property="particleCount"
						label="Particle Count"
						min={0}
					/>

					<EditorInspectorNumberField
						object={this.props.object}
						property="size"
						label="Size"
						min={0}
						step={0.1}
					/>
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
						<EditorInspectorNumberField
							object={this.props.object.babylonSPS}
							property="nbParticles"
							label="Active Particles"
							min={0}
						/>
					</EditorInspectorSectionField>
				)}
			</>
		);
	}

	private _handleStartOrStop(): void {
		if (this.state.started) {
			// Stop SPS animation
			if (this.props.object.babylonSPS) {
				this.props.object.babylonSPS.dispose();
				this.props.object.babylonSPS = null;
			}
			this.setState({
				started: false,
			});
		} else {
			// Create and start SPS animation
			this._createSPSAnimation();
			this.setState({
				started: true,
			});
		}
	}

	private _createSPSAnimation(): void {
		const sps = this.props.object;
		if (!sps.templateMesh) return;

		// Create SPS if not exists
		if (!sps.babylonSPS) {
			sps.babylonSPS = new SolidParticleSystem(sps.name, this.props.editor.layout.preview.scene, {
				useModelMaterial: true,
			});
			sps.babylonSPS.addShape(sps.templateMesh, sps.particleCount);
			sps.babylonSPS.buildMesh();
		}

		// Initialize particles function
		sps.babylonSPS.initParticles = () => {
			if (!sps.babylonSPS) return;
			
			for (let p = 0; p < sps.babylonSPS.nbParticles; p++) {
				const particle = sps.babylonSPS.particles[p];
				// Initialize with default values
				particle.position = new Vector3(0, 0.05, 0);
				particle.scaling = new Vector3(1.0, 1.0, 1.0);
				particle.rotation = new Vector3(0, 0, 0);
				particle.color = new Color4(0.33, 0.49, 0.88, 1);
			}
		};

		// Update particles function - will be controlled by EditorAnimation
		sps.babylonSPS.updateParticle = (particle) => {
			// Add some basic shockwave behavior
			this._applyShockwaveBehavior(particle, Date.now() * 0.001);
			return particle;
		};

		// Initialize particles
		sps.babylonSPS.initParticles();
		sps.babylonSPS.setParticles();

		// Save the animation state for later playback
		SPSAnimationUtility.saveAnimationState(sps);
	}

	private _applyShockwaveBehavior(particle: any, time: number): void {
		// Add alternating rotation speed (like in original shockwave)
		if (particle.id % 2 === 0) {
			particle.rotation.y += 0.06;
		} else {
			particle.rotation.y -= 0.06;
		}
		
		// Add some wave-like movement
		particle.position.x = Math.sin(time * Math.PI * 2 + particle.id * 0.5) * 0.1;
		particle.position.z = Math.cos(time * Math.PI * 2 + particle.id * 0.5) * 0.1;
	}


}
