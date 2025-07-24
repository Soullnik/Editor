import { Skeleton, Node, Tools, Bone, TransformNode } from "babylonjs";

import { UniqueNumber } from "../../tools/tools";

import { Editor } from "../../editor/main";
import { isSkeleton } from "../../tools/guards/nodes";

export function addTransformNode(editor: Editor, parent?: Node) {
	const transformNode = new TransformNode("New Transform Node", editor.layout.preview.scene);
	transformNode.id = Tools.RandomId();
	transformNode.uniqueId = UniqueNumber.Get();
	transformNode.parent = parent ?? null;

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(transformNode);
	});

	editor.layout.inspector.setEditedObject(transformNode);
	editor.layout.preview.gizmo.setAttachedNode(transformNode);
}


export function addSkeleton(editor: Editor) {
	const skeleton = new Skeleton("New Skeleton", Tools.RandomId(), editor.layout.preview.scene);
	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(skeleton);
	});

	editor.layout.inspector.setEditedObject(skeleton);
	editor.layout.preview.gizmo.setAttachedNode(null);
}

export function addBone(editor: Editor, parent: Bone | Skeleton, name: string = "New Bone") {
	const isNotSkeleton = !isSkeleton(parent);
	const skeleton = isNotSkeleton ? parent.getSkeleton() : parent;
	const bone = new Bone(name, skeleton, isNotSkeleton ? parent : undefined);
	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(bone);
	});
	editor.layout.inspector.setEditedObject(bone);
	editor.layout.preview.gizmo.setAttachedNode(null);
}

