import { Component, ReactNode } from "react";
import { CustomSolidParticleSystem, CustomSolidParticle } from "../custom-sps";
import { Animation, Vector3, Color3 } from "babylonjs";
import { SolidParticleBlockFactory, SolidParticleBlockExecutor } from "../utils";

export interface ISolidParticleEditorProps {
	sps: CustomSolidParticleSystem | null;
	onAnimationUpdate?: (particle: CustomSolidParticle, animations: Animation[]) => void;
}

export interface ISolidParticleEditorState {
	selectedParticle: CustomSolidParticle | null;
	graphNodes: SolidParticleNode[];
	connections: NodeConnection[];
	selectedNode: string | null;
	dragging: boolean;
	dragOffset: { x: number; y: number };
	zoom: number;
	pan: { x: number; y: number };
}

export interface SolidParticleNode {
	id: string;
	type: "particle" | "animation" | "property" | "math" | "time" | "input" | "output";
	position: { x: number; y: number };
	title: string;
	inputs: NodeInput[];
	outputs: NodeOutput[];
	data: any;
	width: number;
	height: number;
}

export interface NodeInput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean" | "animation";
	value?: any;
	connected: boolean;
	position: { x: number; y: number };
}

export interface NodeOutput {
	id: string;
	name: string;
	type: "vector3" | "color3" | "number" | "boolean" | "animation";
	position: { x: number; y: number };
}

export interface NodeConnection {
	id: string;
	fromNode: string;
	fromOutput: string;
	toNode: string;
	toInput: string;
}

export class SolidParticleEditor extends Component<ISolidParticleEditorProps, ISolidParticleEditorState> {
	private canvasRef: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;

	public constructor(props: ISolidParticleEditorProps) {
		super(props);

		this.state = {
			selectedParticle: null,
			graphNodes: [],
			connections: [],
			selectedNode: null,
			dragging: false,
			dragOffset: { x: 0, y: 0 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		};
	}

	public componentDidMount(): void {
		this._initializeGraph();
		this._setupCanvas();
	}

	public componentDidUpdate(prevProps: ISolidParticleEditorProps): void {
		if (prevProps.sps !== this.props.sps) {
			this._initializeGraph();
		}
	}

	public render(): ReactNode {
		const { sps } = this.props;
		const { selectedParticle } = this.state;

		return (
			<div className="flex flex-col w-full h-full bg-background">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex items-center gap-4">
						<h3 className="text-lg font-semibold">Solid Particle Editor</h3>
						{sps && <div className="text-sm text-muted-foreground">{sps.nbParticles} particles</div>}
					</div>

					<div className="flex gap-2">
						<button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm" onClick={() => this._addAnimationNode()}>
							+ Animation
						</button>
						<button className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm" onClick={() => this._addMathNode()}>
							+ Math
						</button>
						<button className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm" onClick={() => this._addTimeNode()}>
							+ Time
						</button>
						<button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => this._loadTemplate("bounce")}>
							Bounce
						</button>
						<button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => this._loadTemplate("rotation")}>
							Rotation
						</button>
					</div>
				</div>

				{/* Particle List */}
				<div className="flex h-20 border-b border-border">
					<div className="flex-1 overflow-x-auto">
						<div className="flex gap-2 p-2">
							{sps?.particles.map((particle, index) => (
								<button
									key={particle.id}
									className={`px-3 py-2 rounded text-sm border transition-colors ${
										selectedParticle?.id === particle.id
											? "bg-primary text-primary-foreground border-primary"
											: "bg-background border-border hover:border-primary/50"
									}`}
									onClick={() => this._selectParticle(particle)}
								>
									Particle {index}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Graph Canvas */}
				<div className="flex-1 relative overflow-hidden">
					<canvas
						ref={(r) => {
							this.canvasRef = r;
							if (r) {
								this.ctx = r.getContext("2d");
								this._setupCanvas();
							}
						}}
						className="w-full h-full cursor-crosshair"
						onMouseDown={(e) => this._handleMouseDown(e)}
						onMouseMove={(e) => this._handleMouseMove(e)}
						onMouseUp={(e) => this._handleMouseUp(e)}
						onWheel={(e) => this._handleWheel(e)}
					/>

					{/* Node Properties Panel */}
					{this.state.selectedNode && (
						<div className="absolute top-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg">{this._renderNodeProperties()}</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-4 border-t border-border">
					<div className="text-sm text-muted-foreground">{selectedParticle ? `Editing: Particle ${selectedParticle.id}` : "Select a particle to edit"}</div>

					<div className="flex gap-2">
						<button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => this._compileGraph()}>
							Compile
						</button>
						<button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => this._exportGraph()}>
							Export
						</button>
					</div>
				</div>
			</div>
		);
	}

	private _initializeGraph(): void {
		if (!this.props.sps) {
			this.setState({ graphNodes: [], connections: [] });
			return;
		}

		// Create initial graph nodes for each particle
		const nodes: SolidParticleNode[] = [];

		this.props.sps.particles.forEach((particle, index) => {
			nodes.push(this._createParticleNode(particle, index, { x: 50, y: 50 + index * 150 }));
		});

		this.setState({ graphNodes: nodes });
	}

	private _createParticleNode(particle: CustomSolidParticle, index: number, position: { x: number; y: number }): SolidParticleNode {
		return {
			id: `particle_${particle.id}`,
			type: "particle",
			position,
			title: `Particle ${index}`,
			width: 200,
			height: 120,
			inputs: [],
			outputs: [
				{ id: "position", name: "Position", type: "vector3", position: { x: 200, y: 30 } },
				{ id: "rotation", name: "Rotation", type: "vector3", position: { x: 200, y: 50 } },
				{ id: "scaling", name: "Scaling", type: "vector3", position: { x: 200, y: 70 } },
				{ id: "color", name: "Color", type: "color3", position: { x: 200, y: 90 } },
			],
			data: { particle },
		};
	}

	private _setupCanvas(): void {
		if (!this.canvasRef) {return;}

		const canvas = this.canvasRef;
		const rect = canvas.getBoundingClientRect();

		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;

		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			this.ctx = ctx;
			this._drawGraph();
		}
	}

