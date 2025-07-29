import { MeshBuilder, Mesh, Node, Tools, TransformNode, Vector3, Texture, ShaderMaterial, Effect, VertexData } from "babylonjs";

import { UniqueNumber } from "../../tools/tools";

import { Editor } from "../../editor/main";
import { Grass } from "../../tools/grass";

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

export function addBoxMesh(editor: Editor, parent?: Node) {
	const box = MeshBuilder.CreateBox("New Box", { width: 100, height: 100, depth: 100 }, editor.layout.preview.scene);
	box.receiveShadows = true;
	box.id = Tools.RandomId();
	box.uniqueId = UniqueNumber.Get();
	box.parent = parent ?? null;
	box.metadata = {
		type: "Box",
		width: 100,
		depth: 100,
		height: 100,
	};

	if (box.geometry) {
		box.geometry.id = Tools.RandomId();
		box.geometry.uniqueId = UniqueNumber.Get();
	}

	editor.layout.preview.scene.lights.forEach((light) => {
		light.getShadowGenerator()?.getShadowMap()?.renderList?.push(box);
	});

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(box);
	});

	editor.layout.inspector.setEditedObject(box);
	editor.layout.preview.gizmo.setAttachedNode(box);
}

export function addPlaneMesh(editor: Editor, parent?: Node) {
	const plane = MeshBuilder.CreatePlane("New Plane", { size: 100 }, editor.layout.preview.scene);
	plane.receiveShadows = true;
	plane.id = Tools.RandomId();
	plane.uniqueId = UniqueNumber.Get();
	plane.parent = parent ?? null;
	plane.metadata = {
		type: "Plane",
		size: 100,
	};

	if (plane.geometry) {
		plane.geometry.id = Tools.RandomId();
		plane.geometry.uniqueId = UniqueNumber.Get();
	}

	editor.layout.preview.scene.lights.forEach((light) => {
		light.getShadowGenerator()?.getShadowMap()?.renderList?.push(plane);
	});

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(plane);
	});

	editor.layout.inspector.setEditedObject(plane);
	editor.layout.preview.gizmo.setAttachedNode(plane);
}

export function addGroundMesh(editor: Editor, parent?: Node) {
	const ground = MeshBuilder.CreateGround("New Ground", { width: 1024, height: 1024, subdivisions: 32 }, editor.layout.preview.scene);
	ground.receiveShadows = true;
	ground.id = Tools.RandomId();
	ground.uniqueId = UniqueNumber.Get();
	ground.parent = parent ?? null;
	ground.metadata = {
		type: "Ground",
		width: 1024,
		height: 1024,
		subdivisions: 32,
	};

	if (ground.geometry) {
		ground.geometry.id = Tools.RandomId();
		ground.geometry.uniqueId = UniqueNumber.Get();
	}

	editor.layout.preview.scene.lights.forEach((light) => {
		light.getShadowGenerator()?.getShadowMap()?.renderList?.push(ground);
	});

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(ground);
	});

	editor.layout.inspector.setEditedObject(ground);
	editor.layout.preview.gizmo.setAttachedNode(ground);
}

export function addSphereMesh(editor: Editor, parent?: Node) {
	const sphere = MeshBuilder.CreateSphere("New Sphere", { diameter: 100, segments: 32 }, editor.layout.preview.scene);
	sphere.receiveShadows = true;
	sphere.id = Tools.RandomId();
	sphere.uniqueId = UniqueNumber.Get();
	sphere.parent = parent ?? null;
	sphere.metadata = {
		type: "Sphere",
		diameter: 100,
		segments: 32,
	};

	if (sphere.geometry) {
		sphere.geometry.id = Tools.RandomId();
		sphere.geometry.uniqueId = UniqueNumber.Get();
	}

	editor.layout.preview.scene.lights.forEach((light) => {
		light.getShadowGenerator()?.getShadowMap()?.renderList?.push(sphere);
	});

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(sphere);
	});

	editor.layout.inspector.setEditedObject(sphere);
	editor.layout.preview.gizmo.setAttachedNode(sphere);
}

export function addSkyboxMesh(editor: Editor, parent?: Node) {
	const skybox = MeshBuilder.CreateBox(
		"New SkyBox",
		{
			width: 10_000,
			height: 10_000,
			depth: 10_000,
			sideOrientation: Mesh.BACKSIDE,
		},
		editor.layout.preview.scene
	);

	skybox.receiveShadows = false;
	skybox.id = Tools.RandomId();
	skybox.uniqueId = UniqueNumber.Get();
	skybox.parent = parent ?? null;
	skybox.infiniteDistance = true;
	skybox.metadata = {
		type: "Box",
		width: 10_000,
		depth: 10_000,
		height: 10_000,
	};

	if (skybox.geometry) {
		skybox.geometry.id = Tools.RandomId();
		skybox.geometry.uniqueId = UniqueNumber.Get();
	}

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(skybox);
	});

	editor.layout.inspector.setEditedObject(skybox);
	editor.layout.preview.gizmo.setAttachedNode(skybox);
}

export function addEmptyMesh(editor: Editor, parent?: Node) {
	const emptyMesh = new Mesh("New Empty Mesh", editor.layout.preview.scene);
	emptyMesh.id = Tools.RandomId();
	emptyMesh.uniqueId = UniqueNumber.Get();
	emptyMesh.parent = parent ?? null;

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(emptyMesh);
	});

	editor.layout.inspector.setEditedObject(emptyMesh);
	editor.layout.preview.gizmo.setAttachedNode(emptyMesh);
}

export function addGrassMesh(editor: Editor, parent?: Node) {
	const grass = new Grass(editor.layout.preview.scene, {
		planeSize: 30,
		planeWidth: 30,
		planeHeight: 30,
		shape: 'square', // По умолчанию квадрат
		bladeCount: 1000, // Более безопасное количество по умолчанию
		bladeWidth: 0.1,
		bladeHeight: 0.8,
		bladeHeightVariation: 0.6,
		windStrength: 0.3,
		windSpeed: 500.0,
		lodDistance: 50,
		materialOptions: {
			contrast: 1.0,
			brightness: 0.0,
			opacity: 1.0,
			textureUrl: undefined
		}
	});

	const grassMesh = grass.getMesh();

	grassMesh.id = Tools.RandomId();
	grassMesh.uniqueId = UniqueNumber.Get();
	grassMesh.parent = parent ?? null;
	grassMesh.metadata = {
		type: "Grass",
		bladeCount: 1000000,
		planeSize: 30,
		planeWidth: 30,
		planeHeight: 30,
		shape: 'square',
	};

	editor.layout.graph.refresh().then(() => {
		editor.layout.graph.setSelectedNode(grassMesh);
	});
	editor.layout.inspector.setEditedObject(grassMesh);
	editor.layout.preview.gizmo.setAttachedNode(grassMesh);
}
