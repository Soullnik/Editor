import { Component, ReactNode } from "react";
import { ContextMenu, ContextMenuItem, ContextMenuContent, ContextMenuTrigger } from "../../../../ui/shadcn/ui/context-menu";
import { FaMagic } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { MdOutlineQuestionMark } from "react-icons/md";
import { VFXComponent } from "../types";
import { EditorInspectorSectionField } from "../../../layout/inspector/fields/section";

export interface IVFXComponentListProps {
	components: { [key: string]: VFXComponent[] };
	selectedComponent: VFXComponent | null;
	onComponentSelect: (component: VFXComponent) => void;
	onComponentRemove: (id: string) => void;
	onComponentRemoved?: (id: string) => void;
	onDrop: (ev: React.DragEvent<HTMLDivElement>) => void;
}

export class VFXComponentList extends Component<IVFXComponentListProps> {
	public render(): ReactNode {
		return (
			<div className="flex-1 flex flex-col">
				{/* Components */}
				<div className="flex-shrink-0 space-y-2">
					{Object.entries(this.props.components).map(([type, components]) => (
						<EditorInspectorSectionField key={type} title={this._getTypeDisplayName(type)} label={`${components.length}`}>
							<div className="space-y-1">
								{components.map((component) => (
									<ContextMenu key={component.id}>
										<ContextMenuTrigger>
											<div
												className={`
													flex items-center gap-2 p-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200 rounded
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
											<ContextMenuItem
												onClick={() => {
													this.props.onComponentRemove(component.id);
													if (this.props.onComponentRemoved) {
														this.props.onComponentRemoved(component.id);
													}
												}}
												className="text-red-500"
											>
												Delete
											</ContextMenuItem>
										</ContextMenuContent>
									</ContextMenu>
								))}
							</div>
						</EditorInspectorSectionField>
					))}
				</div>

				{/* Empty space for right-click */}
				<div
					className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground"
					onDragOver={(ev) => ev.preventDefault()}
					onDrop={this.props.onDrop}
				>
					{Object.keys(this.props.components).length === 0 && (
						<>
							<FaMagic className="w-8 h-8 mb-2" />
							<div className="text-sm">No components found</div>
							<div className="text-xs">Drag and drop an asset to add a component</div>
						</>
					)}
				</div>
			</div>
		);
	}

	private _getComponentIcon(type: string): ReactNode {
		switch (type) {
			case "cpu_particle_system":
			case "solid_particle_system":
				return <GiSparkles className="w-4 h-4 text-yellow-500" />;
			case "gpu_particle_system":
				return <GiSparkles className="w-4 h-4 text-blue-500" />;
			case "particle_system_set":
				return <GiSparkles className="w-4 h-4 text-purple-500" />;
			default:
				return <MdOutlineQuestionMark className="w-4 h-4 text-gray-500" />;
		}
	}

	private _getTypeDisplayName(type: string): string {
		switch (type) {
			case "cpu_particle_system":
				return "CPU Particle Systems";
			case "gpu_particle_system":
				return "GPU Particle Systems";
			case "solid_particle_system":
				return "Solid Particle Systems";
			case "particle_system_set":
				return "Particle System Sets";
			default:
				return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) + "s";
		}
	}
}
