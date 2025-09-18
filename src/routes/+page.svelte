<script>
import "./main.scss";
import TiptapEditor from "$lib/Tiptap/TiptapEditor.svelte";

let tiptapEditor = $state(null);

function test() {
	const tts = tiptapEditor.getState();
	const img = tts.getImages();
	console.log(img);
}
</script>

<button onclick={test}>test</button>
<main>
	<TiptapEditor bind:this={tiptapEditor} />
</main>

<style lang="scss">
main {
	width: 100%;
	display: flex;
	justify-content: center;
}
</style>
