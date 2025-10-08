import { INodeTemplate, ISolidParticleNode } from "../types";

export class AnimationNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "position-animation",
				name: "Position Animation",
				description: "Animate particle position",
				category: "Animation",
				icon: "↗",
				color: "#4ECDC4",
				createNode: (position) => ({
					id: `position_anim_${Date.now()}`,
					type: "animation",
					position,
					title: "Position Animation",
					width: 200,
					height: 120,
					inputs: [
						{ id: "start", name: "Start", type: "vector3", position: { x: 0, y: 30 }, connected: false },
						{ id: "end", name: "End", type: "vector3", position: { x: 0, y: 50 }, connected: false },
						{ id: "duration", name: "Duration", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "animation", name: "Animation", type: "animation", position: { x: 200, y: 50 } },
					],
					data: { animationType: "position", duration: 1.0 },
				}),
			},
			{
				id: "rotation-animation",
				name: "Rotation Animation",
				description: "Animate particle rotation",
				category: "Animation",
				icon: "↻",
				color: "#4ECDC4",
				createNode: (position) => ({
					id: `rotation_anim_${Date.now()}`,
					type: "animation",
					position,
					title: "Rotation Animation",
					width: 200,
					height: 120,
					inputs: [
						{ id: "start", name: "Start", type: "vector3", position: { x: 0, y: 30 }, connected: false },
						{ id: "end", name: "End", type: "vector3", position: { x: 0, y: 50 }, connected: false },
						{ id: "duration", name: "Duration", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "animation", name: "Animation", type: "animation", position: { x: 200, y: 50 } },
					],
					data: { animationType: "rotation", duration: 1.0 },
				}),
			},
			{
				id: "scaling-animation",
				name: "Scaling Animation",
				description: "Animate particle scaling",
				category: "Animation",
				icon: "⤢",
				color: "#4ECDC4",
				createNode: (position) => ({
					id: `scaling_anim_${Date.now()}`,
					type: "animation",
					position,
					title: "Scaling Animation",
					width: 200,
					height: 120,
					inputs: [
						{ id: "start", name: "Start", type: "vector3", position: { x: 0, y: 30 }, connected: false },
						{ id: "end", name: "End", type: "vector3", position: { x: 0, y: 50 }, connected: false },
						{ id: "duration", name: "Duration", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "animation", name: "Animation", type: "animation", position: { x: 200, y: 50 } },
					],
					data: { animationType: "scaling", duration: 1.0 },
				}),
			},
			{
				id: "color-animation",
				name: "Color Animation",
				description: "Animate particle color",
				category: "Animation",
				icon: "🎨",
				color: "#4ECDC4",
				createNode: (position) => ({
					id: `color_anim_${Date.now()}`,
					type: "animation",
					position,
					title: "Color Animation",
					width: 200,
					height: 120,
					inputs: [
						{ id: "start", name: "Start", type: "color3", position: { x: 0, y: 30 }, connected: false },
						{ id: "end", name: "End", type: "color3", position: { x: 0, y: 50 }, connected: false },
						{ id: "duration", name: "Duration", type: "number", position: { x: 0, y: 70 }, connected: false },
					],
					outputs: [
						{ id: "animation", name: "Animation", type: "animation", position: { x: 200, y: 50 } },
					],
					data: { animationType: "color", duration: 1.0 },
				}),
			},
		];
	}
}
