import { Component, ReactNode } from "react";
import { join, dirname } from "path/posix";
import sharp from "sharp";
import { FileJson } from "lucide-react";
import { SpriteMap, ISpriteJSONSprite, PBRMaterial, Vector2 } from "babylonjs";
import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { cn } from "../../../../ui/utils";
import { projectConfiguration } from "../../../../project/configuration";
import { toast } from "sonner";
import { MdOutlineQuestionMark } from "react-icons/md";
import { EditorInspectorNumberField } from "./number";
import { EditorInspectorSwitchField } from "./switch";

type SpriteMapPBRMaterial = PBRMaterial & { metadata: { spriteMapInstance?: SpriteMap } };

interface IEditorInspectorSpriteMapFieldProps {
	object: SpriteMapPBRMaterial;
	onChange?: () => void;
} 

interface IEditorInspectorSpriteMapFieldState {
	selectedTile: ISpriteJSONSprite | null;
	searchFilter: string;
	previewUrl: string | null;
}

export class EditorInspectorSpriteMapField extends Component<IEditorInspectorSpriteMapFieldProps, IEditorInspectorSpriteMapFieldState> {
	public constructor(props: IEditorInspectorSpriteMapFieldProps) {
		super(props);

		this.state = {
			selectedTile: null,
			searchFilter: "",
			previewUrl: null,
		};

		this._computePreview();
	}



	public componentWillUnmount(): void {
		if (this.state.previewUrl) {
			URL.revokeObjectURL(this.state.previewUrl);
		}
	}

	public render(): ReactNode {
		const spriteMap = this._getSpriteMap(this.props.object);
		if (!spriteMap) {return null;}
		return (
			<div className="flex flex-col gap-4">
				{this._getAtlasHeaderComponent(spriteMap)}
				{this._getSpriteMapSettingsComponent(spriteMap)}
				{this._getSearchFilterComponent()}
				{this._getSelectedTileComponent()}
				{this._getTilesGridComponent(spriteMap)}
			</div>
		);
	}

	private _getAtlasHeaderComponent(spriteMap: SpriteMap): ReactNode {
		const meta = this._getAtlasMeta(this.props.object);
		return (
			<div className="flex items-center justify-between p-3 bg-muted rounded-md">
				<div className="flex items-center gap-3">
					<FileJson className="w-5 h-5 text-primary" />
					<div>
						<div className="text-sm font-medium">
							{meta?.image}
						</div>
						<div className="text-xs text-muted-foreground">
							{spriteMap.sprites.length} tiles • {meta?.size?.w}×{meta?.size?.h}
						</div>
					</div>
				</div>
			</div>
		);
	}

