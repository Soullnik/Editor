/**
 * VFX Editor Types and Interfaces
 */

import { ParticleSystem, GPUParticleSystem, SolidParticleSystem, Mesh } from "babylonjs";

// Base component interface
export interface IVFXComponent {
	id: string;
	name: string;
	active: boolean;
	filePath?: string;
	type: string;
}

// CPU Particle System Component
export interface IVFXCPUParticleSystem extends IVFXComponent {
	type: "cpu_particle_system";
	babylonSystem: ParticleSystem;
}

// GPU Particle System Component
export interface IVFXGPUParticleSystem extends IVFXComponent {
	type: "gpu_particle_system";
	babylonSystem: GPUParticleSystem;
}

// SPS Particle definition
export interface ISPSParticle {
	id: number;
	name: string;
	enabled: boolean;
	// Animation tracks for this specific particle
	animations: ISPSParticleAnimation[];
}

// SPS Animation for a specific particle
export interface ISPSParticleAnimation {
	id: string;
	name: string;
	property: "position" | "rotation" | "scaling" | "color" | "visibility";
	component: "x" | "y" | "z" | "r" | "g" | "b" | "a";
	enabled: boolean;
	keyframes: ISPSAnimationKeyframe[];
	loop: boolean;
	randomize: boolean;
	randomRange: number; // 0-1, percentage of randomness
}

// SPS Animation keyframe
export interface ISPSAnimationKeyframe {
	time: number; // Time in seconds (0-1 normalized)
	value: number; // Value at this keyframe
	easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

// SPS Animation settings
export interface ISPSAnimationSettings {
	duration: number; // Total duration in seconds
	autoReset: boolean;
	loop: boolean;
	particles: ISPSParticle[];
}

// Solid Particle System Component
export interface IVFXSolidParticleSystem extends IVFXComponent {
	type: "solid_particle_system";
	babylonSPS: SolidParticleSystem | null;
	particleCount: number;
	size: number;
	templateMesh?: Mesh; // Template mesh for creating SPS
	animationSettings: ISPSAnimationSettings;
	// Animation state
	isAnimating: boolean;
	currentAnimationTime: number;
	selectedParticleId: number | null; // Currently selected particle for editing
}

// Particle System Set (group of particle systems)
export interface IVFXParticleSystemSet extends IVFXComponent {
	type: "particle_system_set";
	particleSystems: (IVFXCPUParticleSystem | IVFXGPUParticleSystem)[];
}

// Union type for all VFX components
export type VFXComponent = IVFXCPUParticleSystem | IVFXGPUParticleSystem | IVFXSolidParticleSystem | IVFXParticleSystemSet;

// VFX File structure
export interface IVFXFile {
	version: string;
	components: VFXComponent[];
	metadata?: {
		created: string;
		author?: string;
		description?: string;
	};
}

// VFX Editor Window State
export interface IVFXEditorWindowState {
	components: VFXComponent[];
	selectedComponent: VFXComponent | null;
	playing: boolean;
	canvasRef: HTMLCanvasElement | null;
}

// VFX Editor Window Instance (for passing to child components)
export interface IVFXEditorWindow {
	state: IVFXEditorWindowState;
	setState: (state: any) => void;
	close: () => void;
	removeComponent: (id: string) => void;
	getAllComponents: () => VFXComponent[];
	play: () => void;
	stop: () => void;
	save: () => Promise<void>;
	canvasRef: HTMLCanvasElement | null;
}

// Re-export SPS animation types
export type { ISpsAnimatable, ISpsAnimation, ISpsAnimationKeyframe } from "./sps-animation-types";
export { SpsAnimationUtils } from "./sps-animation-types";
