import { Component, ReactNode } from "react";
import { Input } from "../../../../ui/shadcn/ui/input";
import { ContextMenu, ContextMenuItem, ContextMenuContent, ContextMenuTrigger, ContextMenuSeparator } from "../../../../ui/shadcn/ui/context-menu";
import { FaMagic } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";
import { IVFXFile, VFXNodeType } from "../../../layout/assets-browser/items/vfx-types";

export interface IVFXComponentsPanelProps {
	vfxData: IVFXFile | null;
	search: string;
	selectedComponent: any;
	onSearchChange: (search: string) => void;
	onComponentSelect: (component: any) => void;
	onComponentRemove: (id: string) => void;
	onDrop: (ev: React.DragEvent<HTMLDivElement>) => void;
}

export class VFXComponentsPanel extends Component<IVFXComponentsPanelProps> {
	public render(): ReactNode {
		return (
			<div className="flex flex-col w-full h-full">
				{/* Search */}
				<div className="p-3 border-b border-border">
					<Input placeholder="Search components..." value={this.props.search} onChange={(e) => this.props.onSearchChange(e.target.value)} className="h-8 text-xs" />
				</div>

				{/* Components List */}
				<div className="flex-1 flex flex-col">
					{/* Components */}
					<div className="flex-shrink-0">
						{this._getFilteredComponents().map((component) => (
							<ContextMenu key={component.id}>
								<ContextMenuTrigger>
									<div
										className={`
											flex items-center gap-2 p-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200
											${this.props.selectedComponent?.id === component.id ? "bg-primary/20" : ""}
										`}
										onClick={() => this.props.onComponentSelect(component)}
									>
										<div className={`w-3 h-3 rounded-full ${component.active ? "bg-green-500" : "bg-gray-400"}`} />
										{this._getComponentIcon(component.type)}
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate">{component.name}</div>
											<div className="text-xs text-muted-foreground truncate">{component.type}</div>
										</div>
									</div>
								</ContextMenuTrigger>
								<ContextMenuContent>
									<ContextMenuItem onClick={() => this.props.onComponentSelect(component)}>Select</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuItem onClick={() => this.props.onComponentRemove(component.id)} className="text-red-500">
										Delete
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						))}
					</div>

					{/* Empty space for right-click */}
					<div
						className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground"
						onDragOver={(ev) => ev.preventDefault()}
						onDrop={this.props.onDrop}
					>
						{!this._getFilteredComponents().length && (
							<>
								<FaMagic className="w-8 h-8 mb-2" />
								<div className="text-sm">No components found</div>
								<div className="text-xs">Drag and drop an asset to add a component</div>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}

	private _getFilteredComponents() {
		if (!this.props.vfxData) {
			return [];
		}

		return this.props.vfxData.nodes.filter(
			(component) => component.name.toLowerCase().includes(this.props.search.toLowerCase()) || component.type.toLowerCase().includes(this.props.search.toLowerCase())
		);
	}

	private _getComponentIcon(type: VFXNodeType): ReactNode {
		switch (type) {
			case VFXNodeType.PARTICLE_SYSTEM:
			case VFXNodeType.SOLID_PARTICLE_SYSTEM:
				return <GiSparkles className="w-4 h-4 text-yellow-500" />;
			case VFXNodeType.ANIMATION:
				return <FaMagic className="w-4 h-4 text-green-500" />;
			default:
				return <MdOutlineQuestionMark className="w-4 h-4 text-gray-500" />;
		}
	}
}
