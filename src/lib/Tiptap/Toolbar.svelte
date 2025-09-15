<script>
// @ts-nocheck
import { onMount } from "svelte";
import ButtonTooltip from "./ButtonTooltip.svelte";
import { SvelteSet } from "svelte/reactivity";
import { debounce } from "$lib/helper.js";
import ToolbarItemDropdown from "./ToolbarItemDropdown.svelte";
import { activeOptions } from "./Toolbar.svelte.js";
import LinkEditor from "./LinkEditor.svelte";
import ToolbarImage from "./ToolbarImage.svelte";

let { editor } = $props();

editor.on("transaction", debounce(updateHandler, 100));

function updateHandler() {
	const keys = [
		{ key: "bold", check: "bold" },
		{ key: "italic", check: "italic" },
		{ key: "underline", check: "underline" },
		{ key: "strike", check: "strike" },
		{ key: "superscript", check: "superscript" },
		{ key: "subscript", check: "subscript" },
		{ key: "code", check: "code" },
		{ key: "link", check: "link" },
		{ key: "heading1", check: ["heading", { level: 1 }] },
		{ key: "heading2", check: ["heading", { level: 2 }] },
		{ key: "heading3", check: ["heading", { level: 3 }] },
		{ key: "bullet", check: "bulletList" },
		{ key: "ordered", check: "orderedList" },
		{ key: "blockquote", check: "blockquote" },
		{ key: "codeBlock", check: "codeBlock" },
		{ key: "align_left", check: { textAlign: "left" } },
		{ key: "align_center", check: { textAlign: "center" } },
		{ key: "align_right", check: { textAlign: "right" } },
		{ key: "image", check: "image" },
	];

	keys.forEach((data) => {
		const { check, key } = data;

		let isActive = false;
		if (Array.isArray(check)) {
			isActive = editor.isActive(...check);
		} else {
			isActive = editor.isActive(check);
		}

		if (isActive) {
			activeOptions.add(key);
		} else {
			activeOptions.delete(key);
		}
	});
}

const headings = [
	{
		name: "Heading 1",
		key: "heading1",
		fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
		icon: "lucide:heading-1",
	},
	{
		name: "Heading 2",
		key: "heading2",
		fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
		icon: "lucide:heading-2",
	},
	{
		name: "Heading 3",
		key: "heading3",
		fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
		icon: "lucide:heading-3",
	},
];
const formatting = [
	{
		name: "Bold",
		key: "bold",
		fn: () => editor.chain().focus().toggleBold().run(),
		icon: "lucide:bold",
		tooltip: "Bold",
		kbd: ["Ctrl", "B"],
	},
	{
		name: "underline",
		fn: () => editor.chain().focus().toggleUnderline().run(),
		icon: "lucide:underline",
		tooltip: "Underline",
		kbd: ["Ctrl", "U"],
	},
	{
		name: "italic",
		fn: () => editor.chain().focus().toggleItalic().run(),
		icon: "lucide:italic",
		kbd: ["Ctrl", "I"],
	},
	{
		name: "Strike ",
		key: "strike",
		fn: () => editor.chain().focus().toggleStrike().run(),
		icon: "lucide:strikethrough",
		kbd: ["Ctrl", "Shift", "S"],
	},
	{
		name: "Code",
		key: "code",
		fn: () => {
			if (editor.isActive("code")) {
				editor.chain().focus().unsetCode().run();
			} else {
				editor.chain().focus().setCode().run();
			}
		},
		icon: "lucide:code-xml",
		kbd: ["Ctrl", "E"],
	},
];
const typography = [
	{
		name: "Subscript",
		fn: () => editor.chain().focus().toggleSubscript().run(),
		icon: "lucide:subscript",
	},
	{
		name: "Superscript",
		fn: () => editor.chain().focus().toggleSuperscript().run(),
		icon: "lucide:superscript",
	},
];

const nodes = [
	{
		name: "Bullet List",
		key: "bullet",
		fn: () => editor.chain().focus().toggleBulletList().run(),
		icon: "lucide:list",
		kbd: ["Ctrl", "Shift", "8"],
	},
	{
		name: "Ordered List",
		key: "ordered",
		fn: () => editor.chain().focus().toggleOrderedList().run(),
		icon: "lucide:list-ordered",
		kbd: ["Ctrl", "Shift", "7"],
	},
	{
		name: "Blockquote",
		key: "blockquote",
		fn: () => editor.chain().focus().toggleBlockquote().run(),
		icon: "tabler:align-left-2",
		kbd: ["Ctrl", "Shift", "B"],
	},
	{
		name: "Code Block",
		key: "codeBlock",
		fn: () => editor.chain().focus().toggleCodeBlock().run(),
		icon: "mdi:code-block-tags",
		kbd: ["Ctrl", "Alt", "C"],
	},
];

const alignment = [
	{
		name: "Align left",
		key: "align_left",
		fn: () => toggleAlignment("left"),
		icon: "solar:align-left-linear",
		tooltip: "Align Left",
	},
	{
		name: "Align center",
		key: "align_center",
		fn: () => toggleAlignment("center"),
		icon: "solar:align-horizontal-center-linear",
		tooltip: "Align Center",
	},
	{
		name: "Align right",
		key: "align_right",
		fn: () => toggleAlignment("right"),
		icon: "solar:align-right-linear",
		tooltip: "Align Right",
	},
];
const link = {
	name: "Link",
	key: "link",
	icon: "lucide:link",
	tooltip: "Link",
};

function toggleAlignment(align) {
	if (editor.isActive({ textAlign: align })) {
		editor.chain().focus().unsetTextAlign().run();
	} else {
		editor.chain().focus().setTextAlign(align).run();
	}
}
</script>

<div class="toolbar">
	<ToolbarItemDropdown tools={headings} />
	{@render Tools(nodes)}
	<div class="vertical-divider"></div>
	{@render Tools(formatting)}
	<LinkEditor {link} {editor} />
	<div class="vertical-divider"></div>
	{@render Tools(typography)}
	<div class="vertical-divider"></div>
	{@render Tools(alignment)}
	<div class="vertical-divider"></div>
	<ToolbarImage {editor} />
</div>

{#snippet Tools(tools)}
	{#each tools as t}
		<ButtonTooltip
			icon={t.icon}
			active={activeOptions.has(t.key || t.name)}
			tooltip={t.tooltip ?? t.name}
			kbd={t.kbd}
			onclick={() => t.fn()} />
	{/each}
{/snippet}

<style lang="scss">
.toolbar {
	display: flex;
	justify-content: center;
	border-bottom: 1px solid var(--tt-border);
	padding-block: 0.5rem;
	gap: 0.25rem;
}
</style>
