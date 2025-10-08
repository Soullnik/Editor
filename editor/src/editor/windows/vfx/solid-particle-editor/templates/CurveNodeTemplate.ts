import { INodeTemplate, ISolidParticleNode } from "../types";

export class CurveNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "linear-curve",
				name: "Linear Curve",
				description: "Linear interpolation curve",
				category: "Curve",
				icon: "📈",
				color: "#DDA0DD",
				createNode: (position) => ({
					id: `linear_${Date.now()}`,
					type: "curve",
					position,
					title: "Linear Curve",
					width: 200,
					height: 120,
					inputs: [
						{ id: "input", name: "Input", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "start", name: "Start", type: "number", position: { x: 0, y: 50 }, connected: false },
						{ id: "end", name: "End", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "output", name: "Output", type: "number", position: { x: 200, y: 50 } },
					],
					data: { curveType: "linear" },
				}),
			},
			{
				id: "ease-in-out",
				name: "Ease In-Out",
				description: "Ease in-out curve",
				category: "Curve",
				icon: "📈",
				color: "#DDA0DD",
				createNode: (position) => ({
					id: `ease_in_out_${Date.now()}`,
					type: "curve",
					position,
					title: "Ease In-Out",
					width: 200,
					height: 120,
					inputs: [
						{ id: "input", name: "Input", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "start", name: "Start", type: "number", position: { x: 0, y: 50 }, connected: false },
						{ id: "end", name: "End", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "output", name: "Output", type: "number", position: { x: 200, y: 50 } },
					],
					data: { curveType: "easeInOut" },
				}),
			},
			{
				id: "bounce-curve",
				name: "Bounce Curve",
				description: "Bouncing curve",
				category: "Curve",
				icon: "📈",
				color: "#DDA0DD",
				createNode: (position) => ({
					id: `bounce_${Date.now()}`,
					type: "curve",
					position,
					title: "Bounce Curve",
					width: 200,
					height: 120,
					inputs: [
						{ id: "input", name: "Input", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "start", name: "Start", type: "number", position: { x: 0, y: 50 }, connected: false },
						{ id: "end", name: "End", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "output", name: "Output", type: "number", position: { x: 200, y: 50 } },
					],
					data: { curveType: "bounce" },
				}),
			},
		];
	}
}
