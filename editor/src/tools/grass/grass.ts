import {
	Vector3,
	Texture,
	Mesh,
	VertexData,
	Scene,
	Camera,
} from "babylonjs";

import { GrassMaterial, IGrassMaterialOptions } from "./grass-material";

type BladeVertex = { pos: number[]; uv: number[]; color: number[] };

export type GrassShape = 'square' | 'circle' | 'ellipse' | 'rectangle';

export interface IGrassOptions {
	planeSize?: number;
	planeWidth?: number;
	planeHeight?: number;
	shape?: GrassShape;
	bladeCount?: number;
	bladeWidth?: number;
	bladeHeight?: number;
	bladeHeightVariation?: number;
	tipBendStrength?: number; // Сила изгиба верхушки (0 = прямой, 1 = максимальный изгиб)
	windStrength?: number;
	windSpeed?: number;
	materialOptions?: IGrassMaterialOptions;
	lodDistance?: number;
}

export class Grass {
	private readonly scene: Scene;
	private grassMaterial: GrassMaterial;
	private grassMesh!: Mesh;
	private readonly PLANE_SIZE: number;
	private readonly PLANE_WIDTH: number;
	private readonly PLANE_HEIGHT: number;
	private readonly SHAPE: GrassShape;
	private readonly BLADE_COUNT: number;
	private readonly BLADE_WIDTH: number;
	private readonly BLADE_HEIGHT: number;
	private readonly BLADE_HEIGHT_VARIATION: number;
	private readonly TIP_BEND_STRENGTH: number;
	private readonly LOD_DISTANCE: number;
	private time: number = 0;
	private activeCamera: Camera | null = null;
	private lodLevels: { distance: number; visibleCount: number }[] = [];

	constructor(scene: Scene, options: IGrassOptions = {}) {
		this.scene = scene;
		
		// Set default options
		this.PLANE_SIZE = options.planeSize ?? 30;
		this.PLANE_WIDTH = options.planeWidth ?? this.PLANE_SIZE;
		this.PLANE_HEIGHT = options.planeHeight ?? this.PLANE_SIZE;
		this.SHAPE = options.shape ?? 'square';
		this.BLADE_COUNT = options.bladeCount ?? 1;
		this.BLADE_WIDTH = options.bladeWidth ?? 0.1;
		this.BLADE_HEIGHT = options.bladeHeight ?? 0.8;
		this.BLADE_HEIGHT_VARIATION = options.bladeHeightVariation ?? 0.6;
		this.TIP_BEND_STRENGTH = options.tipBendStrength ?? 0.2;
		this.LOD_DISTANCE = options.lodDistance ?? 50;

		// Setup LOD levels
		this.setupLODLevels();

		// Create grass material with options
		this.grassMaterial = new GrassMaterial(scene, {
			windStrength: options.windStrength,
			windSpeed: options.windSpeed,
			...options.materialOptions
		});

		this.createGrass();
		this.setupAnimation();
	}

	/**
	 * Sets up LOD levels based on distance
	 */
	private setupLODLevels(): void {
		this.lodLevels = [
			{ distance: 0, visibleCount: this.BLADE_COUNT },           // Full detail
			{ distance: this.LOD_DISTANCE * 0.3, visibleCount: Math.floor(this.BLADE_COUNT * 0.7) },    // 70% detail
			{ distance: this.LOD_DISTANCE * 0.6, visibleCount: Math.floor(this.BLADE_COUNT * 0.4) },    // 40% detail
			{ distance: this.LOD_DISTANCE, visibleCount: Math.floor(this.BLADE_COUNT * 0.1) },          // 10% detail
		];
	}

	/**
	 * Sets up the animation loop for wind movement and LOD updates
	 */
	private setupAnimation(): void {
		this.scene.registerBeforeRender(() => {
			this.time += this.scene.getEngine().getDeltaTime();
			const material = this.grassMaterial.getMaterial();
			if (material) {
				material.setFloat("iTime", this.time);
			}
			
			// Update LOD based on camera distance
			this.updateLOD();
		});
	}

