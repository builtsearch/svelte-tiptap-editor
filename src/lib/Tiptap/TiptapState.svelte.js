import { getContext, setContext } from "svelte";

/**
 * Image attributes as stored on TipTap image nodes
 * @typedef {Object} ImageAttrs
 * @property {string} src
 * @property {string=} id
 * @property {string|null=} alt
 * @property {string|null=} title
 * @property {string|null=} class
 */

/**
 * A simple success result
 * @typedef {{ success: true }} SuccessResult
 */

/**
 * A simple error result
 * @typedef {{ error: string }} ErrorResult
 */

export class TipTapState {
	/** @type {import('@tiptap/core').Editor | null} */
	editor = $state(null);
	/** @type {Record<string, Array<(...args: any[]) => void>>} */
	listeners = {};
	constructor() {}

	init() {
		this.editor.on("transaction", () => {
			this.emit("transaction");
		});
	}

	/**
	 * Get image nodes in the current editor document.
	 * - No option: return all image nodes
	 * - 'base64': return only images whose src is a base64 data URL
	 * - function: return images for which the predicate returns true
	 * @param {('base64' | ((src: string) => boolean))=} option
	 * @returns {ImageAttrs[] | ErrorResult} Array of image attributes or error object
	 */
	getImages(option) {
		if (!this.editor) return { error: "Editor not initialized" };

		let base64 = false;
		let customFunction = null;

		if (!option) {
			// return all
		} else if (option === "base64") {
			base64 = true;
		} else if (typeof option === "function") {
			customFunction = option;
		} else {
			throw new Error(
				"Invalid option: must be 'base64', function, or left blank to return all images",
			);
		}

		const images = [];
		const doc = this.editor.getJSON();

		function extractImages(node) {
			if (node.type === "image" && node.attrs?.src) {
				const src = node.attrs.src;
				node.attrs.isBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(src);
				let valid = true;

				if (base64) {
					valid = /^data:image\/[a-zA-Z]+;base64,/.test(src);
				}

				if (valid && typeof customFunction === "function") {
					valid = customFunction(src);
				}

				if (valid) images.push(node.attrs);
			}

			if (Array.isArray(node.content)) {
				node.content.forEach(extractImages);
			}
		}

		extractImages(doc);
		return images;
	}

	/**
	 * Get the src of the first image in the document, or null if none found
	 * @returns {string | null} The src URL of the first image or null
	 */
	getFirstImage() {
		const doc = this.editor.getJSON();
		const img = doc.content.find((node) => node.type === "image" && node.attrs?.src);
		if (img) {
			return img.attrs.src;
		} else {
			return null;
		}
	}

	/**
	 * Replace a single image's src by its node id
	 * @param {string} id - The data-id attribute of the image node to replace
	 * @param {string} src - The new src URL
	 * @returns {SuccessResult | ErrorResult} Success or error object
	 */
	replaceImage(id, src) {
		if (!this.editor) return { error: "Editor not initialized" };
		if (!id || !src) return { error: "dataId and newSrc are required" };

		const { tr } = this.editor.state;
		let found = false;

		this.editor.state.doc.descendants((node, pos) => {
			if (node.type.name === "image" && node.attrs.id === id) {
				const newAttrs = {
					...node.attrs,
					src: src,
				};
				tr.setNodeMarkup(pos, undefined, newAttrs);
				found = true;
				return false; // stop iteration
			}
		});

		if (found) {
			this.editor.view.dispatch(tr);
			return { success: true };
		} else {
			console.error(`Image with id "${id}" not found`);
			return { error: `Image with id "${id}" not found` };
		}
	}

	/**
	 * Replace multiple images in one go
	 * @param {Array<{ id: string, src: string }>} arr - Array of objects with id and new src
	 * @returns {SuccessResult | ErrorResult} Success or error object
	 */
	replaceImages(arr) {
		if (!this.editor) return { error: "Editor not initialized" };
		if (!Array.isArray(arr)) return { error: "Input must be an array of {id, src} objects" };

		for (const { id, src } of arr) {
			const { error } = this.replaceImage(id, src);
			if (error) return { error };
		}

		return { success: true };
	}

	emit(eventName, ...args) {
		if (!this.listeners[eventName]) return;
		for (const cb of this.listeners[eventName]) {
			cb(...args);
		}
	}

	once(eventName, callback) {
		const wrapper = (...args) => {
			callback(...args);
			this.off(eventName, wrapper);
		};
		this.on(eventName, wrapper);
	}

	on(eventName, callback) {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push(callback);
	}

	off(eventName, callback) {
		if (!this.listeners[eventName]) return;
		this.listeners[eventName] = this.listeners[eventName].filter((cb) => cb !== callback);
	}
}

const KEY = Symbol("TipTapState");

/**
 * @returns {TipTapState} - A new instance of `State` which is stored in the context.
 */
/**
 * @param {any=} stateKey
 */
export function setTipTapState(stateKey = null) {
	return setContext(stateKey || KEY, new TipTapState());
}

/**
 * Retrieves the current state from the context.
 * @returns {TipTapState} - The current state.
 */
/**
 * @param {any=} stateKey
 */
export function getTipTapState(stateKey = null) {
	return getContext(stateKey || KEY);
}
