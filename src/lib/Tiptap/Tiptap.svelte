<script>
import "./tiptap.scss";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";

import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";

import { common, createLowlight } from "lowlight";
import { onMount, tick } from "svelte";
import { activeOptions } from "./Toolbar.svelte.js";
import Toolbar from "./Toolbar.svelte";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { fastRandom } from "$lib/helper.js";

/** @type {import('@tiptap/core').Editor | null} */
let editor = $state(null);
/** @type {HTMLElement | null} */
let element = $state(null);

const lowlight = createLowlight(common);
let { content = "", debug = false, width = "100%", height = null } = $props();

//if width does not have any unit, assume px
if (typeof width === "number" || /^\d+$/.test(width)) {
	width = `${width}px`;
}
if (height && (typeof height === "number" || /^\d+$/.test(height))) {
	height = `${height}px`;
}

const SelectionDecoration = Extension.create({
	name: "selectionDecoration",

	addOptions() {
		return {
			className: "selection",
		};
	},

	addProseMirrorPlugins() {
		let shouldDecorate = false;

		return [
			new Plugin({
				key: new PluginKey("selection"),
				props: {
					decorations: (state) => {
						if (!shouldDecorate) return null;

						const { selection } = state;
						if (selection.empty) return null;

						return DecorationSet.create(state.doc, [
							Decoration.inline(selection.from, selection.to, {
								class: this.options.className,
							}),
						]);
					},
				},
				view: (editorView) => {
					const { dom } = editorView;

					dom.addEventListener("blur", () => {
						shouldDecorate = true;
						editorView.dispatch(editorView.state.tr); // re-render
					});

					dom.addEventListener("focus", () => {
						shouldDecorate = false;
						editorView.dispatch(editorView.state.tr); // clear
					});

					return {};
				},
			}),
		];
	},
});

onMount(async () => {
	editor = new Editor({
		element: element,
		extensions: [
			StarterKit.configure({
				codeBlock: false,
				link: {
					openOnClick: false,
				},
			}),
			SelectionDecoration,
			Image.extend({
				addAttributes() {
					return {
						...this.parent?.(),
						id: {
							default: null,
							parseHTML: (el) => el.getAttribute("id"),
							renderHTML: (attrs) => ({ id: attrs.id }),
						},
						class: {
							default: null,
							parseHTML: (element) => element.getAttribute("class"),
							renderHTML: (attributes) => {
								if (!attributes.class) return {};
								return { class: attributes.class };
							},
						},
					};
				},
			}),
			Superscript,
			Subscript,
			CodeBlockLowlight.configure({
				lowlight,
				HTMLAttributes: { spellcheck: "false" },
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			FileHandler.configure({
				allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
				onDrop: (currentEditor, files, pos) => {
					files.forEach((file) => {
						const fileReader = new FileReader();

						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
							currentEditor
								.chain()
								.insertContentAt(pos, {
									type: "image",
									attrs: {
										src: fileReader.result,
									},
								})
								.focus()
								.run();
						};
					});
				},
				onPaste: (currentEditor, files, htmlContent) => {
					files.forEach((file) => {
						if (htmlContent) {
							// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
							// you could extract the pasted file from this url string and upload it to a server for example
							console.log(htmlContent); // eslint-disable-line no-console
							return false;
						}

						const fileReader = new FileReader();

						fileReader.readAsDataURL(file);
						fileReader.onload = () => {
							currentEditor
								.chain()
								.insertContentAt(currentEditor.state.selection.anchor, {
									type: "image",
									attrs: {
										src: fileReader.result,
									},
								})
								.focus()
								.run();
						};
					});
				},
			}),
			TableKit.configure({
				table: { resizable: true },
			}),
		],
		editorProps: {
			handleDOMEvents: {
				// prevent selection from disappearing on blur
				blur: () => {
					return true; // stop default blur handling
				},
			},
		},
		content: content,
	});

	editor.on("create", () => {
		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === "image" && !node.attrs.id) {
				editor.commands.command(({ tr }) => {
					tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						id: fastRandom(8, "tt-img-"),
					});
					return true;
				});
			}
		});
	});

	await tick();
});

export function getHTML() {
	if (editor) {
		return editor.getHTML();
	}
	return { error: "Editor not initialized" };
}

export function getJSON() {
	if (editor) {
		return editor.getJSON();
	}
	return { error: "Editor not initialized" };
}

export function setContent(newContent) {
	if (editor) {
		editor.commands.setContent(newContent);
		return newContent;
	}
	return { error: "Editor not initialized" };
}

export function getEditor() {
	return editor;
}

export function getImages(option) {
	if (!editor) return { error: "Editor not initialized" };

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
	const doc = editor.getJSON();

	function extractImages(node) {
		if (node.type === "image" && node.attrs?.src) {
			const src = node.attrs.src;
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

export function replaceImage(id, src) {
	if (!editor) return { error: "Editor not initialized" };
	if (!id || !src) return { error: "dataId and newSrc are required" };

	const { tr } = editor.state;
	let found = false;

	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === "image" && node.attrs["id"] === id) {
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
		editor.view.dispatch(tr);
		return { success: true };
	} else {
		console.error(`Image with id "${id}" not found`);
		return { error: `Image with id "${id}" not found` };
	}
}

export function replaceImages(arr) {
	if (!editor) return { error: "Editor not initialized" };
	if (!Array.isArray(arr)) return { error: "Input must be an array of {id, src} objects" };

	for (const { id, src } of arr) {
		const { error } = replaceImage(id, src);
		if (error) return;
	}

	return { success: true };
}
</script>

<div
	class="tiptap-svelte-container"
	style="--tiptap-width: {width};
	--tiptap-height: {height ? height : 'auto'};">
	{#if editor}
		<Toolbar {editor} />
	{/if}
	{#if debug}
		<div class="debug">
			<span class="label">Active Options: </span>
			<span class="value">
				{#if activeOptions.size === 0}-{/if}
				{#each Array.from(activeOptions) as option}
					<span>{option}</span>
				{/each}
			</span>
		</div>
	{/if}
	<div class="tiptap-editor">
		<div class="scrollable">
			<div bind:this={element} class="editor-area content"></div>
		</div>
	</div>
</div>

<style lang="scss">
.tiptap-svelte-container {
	// width: var(--tiptap-container-width, 100%);
	width: auto;
	display: flex;
	flex-direction: column;
	gap: 0;
	position: relative;
	// gap: 1rem;
	.tiptap-editor {
		overflow: auto;
		.scrollable {
			margin-block: 1rem;
			margin-inline: auto;
			width: var(--tiptap-width, 600px);
			// height: calc(100dvh - 150px);
			height: var(--tiptap-height, auto);
		}
	}
	.debug {
		top: 4rem;
		width: 100%;
		border-radius: 0.5rem;
		padding: 0.5rem;
		font-size: 0.875rem;
		background-color: color-mix(in srgb, var(--mono) 12%, var(--bg-100));
		display: flex;
		min-height: 37px;
		gap: 0.25rem;
		margin-block: 0.25rem;
		.label {
			margin-top: 2px;
		}
		.value {
			display: flex;
			gap: 0.25rem;
			flex-wrap: wrap;
			span {
				font-family: var(--font-mono);
				background-color: var(--bg-100);
				padding: 2px 4px;
				font-size: 0.8125rem;
				border-radius: 0.25rem;
			}
		}
	}
}
</style>