	/**
	 * Updates LOD based on camera distance
	 */
	private updateLOD(): void {
		if (!this.activeCamera) {
			this.activeCamera = this.scene.activeCamera;
			if (!this.activeCamera) return;
		}

		const cameraPosition = this.activeCamera.position;
		const grassCenter = this.grassMesh ? this.grassMesh.position : Vector3.Zero();
		const distance = Vector3.Distance(cameraPosition, grassCenter);

		// Find appropriate LOD level
		let targetVisibleCount = this.BLADE_COUNT;
		for (let i = this.lodLevels.length - 1; i >= 0; i--) {
			if (distance >= this.lodLevels[i].distance) {
				targetVisibleCount = this.lodLevels[i].visibleCount;
				break;
			}
		}

		// For single mesh, we could implement geometry-based LOD here
		// For now, we'll keep it simple and render all blades
	}

	/**
	 * Creates the grass geometry as a single optimized mesh
	 */
	private createGrass(): void {
		// Create grass geometry
		const positions: number[] = [];
		const uvs: number[] = [];
		const colors: number[] = [];
		const indices: number[] = [];

		let bladeIndex = 0;
		let actualBladeCount = 0;
		
		// Generate all blades in one pass
		for (let i = 0; i < this.BLADE_COUNT; i++) {
			const blade = this.generateBlade(i);

			blade.verts.forEach((vert) => {
				positions.push(...vert.pos);
				uvs.push(...vert.uv);
				colors.push(...vert.color);
			});
			blade.indices.forEach((index) => indices.push(index + bladeIndex * 7));
			bladeIndex++;
			actualBladeCount++;
		}

		// Create mesh
		this.grassMesh = new Mesh("grass", this.scene);
		const vertexData = new VertexData();

		vertexData.positions = positions;
		vertexData.uvs = uvs;
		vertexData.colors = colors;
		vertexData.indices = indices;

		vertexData.applyToMesh(this.grassMesh);
		this.grassMesh.material = this.grassMaterial.getMaterial();

		// Position the grass
		this.grassMesh.position = new Vector3(0, 1, 0);
		
		console.log(`Grass created: ${actualBladeCount} blades in single mesh`);
	}

