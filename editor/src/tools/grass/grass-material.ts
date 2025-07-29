import { RawTexture } from "babylonjs";
import { ShaderMaterial, Effect, Texture, Scene } from "babylonjs";

export interface IGrassMaterialOptions {
	windStrength?: number;
	windSpeed?: number;
	contrast?: number;
	brightness?: number;
	opacity?: number;
	textureUrl?: string;
}

export class GrassMaterial {
	private material: ShaderMaterial;
	private windStrength: number;
	private windSpeed: number;
	private contrast: number;
	private brightness: number;
	private opacity: number;

	constructor(scene: Scene, options: IGrassMaterialOptions = {}) {
		this.windStrength = options.windStrength ?? 0.3;
		this.windSpeed = options.windSpeed ?? 500.0;
		this.contrast = options.contrast ?? 1.0;
		this.brightness = options.brightness ?? 0.0;
		this.opacity = options.opacity ?? 1.0;

		this.initializeShaders();
		this.createMaterial(scene, options);
	}

	/**
	 * Initializes the vertex and fragment shaders with current parameters
	 */
	private initializeShaders(): void {
		Effect.ShadersStore["grassMaterialVertexShader"] = `
			precision highp float;
			
			// Attributes
			attribute vec3 position;
			attribute vec2 uv;
			attribute vec3 color;

			// Uniforms
			uniform mat4 world;
			uniform mat4 viewProjection;
			uniform float iTime;

			// Varying
			varying vec2 vUv;
			varying vec3 vColor;

			void main(void) {
				vUv = uv;
				vColor = color;
				vec3 cpos = position;
				
				// Optimized wind calculation - only for tip vertices (color.x > 0.6)
				if (color.x > 0.6) {
					float windOffset = sin(iTime * ${(1.0 / this.windSpeed).toFixed(6)} + uv.x * 10.0) * ${this.windStrength.toFixed(3)};
					cpos.x += windOffset;
				}
				
				gl_Position = viewProjection * world * vec4(cpos, 1.0);
			}
		`;

		Effect.ShadersStore["grassMaterialFragmentShader"] = `
			precision highp float;

			varying vec2 vUv;
			varying vec3 vColor;

			uniform sampler2D grassTexture;

			void main(void) {
				vec3 texColor = texture2D(grassTexture, vUv).rgb;
				
				// Optimized color calculation - combine all operations
				vec3 finalColor = (texColor * ${this.contrast.toFixed(3)} + ${this.brightness.toFixed(3)}) * 0.7;
				
				gl_FragColor = vec4(finalColor, ${this.opacity.toFixed(3)});
			}
		`;
	}

	/**
	 * Creates the shader material
	 */
	private createMaterial(scene: Scene, options: IGrassMaterialOptions): void {
		this.material = new ShaderMaterial(
			"grassMaterial",
			scene,
			{
				vertex: "grassMaterial",
				fragment: "grassMaterial",
			},
			{
				attributes: ["position", "uv", "color"],
				uniforms: [
					"world",
					"viewProjection",
					"iTime",
					"grassTexture",
				],
			}
		);
		
		// Set default texture if none provided
		if (!options.textureUrl) {
			this.setDefaultTexture();
		} else {
			this.setTextureUrl(options.textureUrl);
		}
	}

	/**
	 * Sets a default white texture for grass
	 */
	private setDefaultTexture(): void {
		const greenPixel = new Uint8Array([0, 255, 0, 255]); // R, G, B, A
        const greenTexture = RawTexture.CreateRGBATexture(
            greenPixel,
            1,
            1,
            this.material.getScene(),
            false, // generateMipMaps
            false, // invertY
            Texture.CLAMP_ADDRESSMODE,
            Texture.CLAMP_ADDRESSMODE
        );

        this.material.setTexture("grassTexture", greenTexture);

	}

	/**
	 * Returns the material
	 */
	public getMaterial(): ShaderMaterial {
		return this.material;
	}

	/**
	 * Updates the grass texture
	 */
	public setTexture(texture: Texture): void {
		this.material.setTexture("grassTexture", texture);
	}

	/**
	 * Updates the grass texture by URL
	 */
	public setTextureUrl(url: string): void {
		const texture = new Texture(url, this.material.getScene());
		this.material.setTexture("grassTexture", texture);
	}

	/**
	 * Updates wind parameters
	 */
	public setWindParameters(strength: number, speed: number): void {
		this.windStrength = strength;
		this.windSpeed = speed;
		this.initializeShaders();
	}

	/**
	 * Updates visual parameters
	 */
	public setVisualParameters(contrast: number, brightness: number, opacity: number): void {
		this.contrast = contrast;
		this.brightness = brightness;
		this.opacity = opacity;
		this.initializeShaders();
	}

	/**
	 * Gets current wind parameters
	 */
	public getWindParameters(): { strength: number; speed: number } {
		return {
			strength: this.windStrength,
			speed: this.windSpeed,
		};
	}

	/**
	 * Gets current visual parameters
	 */
	public getVisualParameters(): { contrast: number; brightness: number; opacity: number } {
		return {
			contrast: this.contrast,
			brightness: this.brightness,
			opacity: this.opacity,
		};
	}

	/**
	 * Disposes the material
	 */
	public dispose(): void {
		if (this.material) {
			this.material.dispose();
		}
	}
}
