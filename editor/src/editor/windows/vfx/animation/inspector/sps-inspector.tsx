import { Component, ReactNode } from "react";
import { IVFXSolidParticleSystem, ISPSParticleAnimation } from "../../types";
import { SPSSAnimationEditor } from "../sps-animation-editor";
import { Input } from "../../../../../ui/shadcn/ui/input";
import { Label } from "../../../../../ui/shadcn/ui/label";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { Switch } from "../../../../../ui/shadcn/ui/switch";
import { Slider } from "../../../../../ui/shadcn/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../ui/shadcn/ui/select";

export interface ISPSAnimationInspectorProps {
	animationEditor: SPSSAnimationEditor;
}

export class SPSSAnimationInspector extends Component<ISPSAnimationInspectorProps> {
	public render(): ReactNode {
		const { animationEditor } = this.props;
		const spsComponent = animationEditor.props.spsComponent;
		const selectedAnimation = animationEditor.state.selectedAnimation;

		if (!spsComponent) {
			return (
				<div className="flex flex-col w-80 h-full bg-muted/20">
					<div className="p-4 text-center text-muted-foreground">No SPS component selected</div>
				</div>
			);
		}

		return (
			<div className="flex flex-col w-80 h-full bg-muted/20">
				{/* SPS Settings */}
				<div className="p-4 border-b border-border">
					<h3 className="text-sm font-medium mb-3">SPS Settings</h3>
					<div className="space-y-3">
						<div>
							<Label htmlFor="duration">Duration (seconds)</Label>
							<Input
								id="duration"
								type="number"
								step="0.1"
								value={spsComponent.animationSettings.duration}
								onChange={(e) => this._updateSPSSetting("duration", parseFloat(e.target.value))}
								className="mt-1"
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch id="loop" checked={spsComponent.animationSettings.loop} onCheckedChange={(checked) => this._updateSPSSetting("loop", checked)} />
							<Label htmlFor="loop">Loop Animation</Label>
						</div>
						<div className="flex items-center space-x-2">
							<Switch id="autoReset" checked={spsComponent.animationSettings.autoReset} onCheckedChange={(checked) => this._updateSPSSetting("autoReset", checked)} />
							<Label htmlFor="autoReset">Auto Reset</Label>
						</div>
					</div>
				</div>

				{/* Animation Inspector */}
				{selectedAnimation && (
					<div className="p-4 border-b border-border">
						<h3 className="text-sm font-medium mb-3">Animation: {selectedAnimation.name}</h3>
						<div className="space-y-3">
							<div>
								<Label htmlFor="animationName">Name</Label>
								<Input id="animationName" value={selectedAnimation.name} onChange={(e) => this._updateAnimation("name", e.target.value)} className="mt-1" />
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="animationEnabled" checked={selectedAnimation.enabled} onCheckedChange={(checked) => this._updateAnimation("enabled", checked)} />
								<Label htmlFor="animationEnabled">Enabled</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="animationLoop" checked={selectedAnimation.loop} onCheckedChange={(checked) => this._updateAnimation("loop", checked)} />
								<Label htmlFor="animationLoop">Loop</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="animationRandomize" checked={selectedAnimation.randomize} onCheckedChange={(checked) => this._updateAnimation("randomize", checked)} />
								<Label htmlFor="animationRandomize">Randomize</Label>
							</div>
							{selectedAnimation.randomize && (
								<div>
									<Label htmlFor="randomRange">Random Range</Label>
									<Slider
										id="randomRange"
										min={0}
										max={1}
										step={0.01}
										value={[selectedAnimation.randomRange]}
										onValueChange={(value) => this._updateAnimation("randomRange", value[0])}
										className="mt-1"
									/>
									<div className="text-xs text-muted-foreground mt-1">{(selectedAnimation.randomRange * 100).toFixed(0)}%</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* No selection */}
				{!selectedAnimation && <div className="p-4 text-center text-muted-foreground">Select an animation to edit properties</div>}
			</div>
		);
	}

	private _updateSPSSetting(key: string, value: any): void {
		const spsComponent = this.props.animationEditor.props.spsComponent;
		if (!spsComponent) return;

		(spsComponent.animationSettings as any)[key] = value;
		this.props.animationEditor.forceUpdate();
	}

	private _updateAnimation(key: string, value: any): void {
		const selectedAnimation = this.props.animationEditor.state.selectedAnimation;
		if (!selectedAnimation) return;

		// TODO: Update animation property
		console.log("Update animation:", selectedAnimation.id, key, value);
	}
}
