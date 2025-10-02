import { Component, ReactNode } from "react";

export interface ISPSAnimationTrackerProps {
	width: number;
	scale: number;
	currentTime: number;
	onTimeChange: (currentTime: number) => void;
}

export class SPSSAnimationTracker extends Component<ISPSAnimationTrackerProps> {
	public render(): ReactNode {
		const { width, scale, currentTime } = this.props;

		return (
			<div className="relative h-10 bg-muted/30 border-b border-border">
				{/* Time markers */}
				{this._generateTimeMarkers(width, scale)}

				{/* Current time indicator */}
				<div
					style={{
						left: `${currentTime * scale - 1.5}px`,
					}}
					className="absolute top-0 h-full w-[3px] bg-primary z-10"
				/>
			</div>
		);
	}

	private _generateTimeMarkers(width: number, scale: number): ReactNode {
		const markers = [];
		const markerInterval = this._getMarkerInterval(scale);
		const startTime = 0;
		const endTime = width / scale;

		for (let time = startTime; time <= endTime; time += markerInterval) {
			const left = time * scale;
			const isMajorMarker = time % (markerInterval * 5) === 0;

			markers.push(<div key={time} style={{ left: `${left}px` }} className={`absolute top-0 h-full w-[1px] ${isMajorMarker ? "bg-foreground/60" : "bg-foreground/30"}`} />);

			if (isMajorMarker) {
				markers.push(
					<div key={`label-${time}`} style={{ left: `${left + 2}px` }} className="absolute top-1 text-xs text-foreground/70 font-mono">
						{time.toFixed(1)}s
					</div>
				);
			}
		}

		return markers;
	}

	private _getMarkerInterval(scale: number): number {
		// Adjust marker interval based on scale
		if (scale < 0.5) return 10;
		if (scale < 1) return 5;
		if (scale < 2) return 2;
		if (scale < 5) return 1;
		return 0.5;
	}
}
