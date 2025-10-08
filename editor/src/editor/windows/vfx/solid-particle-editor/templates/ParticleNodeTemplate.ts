import { INodeTemplate, ISolidParticleNode } from "../types";

export class ParticleNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "particle-input",
				name: "Particle Input",
				description: "Input particle properties",
				category: "Particle",
				icon: "P",
				color: "#FF6B6B",
				createNode: (position) => ({
					id: `particle_${Date.now()}`,
					type: "particle",
					position,
					title: "Particle Input",
					width: 200,
					height: 120,
					inputs: [],
					outputs: [
						{ id: "position", name: "Position", type: "vector3", position: { x: 200, y: 30 } },
						{ id: "rotation", name: "Rotation", type: "vector3", position: { x: 200, y: 50 } },
						{ id: "scaling", name: "Scaling", type: "vector3", position: { x: 200, y: 70 } },
						{ id: "color", name: "Color", type: "color3", position: { x: 200, y: 90 } },
					],
					data: { particleId: null },
				}),
			},
		];
	}
}
