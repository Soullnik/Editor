import { Editor } from "../../main";

import { addPBRMaterial, addStandardMaterial, addNodeMaterial, addSkyMaterial, addCellMaterial, addFireMaterial, addFurMaterial, addGridMaterial, addWaterMaterial, addLavaMaterial, addTerrainMaterial, addTriPlanarMaterial } from "../../../project/add/material";

import { ICommandPaletteType } from "./command-palette";

export function getMaterialCommands(editor?: Editor): ICommandPaletteType[] {
	return [
		{
			text: "PBR Material",
			label: "Add a new PBR material to the scene",
			key: "add-pbr-material",
			action: () => editor && addPBRMaterial(editor.layout.preview.scene)
		},
		{
			text: "Standard Material",
			label: "Add a new standard material to the scene",
			key: "add-standard-material",
			action: () => editor && addStandardMaterial(editor.layout.preview.scene)
		},
		{
			text: "Node Material",
			label: "Add a new node material to the scene",
			key: "add-node-material",
			action: () => editor && addNodeMaterial(editor.layout.preview.scene)
		},
		{
			text: "Sky Material",
			label: "Add a new sky material to the scene",
			key: "add-sky-material",
			action: () => editor && addSkyMaterial(editor.layout.preview.scene)
		},
		{
			text: "Cell Material",
			label: "Add a new cell material to the scene",
			key: "add-cell-material",
			action: () => editor && addCellMaterial(editor.layout.preview.scene)
		},
		{
			text: "Fire Material",
			label: "Add a new fire material to the scene",
			key: "add-fire-material",
			action: () => editor && addFireMaterial(editor.layout.preview.scene)
		},
		{
			text: "Fur Material",
			label: "Add a new fur material to the scene",
			key: "add-fur-material",
			action: () => editor && addFurMaterial(editor.layout.preview.scene)
		},
		{
			text: "Grid Material",
			label: "Add a new grid material to the scene",
			key: "add-grid-material",
			action: () => editor && addGridMaterial(editor.layout.preview.scene)
		},
		{
			text: "Water Material",
			label: "Add a new water material to the scene",
			key: "add-water-material",
			action: () => editor && addWaterMaterial(editor.layout.preview.scene)
		},
		{
			text: "Lava Material",
			label: "Add a new lava material to the scene",
			key: "add-lava-material",
			action: () => editor && addLavaMaterial(editor.layout.preview.scene)
		},
		{
			text: "Terrain Material",
			label: "Add a new terrain material to the scene",
			key: "add-terrain-material",
			action: () => editor && addTerrainMaterial(editor.layout.preview.scene)
		},
		{
			text: "TriPlanar Material",
			label: "Add a new triplanar material to the scene",
			key: "add-triplanar-material",
			action: () => editor && addTriPlanarMaterial(editor.layout.preview.scene)
		},
	];
}
