<script>
import Icon from "@iconify/svelte";
import ButtonTooltip from "./ButtonTooltip.svelte";
import { activeOptions } from "./Toolbar.svelte.js";
import { fastRandom } from "$lib/helper.js";

let { button, tools } = $props();

let t = $derived.by(() => {
	const array = Array.from(activeOptions);
	const item = array.find((item) => item.startsWith("heading"));
	if (item) {
		return tools.find((t) => t.key == item);
	}
	return tools[0];
});
let showDropdown = $state(false);
const id = fastRandom(8, "tt-headings-dropdown-");

function openDropdown() {
	showDropdown = !showDropdown;
}

$effect(() => {
	showDropdown;
	if (showDropdown) {
		document.body.setAttribute("data-scroll-locked", true);
	} else {
		document.body.removeAttribute("data-scroll-locked");
	}
});
</script>

<svelte:window
	onclick={(e) => {
		if (!e.target.closest(`#${id}`)) {
			showDropdown = false;
		}
	}} />

<ButtonTooltip
	{id}
	icon={t.icon}
	tooltip={t.tooltip ?? t.name}
	hovered={showDropdown}
	active={activeOptions.has(t.key)}
	kbd={t.kbd}
	onclick={openDropdown}>
	<div class="expand-icon">
		<Icon icon="mdi:expand-more" width="12" />
	</div>
	{#if showDropdown}
		<div class="tt-toolbar-options tt-shadow-lg">
			{#each tools as tool}
				<button class="tt-button" onclick={() => tool.fn()}>
					<div class="icon">
						<Icon icon={tool.icon} width="18" />
					</div>
					<span class="name">{tool.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</ButtonTooltip>

<style lang="scss">
.expand-icon {
	color: var(--mono-mid);
}
.tt-toolbar-options {
	pointer-events: auto;
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 0.25rem;
	width: fit-content;
	font-size: 0.875rem;
	background-color: var(--bg-100);
	border: 1px solid var(--border);
	padding: 0.25rem;
	border-radius: 0.75rem;
	z-index: 1;
}

button {
	gap: 0.5rem;
	display: flex;
	align-items: center;
	white-space: nowrap;
	width: 100%;
	border-radius: 0.5rem;
	.icon {
		color: color-mix(in srgb, var(--mono), 40% #000);
	}
	span {
		color: var(--text-soft);
		font-size: 0.8125rem;
	}
}
</style>
