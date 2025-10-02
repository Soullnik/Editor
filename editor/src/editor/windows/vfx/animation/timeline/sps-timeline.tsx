import { Component, ReactNode } from "react";
import { Vector3, Color4 } from "babylonjs";
import { IVFXSolidParticleSystem } from "../../types";
import { Editor } from "../../../../main";
import { SPSSAnimationEditor } from "../sps-animation-editor";
import { SPSSAnimationTracker } from "./sps-tracker";
import { SPSSAnimationTimelineItem } from "./sps-timeline-item";

export interface ISPSAnimationTimelinePanelProps {
	editor: Editor;
	spsComponent: IVFXSolidParticleSystem;
	animationEditor: SPSSAnimationEditor;
}

export interface ISPSAnimationTimelinePanelState {
	scale: number;
	moving: boolean;
	currentTime: number;
}

export class SPSSAnimationTimelinePanel extends Component<ISPSAnimationTimelinePanelProps, ISPSAnimationTimelinePanelState> {
	private _divRef: HTMLDivElement | null = null;

	public constructor(props: ISPSAnimationTimelinePanelProps) {
		super(props);

		this.state = {
			scale: 1,
			moving: false,
			currentTime: 0,
		};
	}

	public render(): ReactNode {
		const selectedParticle = this.props.animationEditor.state.selectedParticle;
		if (selectedParticle === null) {
			return this._getEmpty();
		}

		const particle = this.props.spsComponent.animationSettings.particles.find((p) => p.id === selectedParticle);
		if (!particle || particle.animations.length === 0) {
			return this._getEmptyTracks();
		}

		const width = this._getMaxWidthForTimeline();

		return (
			<div
				ref={(r) => (this._divRef = r)}
				onWheel={(ev) => this._onWheelEvent(ev)}
				onMouseDown={(ev) => this._handlePointerDown(ev)}
				className="relative flex flex-col w-full h-full overflow-x-auto overflow-y-hidden"
			>
				<SPSSAnimationTracker
					width={width}
					scale={this.state.scale}
					currentTime={this.state.currentTime}
					onTimeChange={(currentTime) => this.setCurrentTime(currentTime)}
				/>

				{/* Current time indicator */}
				<div
					style={{
						left: `${this.state.currentTime * this.state.scale - 1.5}px`,
					}}
					className="absolute top-10 h-full w-[3px] bg-secondary/35 z-10"
				/>

				<div
					style={{
						width: `${width}px`,
					}}
					className="flex flex-col min-w-full"
				>
					{particle.animations.map((animation, index) => (
						<SPSSAnimationTimelineItem
							key={`${animation.property}_${animation.component}_${index}`}
							animation={animation}
							scale={this.state.scale}
							currentTime={this.state.currentTime}
							animationEditor={this.props.animationEditor}
						/>
					))}
				</div>
			</div>
		);
	}

	public componentDidUpdate(prevProps: ISPSAnimationTimelinePanelProps): void {
		// Sync with parent animation editor state
		if (this.props.animationEditor.state.currentTime !== this.state.currentTime) {
			this.setState({ currentTime: this.props.animationEditor.state.currentTime });
		}
		if (this.props.animationEditor.state.scale !== this.state.scale) {
			this.setState({ scale: this.props.animationEditor.state.scale });
		}
	}

	/**
	 * Sets the current time being edited in the timeline
	 */
	public setCurrentTime(currentTime: number): void {
		this.setState({ currentTime });
		this.props.animationEditor.setCurrentTime(currentTime);
	}

	/**
	 * Sets the scale of the timeline
	 */
	public setScale(scale: number): void {
		this.setState({ scale });
	}

	/**
	 * Plays the animation
	 */
	public play(): void {
		const spsComponent = this.props.spsComponent;
		if (!spsComponent || !spsComponent.babylonSPS) {
			console.warn("No SPS component or babylonSPS found");
			return;
		}

		const sps = spsComponent.babylonSPS;

		// Set animation start time
		sps._animationStartTime = performance.now();

		// Create particle configurations
		sps._particleConfigs = this._createParticleConfigs(spsComponent);

		// Set up initParticles function
		sps.initParticles = () => {
			for (let i = 0; i < sps.nbParticles; i++) {
				const particle = sps.particles[i];

				// Set initial values for each particle
				particle.position = new Vector3(0, 0, 0);
				particle.scaling = new Vector3(1.0, 1.0, 1.0);
				particle.rotation = new Vector3(0, 0, 0);
				particle.color = new Color4(1.0, 1.0, 1.0, 1.0);
			}
		};

		// Set up updateParticle function
		sps.updateParticle = (particle) => {
			const duration = spsComponent.animationSettings.duration;
			const normalizedTime = (performance.now() - sps._animationStartTime) / (duration * 1000);
			const loopTime = normalizedTime % 1.0;

			// Apply animations for each particle based on its index
			const particleIndex = particle.id;

			// Find particle configuration
			const particleConfig = sps._particleConfigs[particleIndex];
			if (!particleConfig) return;

			// Apply each animation track
			particleConfig.animations.forEach((animation) => {
				if (!animation.enabled) return;

				const value = this._evaluateAnimation(animation, loopTime);
				this._applyAnimationToParticle(particle, animation, value);
			});
		};

		// Initialize particles
		sps.initParticles();
		sps.setParticles();

		// Start animation loop
		sps._animationLoop = () => {
			if (sps._animationActive) {
				sps.setParticles();
				requestAnimationFrame(sps._animationLoop);
			}
		};

		sps._animationActive = true;
		sps._animationLoop();

		console.log("SPS animation started");
	}

