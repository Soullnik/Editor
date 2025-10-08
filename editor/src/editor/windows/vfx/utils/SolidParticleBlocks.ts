import { Vector3, Color3, Animation } from "babylonjs";
import { CustomSolidParticle } from "../custom-sps";

export interface ISolidParticleBlock {
	id: string;
	name: string;
	type: "input" | "output" | "math" | "animation" | "property" | "time";
	inputs: IBlockInput[];
	outputs: IBlockOutput[];
	data: any;
}

export interface IBlockInput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean";
	value?: any;
	connected: boolean;
}

export interface IBlockOutput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean";
}

export class SolidParticleBlockFactory {
	/**
	 * Create a particle input block
	 */
	public static createParticleInputBlock(): ISolidParticleBlock {
		return {
			id: `particle_input_${Date.now()}`,
			name: "Particle Input",
			type: "input",
			inputs: [],
			outputs: [
				{ id: "position", name: "Position", type: "vector3" },
				{ id: "rotation", name: "Rotation", type: "vector3" },
				{ id: "scaling", name: "Scaling", type: "vector3" },
				{ id: "color", name: "Color", type: "color3" },
			],
			data: {},
		};
	}

	/**
	 * Create a position animation block
	 */
	public static createPositionAnimationBlock(): ISolidParticleBlock {
		return {
			id: `position_anim_${Date.now()}`,
			name: "Position Animation",
			type: "animation",
			inputs: [
				{ id: "startPos", name: "Start Position", type: "vector3", connected: false },
				{ id: "endPos", name: "End Position", type: "vector3", connected: false },
				{ id: "duration", name: "Duration", type: "number", connected: false, value: 1 },
			],
			outputs: [{ id: "position", name: "Position", type: "vector3" }],
			data: {
				animationType: "position",
				duration: 1,
				loop: false,
				easing: "linear",
			},
		};
	}

	/**
	 * Create a rotation animation block
	 */
	public static createRotationAnimationBlock(): ISolidParticleBlock {
		return {
			id: `rotation_anim_${Date.now()}`,
			name: "Rotation Animation",
			type: "animation",
			inputs: [
				{ id: "startRot", name: "Start Rotation", type: "vector3", connected: false },
				{ id: "endRot", name: "End Rotation", type: "vector3", connected: false },
				{ id: "duration", name: "Duration", type: "number", connected: false, value: 1 },
			],
			outputs: [{ id: "rotation", name: "Rotation", type: "vector3" }],
			data: {
				animationType: "rotation",
				duration: 1,
				loop: false,
				easing: "linear",
			},
		};
	}

	/**
	 * Create a scaling animation block
	 */
	public static createScalingAnimationBlock(): ISolidParticleBlock {
		return {
			id: `scaling_anim_${Date.now()}`,
			name: "Scaling Animation",
			type: "animation",
			inputs: [
				{ id: "startScale", name: "Start Scale", type: "vector3", connected: false },
				{ id: "endScale", name: "End Scale", type: "vector3", connected: false },
				{ id: "duration", name: "Duration", type: "number", connected: false, value: 1 },
			],
			outputs: [{ id: "scaling", name: "Scaling", type: "vector3" }],
			data: {
				animationType: "scaling",
				duration: 1,
				loop: false,
				easing: "linear",
			},
		};
	}

	/**
	 * Create a color animation block
	 */
	public static createColorAnimationBlock(): ISolidParticleBlock {
		return {
			id: `color_anim_${Date.now()}`,
			name: "Color Animation",
			type: "animation",
			inputs: [
				{ id: "startColor", name: "Start Color", type: "color3", connected: false },
				{ id: "endColor", name: "End Color", type: "color3", connected: false },
				{ id: "duration", name: "Duration", type: "number", connected: false, value: 1 },
			],
			outputs: [{ id: "color", name: "Color", type: "color3" }],
			data: {
				animationType: "color",
				duration: 1,
				loop: false,
				easing: "linear",
			},
		};
	}