	/**
	 * Generates a single grass blade
	 */
	private generateBlade(index: number): {
		verts: BladeVertex[];
		indices: number[];
	} {
		const VERTEX_COUNT = 7; // Увеличили с 5 до 7 вершин
		const MID_WIDTH = this.BLADE_WIDTH * 0.5;
		const TIP_OFFSET = 0.1;
		const height = this.BLADE_HEIGHT + Math.random() * this.BLADE_HEIGHT_VARIATION;

		// Generate position based on shape
		let x: number, z: number;
		
		switch (this.SHAPE) {
			case 'square':
				x = (Math.random() - 0.5) * this.PLANE_WIDTH;
				z = (Math.random() - 0.5) * this.PLANE_HEIGHT;
				break;
				
			case 'circle':
				const radius = Math.min(this.PLANE_WIDTH, this.PLANE_HEIGHT) / 2;
				const r = radius * Math.sqrt(Math.random());
				const theta = Math.random() * 2 * Math.PI;
				x = r * Math.cos(theta);
				z = r * Math.sin(theta);
				break;
				
			case 'ellipse':
				const a = this.PLANE_WIDTH / 2;
				const b = this.PLANE_HEIGHT / 2;
				const r_ellipse = Math.sqrt(Math.random());
				const theta_ellipse = Math.random() * 2 * Math.PI;
				x = a * r_ellipse * Math.cos(theta_ellipse);
				z = b * r_ellipse * Math.sin(theta_ellipse);
				break;
				
			case 'rectangle':
				x = (Math.random() - 0.5) * this.PLANE_WIDTH;
				z = (Math.random() - 0.5) * this.PLANE_HEIGHT;
				break;
				
			default:
				x = (Math.random() - 0.5) * this.PLANE_WIDTH;
				z = (Math.random() - 0.5) * this.PLANE_HEIGHT;
				break;
		}

		const center = new Vector3(x, 0, z);

		const yaw = Math.random() * Math.PI * 2;
		const yawUnitVec = new Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
		
		// Сделаем изгиб верхушки более естественным и случайным
		const tipBend = Math.random() * Math.PI * 2;
		const tipBendStrength = (Math.random() - 0.5) * this.TIP_BEND_STRENGTH; // Случайная сила изгиба от -0.1 до 0.1
		const tipBendUnitVec = new Vector3(
			Math.sin(tipBend) * tipBendStrength,
			0,
			-Math.cos(tipBend) * tipBendStrength
		);

		// Base vertices (bottom)
		const bl = center.add(yawUnitVec.scale(this.BLADE_WIDTH / 2));
		const br = center.add(yawUnitVec.scale(-(this.BLADE_WIDTH / 2)));
		
		// Lower middle vertices (25% height)
		const ml1 = center.add(yawUnitVec.scale(this.BLADE_WIDTH * 0.4));
		const mr1 = center.add(yawUnitVec.scale(-(this.BLADE_WIDTH * 0.4)));
		ml1.y += height * 0.25;
		mr1.y += height * 0.25;
		
		// Upper middle vertices (75% height)
		const ml2 = center.add(yawUnitVec.scale(this.BLADE_WIDTH * 0.2));
		const mr2 = center.add(yawUnitVec.scale(-(this.BLADE_WIDTH * 0.2)));
		ml2.y += height * 0.75;
		mr2.y += height * 0.75;
		
		// Tip vertex - более естественный изгиб
		const tc = center.add(tipBendUnitVec);
		tc.y += height;

		// Convert UV coordinates based on shape
		let uv: number[];
		switch (this.SHAPE) {
			case 'square':
			case 'rectangle':
				uv = [
					this.convertRange(center.x, -this.PLANE_WIDTH / 2, this.PLANE_WIDTH / 2, 0, 1),
					this.convertRange(center.z, -this.PLANE_HEIGHT / 2, this.PLANE_HEIGHT / 2, 0, 1),
				];
				break;
			case 'circle':
			case 'ellipse':
				const maxRadius = Math.max(this.PLANE_WIDTH, this.PLANE_HEIGHT) / 2;
				uv = [
					this.convertRange(center.x, -maxRadius, maxRadius, 0, 1),
					this.convertRange(center.z, -maxRadius, maxRadius, 0, 1),
				];
				break;
			default:
				uv = [0.5, 0.5];
				break;
		}

		const verts = [
			{ pos: bl.asArray(), uv: uv, color: [0.0, 0.0, 0.0] },     // Основание - 0% высоты
			{ pos: br.asArray(), uv: uv, color: [0.0, 0.0, 0.0] },     // Основание - 0% высоты
			{ pos: ml1.asArray(), uv: uv, color: [0.25, 0.25, 0.25] }, // Нижняя середина - 25% высоты
			{ pos: mr1.asArray(), uv: uv, color: [0.25, 0.25, 0.25] }, // Нижняя середина - 25% высоты
			{ pos: ml2.asArray(), uv: uv, color: [0.75, 0.75, 0.75] }, // Верхняя середина - 75% высоты
			{ pos: mr2.asArray(), uv: uv, color: [0.75, 0.75, 0.75] }, // Верхняя середина - 75% высоты
			{ pos: tc.asArray(), uv: uv, color: [1.0, 1.0, 1.0] },     // Кончик - 100% высоты
		];

		const indices = [
			// Нижняя часть травинки
			index * VERTEX_COUNT,     // bl
			index * VERTEX_COUNT + 1, // br
			index * VERTEX_COUNT + 2, // ml1
			index * VERTEX_COUNT + 2, // ml1
			index * VERTEX_COUNT + 1, // br
			index * VERTEX_COUNT + 3, // mr1
			
			// Средняя часть травинки
			index * VERTEX_COUNT + 2, // ml1
			index * VERTEX_COUNT + 3, // mr1
			index * VERTEX_COUNT + 4, // ml2
			index * VERTEX_COUNT + 4, // ml2
			index * VERTEX_COUNT + 3, // mr1
			index * VERTEX_COUNT + 5, // mr2
			
			// Верхняя часть травинки
			index * VERTEX_COUNT + 4, // ml2
			index * VERTEX_COUNT + 5, // mr2
			index * VERTEX_COUNT + 6, // tc
		];

		return { verts, indices };
	}

	/**
	 * Converts a value from one range to another
	 */
	private convertRange(
		val: number,
		oldMin: number,
		oldMax: number,
		newMin: number,
		newMax: number
	): number {
		return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
	}