	private _drawGraph(): void {
		if (!this.ctx || !this.canvasRef) {return;}

		const { graphNodes, connections, zoom, pan } = this.state;

		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);

		// Apply zoom and pan
		this.ctx.save();
		this.ctx.translate(pan.x, pan.y);
		this.ctx.scale(zoom, zoom);

		// Draw grid
		this._drawGrid();

		// Draw connections
		connections.forEach((connection) => this._drawConnection(connection));

		// Draw nodes
		graphNodes.forEach((node) => this._drawNode(node));

		this.ctx.restore();
	}

	private _drawGrid(): void {
		if (!this.ctx) {return;}

		const gridSize = 20;
		const width = this.canvasRef?.width || 0;
		const height = this.canvasRef?.height || 0;

		this.ctx.strokeStyle = "#333";
		this.ctx.lineWidth = 0.5;

		for (let x = 0; x < width; x += gridSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, height);
			this.ctx.stroke();
		}

		for (let y = 0; y < height; y += gridSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(width, y);
			this.ctx.stroke();
		}
	}

	private _drawNode(node: SolidParticleNode): void {
		if (!this.ctx) {return;}

		const { x, y } = node.position;
		const { width, height } = node;

		// Node background
		this.ctx.fillStyle = this._getNodeColor(node.type);
		this.ctx.fillRect(x, y, width, height);

		// Node border
		this.ctx.strokeStyle = this.state.selectedNode === node.id ? "#007acc" : "#666";
		this.ctx.lineWidth = this.state.selectedNode === node.id ? 2 : 1;
		this.ctx.strokeRect(x, y, width, height);

		// Node title
		this.ctx.fillStyle = "#fff";
		this.ctx.font = "14px Arial";
		this.ctx.fillText(node.title, x + 10, y + 20);

		// Draw inputs
		node.inputs.forEach((input) => {
			this._drawInput(x + input.position.x, y + input.position.y, input);
		});

		// Draw outputs
		node.outputs.forEach((output) => {
			this._drawOutput(x + output.position.x, y + output.position.y, output);
		});
	}

	private _drawInput(x: number, y: number, input: NodeInput): void {
		if (!this.ctx) {return;}

		// Input circle
		this.ctx.fillStyle = input.connected ? "#4CAF50" : "#666";
		this.ctx.beginPath();
		this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
		this.ctx.fill();

		// Input label
		this.ctx.fillStyle = "#fff";
		this.ctx.font = "12px Arial";
		this.ctx.fillText(input.name, x + 15, y + 4);
	}

	private _drawOutput(x: number, y: number, output: NodeOutput): void {
		if (!this.ctx) {return;}

		// Output circle
		this.ctx.fillStyle = "#2196F3";
		this.ctx.beginPath();
		this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
		this.ctx.fill();

		// Output label
		this.ctx.fillStyle = "#fff";
		this.ctx.font = "12px Arial";
		this.ctx.fillText(output.name, x - 60, y + 4);
	}

	private _drawConnection(connection: NodeConnection): void {
		if (!this.ctx) {return;}

		// Find connection points
		const fromNode = this.state.graphNodes.find((n) => n.id === connection.fromNode);
		const toNode = this.state.graphNodes.find((n) => n.id === connection.toNode);

		if (!fromNode || !toNode) {return;}

		const fromOutput = fromNode.outputs.find((o) => o.id === connection.fromOutput);
		const toInput = toNode.inputs.find((i) => i.id === connection.toInput);

		if (!fromOutput || !toInput) {return;}

		const fromX = fromNode.position.x + fromOutput.position.x;
		const fromY = fromNode.position.y + fromOutput.position.y;

		const toX = toNode.position.x + toInput.position.x;
		const toY = toNode.position.y + toInput.position.y;

		// Draw bezier curve
		this.ctx.strokeStyle = "#4CAF50";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(fromX, fromY);
		this.ctx.bezierCurveTo(fromX + 50, fromY, toX - 50, toY, toX, toY);
		this.ctx.stroke();
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
		};
		return colors[type as keyof typeof colors] || "#666";
	}

	private _selectParticle(particle: CustomSolidParticle): void {
		this.setState({ selectedParticle: particle });
	}

	private _addAnimationNode(): void {
		const block = SolidParticleBlockFactory.createPositionAnimationBlock();
		const newNode: SolidParticleNode = {
			id: block.id,
			type: "animation",
			position: { x: 300, y: 200 },
			title: block.name,
			width: 200,
			height: 120,
			inputs: block.inputs.map((input) => ({
				...input,
				position: { x: 0, y: 30 + block.inputs.indexOf(input) * 20 },
			})),
			outputs: block.outputs.map((output) => ({
				...output,
				position: { x: 200, y: 50 },
			})),
			data: block.data,
		};

		this.setState((prevState) => ({
			graphNodes: [...prevState.graphNodes, newNode],
		}));
	}

	private _addMathNode(): void {
		const block = SolidParticleBlockFactory.createMathBlock("add");
		const newNode: SolidParticleNode = {
			id: block.id,
			type: "math",
			position: { x: 300, y: 300 },
			title: block.name,
			width: 150,
			height: 100,
			inputs: block.inputs.map((input) => ({
				...input,
				position: { x: 0, y: 30 + block.inputs.indexOf(input) * 20 },
			})),
			outputs: block.outputs.map((output) => ({
				...output,
				position: { x: 150, y: 40 },
			})),
			data: block.data,
		};

		this.setState((prevState) => ({
			graphNodes: [...prevState.graphNodes, newNode],
		}));
	}

	private _addTimeNode(): void {
		const block = SolidParticleBlockFactory.createTimeBlock();
		const newNode: SolidParticleNode = {
			id: block.id,
			type: "time",
			position: { x: 300, y: 400 },
			title: block.name,
			width: 150,
			height: 100,
			inputs: block.inputs.map((input) => ({
				...input,
				position: { x: 0, y: 30 + block.inputs.indexOf(input) * 20 },
			})),
			outputs: block.outputs.map((output) => ({
				...output,
				position: { x: 150, y: 30 + block.outputs.indexOf(output) * 20 },
			})),
			data: block.data,
		};

		this.setState((prevState) => ({
			graphNodes: [...prevState.graphNodes, newNode],
		}));
	}

	private _loadTemplate(templateName: string): void {
		// Simple template loading
		if (templateName === "bounce") {
			this._addTimeNode();
			this._addMathNode();
			// Add connections between nodes
		}
	}

	private _renderNodeProperties(): ReactNode {
		const selectedNode = this.state.graphNodes.find((n) => n.id === this.state.selectedNode);
		if (!selectedNode) {return null;}

		return (
			<div className="p-4">
				<h4 className="font-semibold mb-3">{selectedNode.title} Properties</h4>

				{selectedNode.type === "animation" && (
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-medium mb-1">Animation Type</label>
							<select
								className="w-full p-2 border border-border rounded"
								value={selectedNode.data.animationType}
								onChange={(e) => this._updateNodeData(selectedNode.id, { animationType: e.target.value })}
							>
								<option value="position">Position</option>
								<option value="rotation">Rotation</option>
								<option value="scaling">Scaling</option>
								<option value="color">Color</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Duration (seconds)</label>
							<input
								type="number"
								className="w-full p-2 border border-border rounded"
								value={selectedNode.data.duration || 1}
								onChange={(e) => this._updateNodeData(selectedNode.id, { duration: parseFloat(e.target.value) })}
							/>
						</div>
					</div>
				)}

				{selectedNode.type === "math" && (
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-medium mb-1">Operation</label>
							<select
								className="w-full p-2 border border-border rounded"
								value={selectedNode.data.operation}
								onChange={(e) => this._updateNodeData(selectedNode.id, { operation: e.target.value })}
							>
								<option value="add">Add</option>
								<option value="subtract">Subtract</option>
								<option value="multiply">Multiply</option>
								<option value="divide">Divide</option>
								<option value="sin">Sin</option>
								<option value="cos">Cos</option>
								<option value="lerp">Lerp</option>
							</select>
						</div>
					</div>
				)}
			</div>
		);
	}

	private _updateNodeData(nodeId: string, data: any): void {
		this.setState((prevState) => ({
			graphNodes: prevState.graphNodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node)),
		}));
	}

	private _handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>): void {
		const rect = this.canvasRef?.getBoundingClientRect();
		if (!rect) {return;}

		const x = (e.clientX - rect.left - this.state.pan.x) / this.state.zoom;
		const y = (e.clientY - rect.top - this.state.pan.y) / this.state.zoom;

		// Check if clicking on a node
		const clickedNode = this.state.graphNodes.find(
			(node) => x >= node.position.x && x <= node.position.x + node.width && y >= node.position.y && y <= node.position.y + node.height
		);

		if (clickedNode) {
			this.setState({
				selectedNode: clickedNode.id,
				dragging: true,
				dragOffset: {
					x: x - clickedNode.position.x,
					y: y - clickedNode.position.y,
				},
			});
		} else {
			this.setState({ selectedNode: null });
		}
	}

	private _handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
		if (!this.state.dragging) {return;}

		const rect = this.canvasRef?.getBoundingClientRect();
		if (!rect) {return;}

		const x = (e.clientX - rect.left - this.state.pan.x) / this.state.zoom;
		const y = (e.clientY - rect.top - this.state.pan.y) / this.state.zoom;

		this.setState((prevState) => ({
			graphNodes: prevState.graphNodes.map((node) =>
				node.id === prevState.selectedNode ? { ...node, position: { x: x - prevState.dragOffset.x, y: y - prevState.dragOffset.y } } : node
			),
		}));

		this._drawGraph();
	}

	private _handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>): void {
		this.setState({ dragging: false });
	}

	private _handleWheel(e: React.WheelEvent<HTMLCanvasElement>): void {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		this.setState((prevState) => ({
			zoom: Math.max(0.1, Math.min(3, prevState.zoom * delta)),
		}));
		this._drawGraph();
	}

	private _compileGraph(): void {
		if (!this.state.selectedParticle) {
			console.warn("No particle selected for compilation");
			return;
		}

		// Create block executor
		const executor = new SolidParticleBlockExecutor(this.state.selectedParticle);

		// Add all blocks to executor
		this.state.graphNodes.forEach((node) => {
			const block = this._nodeToBlock(node);
			executor.addBlock(block);
		});

		// Add all connections to executor
		this.state.connections.forEach((connection) => {
			executor.addConnection({
				fromBlock: connection.fromNode,
				fromOutput: connection.fromOutput,
				toBlock: connection.toNode,
				toInput: connection.toInput,
			});
		});

		// Execute the graph
		const animations = executor.execute();

		// Apply animations to particle
		this.state.selectedParticle.animations = animations;

		// Notify parent component
		if (this.props.onAnimationUpdate) {
			this.props.onAnimationUpdate(this.state.selectedParticle, animations);
		}

		console.log("Compiled animations:", animations);
	}

	private _nodeToBlock(node: SolidParticleNode): any {
		return {
			id: node.id,
			name: node.title,
			type: node.type,
			inputs: node.inputs.map((input) => ({
				id: input.id,
				name: input.name,
				type: input.type,
				value: input.value,
				connected: input.connected,
			})),
			outputs: node.outputs.map((output) => ({
				id: output.id,
				name: output.name,
				type: output.type,
			})),
			data: node.data,
		};
	}

	private _createPositionAnimation(duration: number): Animation {
		const animation = new Animation(`position_${this.state.selectedParticle?.id}`, "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const keys = [
			{ frame: 0, value: new Vector3(0, 0, 0) },
			{ frame: duration * 30, value: new Vector3(0, 5, 0) },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createRotationAnimation(duration: number): Animation {
		const animation = new Animation(`rotation_${this.state.selectedParticle?.id}`, "rotation", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const keys = [
			{ frame: 0, value: new Vector3(0, 0, 0) },
			{ frame: duration * 30, value: new Vector3(0, Math.PI * 2, 0) },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createScalingAnimation(duration: number): Animation {
		const animation = new Animation(`scaling_${this.state.selectedParticle?.id}`, "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const keys = [
			{ frame: 0, value: new Vector3(1, 1, 1) },
			{ frame: duration * 30, value: new Vector3(2, 2, 2) },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _createColorAnimation(duration: number): Animation {
		const animation = new Animation(`color_${this.state.selectedParticle?.id}`, "color", 30, Animation.ANIMATIONTYPE_COLOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const keys = [
			{ frame: 0, value: new Color3(1, 1, 1) },
			{ frame: duration * 30, value: new Color3(0, 0, 0) },
		];

		animation.setKeys(keys);
		return animation;
	}

	private _exportGraph(): void {
		const graphData = {
			nodes: this.state.graphNodes,
			connections: this.state.connections,
		};

		const dataStr = JSON.stringify(graphData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(dataBlob);
		link.download = "solid-particle-graph.json";
		link.click();
	}
}
