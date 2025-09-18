<script>
import Icon from "@iconify/svelte";
import "./tiptap.scss";
import { tippyTooltip } from "./Tippy.svelte.js";

/**
 * @typedef Props
 * @property {string} icon - Icon name from Iconify
 * @property {boolean} active - Whether the button is active
 * @property {string} tooltip - Tooltip text
 * @property {string[]} [kbd] - Keyboard shortcut keys
 * @property {import('svelte').Snippet} [children]
 * @property {(event: MouseEvent) => void} [onclick]
 */

/** @type {Props} */
let { icon, active, hovered, tooltip, kbd, children, onclick = () => {}, ...props } = $props();
</script>

<button
	class="tt-button toolbar-button"
	{onclick}
	{@attach tippyTooltip(tooltip, { kbd, delay: 300 })}
	class:active
	class:hovered
	{...props}>
	{#if icon}
		<Icon {icon} width="18" />
	{/if}
	{@render children?.()}
</button>

<style lang="scss">
button.toolbar-button {
	position: relative;
	min-width: 32px;
	height: 32px;

	display: flex;
	justify-content: center;
	align-items: center;
	color: var(--tt-icon-button, color-mix(in srgb, var(--mono), 40% #000));
	&.active {
		color: var(--primary);
	}
}
</style>
