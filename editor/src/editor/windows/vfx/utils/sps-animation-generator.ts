import { IVFXSolidParticleSystem, ISPSParticle, ISPSParticleAnimation, ISPSAnimationKeyframe } from "../types";

export class SPSAnimationGenerator {
	/**
	 * Generates initParticles function for SPS based on animation settings
	 */
	public static generateInitParticlesFunction(spsComponent: IVFXSolidParticleSystem): string {
		const particles = spsComponent.animationSettings.particles;

		let code = `// Generated initParticles function
function initParticles() {
    for (let i = 0; i < this.nbParticles; i++) {
        const particle = this.particles[i];
        
        // Set initial values for each particle
        particle.position = new BABYLON.Vector3(0, 0.05, 0);
        particle.scaling = new BABYLON.Vector3(1.0, 0.25, 1.0);
        particle.rotation = new BABYLON.Vector3(0, 0, 0);
        particle.color = new BABYLON.Color3(0.33, 0.49, 0.88);
    }
}`;

		return code;
	}

	/**
	 * Generates updateParticle function for SPS based on animation settings
	 */
	public static generateUpdateParticleFunction(spsComponent: IVFXSolidParticleSystem): string {
		const particles = spsComponent.animationSettings.particles;
		const duration = spsComponent.animationSettings.duration;

		let code = `// Generated updateParticle function
function updateParticle(particle) {
    const normalizedTime = (performance.now() - this._animationStartTime) / (${duration} * 1000);
    const loopTime = normalizedTime % 1.0;
    
    // Apply animations for each particle based on its index
    const particleIndex = particle.id;
    
    // Find particle configuration
    const particleConfig = this._particleConfigs[particleIndex];
    if (!particleConfig) return;
    
    // Apply each animation track
    particleConfig.animations.forEach(animation => {
        if (!animation.enabled) return;
        
        const value = this._evaluateAnimation(animation, loopTime);
        this._applyAnimationToParticle(particle, animation, value);
    });
}`;

		return code;
	}

	/**
	 * Generates helper functions for animation evaluation
	 */
	public static generateHelperFunctions(): string {
		return `
// Helper function to evaluate animation at given time
function _evaluateAnimation(animation, time) {
    if (animation.keyframes.length === 0) return 0;
    if (animation.keyframes.length === 1) return animation.keyframes[0].value;
    
    // Find surrounding keyframes
    let beforeKeyframe = animation.keyframes[0];
    let afterKeyframe = animation.keyframes[animation.keyframes.length - 1];
    
    for (let i = 0; i < animation.keyframes.length - 1; i++) {
        if (time >= animation.keyframes[i].time && time <= animation.keyframes[i + 1].time) {
            beforeKeyframe = animation.keyframes[i];
            afterKeyframe = animation.keyframes[i + 1];
            break;
        }
    }
    
    // Interpolate between keyframes
    const t = (time - beforeKeyframe.time) / (afterKeyframe.time - beforeKeyframe.time);
    const easedT = this._applyEasing(t, beforeKeyframe.easing || "linear");
    
    return beforeKeyframe.value + (afterKeyframe.value - beforeKeyframe.value) * easedT;
}

// Helper function to apply easing
function _applyEasing(t, easing) {
    switch (easing) {
        case "ease-in":
            return t * t;
        case "ease-out":
            return 1 - (1 - t) * (1 - t);
        case "ease-in-out":
            return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
        default:
            return t;
    }
}

// Helper function to apply animation value to particle
function _applyAnimationToParticle(particle, animation, value) {
    const randomFactor = animation.randomize ? (Math.random() - 0.5) * animation.randomRange * 2 : 0;
    const finalValue = value + randomFactor;
    
    switch (animation.property) {
        case "position":
            particle.position[animation.component] = finalValue;
            break;
        case "rotation":
            particle.rotation[animation.component] = finalValue;
            break;
        case "scaling":
            particle.scaling[animation.component] = finalValue;
            break;
        case "color":
            particle.color[animation.component] = finalValue;
            break;
        case "visibility":
            particle.visibility = finalValue;
            break;
    }
}`;
	}

	/**
	 * Generates complete animation system for SPS
	 */
	public static generateCompleteAnimationSystem(spsComponent: IVFXSolidParticleSystem): string {
		const initFunction = this.generateInitParticlesFunction(spsComponent);
		const updateFunction = this.generateUpdateParticleFunction(spsComponent);
		const helperFunctions = this.generateHelperFunctions();

		return `${initFunction}

${updateFunction}

${helperFunctions}`;
	}

	/**
	 * Creates particle configurations array for SPS
	 */
	public static createParticleConfigs(spsComponent: IVFXSolidParticleSystem): any[] {
		return spsComponent.animationSettings.particles.map((particle) => ({
			id: particle.id,
			name: particle.name,
			enabled: particle.enabled,
			animations: particle.animations.map((animation) => ({
				id: animation.id,
				name: animation.name,
				property: animation.property,
				component: animation.component,
				enabled: animation.enabled,
				keyframes: animation.keyframes,
				loop: animation.loop,
				randomize: animation.randomize,
				randomRange: animation.randomRange,
			})),
		}));
	}
}
