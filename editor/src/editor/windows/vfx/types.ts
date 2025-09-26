/**
 * VFX Editor Types and Interfaces
 */

import { ParticleSystem, GPUParticleSystem, SolidParticleSystem, Scene, Engine, ArcRotateCamera } from "babylonjs";

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

// Solid Particle System Component
export interface IVFXSolidParticleSystem extends IVFXComponent {
	type: "solid_particle_system";
	babylonSPS: SolidParticleSystem;
	particleCount: number;
	size: number;
}

// Particle System Set (group of particle systems)
export interface IVFXParticleSystemSet extends IVFXComponent {
	type: "particle_system_set";
	particleSystems: (IVFXCPUParticleSystem | IVFXGPUParticleSystem)[];
}

// Union type for all VFX components
export type VFXComponent = IVFXCPUParticleSystem | IVFXGPUParticleSystem | IVFXSolidParticleSystem | IVFXParticleSystemSet;

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

// Component Panel Props
export interface IVFXComponentsPanelProps {
	vfxData: IVFXFile | null;
	selectedComponent: VFXComponent | null;
	search: string;
	scene: Scene | null;
	onSearchChange: (search: string) => void;
	onComponentSelect: (component: VFXComponent) => void;
	onComponentRemove: (id: string) => void;
	onComponentAdded: (component: VFXComponent) => void;
}

export interface IVFXPreviewPanelProps {
	scene: Scene | null;
	engine: Engine | null;
	onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

export interface IVFXInspectorPanelProps {
	selectedComponent: VFXComponent | null;
	scene: Scene | null;
	onComponentPropertyUpdate: (component: VFXComponent) => void;
}
