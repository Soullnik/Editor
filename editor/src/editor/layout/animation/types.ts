import { IAnimatable } from "babylonjs";
import { CustomSolidParticleSystem } from "../../../project/add/mesh";

export interface ICustomAnimatable extends IAnimatable {
	metadata?: {
		sps?: CustomSolidParticleSystem;
	};
	getClassName?(): string;
}
