/**
 * VFX Editor Types and Interfaces
 */

import { ParticleSystem, GPUParticleSystem, ParticleSystemSet } from "babylonjs";
import { CustomSolidParticleSystem } from "../../../project/add/particles";
import { Mesh } from "babylonjs";

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
	babylonSystem: CustomSolidParticleSystem;
}

// Node Particle System Component
export interface IVFXNodeParticleSystem extends IVFXComponent {
	type: "node_particle_system";
	babylonSystem: ParticleSystemSet;
}

// Emitter Mesh Component
export interface IVFXEmitterMesh extends IVFXComponent {
	type: "emitter_mesh";
	babylonSystem: Mesh;
}

// Union type for all VFX components
export type VFXComponent = IVFXCPUParticleSystem | IVFXGPUParticleSystem | IVFXSolidParticleSystem | IVFXNodeParticleSystem | IVFXEmitterMesh;

// VFX File structure
export interface IVFXFile {
	version: string;
	components: VFXComponent[];
	name: string;
	settings: {
		duration: number;
		loop: boolean;
		preview: boolean;
	},
	metadata: {
		created: string;
		modified: string;
		author: string;
		description: string;
		tags: string[];
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
