import { INodeTemplate, ISolidParticleNode } from "../types";

export class MathNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "add",
				name: "Add",
				description: "Add two values",
				category: "Math",
				icon: "+",
				color: "#96CEB4",
				createNode: (position) => ({
					id: `add_${Date.now()}`,
					type: "math",
					position,
					title: "Add",
					width: 150,
					height: 100,
					inputs: [
						{ id: "a", name: "A", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "b", name: "B", type: "number", position: { x: 0, y: 50 }, connected: false },
					],
					outputs: [
						{ id: "result", name: "Result", type: "number", position: { x: 150, y: 40 } },
					],
					data: { operation: "add" },
				}),
			},
			{
				id: "multiply",
				name: "Multiply",
				description: "Multiply two values",
				category: "Math",
				icon: "×",
				color: "#96CEB4",
				createNode: (position) => ({
					id: `multiply_${Date.now()}`,
					type: "math",
					position,
					title: "Multiply",
					width: 150,
					height: 100,
					inputs: [
						{ id: "a", name: "A", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "b", name: "B", type: "number", position: { x: 0, y: 50 }, connected: false },
					],
					outputs: [
						{ id: "result", name: "Result", type: "number", position: { x: 150, y: 40 } },
					],
					data: { operation: "multiply" },
				}),
			},
			{
				id: "sin",
				name: "Sine",
				description: "Calculate sine of input",
				category: "Math",
				icon: "sin",
				color: "#96CEB4",
				createNode: (position) => ({
					id: `sin_${Date.now()}`,
					type: "math",
					position,
					title: "Sine",
					width: 150,
					height: 100,
					inputs: [
						{ id: "input", name: "Input", type: "number", position: { x: 0, y: 40 }, connected: false },
					],
					outputs: [
						{ id: "result", name: "Result", type: "number", position: { x: 150, y: 40 } },
					],
					data: { operation: "sin" },
				}),
			},
			{
				id: "cos",
				name: "Cosine",
				description: "Calculate cosine of input",
				category: "Math",
				icon: "cos",
				color: "#96CEB4",
				createNode: (position) => ({
					id: `cos_${Date.now()}`,
					type: "math",
					position,
					title: "Cosine",
					width: 150,
					height: 100,
					inputs: [
						{ id: "input", name: "Input", type: "number", position: { x: 0, y: 40 }, connected: false },
					],
					outputs: [
						{ id: "result", name: "Result", type: "number", position: { x: 150, y: 40 } },
					],
					data: { operation: "cos" },
				}),
			},
		];
	}
}
