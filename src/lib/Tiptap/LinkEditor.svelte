<script>
import Icon from "@iconify/svelte";
import ButtonTooltip from "./ButtonTooltip.svelte";
import { onMount, tick } from "svelte";
import { activeOptions } from "./Toolbar.svelte.js";

let { link, editor } = $props();
let showEditor = $state(false);
let url = $state("");
let input = $state(null);
let lastUrl = $state("");

async function showLinkEditor(e) {
	if (e.target.closest(".link-editor")) {
		return;
	}
	if (e.target.closest(".toolbar-button")) {
		showEditor = !showEditor;
	}
}

function updateLink() {
	if (editor.isActive("link")) {
		// cursor already inside a link → just update
		editor
			.chain()
			.focus()
			.extendMarkRange("link") // expands to full link
			.unsetLink() // remove old link+text styling
			.insertContent(`<a href="${url}">${url}</a>`) // insert new one
			.run();
	} else if (editor.state.selection.empty) {
		// nothing selected → insert the link text itself
		editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
	} else {
		// text selected → turn selection into link
		editor.chain().focus().setLink({ href: url }).run();
	}
}
onMount(() => {
	editor.on("selectionUpdate", async () => {
		if (editor.isActive("link")) {
			const attrs = editor.getAttributes("link");
			const currentUrl = attrs.href;

			// If same link is selected again
			if (currentUrl === lastUrl && showEditor) {
				showEditor = false; // close
			} else if (currentUrl !== lastUrl) {
				// new link selected
				url = currentUrl;
				showEditor = true;
			}

			lastUrl = currentUrl;
		} else {
			// reset when selection is not on a link
			showEditor = false;
			url = "";
			lastUrl = "";
		}
	});
});

function unsetLink() {
	if (editor.isActive("link")) {
		editor.chain().focus().unsetLink().run();
		showEditor = false;
		url = "";
		lastUrl = "";
	}
}

$effect(async () => {
	if (showEditor) {
		await tick();
		if (input) {
			input.focus();
			input.setSelectionRange(input.value.length, input.value.length);
		}
	}
});
</script>

<ButtonTooltip
	icon={link.icon}
	onclick={(e) => showLinkEditor(e)}
	hovered={showEditor}
	tooltip={link.tooltip}
	active={activeOptions.has(link.key)}>
	{#if showEditor}
		<div class="link-editor tt-shadow-lg">
			<input
				type="text"
				placeholder="Paste a link..."
				bind:this={input}
				bind:value={url}
				onkeydown={(e) => {
					if (e.key === "Enter") updateLink();
					if (e.key === "Escape") showEditor = false;
				}} />
			<button class="tt-button" onclick={() => updateLink()}>
				<Icon icon="lucide:corner-down-right" width="16" />
			</button>
			<div class="vertical-divider"></div>
			<button class="tt-button" onclick={() => window.open(url, "_blank")}>
				<Icon icon="lucide:external-link" width="16" />
			</button>
			<button class="tt-button" onclick={() => unsetLink()}>
				<Icon icon="lucide:trash" width="16" />
			</button>
		</div>
	{/if}
</ButtonTooltip>

<style lang="scss">
.link-editor {
	z-index: 1;
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	background-color: var(--bg-100);
	border: 1px solid var(--border);
	display: flex;
	align-items: center;
	margin-top: 0.25rem;
	padding-inline: 0.25rem;
	padding-block: 0.25rem;
	border-radius: 0.75rem;
	gap: 0rem;
	height: 2.5rem;
	input {
		border: 0;
		font-family: var(--font);
		outline: none;
		font-size: 0.875rem;
		margin-left: 0.25rem;
		width: 200px;
	}
	.vertical-divider {
		margin-inline: 0.25rem;
	}
	.tt-button {
		color: color-mix(in srgb, var(--text), 25% transparent);
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
	}
}
</style>
