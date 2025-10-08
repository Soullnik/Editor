import { Component, ReactNode } from "react";
import { INodeTemplate } from "../types";
import { NodeTemplates } from "../templates";

export interface INodeListProps {
	onNodeAdd: (template: INodeTemplate, position: { x: number; y: number }) => void;
}

export class NodeList extends Component<INodeListProps> {
	public render(): ReactNode {
		return (
			<div className="w-64 h-full bg-background border-r border-border flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-border">
					<h3 className="text-lg font-semibold">Node Library</h3>
					<p className="text-sm text-muted-foreground">Drag nodes to add them to the graph</p>
				</div>

				{/* Categories */}
				<div className="flex-1 overflow-y-auto">
					{Object.entries(NodeTemplates.getCategories()).map(([category, templates]) => (
						<div key={category} className="p-2">
							<h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
								{category}
							</h4>
							<div className="space-y-1">
								{templates.map((template) => (
									<div
										key={template.id}
										className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
										onClick={() => this.props.onNodeAdd(template, { x: 100, y: 100 })}
									>
										<div
											className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
											style={{ backgroundColor: template.color }}
										>
											{template.icon}
										</div>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm">{template.name}</div>
											<div className="text-xs text-muted-foreground truncate">
												{template.description}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}
}
