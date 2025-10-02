/**
 * VFX Editor Types and Interfaces
 */

import { ParticleSystem, GPUParticleSystem, SolidParticleSystem, Scene, Engine, ArcRotateCamera, Mesh } from "babylonjs";

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

// Animation property types that can be animated
export type AnimatableProperty = "position" | "rotation" | "scaling" | "color" | "visibility";

// Keyframe for animation
export interface IAnimationKeyframe {
	time: number; // Time in seconds (0-1 normalized or absolute)
	value: any; // Value at this keyframe
	easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

// Animation track for a specific property
export interface IAnimationTrack {
	property: AnimatableProperty;
	component: "x" | "y" | "z" | "r" | "g" | "b" | "a" | "all"; // Which component of the property
	keyframes: IAnimationKeyframe[];
	loop: boolean;
}

// Animation settings with timeline
export interface ISPSAnimationSettings {
	duration: number; // Total duration in seconds
	autoReset: boolean;
	loop: boolean;
	// Animation tracks for different properties
	tracks: IAnimationTrack[];
	// Serialized function data
	initParticlesData?: string;
	updateParticleData?: string;
	// Initial particle states
	initialParticleStates?: Array<{
		position: { x: number; y: number; z: number };
		rotation: { x: number; y: number; z: number };
		scaling: { x: number; y: number; z: number };
		color: { r: number; g: number; b: number; a: number };
	}>;
}

// Solid Particle System Component
export interface IVFXSolidParticleSystem extends IVFXComponent {
	type: "solid_particle_system";
	babylonSPS: SolidParticleSystem | null;
	particleCount: number;
	size: number;
	templateMesh?: Mesh; // Шаблон меша для создания SPS
	animationSettings?: ISPSAnimationSettings;
	// Animation loop properties
	_animationFrameId?: number;
	_animationLoop?: () => void;
	_animationStartTime?: number;
}

// Particle System Set (group of particle systems)
export interface IVFXParticleSystemSet extends IVFXComponent {
	type: "particle_system_set";
	particleSystems: (IVFXCPUParticleSystem | IVFXGPUParticleSystem)[];
}

// Emitter Mesh Component
export interface IVFXEmitterMesh extends IVFXComponent {
	type: "emitter_mesh";
	babylonMesh: Mesh;
}

// Union type for all VFX components
export type VFXComponent = IVFXCPUParticleSystem | IVFXGPUParticleSystem | IVFXSolidParticleSystem | IVFXParticleSystemSet | IVFXEmitterMesh;

export interface IVFXSettings {
	duration: number;
	loop: boolean;
	preview: boolean;
	quality?: "low" | "medium" | "high";
}

export interface IVFXFile {
	name: string;
	version: string;
	description: string;
	cpuParticles: IVFXCPUParticleSystem[];
	gpuParticles: IVFXGPUParticleSystem[];
	sps: IVFXSolidParticleSystem[];
	particleSystemSets: IVFXParticleSystemSet[];
	settings: IVFXSettings;
	created: string;
	modified: string;
	author?: string;
	tags?: string[];
}

// VFX Editor Window Props
export interface IVFXEditorWindowProps {
	filePath: string;
}

// VFX Editor Window State
export interface IVFXEditorWindowState {
	vfxData: IVFXFile | null;
	selectedComponent: VFXComponent | null;
	playing: boolean;
	scene: Scene | null;
	engine: Engine | null;
	camera: ArcRotateCamera | null;
	search: string;
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
