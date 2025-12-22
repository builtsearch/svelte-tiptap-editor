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
import { getTipTapState } from "./TiptapState.svelte.js";

let { removeTools = [] } = $props();
const tts = getTipTapState();

// Helper function to check if a tool should be displayed
function shouldShowTool(toolKey) {
	return !removeTools.includes(toolKey);
}

tts.on("transaction", debounce(updateHandler, 100));

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
			isActive = tts.editor.isActive(...check);
		} else {
			isActive = tts.editor.isActive(check);
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
		fn: () => tts.editor.chain().focus().toggleHeading({ level: 1 }).run(),
		icon: "lucide:heading-1",
	},
	{
		name: "Heading 2",
		key: "heading2",
		fn: () => tts.editor.chain().focus().toggleHeading({ level: 2 }).run(),
		icon: "lucide:heading-2",
	},
	{
		name: "Heading 3",
		key: "heading3",
		fn: () => tts.editor.chain().focus().toggleHeading({ level: 3 }).run(),
		icon: "lucide:heading-3",
	},
];
const formatting = [
	{
		name: "Bold",
		key: "bold",
		fn: () => tts.editor.chain().focus().toggleBold().run(),
		icon: "lucide:bold",
		tooltip: "Bold",
		kbd: ["Ctrl", "B"],
	},
	{
		name: "underline",
		fn: () => tts.editor.chain().focus().toggleUnderline().run(),
		icon: "lucide:underline",
		tooltip: "Underline",
		kbd: ["Ctrl", "U"],
	},
	{
		name: "italic",
		fn: () => tts.editor.chain().focus().toggleItalic().run(),
		icon: "lucide:italic",
		kbd: ["Ctrl", "I"],
	},
	{
		name: "Strike ",
		key: "strike",
		fn: () => tts.editor.chain().focus().toggleStrike().run(),
		icon: "lucide:strikethrough",
		kbd: ["Ctrl", "Shift", "S"],
	},
	{
		name: "Code",
		key: "code",
		fn: () => {
			if (tts.editor.isActive("code")) {
				tts.editor.chain().focus().unsetCode().run();
			} else {
				tts.editor.chain().focus().setCode().run();
			}
		},
		icon: "lucide:code-xml",
		kbd: ["Ctrl", "E"],
	},
];
const typography = [
	{
		name: "Subscript",
		fn: () => tts.editor.chain().focus().toggleSubscript().run(),
		icon: "lucide:subscript",
	},
	{
		name: "Superscript",
		fn: () => tts.editor.chain().focus().toggleSuperscript().run(),
		icon: "lucide:superscript",
	},
];

const nodes = [
	{
		name: "Bullet List",
		key: "bullet",
		fn: () => tts.editor.chain().focus().toggleBulletList().run(),
		icon: "lucide:list",
		kbd: ["Ctrl", "Shift", "8"],
	},
	{
		name: "Ordered List",
		key: "ordered",
		fn: () => tts.editor.chain().focus().toggleOrderedList().run(),
		icon: "lucide:list-ordered",
		kbd: ["Ctrl", "Shift", "7"],
	},
	{
		name: "Blockquote",
		key: "blockquote",
		fn: () => tts.editor.chain().focus().toggleBlockquote().run(),
		icon: "tabler:align-left-2",
		kbd: ["Ctrl", "Shift", "B"],
	},
	{
		name: "Code Block",
		key: "codeBlock",
		fn: () => tts.editor.chain().focus().toggleCodeBlock().run(),
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

const image = {
	name: "Image",
	key: "image",
	type: "image",
	icon: "lucide:image",
	tooltip: "Insert Image",
};

function toggleAlignment(align) {
	if (tts.editor.isActive({ textAlign: align })) {
		tts.editor.chain().focus().unsetTextAlign().run();
	} else {
		tts.editor.chain().focus().setTextAlign(align).run();
	}
}

// Derived state that gathers all tools with dividers
const allTools = $derived.by(() => {
	const toolGroups = [
		{ type: "headings", tools: headings },
		{ type: "nodes", tools: nodes },
		{ type: "formatting", tools: formatting },
		{ type: "link", tool: link },
		{ type: "typography", tools: typography },
		{ type: "alignment", tools: alignment },
		{ type: "image", tool: image },
	];

	const result = [];

	toolGroups.forEach((group, index) => {
		let hasVisibleTools = false;

		// Handle groups with multiple tools
		if (group.tools) {
			// Check if entire group is removed
			if (shouldShowTool(group.type)) {
				// Otherwise filter individual tools
				const visibleTools = group.tools.filter((t) => shouldShowTool(t.key || t.name));
				if (visibleTools.length > 0) {
					result.push({ type: group.type, tools: visibleTools });
					hasVisibleTools = true;
				}
			}
		} else if (group.tool) {
			if (shouldShowTool(group.tool.key)) {
				result.push({ type: group.type, tool: group.tool });
				hasVisibleTools = true;
			}
		}

		if (hasVisibleTools && index < toolGroups.length - 1) {
			// Check if there are more visible tools after this
			const hasMoreTools = toolGroups.slice(index + 1).some((nextGroup) => {
				if (nextGroup.tools) {
					return (
						shouldShowTool(nextGroup.type) &&
						nextGroup.tools.some((t) => shouldShowTool(t.key || t.name))
					);
				} else if (nextGroup.tool) {
					return shouldShowTool(nextGroup.tool.key);
				}
				return false;
			});

			if (hasMoreTools) {
				result.push({ type: "divider-vertical" });
			}
		}
	});

	return result;
});
</script>

{#if tts?.editor}
	<div class="toolbar">
		{#each allTools as item}
			{#if item.type === "headings"}
				<ToolbarItemDropdown tools={item.tools} />
			{:else if item.tools}
				{#each item.tools as t}
					<ButtonTooltip
						icon={t.icon}
						active={activeOptions.has(t.key || t.name)}
						tooltip={t.tooltip ?? t.name}
						kbd={t.kbd}
						onclick={() => t.fn()} />
				{/each}
			{:else if item.type === "link"}
				<LinkEditor link={item.tool} editor={tts.editor} />
			{:else if item.type === "image"}
				<ToolbarImage editor={tts.editor} />
			{:else if item.type === "divider-vertical"}
				<div class="vertical-divider"></div>
			{/if}
		{/each}
	</div>
{/if}

<style lang="scss">
.toolbar {
	display: flex;
	justify-content: center;
	padding-block: 0.5rem;
	gap: 0.25rem;
	align-items: center;
}

.vertical-divider {
	width: 1px;
	height: 1.5rem;
}
</style>
