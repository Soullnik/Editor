import { ipcRenderer } from "electron";
import { copy, pathExists, readJSON } from "fs-extra";
import { join, basename, dirname } from "path/posix";

import { ReactNode } from "react";

import { HiOutlineDuplicate } from "react-icons/hi";
import { FaMagic } from "react-icons/fa";

import { waitNextAnimationFrame } from "../../../../tools/tools";

import { ContextMenuItem } from "../../../../ui/shadcn/ui/context-menu";

import { AssetsBrowserItem } from "./item";
import { IVFXFile } from "../../../windows/vfx/types";
export class AssetBrowserVFXItem extends AssetsBrowserItem {
	private _previewPath: string | null = null;
	private _vfxData: IVFXFile | null = null;

	/**
	 * @override
	 */
	protected getContextMenuContent(): ReactNode {
		return (
			<>
				<ContextMenuItem className="flex items-center gap-2" onClick={() => this._handleDuplicate()}>
					<HiOutlineDuplicate className="w-5 h-5" /> Duplicate
				</ContextMenuItem>
			</>
		);
	}

	/**
	 * @override
	 */
	protected getIcon(): ReactNode {
		return this._previewPath ? (
			<img alt="" src={this._previewPath} className="w-[120px] aspect-square object-cover ring-purple-500 ring-2 rounded-lg" />
		) : (
			<FaMagic size="64px" className="text-purple-500" />
		);
	}

	/**
	 * @override
	 */
	protected getTitle(): string {
		return this._vfxData?.name || basename(this.props.absolutePath, ".vfx");
	}

	/**
	 * @override
	 */
	protected getSubtitle(): string {
		if (this._vfxData) {
			return `${this._vfxData.components.length} components`;
		}
		return "VFX Effect";
	}

	/**
	 * @override
	 */
	protected async onDoubleClick(): Promise<void> {
		ipcRenderer.send("window:open", "build/src/editor/windows/vfx", {
			filePath: this.props.absolutePath,
		});
	}

	public async componentDidMount(): Promise<void> {
		super.componentDidMount();

		// Load VFX data
		try {
			this._vfxData = await readJSON(this.props.absolutePath);
		} catch (error) {
			console.warn("Failed to load VFX data:", error);
		}

		// Load preview image
		const previewPath = join(this.props.absolutePath, "preview.png");
		if (await pathExists(previewPath)) {
			this._previewPath = previewPath;
		}

		this.forceUpdate();
	}

	private async _handleDuplicate(): Promise<void> {
		const dir = dirname(this.props.absolutePath);
		const name = basename(this.props.absolutePath, ".vfx");

		// Choose name
		let index: number | undefined = undefined;
		while (await pathExists(join(dir, `${name}${index !== undefined ? ` ${index}` : ""}.vfx`))) {
			index ??= 0;
			++index;
		}

		const newName = `${name}${index !== undefined ? ` ${index}` : ""}.vfx`;
		const newAbsolutePath = join(dir, newName);

		// Copy scene folder
		await copy(this.props.absolutePath, newAbsolutePath);

		// Refresh
		this.props.onRefresh();
		waitNextAnimationFrame().then(() => {
			this.props.editor.layout.assets.setSelectedFile(newAbsolutePath);
		});
	}
}
