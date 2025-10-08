import { INodeTemplate, ISolidParticleNode } from "../types";

export class NoiseNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "perlin-noise",
				name: "Perlin Noise",
				description: "Generate Perlin noise",
				category: "Noise",
				icon: "🌊",
				color: "#87CEEB",
				createNode: (position) => ({
					id: `perlin_${Date.now()}`,
					type: "noise",
					position,
					title: "Perlin Noise",
					width: 200,
					height: 120,
					inputs: [
						{ id: "seed", name: "Seed", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "scale", name: "Scale", type: "number", position: { x: 0, y: 50 }, connected: false },
						{ id: "octaves", name: "Octaves", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "noise", name: "Noise", type: "number", position: { x: 200, y: 50 } },
					],
					data: { noiseType: "perlin", seed: 0, scale: 1.0, octaves: 4 },
				}),
			},
			{
				id: "simplex-noise",
				name: "Simplex Noise",
				description: "Generate Simplex noise",
				category: "Noise",
				icon: "🌊",
				color: "#87CEEB",
				createNode: (position) => ({
					id: `simplex_${Date.now()}`,
					type: "noise",
					position,
					title: "Simplex Noise",
					width: 200,
					height: 120,
					inputs: [
						{ id: "seed", name: "Seed", type: "number", position: { x: 0, y: 30 }, connected: false },
						{ id: "scale", name: "Scale", type: "number", position: { x: 0, y: 50 }, connected: false },
						{ id: "octaves", name: "Octaves", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "noise", name: "Noise", type: "number", position: { x: 200, y: 50 } },
					],
					data: { noiseType: "simplex", seed: 0, scale: 1.0, octaves: 4 },
				}),
			},
		];
	}
}
