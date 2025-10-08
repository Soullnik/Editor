import { INodeTemplate, ISolidParticleNode } from "../types";

export class ConstantNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "number-constant",
				name: "Number",
				description: "Constant number value",
				category: "Constant",
				icon: "123",
				color: "#FFB347",
				createNode: (position) => ({
					id: `number_${Date.now()}`,
					type: "constant",
					position,
					title: "Number",
					width: 150,
					height: 100,
					inputs: [],
					outputs: [
						{ id: "value", name: "Value", type: "number", position: { x: 150, y: 40 } },
					],
					data: { value: 1.0, valueType: "number" },
				}),
			},
			{
				id: "vector3-constant",
				name: "Vector3",
				description: "Constant Vector3 value",
				category: "Constant",
				icon: "3D",
				color: "#FFB347",
				createNode: (position) => ({
					id: `vector3_${Date.now()}`,
					type: "constant",
					position,
					title: "Vector3",
					width: 150,
					height: 100,
					inputs: [],
					outputs: [
						{ id: "value", name: "Value", type: "vector3", position: { x: 150, y: 40 } },
					],
					data: { value: { x: 0, y: 0, z: 0 }, valueType: "vector3" },
				}),
			},
			{
				id: "color3-constant",
				name: "Color3",
				description: "Constant Color3 value",
				category: "Constant",
				icon: "🎨",
				color: "#FFB347",
				createNode: (position) => ({
					id: `color3_${Date.now()}`,
					type: "constant",
					position,
					title: "Color3",
					width: 150,
					height: 100,
					inputs: [],
					outputs: [
						{ id: "value", name: "Value", type: "color3", position: { x: 150, y: 40 } },
					],
					data: { value: { r: 1, g: 1, b: 1 }, valueType: "color3" },
				}),
			},
		];
	}
}
