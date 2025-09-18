<script>
import Tiptap from "./Tiptap.svelte";
import { setTipTapState } from "./TiptapState.svelte.js";
import Toolbar from "./Toolbar.svelte";

let { onReady = () => {} } = $props();
const tts = setTipTapState();

tts.replaceImage();
export function getState() {
	return tts;
}
</script>

<div class="tiptap-wrapper">
	<div class="toolbar">
		<Toolbar />
	</div>
	<div class="tiptap-content">
		<Tiptap onReady={() => onReady()} />
	</div>
</div>

<style lang="scss">
.tiptap-wrapper {
	width: 100%;
	.toolbar {
		border-bottom: 1px solid var(--tt-border);
		position: sticky;
		top: 0;
		z-index: 1;
		background-color: var(--bg-100);
	}
	.tiptap-content {
		padding-block: 0.5rem;
		margin-inline: auto;
		width: 600px;
	}
}
</style>