	/**
	 * Stops the animation
	 */
	public stop(): void {
		const spsComponent = this.props.spsComponent;
		if (!spsComponent || !spsComponent.babylonSPS) {
			return;
		}

		const sps = spsComponent.babylonSPS;

		// Stop animation loop
		sps._animationActive = false;

		// Reset particles to initial state
		if (sps.initParticles) {
			sps.initParticles();
			sps.setParticles();
		}

		console.log("SPS animation stopped");
	}

	private _getMaxWidthForTimeline(): number {
		return this._getMaxFrameForTimeline() * this.state.scale;
	}

	private _getMaxFrameForTimeline(): number {
		const duration = this.props.spsComponent.animationSettings.duration;
		return duration * 60; // Convert seconds to frames (assuming 60 FPS)
	}

	/**
	 * Creates particle configurations array for SPS
	 */
	private _createParticleConfigs(spsComponent: any): any[] {
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

	/**
	 * Evaluates animation at given time
	 */
	private _evaluateAnimation(animation: any, time: number): number {
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

	/**
	 * Applies easing to a time value
	 */
	private _applyEasing(t: number, easing: string): number {
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

	/**
	 * Applies animation value to particle
	 */
	private _applyAnimationToParticle(particle: any, animation: any, value: number): void {
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
	}

	private _onWheelEvent(ev: React.WheelEvent<HTMLDivElement>): void {
		if (ev.ctrlKey || ev.metaKey) {
			const newScale = Math.max(0.1, Math.min(10, this.state.scale + ev.deltaY * 0.001));
			this.setScale(newScale);
		}
	}

	private _getEmpty(): ReactNode {
		return (
			<div className="flex flex-col gap-2 justify-center items-center text-center font-semibold text-xl w-full h-full">
				<div>No particle selected.</div>
				<div className="text-sm text-muted-foreground">Select a particle to view its animation tracks.</div>
			</div>
		);
	}

	private _getEmptyTracks(): ReactNode {
		return (
			<div className="flex flex-col gap-2 justify-center items-center text-center font-semibold text-xl w-full h-full">
				<div>No animation tracks found.</div>
				<div className="text-sm text-muted-foreground">Add tracks to start animating your SPS particles.</div>
			</div>
		);
	}

	private _handlePointerDown(ev: React.MouseEvent<HTMLDivElement>): void {
		if (ev.button !== 0 || !this._divRef) {
			return;
		}

		document.body.style.cursor = "ew-resize";

		let mouseUpListener: (event: globalThis.MouseEvent) => void;
		let mouseMoveListener: (event: globalThis.MouseEvent) => void;

		let moving = false;
		let clientX: number | null = null;

		const scrollLeft = this._divRef.scrollLeft;
		const startPosition = (ev.nativeEvent.offsetX + scrollLeft) / this.state.scale;

		this.setCurrentTime(startPosition);

		document.body.addEventListener(
			"mousemove",
			(mouseMoveListener = (ev) => {
				if (clientX === null) {
					clientX = ev.clientX;
				}

				const delta = clientX - ev.clientX;
				if (moving || Math.abs(delta) > 5 * devicePixelRatio) {
					moving = true;
					this.setState({ moving: true });
				} else {
					return;
				}

				const currentTime = Math.round(Math.max(0, startPosition - delta / this.state.scale));
				this.setCurrentTime(currentTime);
			})
		);

		document.body.addEventListener(
			"mouseup",
			(mouseUpListener = (ev) => {
				ev.stopPropagation();

				document.body.style.cursor = "auto";

				document.body.removeEventListener("mouseup", mouseUpListener);
				document.body.removeEventListener("mousemove", mouseMoveListener);

				setTimeout(() => {
					this.setState({ moving: false });
				}, 0);
			})
		);
	}
}
