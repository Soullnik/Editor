import { Component, ReactNode } from "react";
import { ISolidParticleNode, INodeConnection } from "../types";

export interface IGraphViewProps {
	nodes: ISolidParticleNode[];
	connections: INodeConnection[];
	selectedNode: string | null;
	zoom: number;
	pan: { x: number; y: number };
	onNodeSelect: (nodeId: string | null) => void;
	onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
	onNodeDragStart: (nodeId: string, offset: { x: number; y: number }) => void;
	onNodeDragEnd: () => void;
	onPan: (pan: { x: number; y: number }) => void;
	onZoom: (zoom: number) => void;
}

export class GraphView extends Component<IGraphViewProps> {
	private _containerRef: HTMLDivElement | null = null;
	private _dragging = false;
	private _dragStart = { x: 0, y: 0 };

	public render(): ReactNode {
		const { nodes, connections, zoom, pan } = this.props;

		return (
			<div
				ref={(r) => (this._containerRef = r)}
				className="flex-1 relative overflow-hidden bg-background"
				onMouseDown={(e) => this._handleMouseDown(e)}
				onMouseMove={(e) => this._handleMouseMove(e)}
				onMouseUp={(e) => this._handleMouseUp(e)}
				onWheel={(e) => this._handleWheel(e)}
			>
				{/* Grid Background */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `
							linear-gradient(to right, #333 1px, transparent 1px),
							linear-gradient(to bottom, #333 1px, transparent 1px)
						`,
						backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
						transform: `translate(${pan.x}px, ${pan.y}px)`,
					}}
				/>

				{/* Graph Container */}
				<div
					className="absolute inset-0"
					style={{
						transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
						transformOrigin: "0 0",
					}}
				>
					{/* Connections */}
					<svg className="absolute inset-0 w-full h-full pointer-events-none">
						{connections.map((connection) => this._renderConnection(connection))}
					</svg>

					{/* Nodes */}
					{nodes.map((node) => this._renderNode(node))}
				</div>
			</div>
		);
	}

	private _renderNode(node: ISolidParticleNode): ReactNode {
		const { selectedNode } = this.props;
		const isSelected = selectedNode === node.id;

		return (
			<div
				key={node.id}
				className={`absolute cursor-move select-none ${
					isSelected ? "ring-2 ring-primary ring-offset-2" : ""
				}`}
				style={{
					left: node.position.x,
					top: node.position.y,
					width: node.width,
					height: node.height,
				}}
				onMouseDown={(e) => this._handleNodeMouseDown(e, node)}
			>
				{/* Node Background */}
				<div
					className="rounded-lg border-2 shadow-lg"
					style={{
						backgroundColor: this._getNodeColor(node.type),
						borderColor: isSelected ? "#007acc" : "#666",
					}}
				>
					{/* Node Header */}
					<div className="px-3 py-2 border-b border-black/20">
						<div className="flex items-center gap-2">
							<div className="text-white font-medium text-sm">{node.title}</div>
						</div>
					</div>

					{/* Node Content */}
					<div className="p-3">
						{/* Inputs */}
						{node.inputs.map((input) => (
							<div
								key={input.id}
								className="flex items-center gap-2 mb-1"
								onMouseDown={(e) => e.stopPropagation()}
							>
								<div
									className="w-3 h-3 rounded-full border-2 border-white"
									style={{
										backgroundColor: input.connected ? "#4CAF50" : "#666",
									}}
								/>
								<div className="text-white text-xs">{input.name}</div>
							</div>
						))}

						{/* Outputs */}
						{node.outputs.map((output) => (
							<div
								key={output.id}
								className="flex items-center gap-2 mb-1 justify-end"
								onMouseDown={(e) => e.stopPropagation()}
							>
								<div className="text-white text-xs">{output.name}</div>
								<div
									className="w-3 h-3 rounded-full border-2 border-white"
									style={{ backgroundColor: "#2196F3" }}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	private _renderConnection(connection: INodeConnection): ReactNode {
		const { nodes } = this.props;
		const fromNode = nodes.find((n) => n.id === connection.fromNode);
		const toNode = nodes.find((n) => n.id === connection.toNode);

		if (!fromNode || !toNode) {
			return null;
		}

		const fromOutput = fromNode.outputs.find((o) => o.id === connection.fromOutput);
		const toInput = toNode.inputs.find((i) => i.id === connection.toInput);

		if (!fromOutput || !toInput) {
			return null;
		}

		const fromX = fromNode.position.x + fromOutput.position.x;
		const fromY = fromNode.position.y + fromOutput.position.y;
		const toX = toNode.position.x + toInput.position.x;
		const toY = toNode.position.y + toInput.position.y;

		// Calculate control points for bezier curve
		const controlPoint1X = fromX + 50;
		const controlPoint1Y = fromY;
		const controlPoint2X = toX - 50;
		const controlPoint2Y = toY;

		const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

		return (
			<path
				key={connection.id}
				d={path}
				stroke="#4CAF50"
				strokeWidth="2"
				fill="none"
				markerEnd="url(#arrowhead)"
			/>
		);
	}

	private _getNodeColor(type: string): string {
		const colors = {
			particle: "#FF6B6B",
			animation: "#4ECDC4",
			property: "#45B7D1",
			math: "#96CEB4",
			time: "#FFEAA7",
			input: "#DDA0DD",
			output: "#98D8C8",
			constant: "#FFB347",
			noise: "#87CEEB",
			curve: "#DDA0DD",
		};
		return colors[type as keyof typeof colors] || "#666";
	}

	private _handleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
		if (e.target === this._containerRef) {
			this._dragging = true;
			this._dragStart = { x: e.clientX, y: e.clientY };
			this.props.onNodeSelect(null);
		}
	}

	private _handleMouseMove(e: React.MouseEvent<HTMLDivElement>): void {
		if (this._dragging) {
			const deltaX = e.clientX - this._dragStart.x;
			const deltaY = e.clientY - this._dragStart.y;
			this.props.onPan({
				x: this.props.pan.x + deltaX,
				y: this.props.pan.y + deltaY,
			});
			this._dragStart = { x: e.clientX, y: e.clientY };
		}
	}

	private _handleMouseUp(_e: React.MouseEvent<HTMLDivElement>): void {
		this._dragging = false;
	}

	private _handleWheel(e: React.WheelEvent<HTMLDivElement>): void {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		this.props.onZoom(Math.max(0.1, Math.min(3, this.props.zoom * delta)));
	}

	private _handleNodeMouseDown(e: React.MouseEvent<HTMLDivElement>, node: ISolidParticleNode): void {
		e.stopPropagation();
		this.props.onNodeSelect(node.id);
		this.props.onNodeDragStart(node.id, {
			x: e.clientX - node.position.x,
			y: e.clientY - node.position.y,
		});
	}
}
