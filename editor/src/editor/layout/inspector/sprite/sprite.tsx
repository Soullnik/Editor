import { Component, ReactNode } from "react";
import { SpriteMap,Vector2,Mesh } from "babylonjs";

import { FaFileAlt } from "react-icons/fa";

import { EditorInspectorSectionField } from "../fields/section";
import { EditorInspectorStringField } from "../fields/string";
import { EditorInspectorSwitchField } from "../fields/switch";
import { EditorInspectorVectorField } from "../fields/vector";

import { IEditorInspectorImplementationProps } from "../inspector";
import { isSpriteMapOutputMesh } from "../../../../tools/guards/nodes";

import { Input } from "../../../../ui/shadcn/ui/input";
import { Label } from "../../../../ui/shadcn/ui/label";
import { cn } from "../../../../ui/utils";

export class EditorSpriteMapInspector extends Component<IEditorInspectorImplementationProps<Mesh>, {
  selectedTileIdx: number;
  searchFilter: string;
}> {
	public static IsSupported(obj: unknown): boolean {
		return isSpriteMapOutputMesh(obj);
	}

	public constructor(props: IEditorInspectorImplementationProps<Mesh>) {
		super(props);
		const spriteMap = props.object.metadata.spriteMapRef as SpriteMap;
		this.state = {
			selectedTileIdx: spriteMap.options.baseTile ?? 0,
			searchFilter: "",
		};
	}

	public render(): ReactNode {
		const mesh = this.props.object;
		const spriteMap = mesh.metadata?.spriteMapRef as SpriteMap;

		if (!spriteMap) {
			return (
				<EditorInspectorSectionField title="Sprite Map">
					<div className="text-yellow-500">Missing spriteMapRef in metadata</div>
				</EditorInspectorSectionField>
			);
		}

		const atlasMeta = spriteMap.atlasJSON?.meta as any;
		const filteredTiles = spriteMap.sprites.filter(s => s.filename.toLowerCase().includes(this.state.searchFilter.toLowerCase()));

		return (
			<>
				<EditorInspectorSectionField title="Atlas Info">
					<div className="flex items-center gap-3">
						<FaFileAlt className="w-5 h-5 text-primary" />
						<div>
							<div className="text-sm font-medium">{atlasMeta?.image}</div>
							<div className="text-xs text-muted-foreground">
								{spriteMap.sprites.length} tiles • {atlasMeta?.size?.w}×{atlasMeta?.size?.h}
							</div>
						</div>
					</div>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Transform">
					<EditorInspectorVectorField
						label={<div className="w-14">Position</div>}
						object={mesh}
						property="position"
					/>

					<EditorInspectorVectorField
						label={<div className="w-14">Rotation</div>}
						object={mesh}
						property="rotation"
					/>

					<EditorInspectorVectorField
						label={<div className="w-14">Scaling</div>}
						object={mesh}
						property="scaling"
					/>

					<EditorInspectorSwitchField label="Visible" object={mesh} property="isVisible" />
					<EditorInspectorSwitchField label="Pickable" object={mesh} property="isPickable" />
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="SpriteMap Settings">
					<EditorInspectorStringField label="Name" object={spriteMap} property="name" />

					<EditorInspectorVectorField
						label={<div className="w-28">Stage Size</div>}
						object={spriteMap.options}
						property="stageSize"
						step={1}
					/>
				</EditorInspectorSectionField>

				<EditorInspectorSectionField title="Tiles">
					<Label htmlFor="tile-search" className="text-sm font-medium">Search Tiles</Label>
					<Input
						id="tile-search"
						type="text"
						value={this.state.searchFilter}
						onChange={(e) => this.setState({ searchFilter: e.target.value })}
						placeholder="Filter tiles by name..."
						className="h-8 mb-2"
					/>

					<div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
						{filteredTiles.map((tile, index) => (
							<div
								key={index}
								onClick={() => this._applySelectedTile(spriteMap, index)}
								className={cn(
									"flex flex-col items-center p-2 rounded-md cursor-pointer transition-colors",
									this.state.selectedTileIdx === index ? "bg-accent border border-accent-foreground/20" : "bg-muted hover:bg-accent/50"
								)}
							>
								<div className="text-xs text-center truncate w-full">{tile.filename}</div>
							</div>
						))}
					</div>
				</EditorInspectorSectionField>

				
			</>
		);
	}

	private _applySelectedTile(spriteMap: SpriteMap, index: number): void {
		spriteMap.changeTiles(0, new Vector2(0, 0), index);
		this.setState({ selectedTileIdx: index });
	}
}