	private _getSpriteMapSettingsComponent(spriteMap: SpriteMap): ReactNode {
		return (
			<div className="flex flex-col gap-2 p-2 bg-muted rounded">
				<Label className="text-sm font-medium">SpriteMap Settings</Label>
				<div className="flex gap-2">
					<EditorInspectorNumberField 
						label="Stage Width" 
						property="x" 
						object={spriteMap.options.stageSize} 
						onChange={v => { 
							spriteMap.options.stageSize = new Vector2(v, spriteMap.options.stageSize?.y ?? 1);
							this._recreateSpriteMap(spriteMap);
						}} 
					/>
					<EditorInspectorNumberField 
						label="Stage Height" 
						property="y" 
						object={spriteMap.options.stageSize} 
						onChange={v => { 
							spriteMap.options.stageSize = new Vector2(spriteMap.options.stageSize?.x ?? 1, v);
							this._recreateSpriteMap(spriteMap);
						}} 
					/>
				</div>
				<div className="flex gap-2">
					<EditorInspectorNumberField 
						label="Position" 
						property="x" 
						object={spriteMap.position} 
						onChange={v => { spriteMap.position.x = v; this.forceUpdate(); }} 
					/>
					<EditorInspectorNumberField 
						property="y" 
						object={spriteMap.position} 
						onChange={v => { spriteMap.position.y = v; this.forceUpdate(); }} 
					/>
					<EditorInspectorNumberField 
						property="z" 
						object={spriteMap.position} 
						onChange={v => { spriteMap.position.z = v; this.forceUpdate(); }} 
					/>
				</div>
				<div className="flex gap-2">
					<EditorInspectorNumberField 
						label="Rotation" 
						property="x" 
						object={spriteMap.rotation} 
						onChange={v => { spriteMap.rotation.x = v; this.forceUpdate(); }} 
					/>
					<EditorInspectorNumberField 
						property="y" 
						object={spriteMap.rotation} 
						onChange={v => { spriteMap.rotation.y = v; this.forceUpdate(); }} 
					/>
					<EditorInspectorNumberField 
						property="z" 
						object={spriteMap.rotation} 
						onChange={v => { spriteMap.rotation.z = v; this.forceUpdate(); }} 
					/>
				</div>	
				<div className="flex gap-2 flex-col">
					<EditorInspectorSwitchField 
						label="Fog Enabled" 
						property="fogEnabled" 
						object={spriteMap} 
						onChange={v => { spriteMap.fogEnabled = v; this.forceUpdate(); }} />
					<EditorInspectorSwitchField 
						label="Logarithmic Depth" 
						property="useLogarithmicDepth" 
						object={spriteMap} 
						onChange={v => { spriteMap.useLogarithmicDepth = v; this.forceUpdate(); }} />
					<EditorInspectorSwitchField 
						label="Flip U" 
						property="flipU" 
						object={spriteMap.options} 
						onChange={v => { spriteMap.options.flipU = v; this.forceUpdate(); }} />
				</div>
			</div>
		);
	}

	private _getSearchFilterComponent(): ReactNode {
		const { searchFilter } = this.state;
		return (
			<div className="flex flex-col gap-2">
				<Label htmlFor="tile-search" className="text-sm font-medium">Search Tiles</Label>
				<Input
					id="tile-search"
					type="text"
					value={searchFilter}
					onChange={(e) => this.setState({ searchFilter: e.target.value })}
					placeholder="Filter tiles by name..."
					className="h-8"
				/>
			</div>
		);
	}

	private _getSelectedTileComponent(): ReactNode {
		const { selectedTile, previewUrl } = this.state;
		if (!selectedTile) {return null;}
		const meta = this._getAtlasMeta(this.props.object);
		const containerSize = 64;
		return (
			<div className="flex flex-col gap-3 p-3 bg-accent/50 rounded-md border border-accent">
				<div className="text-sm font-medium">Selected Tile</div>
				<div className="flex gap-3">
					{previewUrl && meta?.size && (
						<div className="flex items-center justify-center" style={this._getTilePreviewStyle(
							selectedTile,
							meta.size,
							containerSize,
							previewUrl,
						)} />
					)}
					{!previewUrl && (
						<MdOutlineQuestionMark className="w-5 h-5 text-muted-foreground" />
					)}
					<div className="flex flex-col gap-1">
						<div className="text-sm font-medium">{selectedTile.filename}</div>
						<div className="text-xs text-muted-foreground">
							Size: {selectedTile.frame.w}×{selectedTile.frame.h}
						</div>
						<div className="text-xs text-muted-foreground">
							Position: ({selectedTile.frame.x}, {selectedTile.frame.y})
						</div>
					</div>
				</div>
			</div>
		);
	}

