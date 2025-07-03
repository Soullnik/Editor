import type { ISpriteJSONAtlas, ISpriteJSONSprite, ISpriteJSONSpriteFrameData, ISpriteJSONSpriteSourceSize } from "babylonjs/Sprites/ISprites";

/**
 * Checks if the provided object matches the ISpriteJSONAtlas structure required by Babylon.js SpriteMap.
 * Validates all required fields and nested objects according to the Babylon.js specification.
 *
 * @param json - The object to validate (usually parsed from a JSON file).
 * @returns {boolean} True if the structure is valid for Babylon.js SpriteMap, otherwise false.
 */
export function isValidSpriteAtlas(json: any): json is ISpriteJSONAtlas {
	if (!json || typeof json !== "object") {return false;}
	if (!Array.isArray(json.frames) || json.frames.length === 0) {return false;}
	if ("meta" in json && (typeof json.meta !== "object" || json.meta === null)) {return false;}
	if (json.meta) {
		if (typeof json.meta.image !== "string") {return false;}
		if (!json.meta.size || typeof json.meta.size.w !== "number" || typeof json.meta.size.h !== "number") {return false;}
	}

	for (const frame of json.frames) {
		if (!isValidSpriteFrame(frame)) {return false;}
	}
	return true;
}

function isValidSpriteFrame(frame: any): frame is ISpriteJSONSprite {
	if (!frame || typeof frame !== "object") {return false;}
	if (typeof frame.filename !== "string") {return false;}
	if (!isValidFrameData(frame.frame)) {return false;}
	if (typeof frame.rotated !== "boolean") {return false;}
	if (typeof frame.trimmed !== "boolean") {return false;}
	if (!isValidFrameData(frame.spriteSourceSize)) {return false;}
	if (!isValidSourceSize(frame.sourceSize)) {return false;}
	return true;
}

function isValidFrameData(data: any): data is ISpriteJSONSpriteFrameData {
	return (
		data && typeof data === "object" &&
        typeof data.x === "number" &&
        typeof data.y === "number" &&
        typeof data.w === "number" &&
        typeof data.h === "number"
	);
}

function isValidSourceSize(data: any): data is ISpriteJSONSpriteSourceSize {
	return (
		data && typeof data === "object" &&
        typeof data.w === "number" &&
        typeof data.h === "number"
	);
}
