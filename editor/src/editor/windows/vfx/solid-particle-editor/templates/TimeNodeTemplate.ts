import { INodeTemplate, ISolidParticleNode } from "../types";

export class TimeNodeTemplate {
	public static getTemplates(): INodeTemplate[] {
		return [
			{
				id: "time",
				name: "Time",
				description: "Current time value",
				category: "Time",
				icon: "⏰",
				color: "#FFEAA7",
				createNode: (position) => ({
					id: `time_${Date.now()}`,
					type: "time",
					position,
					title: "Time",
					width: 150,
					height: 100,
					inputs: [],
					outputs: [
						{ id: "time", name: "Time", type: "number", position: { x: 150, y: 30 } },
						{ id: "delta", name: "Delta", type: "number", position: { x: 150, y: 50 } },
					],
					data: { timeType: "absolute" },
				}),
			},
			{
				id: "delta-time",
				name: "Delta Time",
				description: "Time since last frame",
				category: "Time",
				icon: "Δt",
				color: "#FFEAA7",
				createNode: (position) => ({
					id: `delta_time_${Date.now()}`,
					type: "time",
					position,
					title: "Delta Time",
					width: 150,
					height: 100,
					inputs: [],
					outputs: [
						{ id: "delta", name: "Delta", type: "number", position: { x: 150, y: 40 } },
					],
					data: { timeType: "delta" },
				}),
			},
		];
	}
}
