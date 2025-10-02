import { Component, ReactNode } from "react";
import { IoPlay, IoStop } from "react-icons/io5";
import { IVFXSolidParticleSystem } from "../../types";
import { Button } from "../../../../../ui/shadcn/ui/button";
import { Slider } from "../../../../../ui/shadcn/ui/slider";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "../../../../../ui/shadcn/ui/menubar";
import { SPSSAnimationEditor } from "../sps-animation-editor";

export interface ISPSAnimationToolbarProps {
	playing: boolean;
	spsComponent: IVFXSolidParticleSystem | null;
	animationEditor: SPSSAnimationEditor;
}

export class SPSSAnimationToolbar extends Component<ISPSAnimationToolbarProps> {
	public render(): ReactNode {
		return (
			<div className="flex justify-between items-center w-full h-10 bg-primary-foreground">
				<Menubar className="border-none rounded-none pl-3 my-auto bg-primary-foreground h-10">
					{/* File */}
					<MenubarMenu>
						<MenubarTrigger disabled={this.props.spsComponent === null}>File</MenubarTrigger>
						<MenubarContent className="border-black/50">
							<MenubarItem onClick={() => this._exportAnimation()}>Export Animation...</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onClick={() => this._importAnimation()}>Import Animation...</MenubarItem>
						</MenubarContent>
					</MenubarMenu>

					{/* Edit */}
					<MenubarMenu>
						<MenubarTrigger disabled={this.props.spsComponent === null}>Edit</MenubarTrigger>
						<MenubarContent className="border-black/50">
							<MenubarItem onClick={() => this._addKeyframesAtCurrentTime()}>Add Keyframes At Current Time</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onClick={() => this._resetAnimation()}>Reset Animation</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>

				{/* Controls */}
				<div className="flex gap-2 items-center pr-2">
					<Slider
						min={0.1}
						max={5}
						step={0.1}
						className="w-32"
						value={[this.props.animationEditor.state.scale]}
						onValueChange={(v) => {
							this.props.animationEditor.setScale(v[0]);
						}}
					/>

					<Button
						variant="ghost"
						disabled={!this.props.playing}
						onClick={() => this.props.animationEditor.stop()}
						className="w-8 h-8 p-1 disabled:opacity-25 transition-all duration-150 ease-in-out"
					>
						<IoStop className="w-6 h-6" strokeWidth={1} color="red" />
					</Button>

					<Button
						variant="ghost"
						onClick={() => this.props.animationEditor.play()}
						disabled={this.props.spsComponent === null || this.props.playing}
						className="w-8 h-8 p-1 disabled:opacity-25 transition-all duration-150 ease-in-out"
					>
						<IoPlay className="w-6 h-6" strokeWidth={1} color="green" />
					</Button>
				</div>
			</div>
		);
	}

	private _exportAnimation(): void {
		// TODO: Implement animation export
		console.log("Export animation");
	}

	private _importAnimation(): void {
		// TODO: Implement animation import
		console.log("Import animation");
	}

	private _addKeyframesAtCurrentTime(): void {
		// TODO: Implement adding keyframes at current time
		console.log("Add keyframes at current time");
	}

	private _resetAnimation(): void {
		if (!this.props.spsComponent) return;

		this.props.animationEditor.setCurrentTime(0);
		this.props.animationEditor.stop();
	}
}
