import { Node } from "babylonjs";

import { Editor } from "../../main";

import {
	addSkeleton, addBone,
} from "../../../project/add/skeleton";

import { skeletonCommandItems } from "./shared-commands";
import { ICommandPaletteType } from "./command-palette";

export function getSkeletonCommands(editor?: Editor, parent?: Node): ICommandPaletteType[] {
	return [
		{
			...skeletonCommandItems.skeleton,
			action: () => editor && addSkeleton(editor)
		},
		// {
		//     ...meshCommandItems.bone,
		//     action: () => editor && addBone(editor, parent)
		// },
	];
}




