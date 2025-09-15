<script>
import Tiptap from "$lib/Tiptap/Tiptap.svelte";
import "./main.scss";
import content from "$lib/data/content.html?raw";

/** @type {import('$lib/Tiptap/Tiptap.svelte').default | null} */
let tiptap = $state(null);
function save() {
	const editor = tiptap.getEditor();

	const html = tiptap.getHTML();
	const images = tiptap.getImages();
	tiptap.replaceImages([
		{
			id: images[0].id,
			src: "https://picsum.photos/200/300",
		},
	]);
}
</script>

<button onclick={save}>Save</button>
<button
	onclick={() => {
		tiptap.setContent("<p>hello</p>");
	}}>Replace</button>

<main>
	<Tiptap {content} width="600" bind:this={tiptap} />
</main>

<style lang="scss">
main {
	width: 100%;
	display: flex;
	justify-content: center;
	height: 600px;
}
</style>
