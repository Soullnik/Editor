/**
 * VFX File Types and Interfaces
 */

export interface IVFXNode {
	id: string;
	type: VFXNodeType;
	name: string;
	position: { x: number; y: number };
	inputs: IVFXNodeInput[];
	outputs: IVFXNodeOutput[];
	properties: Record<string, any>;
	active: boolean;
}

export interface IVFXNodeInput {
	id: string;
	name: string;
	type: string;
	connected: boolean;
	connectionId?: string;
}

export interface IVFXNodeOutput {
	id: string;
	name: string;
	type: string;
	connections: string[];
}

export interface IVFXConnection {
	id: string;
	fromNodeId: string;
	fromOutputId: string;
	toNodeId: string;
	toInputId: string;
}

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
	nodes: IVFXNode[];
	connections: IVFXConnection[];
	settings: IVFXSettings;
	created: string;
	modified: string;
	author?: string;
	tags?: string[];
}

export enum VFXNodeType {
	// Particle Systems
	PARTICLE_SYSTEM = "particle_system",
	SOLID_PARTICLE_SYSTEM = "solid_particle_system",

	// Emitters
	MESH_EMITTER = "mesh_emitter",
	POINT_EMITTER = "point_emitter",
	BOX_EMITTER = "box_emitter",
	SPHERE_EMITTER = "sphere_emitter",

	// Materials
	MATERIAL = "material",
	PBR_MATERIAL = "pbr_material",
	STANDARD_MATERIAL = "standard_material",

	// Animation
	ANIMATION = "animation",
	KEYFRAME_ANIMATION = "keyframe_animation",

	// Lighting
	LIGHT = "light",
	DIRECTIONAL_LIGHT = "directional_light",
	POINT_LIGHT = "point_light",
	SPOT_LIGHT = "spot_light",

	// Sound
	SOUND = "sound",
	SPATIAL_SOUND = "spatial_sound",

	// Logic
	TRIGGER = "trigger",
	DELAY = "delay",
	BLEND = "blend",
	MULTIPLY = "multiply",
	ADD = "add",
	SUBTRACT = "subtract",
	CONDITION = "condition",
	LOOP = "loop",
	SEQUENCE = "sequence",

	// Effects
	POST_PROCESS = "post_process",
	BLOOM = "bloom",
	BLUR = "blur",
	GLOW = "glow",

	// Physics
	PHYSICS = "physics",
	COLLISION = "collision",
	FORCE = "force",
}