	/**
	 * Returns the grass mesh
	 */
	public getMesh(): Mesh {
		return this.grassMesh;
	}

	/**
	 * Returns the grass material
	 */
	public getMaterial(): GrassMaterial {
		return this.grassMaterial;
	}

	/**
	 * Updates the grass texture
	 */
	public setTexture(texture: Texture): void {
		this.grassMaterial.setTexture(texture);
	}

	/**
	 * Sets wind parameters
	 */
	public setWindParameters(strength: number, speed: number): void {
		this.grassMaterial.setWindParameters(strength, speed);
	}

	/**
	 * Sets visual parameters
	 */
	public setVisualParameters(contrast: number, brightness: number, opacity: number): void {
		this.grassMaterial.setVisualParameters(contrast, brightness, opacity);
	}

	/**
	 * Sets texture URL
	 */
	public setTextureUrl(url: string): void {
		this.grassMaterial.setTextureUrl(url);
	}

	/**
	 * Enables wind animation
	 */
	public enableWindAnimation(): void {
		this.grassMaterial.enableWindAnimation();
	}

	/**
	 * Disables wind animation
	 */
	public disableWindAnimation(): void {
		this.grassMaterial.disableWindAnimation();
	}

	/**
	 * Gets wind animation status
	 */
	public isWindAnimationEnabled(): boolean {
		return this.grassMaterial.isWindAnimationEnabled();
	}

	/**
	 * Gets current wind parameters
	 */
	public getWindParameters(): { strength: number; speed: number } {
		return this.grassMaterial.getWindParameters();
	}

	/**
	 * Gets current visual parameters
	 */
	public getVisualParameters(): { contrast: number; brightness: number; opacity: number } {
		return this.grassMaterial.getVisualParameters();
	}

	/**
	 * Gets current LOD information
	 */
	public getLODInfo(): { levels: typeof this.lodLevels; activeCamera: Camera | null } {
		return {
			levels: this.lodLevels,
			activeCamera: this.activeCamera
		};
	}

	/**
	 * Gets grass shape and size information
	 */
	public getShapeInfo(): { shape: GrassShape; width: number; height: number; size: number } {
		return {
			shape: this.SHAPE,
			width: this.PLANE_WIDTH,
			height: this.PLANE_HEIGHT,
			size: this.PLANE_SIZE
		};
	}

	/**
	 * Updates blade geometry parameters (requires regeneration)
	 */
	public updateBladeGeometry(width: number, height: number, heightVariation: number, tipBendStrength: number): void {
		// Store new values
		(this as any).BLADE_WIDTH = width;
		(this as any).BLADE_HEIGHT = height;
		(this as any).BLADE_HEIGHT_VARIATION = heightVariation;
		(this as any).TIP_BEND_STRENGTH = tipBendStrength;
		
		// Regenerate grass
		this.recreateGrass();
	}

	/**
	 * Updates blade count (requires regeneration)
	 */
	public updateBladeCount(count: number): void {
		(this as any).BLADE_COUNT = count;
		this.setupLODLevels();
		this.recreateGrass();
	}

	/**
	 * Recreates grass geometry with current parameters
	 */
	private recreateGrass(): void {
		// Dispose old mesh
		if (this.grassMesh) {
			this.grassMesh.dispose();
		}
		
		// Create new grass
		this.createGrass();
	}

	/**
	 * Gets current blade geometry parameters
	 */
	public getBladeGeometry(): { width: number; height: number; heightVariation: number; tipBendStrength: number } {
		return {
			width: this.BLADE_WIDTH,
			height: this.BLADE_HEIGHT,
			heightVariation: this.BLADE_HEIGHT_VARIATION,
			tipBendStrength: this.TIP_BEND_STRENGTH
		};
	}

	/**
	 * Gets current blade count
	 */
	public getBladeCount(): number {
		return this.BLADE_COUNT;
	}

	/**
	 * Disposes the grass system
	 */
	public dispose(): void {
		if (this.grassMesh) {
			this.grassMesh.dispose();
		}
		if (this.grassMaterial) {
			this.grassMaterial.dispose();
		}
	}
}
