/**
 * SPS Animation Types - аналоги стандартных типов анимации Babylon.js
 */

import { SolidParticleSystem } from "babylonjs";
import { IVFXSolidParticleSystem } from "./types";

export class SpsAnimation {
	public enabled: boolean = true;
	public keyframes: ISpsAnimationKeyframe[] = [];
	public loop: boolean = false;
	public randomize: boolean = false;
	public randomRange: number = 0;

	public id: string;
	public name: string;
	public property: "position" | "rotation" | "scaling" | "color" | "visibility";
	public component: "x" | "y" | "z" | "r" | "g" | "b" | "a";
	public particleId: number;

	constructor(id: number) {
		this.id = `particle_${id}`;
		this.name = `Particle ${id}`;
		this.property = "position";
		this.component = "x";
		this.particleId = id;
	}
}

/**
 * Аналог IAnimatable для SPS компонентов
 * Представляет SPS компонент как анимируемый объект
 */
export interface ISpsAnimatable extends SolidParticleSystem {
	/**
	 * Массив анимаций для SPS (аналогично object.animations)
	 */
	animations: SpsAnimation[];
}

/**
 * Аналог Animation для SPS анимаций
 * Представляет анимацию конкретной частицы
 */
export interface ISpsAnimation {
	/**
	 * Уникальный ID анимации
	 */
	id: string;

	/**
	 * Имя анимации
	 */
	name: string;

	/**
	 * Свойство для анимации (position, rotation, scaling, color, visibility)
	 */
	property: "position" | "rotation" | "scaling" | "color" | "visibility";

	/**
	 * Компонент свойства (x, y, z, r, g, b, a)
	 */
	component: "x" | "y" | "z" | "r" | "g" | "b" | "a";

	/**
	 * ID частицы, к которой привязана анимация
	 */
	particleId: number;

	/**
	 * Включена ли анимация
	 */
	enabled: boolean;

	/**
	 * Ключевые кадры анимации
	 */
	keyframes: ISpsAnimationKeyframe[];

	/**
	 * Зацикливать ли анимацию
	 */
	loop: boolean;

	/**
	 * Добавлять ли случайность
	 */
	randomize: boolean;

	/**
	 * Диапазон случайности (0-1)
	 */
	randomRange: number;
}

/**
 * Ключевой кадр SPS анимации
 */
export interface ISpsAnimationKeyframe {
	/**
	 * Время ключевого кадра (0-1, нормализованное)
	 */
	time: number;

	/**
	 * Значение в ключевом кадре
	 */
	value: number;

	/**
	 * Тип сглаживания
	 */
	easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

/**
 * Утилиты для работы с SPS анимациями
 */
export class SpsAnimationUtils {
	/**
	 * Создает ISpsAnimatable из IVFXSolidParticleSystem
	 */
	public static createSpsAnimatable(spsComponent: IVFXSolidParticleSystem): ISpsAnimatable {
		const animations: ISpsAnimation[] = [];

		// Преобразуем все анимации частиц в плоский массив
		spsComponent.animationSettings.particles.forEach((particle) => {
			particle.animations.forEach((anim) => {
				animations.push({
					id: anim.id,
					name: anim.name,
					property: anim.property,
					component: anim.component,
					particleId: particle.id,
					enabled: anim.enabled,
					keyframes: anim.keyframes,
					loop: anim.loop,
					randomize: anim.randomize,
					randomRange: anim.randomRange,
				});
			});
		});

		return {
			...spsComponent,
			animations,
		};
	}

	/**
	 * Обновляет SPS компонент из ISpsAnimatable
	 */
	public static updateSpsComponent(spsAnimatable: ISpsAnimatable): void {
		const spsComponent = spsAnimatable;

		// Очищаем все анимации частиц
		spsComponent.animationSettings.particles.forEach((particle) => {
			particle.animations = [];
		});

		// Заполняем анимации из ISpsAnimatable
		spsAnimatable.animations.forEach((anim) => {
			const particle = spsComponent.animationSettings.particles.find((p) => p.id === anim.particleId);
			if (particle) {
				particle.animations.push({
					id: anim.id,
					name: anim.name,
					property: anim.property,
					component: anim.component,
					enabled: anim.enabled,
					keyframes: anim.keyframes,
					loop: anim.loop,
					randomize: anim.randomize,
					randomRange: anim.randomRange,
				});
			}
		});

		// Обновляем selectedParticleId
		spsComponent.selectedParticleId = spsAnimatable.selectedParticleId;
	}

	/**
	 * Проверяет, является ли объект SPS анимируемым
	 */
	public static isSpsAnimatable(object: any): object is ISpsAnimatable {
		return object && typeof object === "object" && "spsComponent" in object && "animations" in object && "selectedParticleId" in object;
	}

	/**
	 * Проверяет, является ли объект SPS компонентом
	 */
	public static isSpsComponent(object: any): object is IVFXSolidParticleSystem {
		return object && typeof object === "object" && object.type === "solid_particle_system" && "babylonSPS" in object && "animationSettings" in object;
	}
}
