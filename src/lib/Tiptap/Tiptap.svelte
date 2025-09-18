<script>
import "./tiptap.scss";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import UniqueID from "@tiptap/extension-unique-id";
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
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { getTipTapState } from "./TiptapState.svelte.js";
import { Placeholder } from "@tiptap/extensions";
const tts = getTipTapState();

// let tts.editor = $state(null);

/** @type {HTMLElement | null} */
let element = $state(null);

const lowlight = createLowlight(common);
let {
	content = "",
	debug = false,
	width = "100%",
	height = null,
	placeholder = "Start Typing...",
	onReady = () => {},
} = $props();

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
	tts.editor = new Editor({
		element: element,
		extensions: [
			StarterKit.configure({
				codeBlock: false,
				link: {
					openOnClick: false,
				},
			}),
			UniqueID.configure({
				types: ["image"],
			}),
			Placeholder.configure({
				placeholder: placeholder,
			}),
			SelectionDecoration,
			Image.extend({
				addAttributes() {
					return {
						...this.parent?.(),

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
			handlePaste(view, event) {
				const { schema } = view.state;

				// case 1: raw image file from clipboard
				const items = event.clipboardData?.items || [];
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					if (item.kind === "file" && item.type.startsWith("image/")) {
						const file = item.getAsFile();
						const reader = new FileReader();
						reader.onload = () => {
							view.dispatch(
								view.state.tr.replaceSelectionWith(
									schema.nodes.image.create({ src: reader.result }),
								),
							);
						};
						reader.readAsDataURL(file);
						return true;
					}
				}

				// case 2: copied <img src="http...">
				const html = event.clipboardData?.getData("text/html");
				if (html) {
					const doc = new DOMParser().parseFromString(html, "text/html");
					const img = doc.querySelector("img");
					if (img && img.src.startsWith("http")) {
						fetch(img.src)
							.then((res) => res.blob())
							.then((blob) => {
								const reader = new FileReader();
								reader.onload = () => {
									view.dispatch(
										view.state.tr.replaceSelectionWith(
											schema.nodes.image.create({ src: reader.result }),
										),
									);
								};
								reader.readAsDataURL(blob);
							});
						return true;
					}
				}

				return false; // let Tiptap handle non-image paste normally
			},
		},
		content: content,
	});

	await tick();
	tts.init();
	onReady();
});

export function getHTML() {
	if (tts.editor) {
		return tts.editor.getHTML();
	}
	return { error: "Editor not initialized" };
}

export function getJSON() {
	if (tts.editor) {
		return tts.editor.getJSON();
	}
	return { error: "Editor not initialized" };
}

export function setContent(newContent) {
	if (tts.editor) {
		tts.editor.commands.setContent(newContent);
		return newContent;
	}
	return { error: "Editor not initialized" };
}

export function getEditor() {
	return tts.editor;
}
</script>

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
<div bind:this={element} class="editor-area content"></div>

<style lang="scss">
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
</style>