	/**
	 * Create a math block
	 */
	public static createMathBlock(operation: "add" | "subtract" | "multiply" | "divide" | "sin" | "cos" | "lerp"): ISolidParticleBlock {
		return {
			id: `math_${operation}_${Date.now()}`,
			name: `${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
			type: "math",
			inputs: this._getMathInputs(operation),
			outputs: [{ id: "result", name: "Result", type: "number" }],
			data: { operation },
		};
	}

	/**
	 * Create a time block
	 */
	public static createTimeBlock(): ISolidParticleBlock {
		return {
			id: `time_${Date.now()}`,
			name: "Time",
			type: "time",
			inputs: [],
			outputs: [
				{ id: "time", name: "Time", type: "number" },
				{ id: "delta", name: "Delta", type: "number" },
				{ id: "normalized", name: "Normalized", type: "number" },
			],
			data: {},
		};
	}

	/**
	 * Create a constant value block
	 */
	public static createConstantBlock(valueType: "vector3" | "color3" | "number" | "boolean", value: any): ISolidParticleBlock {
		return {
			id: `constant_${valueType}_${Date.now()}`,
			name: "Constant",
			type: "input",
			inputs: [],
			outputs: [{ id: "value", name: "Value", type: valueType }],
			data: { value, valueType },
		};
	}

	/**
	 * Create a noise block for random values
	 */
	public static createNoiseBlock(): ISolidParticleBlock {
		return {
			id: `noise_${Date.now()}`,
			name: "Noise",
			type: "math",
			inputs: [
				{ id: "seed", name: "Seed", type: "number", connected: false, value: 0 },
				{ id: "scale", name: "Scale", type: "number", connected: false, value: 1 },
			],
			outputs: [{ id: "value", name: "Value", type: "number" }],
			data: { operation: "noise" },
		};
	}

	/**
	 * Create a curve block for custom easing
	 */
	public static createCurveBlock(): ISolidParticleBlock {
		return {
			id: `curve_${Date.now()}`,
			name: "Curve",
			type: "math",
			inputs: [
				{ id: "input", name: "Input", type: "number", connected: false },
				{ id: "curve", name: "Curve", type: "number", connected: false },
			],
			outputs: [{ id: "output", name: "Output", type: "number" }],
			data: {
				operation: "curve",
				curveType: "easeInOut",
				points: [
					{ x: 0, y: 0 },
					{ x: 0.5, y: 0.5 },
					{ x: 1, y: 1 },
				],
			},
		};
	}

	private static _getMathInputs(operation: string): IBlockInput[] {
		const baseInputs: IBlockInput[] = [
			{ id: "a", name: "A", type: "number", connected: false },
			{ id: "b", name: "B", type: "number", connected: false },
		];

		if (operation === "lerp") {
			baseInputs.push({ id: "t", name: "T", type: "number", connected: false });
		}

		if (operation === "sin" || operation === "cos") {
			return [{ id: "a", name: "Input", type: "number", connected: false }];
		}

		return baseInputs;
	}
}

/**
 * Block execution engine
 */
export class SolidParticleBlockExecutor {
	private blocks: Map<string, ISolidParticleBlock> = new Map();
	private connections: Map<string, { fromBlock: string; fromOutput: string; toBlock: string; toInput: string }> = new Map();
	private particle: CustomSolidParticle;

	constructor(particle: CustomSolidParticle) {
		this.particle = particle;
	}

	/**
	 * Add a block to the executor
	 */
	public addBlock(block: ISolidParticleBlock): void {
		this.blocks.set(block.id, block);
	}

	/**
	 * Add a connection between blocks
	 */
	public addConnection(connection: { fromBlock: string; fromOutput: string; toBlock: string; toInput: string }): void {
		const connectionId = `${connection.fromBlock}_${connection.fromOutput}_${connection.toBlock}_${connection.toInput}`;
		this.connections.set(connectionId, connection);
	}

	/**
	 * Execute the block graph and return animations
	 */
	public execute(): Animation[] {
		const animations: Animation[] = [];

		// Find all animation blocks
		const animationBlocks = Array.from(this.blocks.values()).filter((block) => block.type === "animation");

		for (const block of animationBlocks) {
			const animation = this._executeAnimationBlock(block);
			if (animation) {
				animations.push(animation);
			}
		}

		return animations;
	}

	private _executeAnimationBlock(block: ISolidParticleBlock): Animation | null {
		const { animationType, duration } = block.data;

		switch (animationType) {
			case "position":
				return this._createPositionAnimation(block, duration);
			case "rotation":
				return this._createRotationAnimation(block, duration);
			case "scaling":
				return this._createScalingAnimation(block, duration);
			case "color":
				return this._createColorAnimation(block, duration);
			default:
				return null;
		}
	}

	private _createPositionAnimation(block: ISolidParticleBlock, duration: number): Animation {
		const animation = new Animation(`position_${this.particle.id}`, "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const startPos = this._getConnectedValue(block, "startPos") || new Vector3(0, 0, 0);
		const endPos = this._getConnectedValue(block, "endPos") || new Vector3(0, 5, 0);

		const keys = [
			{ frame: 0, value: startPos },
			{ frame: duration * 30, value: endPos },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createRotationAnimation(block: ISolidParticleBlock, duration: number): Animation {
		const animation = new Animation(`rotation_${this.particle.id}`, "rotation", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const startRot = this._getConnectedValue(block, "startRot") || new Vector3(0, 0, 0);
		const endRot = this._getConnectedValue(block, "endRot") || new Vector3(0, Math.PI * 2, 0);

		const keys = [
			{ frame: 0, value: startRot },
			{ frame: duration * 30, value: endRot },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createScalingAnimation(block: ISolidParticleBlock, duration: number): Animation {
		const animation = new Animation(`scaling_${this.particle.id}`, "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const startScale = this._getConnectedValue(block, "startScale") || new Vector3(1, 1, 1);
		const endScale = this._getConnectedValue(block, "endScale") || new Vector3(2, 2, 2);

		const keys = [
			{ frame: 0, value: startScale },
			{ frame: duration * 30, value: endScale },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createColorAnimation(block: ISolidParticleBlock, duration: number): Animation {
		const animation = new Animation(`color_${this.particle.id}`, "color", 30, Animation.ANIMATIONTYPE_COLOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const startColor = this._getConnectedValue(block, "startColor") || new Color3(1, 1, 1);
		const endColor = this._getConnectedValue(block, "endColor") || new Color3(0, 0, 0);

		const keys = [
			{ frame: 0, value: startColor },
			{ frame: duration * 30, value: endColor },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _getConnectedValue(block: ISolidParticleBlock, inputId: string): any {
		// Find connection to this input
		const connection = Array.from(this.connections.values()).find((conn) => conn.toBlock === block.id && conn.toInput === inputId);

		if (!connection) {
			// Return default value from block input
			const input = block.inputs.find((i) => i.id === inputId);
			return input?.value;
		}

		// Find the source block
		const sourceBlock = this.blocks.get(connection.fromBlock);
		if (!sourceBlock) {return null;}

		// Get value from source block
		return this._evaluateBlock(sourceBlock, connection.fromOutput);
	}

	private _evaluateBlock(block: ISolidParticleBlock, outputId: string): any {
		switch (block.type) {
			case "input":
				return block.data.value;

			case "math":
				return this._evaluateMathBlock(block);

			case "time":
				return this._evaluateTimeBlock(block, outputId);

			default:
				return null;
		}
	}

	private _evaluateMathBlock(block: ISolidParticleBlock): number {
		const { operation } = block.data;
		const a = this._getConnectedValue(block, "a") || 0;
		const b = this._getConnectedValue(block, "b") || 0;

		switch (operation) {
			case "add":
				return a + b;
			case "subtract":
				return a - b;
			case "multiply":
				return a * b;
			case "divide":
				return b !== 0 ? a / b : 0;
			case "sin":
				return Math.sin(a);
			case "cos":
				return Math.cos(a);
			case "lerp":
				return a + (b - a) * (this._getConnectedValue(block, "t") || 0.5);
			case "noise":
				return Math.random() * (this._getConnectedValue(block, "scale") || 1);
			default:
				return 0;
		}
	}

	private _evaluateTimeBlock(block: ISolidParticleBlock, outputId: string): number {
		switch (outputId) {
			case "time":
				return Date.now() / 1000;
			case "delta":
				return 1 / 60; // Assume 60 FPS
			case "normalized":
				return (Date.now() / 1000) % 1;
			default:
				return 0;
		}
	}
}
