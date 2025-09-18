<script>
import "./main.scss";
import TiptapEditor from "$lib/Tiptap/TiptapEditor.svelte";
import content from "../lib/data/content.html?raw";
let tiptapEditor = $state(null);

function init() {
	const tts = tiptapEditor.getState();
	tts.editor.commands.setContent(content);
}

function test() {
	const tts = tiptapEditor.getState();
	const img = tts.getImages();
	console.log(img);
}
</script>

<button onclick={test}>test</button>
<main>
	<TiptapEditor onReady={() => init()} bind:this={tiptapEditor} />
</main>

<style lang="scss">
main {
	width: 100%;
	display: flex;
	justify-content: center;
}
</style>
