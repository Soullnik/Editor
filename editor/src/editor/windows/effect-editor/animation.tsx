import { Component, createRef, PointerEvent, ReactNode } from "react";
import { ParticleEmitter, ParticleSystem as QuarksParticleSystem, QuarksUtil } from "babylon.quarks";
import { IEffectEditor } from ".";
import { QuarksEffectDocument } from "./quarks-bridge";
import { Button } from "../../../ui/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../ui/shadcn/ui/tooltip";
import { IoPlay, IoStop, IoRefresh } from "react-icons/io5";

interface IAnimationTrack {
	effectId: string;
	effectName: string;
	particleName: string;
	duration: number;
	looping: boolean;
	currentTime: number;
}

export interface IEffectEditorAnimationProps {
	filePath: string | null;
	editor: IEffectEditor;
}

export interface IEffectEditorAnimationState {
	tracks: IAnimationTrack[];
	isPlaying: boolean;
	currentTime: number;
	totalDuration: number;
	pixelsPerSecond: number;
}

export class EffectEditorAnimation extends Component<IEffectEditorAnimationProps, IEffectEditorAnimationState> {
	private _rafId: number | null = null;
	private _lastFrameMs: number = 0;
	private readonly _rulerRef = createRef<HTMLDivElement>();
	private _isDraggingPlayhead = false;
	private _containerWidth = 600;

	public constructor(props: IEffectEditorAnimationProps) {
		super(props);
		this.state = {
			tracks: [],
			isPlaying: false,
			currentTime: 0,
			totalDuration: 5,
			pixelsPerSecond: 80,
		};
	}

	public componentDidMount(): void {
		this._refreshTracks();
	}

	public componentDidUpdate(prevProps: IEffectEditorAnimationProps): void {
		if (prevProps.editor.graph !== this.props.editor.graph) {
			this._refreshTracks();
		}
	}

	public componentWillUnmount(): void {
		this._stopRaf();
	}

	/** Refreshes track list from current graph state. */
	public refreshTracks(): void {
		this._refreshTracks();
	}

	public render(): ReactNode {
		const { tracks, isPlaying, currentTime, totalDuration, pixelsPerSecond } = this.state;
		const timelineWidth = Math.max(this._containerWidth, totalDuration * pixelsPerSecond + 80);
		const playheadX = currentTime * pixelsPerSecond + TRACK_LABEL_WIDTH;

		return (
			<div className="flex flex-col w-full h-full min-h-0 text-foreground select-none overflow-hidden">
				{/* Toolbar */}
				<div className="flex items-center gap-2 px-3 py-1.5 border-b border-border shrink-0">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant={isPlaying ? "default" : "ghost"}
									size="icon"
									className="h-7 w-7"
									onClick={() => this._handlePlayPause()}
								>
									<IoPlay className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{isPlaying ? "Pause" : "Play All"}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => this._handleStop()}>
									<IoStop className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Stop All</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => this._handleRestart()}>
									<IoRefresh className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Restart All</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<div className="ml-2 text-xs text-muted-foreground font-mono tabular-nums">
						{currentTime.toFixed(2)}s / {totalDuration.toFixed(1)}s
					</div>

					<div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
						<span>Zoom:</span>
						<button
							className="px-1.5 py-0.5 border border-border rounded text-xs hover:bg-muted"
							onClick={() => this.setState((s: IEffectEditorAnimationState) => ({ pixelsPerSecond: Math.max(20, s.pixelsPerSecond - 20) }))}
						>
							−
						</button>
						<button
							className="px-1.5 py-0.5 border border-border rounded text-xs hover:bg-muted"
							onClick={() => this.setState((s: IEffectEditorAnimationState) => ({ pixelsPerSecond: Math.min(300, s.pixelsPerSecond + 20) }))}
						>
							+
						</button>
						<button
							className="px-1.5 py-0.5 border border-border rounded text-xs hover:bg-muted"
							onClick={() => this._refreshTracks()}
						>
							Refresh
						</button>
					</div>
				</div>

