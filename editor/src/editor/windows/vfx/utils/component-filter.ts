import { VFXComponent, IVFXFile } from "../types";

export class ComponentFilter {
	/**
	 * Filters and groups components by type based on search criteria
	 */
	public static getFilteredComponents(vfxData: IVFXFile | null, search: string): { [key: string]: VFXComponent[] } {
		if (!vfxData) {
			return {};
		}

		const allComponents: VFXComponent[] = [...vfxData.cpuParticles, ...vfxData.gpuParticles, ...vfxData.sps, ...vfxData.particleSystemSets];

		const filteredComponents = allComponents.filter(
			(component) => component.name.toLowerCase().includes(search.toLowerCase()) || component.type.toLowerCase().includes(search.toLowerCase())
		);

		// Group components by type
		const groupedComponents: { [key: string]: VFXComponent[] } = {};
		filteredComponents.forEach((component) => {
			if (!groupedComponents[component.type]) {
				groupedComponents[component.type] = [];
			}
			groupedComponents[component.type].push(component);
		});

		return groupedComponents;
	}
}
