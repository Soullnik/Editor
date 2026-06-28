import { Component, ReactNode } from "react";
import { Tree, TreeNodeInfo } from "@blueprintjs/core";

import { IoImageOutline, IoCubeOutline, IoColorPaletteOutline } from "react-icons/io5";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../../../ui/shadcn/ui/context-menu";

export interface IEffectResource {
	id: string;
	name: string;
	type: "texture" | "material";
	resourceData?: { path?: string; uuid?: string; className?: string };
}

export interface IEffectEditorResourcesProps {
	resources: IEffectResource[];
}

export interface IEffectEditorResourcesState {
	nodes: TreeNodeInfo[];
}

export class EffectEditorResources extends Component<IEffectEditorResourcesProps, IEffectEditorResourcesState> {
	public constructor(props: IEffectEditorResourcesProps) {
		super(props);

		this.state = {
			nodes: this._convertToTreeNodeInfo(props.resources),
		};
	}

	public componentDidUpdate(prevProps: IEffectEditorResourcesProps): void {
		if (prevProps.resources !== this.props.resources) {
			this.setState({
				nodes: this._convertToTreeNodeInfo(this.props.resources),
			});
		}
	}

	private _convertToTreeNodeInfo(resources: IEffectResource[]): TreeNodeInfo[] {
		const textures = resources.filter((r) => r.type === "texture");
		const materials = resources.filter((r) => r.type === "material");

		const makeLeaf = (resource: IEffectResource): TreeNodeInfo => {
			const icon =
				resource.type === "texture" ? (
					<IoImageOutline className="w-4 h-4 text-yellow-400" />
				) : (
					<IoColorPaletteOutline className="w-4 h-4 text-blue-400" />
				);

			const label = (
				<ContextMenu>
					<ContextMenuTrigger className="w-full h-full">
						<div className="ml-2 p-1 w-full flex flex-col gap-0.5">
							<span className="text-xs">{resource.name}</span>
							{resource.resourceData?.className && (
								<span className="text-[10px] text-muted-foreground">{resource.resourceData.className}</span>
							)}
							{resource.resourceData?.path && (
								<span className="text-[10px] text-muted-foreground truncate" title={resource.resourceData.path}>
									{resource.resourceData.path.split(/[\\/]/).pop()}
								</span>
							)}
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem disabled className="font-mono text-xs">
							{resource.resourceData?.uuid || resource.id}
						</ContextMenuItem>
						{resource.resourceData?.path && (
							<ContextMenuItem
								onClick={() => {
									navigator.clipboard?.writeText(resource.resourceData!.path!);
								}}
							>
								Copy Path
							</ContextMenuItem>
						)}
					</ContextMenuContent>
				</ContextMenu>
			);

			return {
				id: resource.id,
				label,
				icon,
				isExpanded: false,
				childNodes: undefined,
				isSelected: false,
				hasCaret: false,
			};
		};

		const nodes: TreeNodeInfo[] = [];

		if (textures.length > 0) {
			nodes.push({
				id: "group-textures",
				label: (
					<div className="ml-2 p-1 flex items-center gap-1">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Textures ({textures.length})
						</span>
					</div>
				),
				icon: <IoImageOutline className="w-4 h-4 text-muted-foreground" />,
				isExpanded: true,
				hasCaret: true,
				childNodes: textures.map(makeLeaf),
			});
		}

		if (materials.length > 0) {
			nodes.push({
				id: "group-materials",
				label: (
					<div className="ml-2 p-1 flex items-center gap-1">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Materials ({materials.length})
						</span>
					</div>
				),
				icon: <IoCubeOutline className="w-4 h-4 text-muted-foreground" />,
				isExpanded: true,
				hasCaret: true,
				childNodes: materials.map(makeLeaf),
			});
		}

		return nodes;
	}

	public render(): ReactNode {
		if (this.state.nodes.length === 0) {
			return (
				<div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
					No resources. Load an effect with textures or materials.
				</div>
			);
		}

		return (
			<div className="flex flex-col w-full h-full text-foreground overflow-auto">
				<Tree
					contents={this.state.nodes}
					onNodeExpand={(n) =>
						this.setState({
							nodes: this._toggleExpanded(this.state.nodes, n.id, true),
						})
					}
					onNodeCollapse={(n) =>
						this.setState({
							nodes: this._toggleExpanded(this.state.nodes, n.id, false),
						})
					}
				/>
			</div>
		);
	}

	private _toggleExpanded(nodes: TreeNodeInfo[], id: string | number, expanded: boolean): TreeNodeInfo[] {
		return nodes.map((n) => ({
			...n,
			isExpanded: n.id === id ? expanded : n.isExpanded,
			childNodes: n.childNodes ? this._toggleExpanded(n.childNodes, id, expanded) : undefined,
		}));
	}
}