	private _getTilesGridComponent(spriteMap: SpriteMap): ReactNode {
		const { searchFilter, selectedTile, previewUrl } = this.state;
		const meta = this._getAtlasMeta(this.props.object);
		const filteredFrames = spriteMap.sprites.filter(frame =>
			frame.filename.toLowerCase().includes(searchFilter.toLowerCase())
		);
		const containerSize = 48;
		return (
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<Label className="text-sm font-medium">
						Tiles ({filteredFrames.length}/{spriteMap.sprites.length})
					</Label>
				</div>
				<div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
					{filteredFrames.map((frame, index) => {
						return (
							<div
								key={index}
								onClick={() => this._applySelectedTile(frame)}
								className={cn(
									"flex flex-col items-center p-2 rounded-md cursor-pointer transition-colors",
									selectedTile?.filename === frame.filename
										? "bg-accent border border-accent-foreground/20"
										: "bg-muted hover:bg-accent/50"
								)}
							>
								{previewUrl && meta?.size && (
									<div className="flex items-center justify-center" style={this._getTilePreviewStyle(
										frame,
										meta.size,
										containerSize,
										previewUrl,
									)} />
								)}
								{!previewUrl && (
									<MdOutlineQuestionMark className="w-5 h-5 text-muted-foreground" />
								)}
								<div className="text-xs text-center mt-1 truncate w-full">
									{frame.filename}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	private _applySelectedTile(frame?: ISpriteJSONSprite): void {
		if(!frame) {return;}
		const spriteMap = this._getSpriteMap(this.props.object);
		if(!spriteMap) {return;}
		const idx = spriteMap.getTileIdxByName(frame.filename);
		spriteMap.changeTiles(0, new Vector2(0, 0), idx);
		this.setState({ selectedTile: frame });
		this.props.onChange?.();
	}

	private async _computePreview(): Promise<void> {
		const textureUrl = this._getSpriteMap(this.props.object)?.spriteSheet.url;
		if (!textureUrl) {return;}
		const path = join(dirname(projectConfiguration.path!), textureUrl);
		try {
			const buffer = await sharp(path).toBuffer();
			if (this.state.previewUrl) {
				URL.revokeObjectURL(this.state.previewUrl);
			}
			this.setState({ previewUrl: URL.createObjectURL(new Blob([buffer])) });
		} catch (error) {
			toast.error("Failed to load SpriteMap preview");
		}
	}

	private _getSpriteMap(material: PBRMaterial): SpriteMap | undefined {
		return (material.metadata as { spriteMapInstance?: SpriteMap })?.spriteMapInstance;
	}

	private _getAtlasMeta(material: PBRMaterial): { image: string; size: { w: number; h: number } } | undefined {
		return (material.metadata as { spriteMapInstance?: SpriteMap })?.spriteMapInstance?.atlasJSON?.meta as any;
	}


	private _getTilePreviewStyle(
		frame: ISpriteJSONSprite,
		atlasSize: { w: number; h: number },
		containerSize: number,
		previewUrl: string,
	) {
		const scale = Math.min(
			containerSize / frame.frame.w,
			containerSize / frame.frame.h
		);
		const bgWidth = atlasSize.w * scale;
		const bgHeight = atlasSize.h * scale;
		const bgPosX = -frame.frame.x * scale;
		const bgPosY = -frame.frame.y * scale;
		return {
			width: containerSize,
			height: containerSize,
			background: "#222",
			borderRadius: "0.25rem",
			overflow: "hidden",
			backgroundImage: `url(${previewUrl})`,
			backgroundSize: `${bgWidth}px ${bgHeight}px`,
			backgroundPosition: `${bgPosX}px ${bgPosY}px`,
			backgroundRepeat: "no-repeat",
		};
	}


	private _recreateSpriteMap(oldSpriteMap: SpriteMap): void {
		const material = this.props.object;
		const scene = material.getScene();
		
		const atlasJSON = oldSpriteMap.atlasJSON;
		const spriteSheet = oldSpriteMap.spriteSheet;
		const options = { ...oldSpriteMap.options };
		
		oldSpriteMap.dispose();
		
		const newSpriteMap = new SpriteMap(
			"SpriteMap",
			atlasJSON,
			spriteSheet,
			options,
			scene
		);
		
		material.metadata.spriteMapInstance = newSpriteMap;
		
		this.forceUpdate();
	}

} 
