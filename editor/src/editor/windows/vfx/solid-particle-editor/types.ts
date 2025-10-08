export interface ISolidParticleNode {
	id: string;
	type: "particle" | "animation" | "property" | "math" | "time" | "input" | "output" | "constant" | "noise" | "curve";
	position: { x: number; y: number };
	title: string;
	inputs: INodeInput[];
	outputs: INodeOutput[];
	data: any;
	width: number;
	height: number;
}

export interface INodeInput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean" | "animation";
	value?: any;
	connected: boolean;
	position: { x: number; y: number };
}

export interface INodeOutput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean" | "animation";
	position: { x: number; y: number };
}

export interface INodeConnection {
	id: string;
	fromNode: string;
	fromOutput: string;
	toNode: string;
	toInput: string;
}

export interface INodeTemplate {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	color: string;
	createNode: (position: { x: number; y: number }) => ISolidParticleNode;
}

export interface ISolidParticleEditorState {
	selectedParticle: any | null;
	graphNodes: ISolidParticleNode[];
	connections: INodeConnection[];
	selectedNode: string | null;
	dragging: boolean;
	dragOffset: { x: number; y: number };
	zoom: number;
	pan: { x: number; y: number };
}
