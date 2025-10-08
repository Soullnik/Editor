import { Component, ReactNode } from "react";
import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, DirectionalLight, MeshBuilder } from "babylonjs";
import { GridMaterial } from "babylonjs-materials";
import { CustomSolidParticleSystem } from "../custom-sps";

export interface IPreviewPanelProps {
	sps: CustomSolidParticleSystem | null;
}

export interface IPreviewPanelState {
	engine: Engine | null;
	scene: Scene | null;
	camera: ArcRotateCamera | null;
	initialized: boolean;
}

export class PreviewPanel extends Component<IPreviewPanelProps, IPreviewPanelState> {
	private _canvasRef: HTMLCanvasElement | null = null;

	public constructor(props: IPreviewPanelProps) {
		super(props);

		this.state = {
			engine: null,
			scene: null,
			camera: null,
			initialized: false,
		};
	}

	public componentDidMount(): void {
		this._initializeScene();
	}

	public componentWillUnmount(): void {
		if (this.state.engine) {
			this.state.engine.dispose();
		}
	}

	public componentDidUpdate(prevProps: IPreviewPanelProps): void {
		if (prevProps.sps !== this.props.sps && this.props.sps) {
			this._updateSPS();
		}
	}

	public render(): ReactNode {
		const { sps } = this.props;
		const { initialized } = this.state;

		return (
			<div className="w-80 h-full bg-background border-l border-border flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-border">
					<h3 className="text-lg font-semibold">Preview</h3>
					{sps && (
						<div className="text-sm text-muted-foreground">
							{sps.nbParticles} particles
						</div>
					)}
				</div>

				{/* Canvas */}
				<div className="flex-1 relative">
					<canvas
						ref={(r) => {
							this._canvasRef = r;
							if (r && !initialized) {
								this._initializeScene();
							}
						}}
						className="w-full h-full"
					/>

					{/* Controls Overlay */}
					<div className="absolute top-4 left-4 flex gap-2">
						<button
							className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
							onClick={() => this._startSolidParticleSystem()}
						>
							Start
						</button>
						<button
							className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
							onClick={() => this._stopSolidParticleSystem()}
						>
							Stop
						</button>
					</div>
				</div>
			</div>
		);
	}

	private _initializeScene(): void {
		if (!this._canvasRef) {
			return;
		}

		const engine = new Engine(this._canvasRef, true);
		const scene = new Scene(engine);
		scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0);
		scene.ambientColor = new Color3(1, 1, 1);

		const camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), scene as any);
		camera.doNotSerialize = true;
		camera.lowerRadiusLimit = 3;
		camera.upperRadiusLimit = 10;
		camera.wheelPrecision = 20;
		camera.minZ = 0.001;
		camera.attachControl(false);
		camera.useFramingBehavior = true;
		camera.wheelDeltaPercentage = 0.01;
		camera.pinchDeltaPercentage = 0.01;

		// Create directional light (sun)
		const sunLight = new DirectionalLight("sun", new Vector3(-1, -1, -1), scene);
		sunLight.intensity = 1.0;
		sunLight.diffuse = new Color3(1, 1, 1);
		sunLight.specular = new Color3(1, 1, 1);

		const groundMaterial = new GridMaterial("groundMaterial", scene as any);
		groundMaterial.majorUnitFrequency = 2;
		groundMaterial.minorUnitVisibility = 0.1;
		groundMaterial.gridRatio = 0.5;
		groundMaterial.backFaceCulling = false;
		groundMaterial.mainColor = new Color3(1, 1, 1);
		groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
		groundMaterial.opacity = 0.5;

		const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene as any);
		ground.material = groundMaterial as any;

		engine.runRenderLoop(() => {
			engine.resize();
			scene.render();
		});

		this.setState({ engine, scene, camera, initialized: true });
	}

	private _updateSPS(): void {
		const { sps } = this.props;
		const { scene } = this.state;

		if (!sps || !scene) {
			return;
		}

		// Add SPS to scene if not already added
		if (sps.mesh && !sps.mesh.getScene()) {
			sps.mesh.setParent(null);
			scene.addMesh(sps.mesh as any);
		}
	}

	private _startSolidParticleSystem(): void {
		const { sps } = this.props;
		if (sps) {
            sps.start()
		}
	}

	private _stopSolidParticleSystem(): void {
		const { sps } = this.props;
		if (sps) {
			sps.stop()
		}
	}
}