				{tracks.length === 0 ? (
					<div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
						No particle systems loaded. Open an effect file to see the animation timeline.
					</div>
				) : (
					<div
						className="flex flex-col flex-1 min-h-0 overflow-auto"
						ref={(el: HTMLDivElement | null) => {
							if (el) {
								this._containerWidth = el.clientWidth - TRACK_LABEL_WIDTH;
							}
						}}
					>
						{/* Ruler row */}
						<div className="flex shrink-0 sticky top-0 z-10 bg-background/95 border-b border-border">
							{/* Label spacer */}
							<div className="shrink-0 border-r border-border" style={{ width: TRACK_LABEL_WIDTH }} />
							{/* Ruler */}
							<div
								ref={this._rulerRef}
								className="relative overflow-hidden cursor-pointer"
								style={{ width: timelineWidth - TRACK_LABEL_WIDTH, height: RULER_HEIGHT }}
								onPointerDown={(e: PointerEvent<HTMLDivElement>) => this._handleRulerPointerDown(e)}
								onPointerMove={(e: PointerEvent<HTMLDivElement>) => this._handleRulerPointerMove(e)}
								onPointerUp={() => this._handleRulerPointerUp()}
								onPointerLeave={() => this._handleRulerPointerUp()}
							>
								{this._renderRulerTicks(timelineWidth - TRACK_LABEL_WIDTH, pixelsPerSecond)}
								{/* Playhead on ruler */}
								<div
									className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none"
									style={{ left: currentTime * pixelsPerSecond }}
								/>
							</div>
						</div>

						{/* Track rows */}
						<div className="relative flex flex-col overflow-hidden">
							{/* Vertical playhead line over all tracks */}
							<div
								className="absolute top-0 bottom-0 w-px bg-primary/70 z-10 pointer-events-none"
								style={{ left: playheadX }}
							/>

							{tracks.map((track: IAnimationTrack, index: number) => (
								<div
									key={`${track.effectId}-${track.particleName}-${index}`}
									className="flex shrink-0 border-b border-border"
									style={{ height: TRACK_HEIGHT }}
								>
									{/* Label */}
									<div
										className="shrink-0 flex flex-col justify-center px-2 gap-0.5 border-r border-border bg-muted/30"
										style={{ width: TRACK_LABEL_WIDTH }}
									>
										<div className="text-xs font-medium truncate">{track.particleName}</div>
										<div className="text-[10px] text-muted-foreground truncate">{track.effectName}</div>
									</div>
									{/* Track area */}
									<div className="relative flex-1 overflow-hidden" style={{ width: timelineWidth - TRACK_LABEL_WIDTH }}>
										{this._renderTrackBar(track, pixelsPerSecond)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	}

	private _renderRulerTicks(width: number, pps: number): ReactNode {
		const ticks: ReactNode[] = [];
		const step = this._getTickStep(pps);
		const totalSeconds = width / pps;

		for (let t = 0; t <= totalSeconds + step; t += step) {
			const x = t * pps;
			const isMajor = Math.round(t / step) % 5 === 0;
			ticks.push(
				<g key={t}>
					<line
						x1={x}
						y1={isMajor ? 0 : RULER_HEIGHT / 2}
						x2={x}
						y2={RULER_HEIGHT}
						className={isMajor ? "stroke-muted-foreground" : "stroke-muted-foreground/40"}
						strokeWidth="1"
					/>
					{isMajor && (
						<text
							x={x + 3}
							y={RULER_HEIGHT - 4}
							fontSize="9"
							className="fill-muted-foreground"
							style={{ fontFamily: "monospace" }}
						>
							{t.toFixed(step < 1 ? 1 : 0)}s
						</text>
					)}
				</g>,
			);
		}

		return (
			<svg
				width={width}
				height={RULER_HEIGHT}
				className="absolute inset-0 overflow-visible"
				style={{ pointerEvents: "none" }}
			>
				{ticks}
			</svg>
		);
	}

	private _renderTrackBar(track: IAnimationTrack, pps: number): ReactNode {
		if (track.looping) {
			// Looping: draw repeating colored bands indicating loop cycles
			const bars: ReactNode[] = [];
			const loopDuration = Math.max(0.1, track.duration);
			const totalWidth = (this.state.totalDuration + 2) * pps;
			const cycleCount = Math.ceil(totalWidth / (loopDuration * pps)) + 1;
			for (let i = 0; i < cycleCount; i++) {
				bars.push(
					<div
						key={i}
						className="absolute top-1 bottom-1 rounded-sm opacity-70"
						style={{
							left: i * loopDuration * pps + 2,
							width: Math.max(2, loopDuration * pps - 4),
							background: `hsl(${(i % 2 === 0 ? 220 : 200)}, 60%, 50%)`,
						}}
					/>,
				);
			}
			return <>{bars}</>;
		}

		// Non-looping: single bar
		return (
			<div
				className="absolute top-1 bottom-1 rounded-sm bg-primary/60"
				style={{
					left: 2,
					width: Math.max(4, track.duration * pps - 4),
				}}
			/>
		);
	}

	private _getTickStep(pps: number): number {
		if (pps >= 200) {
			return 0.1;
		}
		if (pps >= 80) {
			return 0.5;
		}
		if (pps >= 40) {
			return 1;
		}
		return 2;
	}

	private _handlePlayPause(): void {
		if (this.state.isPlaying) {
			this._stopRaf();
			this.setState({ isPlaying: false });
			this.props.editor.graph?.stopAll();
		} else {
			this._lastFrameMs = performance.now();
			this.setState({ isPlaying: true }, () => this._tick());
			this.props.editor.graph?.playAll();
		}
	}

	private _handleStop(): void {
		this._stopRaf();
		this.setState({ isPlaying: false, currentTime: 0 });
		this.props.editor.graph?.stopAll();
	}

	private _handleRestart(): void {
		this._stopRaf();
		this._lastFrameMs = performance.now();
		this.setState({ isPlaying: true, currentTime: 0 }, () => this._tick());
		this.props.editor.graph?.restartAll();
	}

	private _handleRulerPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
		this._isDraggingPlayhead = true;
		e.currentTarget.setPointerCapture(e.pointerId);
		this._seekToPointer(e);
	}

	private _handleRulerPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
		if (!this._isDraggingPlayhead) {
			return;
		}
		this._seekToPointer(e);
	}

	private _handleRulerPointerUp(): void {
		this._isDraggingPlayhead = false;
	}

	private _seekToPointer(e: React.PointerEvent<HTMLDivElement>): void {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const t = Math.max(0, x / this.state.pixelsPerSecond);
		this.setState({ currentTime: Math.min(t, this.state.totalDuration) });
	}

	private _tick(): void {
		if (!this.state.isPlaying) {
			return;
		}
		const now = performance.now();
		const delta = (now - this._lastFrameMs) / 1000;
		this._lastFrameMs = now;

		this.setState((s: IEffectEditorAnimationState) => {
			let next = s.currentTime + delta;
			if (next >= s.totalDuration) {
				next = s.totalDuration;
				this._stopRaf();
				return { currentTime: next, isPlaying: false };
			}
			return { currentTime: next };
		});

		this._rafId = requestAnimationFrame(() => this._tick());
	}

	private _stopRaf(): void {
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
	}

	private _refreshTracks(): void {
		const graph = this.props.editor.graph;
		if (!graph) {
			this.setState({ tracks: [], totalDuration: 5 });
			return;
		}

		const effects = graph.getAllEffects();
		const tracks: IAnimationTrack[] = [];
		let maxDuration = 1;

		for (const effect of effects) {
			this._collectTracksFromEffect(effect, tracks);
		}

		for (const track of tracks) {
			if (!track.looping && track.duration > maxDuration) {
				maxDuration = track.duration;
			}
		}

		// For all-looping effects, show a sensible window
		if (tracks.every((t) => t.looping)) {
			maxDuration = Math.max(5, ...tracks.map((t) => t.duration * 3));
		}

		this.setState({ tracks, totalDuration: Math.ceil(maxDuration * 10) / 10 });
	}

	private _collectTracksFromEffect(effect: QuarksEffectDocument, out: IAnimationTrack[]): void {
		QuarksUtil.runOnAllParticleEmitters(effect.root, (emitter: ParticleEmitter) => {
			const system = emitter.system as QuarksParticleSystem;
			out.push({
				effectId: effect.id,
				effectName: effect.name,
				particleName: emitter.name || "Particle",
				duration: system.looping ? system.duration || 2 : system.duration || 2,
				looping: system.looping,
				currentTime: 0,
			});
		});
	}
}

const TRACK_LABEL_WIDTH = 160;
const TRACK_HEIGHT = 36;
const RULER_HEIGHT = 24;
