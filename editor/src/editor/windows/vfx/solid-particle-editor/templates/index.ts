import { INodeTemplate } from "../types";
import { ParticleNodeTemplate } from "./ParticleNodeTemplate";
import { AnimationNodeTemplate } from "./AnimationNodeTemplate";
import { MathNodeTemplate } from "./MathNodeTemplate";
import { TimeNodeTemplate } from "./TimeNodeTemplate";
import { ConstantNodeTemplate } from "./ConstantNodeTemplate";
import { NoiseNodeTemplate } from "./NoiseNodeTemplate";
import { CurveNodeTemplate } from "./CurveNodeTemplate";

export class NodeTemplates {
	private static _templates: INodeTemplate[] = [
		...ParticleNodeTemplate.getTemplates(),
		...AnimationNodeTemplate.getTemplates(),
		...MathNodeTemplate.getTemplates(),
		...TimeNodeTemplate.getTemplates(),
		...ConstantNodeTemplate.getTemplates(),
		...NoiseNodeTemplate.getTemplates(),
		...CurveNodeTemplate.getTemplates(),
	];

	public static getTemplates(): INodeTemplate[] {
		return this._templates;
	}

	public static getCategories(): Record<string, INodeTemplate[]> {
		const categories: Record<string, INodeTemplate[]> = {};
		
		this._templates.forEach((template) => {
			if (!categories[template.category]) {
				categories[template.category] = [];
			}
			categories[template.category].push(template);
		});

		return categories;
	}

	public static getTemplate(id: string): INodeTemplate | undefined {
		return this._templates.find((template) => template.id === id);
	}
}
