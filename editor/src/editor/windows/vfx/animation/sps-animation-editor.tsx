import { Component, ReactNode } from "react";
import { Editor } from "../../../main";
import { IVFXSolidParticleSystem, ISPSParticleAnimation } from "../types";
import { SPSSAnimationToolbar } from "./toolbar/sps-toolbar";
import { SPSSAnimationParticlesPanel } from "./particles/sps-particles";
import { SPSSAnimationTracksPanel } from "./tracks/sps-tracks";
import { SPSSAnimationTimelinePanel } from "./timeline/sps-timeline";
import { SPSSAnimationInspector } from "./inspector/sps-inspector";

export interface ISPSAnimationEditorProps {
	editor: Editor;
	spsComponent: IVFXSolidParticleSystem | null;
	onAnimationUpdate?: (sps: IVFXSolidParticleSystem) => void;
}

export interface ISPSAnimationEditorState {
	playing: boolean;
	focused: boolean;
	selectedParticle: number | null;
	selectedAnimation: ISPSParticleAnimation | null;
}

export class SPSSAnimationEditor extends Component<ISPSAnimationEditorProps, ISPSAnimationEditorState> {
	public particles!: SPSSAnimationParticlesPanel;
	public tracks!: SPSSAnimationTracksPanel;
	public timeline!: SPSSAnimationTimelinePanel;
	public inspector!: SPSSAnimationInspector;
	public toolbar!: SPSSAnimationToolbar;

	private _playing: boolean = false;
	private _currentTimeBeforePlay: number | null = null;
	private _onKeyUpListener: (event: KeyboardEvent) => void;

	public constructor(props: ISPSAnimationEditorProps) {
		super(props);

		this.state = {
			playing: false,
			focused: false,
			selectedParticle: null,
			selectedAnimation: null,
		};
	}

	public render(): ReactNode {
		if (!this.props.spsComponent) {
			return this._getEmpty();
		}

		return (
			<div className="flex flex-col min-w-full h-full">
				<SPSSAnimationToolbar animationEditor={this} playing={this.state.playing} spsComponent={this.props.spsComponent} />

				<div className="flex w-full h-10">
					<div className="flex justify-center items-center font-semibold w-64 h-full bg-secondary">Particles</div>
					<div className="w-1 h-full bg-primary-foreground" />
					<div className="flex justify-center items-center font-semibold w-96 h-full bg-secondary">Tracks</div>
					<div className="w-1 h-full bg-primary-foreground" />
					<div className="flex justify-center items-center font-semibold w-full h-full bg-secondary">Timeline</div>
				</div>

				<div
					onClick={() => this.setState({ focused: true })}
					onMouseLeave={() => this.setState({ focused: false })}
					className="relative flex w-full h-full overflow-x-hidden overflow-y-auto"
				>
					<SPSSAnimationParticlesPanel animationEditor={this} ref={(r) => (this.particles = r!)} spsComponent={this.props.spsComponent} />

					<div className="w-1 h-full bg-primary-foreground" />

					<SPSSAnimationTracksPanel animationEditor={this} ref={(r) => (this.tracks = r!)} spsComponent={this.props.spsComponent} />

					<div className="w-1 h-full bg-primary-foreground" />

					<SPSSAnimationTimelinePanel animationEditor={this} editor={this.props.editor} ref={(r) => (this.timeline = r!)} spsComponent={this.props.spsComponent} />

					<SPSSAnimationInspector animationEditor={this} ref={(r) => (this.inspector = r!)} />
				</div>
			</div>
		);
	}

	public componentDidMount(): void {
		window.addEventListener(
			"keyup",
			(this._onKeyUpListener = (ev) => {
				if (ev.key !== " " || !this.state.focused) {
					return;
				}

				if (this.state.playing) {
					this.stop();
				} else {
					this.play();
				}
			})
		);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("keyup", this._onKeyUpListener);
		this.stop();
	}

	/**
	 * Sets the edited SPS component
	 */
	public setEditedObject(spsComponent: IVFXSolidParticleSystem | null): void {
		// This method is called by VFXAnimationPanel when switching components
		// The component is already passed via props, so we just need to update state
		if (spsComponent) {
			this.setState({
				selectedParticle: spsComponent.selectedParticleId,
				selectedAnimation: null,
			});
		}
	}

	/**
	 * Sets the selected particle
	 */
	public setSelectedParticle(particleId: number | null): void {
		this.setState({ selectedParticle: particleId });
		if (this.props.spsComponent) {
			this.props.spsComponent.selectedParticleId = particleId;
		}
	}

	/**
	 * Sets the selected animation
	 */
	public setSelectedAnimation(animation: ISPSParticleAnimation | null): void {
		this.setState({ selectedAnimation: animation });
	}

	/**
	 * Sets the current time being edited in the timeline
	 */
	public setCurrentTime(currentTime: number): void {
		// TODO: Implement SPS time setting
		console.log("Set current time:", currentTime);
	}

	/**
	 * Plays the current timeline starting from the current tracker position.
	 */
	public play(): void {
		if (this._playing) {
			return;
		}

		this.setState({ playing: true });
		this._playing = true;
		this._currentTimeBeforePlay = this.timeline.state.currentTime;

		this.timeline.play();
	}

	/**
	 * Stops the current timeline being played and returns to the previous tracker position
	 * saved before the timeline was played.
	 */
	public stop(): void {
		if (!this._playing) {
			return;
		}

		this._playing = false;
		this.setState({ playing: false });

		this.timeline.stop();

		if (this._currentTimeBeforePlay !== null) {
			this.timeline.setCurrentTime(this._currentTimeBeforePlay);
			this._currentTimeBeforePlay = null;
		}
	}

	private _getEmpty(): ReactNode {
		return <div className="flex justify-center items-center text-center font-semibold text-xl w-full h-full">No SPS component selected.</div>;
	}
}
