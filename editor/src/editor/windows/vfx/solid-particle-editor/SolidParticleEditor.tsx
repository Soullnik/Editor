import { Component, ReactNode } from "react";
import { CustomSolidParticleSystem } from "./custom-sps";
import { VFXComponent } from "../types";
import { ISolidParticleEditorState, INodeTemplate } from "./types";
import { NodeList } from "./components/NodeList";
import { GraphView } from "./components/GraphView";
import { PreviewPanel } from "./components/PreviewPanel";

export interface ISolidParticleEditorProps {
	selectedComponent: VFXComponent | null;
}

export class SolidParticleEditor extends Component<ISolidParticleEditorProps, ISolidParticleEditorState> {
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
	}

	public componentDidUpdate(prevProps: ISolidParticleEditorProps): void {
		if (prevProps.selectedComponent !== this.props.selectedComponent) {
			this._initializeGraph();
		}
	}

	public render(): ReactNode {
		const { selectedComponent } = this.props;
		const { graphNodes, connections, selectedNode, zoom, pan } = this.state;
		
		// Check if selected component is a solid particle system
		const sps = selectedComponent?.type === "solid_particle_system" 
			? selectedComponent.babylonSystem as CustomSolidParticleSystem 
			: null;
		
		// Show "No object selected" if not a solid particle system
		if (!sps) {
			return (
				<div className="flex flex-col w-full h-full bg-background">
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<h3 className="text-lg font-semibold text-muted-foreground mb-2">No Object Selected</h3>
							<p className="text-sm text-muted-foreground">
								Please select a Solid Particle System to edit particles
							</p>
						</div>
					</div>
				</div>
			);
		}
		
		return (
			<div className="flex w-full h-full bg-background">
				{/* Left Panel - Node Library */}
				<NodeList onNodeAdd={this._handleNodeAdd} />

				{/* Center Panel - Graph View */}
				<div className="flex-1 flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-border">
						<div className="flex items-center gap-4">
							<h3 className="text-lg font-semibold">Solid Particle Editor</h3>
							<div className="text-sm text-muted-foreground">{sps.nbParticles} particles</div>
						</div>

						<div className="flex gap-2">
							<button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => this._compileGraph()}>
								Compile
							</button>
							<button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => this._exportGraph()}>
								Export
							</button>
						</div>
					</div>

					{/* Graph View */}
					<GraphView
						nodes={graphNodes}
						connections={connections}
						selectedNode={selectedNode}
						zoom={zoom}
						pan={pan}
						onNodeSelect={this._handleNodeSelect}
						onNodeMove={this._handleNodeMove}
						onNodeDragStart={this._handleNodeDragStart}
						onNodeDragEnd={this._handleNodeDragEnd}
						onPan={this._handlePan}
						onZoom={this._handleZoom}
					/>
				</div>

				{/* Right Panel - Preview */}
				<PreviewPanel sps={sps} />
			</div>
		);
	}

	private _initializeGraph(): void {
		const { selectedComponent } = this.props;
		
		// Check if selected component is a solid particle system
		const sps = selectedComponent?.type === "solid_particle_system" 
			? selectedComponent.babylonSystem as CustomSolidParticleSystem 
			: null;
			
		if (!sps) {
			this.setState({ graphNodes: [], connections: [] });
			return;
		}

		// Initialize with empty graph
		this.setState({ graphNodes: [], connections: [] });
	}

	// Event handlers
	private _handleNodeAdd = (template: INodeTemplate, position: { x: number; y: number }): void => {
		const newNode = template.createNode(position);
		this.setState((prevState) => ({
			graphNodes: [...prevState.graphNodes, newNode],
		}));
	};

	private _handleNodeSelect = (nodeId: string | null): void => {
		this.setState({ selectedNode: nodeId });
	};

	private _handleNodeMove = (nodeId: string, position: { x: number; y: number }): void => {
		this.setState((prevState) => ({
			graphNodes: prevState.graphNodes.map((node) =>
				node.id === nodeId ? { ...node, position } : node
			),
		}));
	};

	private _handleNodeDragStart = (_nodeId: string, offset: { x: number; y: number }): void => {
		this.setState({ dragging: true, dragOffset: offset });
	};

	private _handleNodeDragEnd = (): void => {
		this.setState({ dragging: false });
	};

	private _handlePan = (pan: { x: number; y: number }): void => {
		this.setState({ pan });
	};

	private _handleZoom = (zoom: number): void => {
		this.setState({ zoom });
	};

	// Graph compilation and export
	private _compileGraph(): void {
		const { selectedComponent } = this.props;
		const { graphNodes, connections } = this.state;
		
		if (!selectedComponent || selectedComponent.type !== "solid_particle_system") {
			console.warn("No SPS selected for compilation");
			return;
		}

		const sps = selectedComponent.babylonSystem as CustomSolidParticleSystem;
		
		// TODO: Implement graph compilation logic
		console.log("Compiling graph:", { graphNodes, connections, sps });
	}

	private _exportGraph(): void {
		const { graphNodes, connections } = this.state;
		
		const graphData = {
			nodes: graphNodes,
			connections: connections,
		};

		const dataStr = JSON.stringify(graphData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(dataBlob);
		link.download = "solid-particle-graph.json";
		link.click();
	}

}
