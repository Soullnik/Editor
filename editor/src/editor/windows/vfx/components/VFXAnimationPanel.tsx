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

	public componentDidMount(): void {
		// Update animation target on mount after ref is set
		setTimeout(() => {
			this._updateAnimationTarget();
		}, 0);
	}

	public componentDidUpdate(prevProps: IVFXAnimationPanelProps): void {
		// Update animation panel when selected component changes
		if (prevProps.selectedComponent !== this.props.selectedComponent) {
			this._updateAnimationTarget();
		}
	}

	private _updateAnimationTarget(): void {
		if (!this._animation) {
			console.log("VFXAnimationPanel: _animation ref not set yet");
			return; // Wait for ref to be set
		}
		
		const { selectedComponent } = this.props;
		console.log("VFXAnimationPanel: Updating animation target", selectedComponent);
		
		if (selectedComponent && selectedComponent.type === "solid_particle_system") {
			// Create a mock animatable object for the SPS
			const animatableSPS = this._createAnimatableSPS(selectedComponent);
			console.log("VFXAnimationPanel: Created animatable SPS", animatableSPS);
			if (animatableSPS) {
				this._animation.setEditedObject(animatableSPS);
			} else {
				this._animation.setEditedObject(null);
			}
		} else {
			console.log("VFXAnimationPanel: No SPS component selected, clearing animation target");
			this._animation.setEditedObject(null);
		}
	}

	private _createAnimatableSPS(sps: VFXComponent): any {
		if (sps.type !== "solid_particle_system") {
			console.log("VFXAnimationPanel: Not a solid particle system", sps.type);
			return null;
		}
		
		console.log("VFXAnimationPanel: Creating animatable SPS", sps);
		
		// Create a mock object that looks like a Babylon.js animatable object
		// This will allow EditorAnimation to work with our SPS
		const animatable = {
			// Make it pass isAnyParticleSystem check
			getClassName: () => "SolidParticleSystem",
			
			// Required for IAnimatable
			animations: [],
			
			// Add properties that can be animated
			position: sps.babylonSPS?.mesh?.position || { x: 0, y: 0, z: 0 },
			rotation: sps.babylonSPS?.mesh?.rotation || { x: 0, y: 0, z: 0 },
			scaling: sps.babylonSPS?.mesh?.scaling || { x: 1, y: 1, z: 1 },
			
			// Add more animatable properties for SPS
			particleCount: sps.particleCount,
			size: sps.size,
			
			// Store reference to our SPS for updates
			_vfxSPS: sps,
			
			// Add method to apply animations to particles
			_applyParticleAnimation: (animation: any, time: number) => {
				this._applyAnimationToParticles(sps, animation, time);
			}
		};
		
		console.log("VFXAnimationPanel: Created animatable object", animatable);
		return animatable;
	}

	private _applyAnimationToParticles(sps: VFXComponent, animation: any, time: number): void {
		if (sps.type !== "solid_particle_system") return;
		if (!sps.babylonSPS || !sps.babylonSPS.particles) return;

		// Apply animation to all particles
		sps.babylonSPS.particles.forEach((particle) => {
			// Calculate animation value based on time
			const value = this._evaluateAnimation(animation, time);
			
			// Apply to particle based on animation property
			switch (animation.targetProperty) {
				case "position.x":
					particle.position.x = value;
					break;
				case "position.y":
					particle.position.y = value;
					break;
				case "position.z":
					particle.position.z = value;
					break;
				case "rotation.x":
					particle.rotation.x = value;
					break;
				case "rotation.y":
					particle.rotation.y = value;
					break;
				case "rotation.z":
					particle.rotation.z = value;
					break;
				case "scaling.x":
					particle.scaling.x = value;
					break;
				case "scaling.y":
					particle.scaling.y = value;
					break;
				case "scaling.z":
					particle.scaling.z = value;
					break;
			}
		});

		// Update particles
		sps.babylonSPS.setParticles();
	}

	private _evaluateAnimation(animation: any, time: number): number {
		// Simple animation evaluation - in real implementation this would be more complex
		if (!animation.keys || animation.keys.length === 0) return 0;
		
		// Find surrounding keys
		let beforeKey = animation.keys[0];
		let afterKey = animation.keys[animation.keys.length - 1];
		
		for (let i = 0; i < animation.keys.length - 1; i++) {
			if (time >= animation.keys[i].frame && time <= animation.keys[i + 1].frame) {
				beforeKey = animation.keys[i];
				afterKey = animation.keys[i + 1];
				break;
			}
		}
		
		// Interpolate
		const t = (time - beforeKey.frame) / (afterKey.frame - beforeKey.frame);
		return beforeKey.value + (afterKey.value - beforeKey.value) * t;
	}

	public setEditedObject(object: VFXComponent | null): void {
		this._animation.setEditedObject(object);
	}

	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				<EditorAnimation 
					editor={this.props.editor} 
					ref={(r) => (this._animation = r!)} 
				/>
			</div>
		);
	}
}
