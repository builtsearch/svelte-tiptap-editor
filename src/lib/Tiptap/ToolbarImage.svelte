<script>
import { fastRandom } from "$lib/helper.js";
import Icon from "@iconify/svelte";
import ButtonTooltip from "./ButtonTooltip.svelte";
import { activeOptions } from "./Toolbar.svelte.js";
import { onMount } from "svelte";

let { editor } = $props();
let lastSelectedImage = $state(null);
let showEditor = $state(false);

const tool = {
	name: "Image",
	key: "image",
	icon: "lucide:image-plus",
	tooltip: "Image",
};

let editImageFields = $state({
	originalWidth: 0,
	originalHeight: 0,
	width: 0,
	height: 0,
	position: "cc",
	constraint: true,
});

let icon = $derived(activeOptions.has("image") ? "lucide:image" : "lucide:image-plus");

function browseImage(e) {
	if (activeOptions.has(tool.key)) return;
	if (e.target.closest(".tt-toolbar-options")) {
		return;
	}

	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = async (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result;
				// Insert the image at the current cursor position
				editor.chain().focus().setImage({ src: base64 }).run();
			};
			reader.readAsDataURL(file);
		}
	};
	input.click();
}

$effect(() => {
	if (activeOptions.has(tool.key)) {
	}
});

onMount(() => {
	editor.on("selectionUpdate", () => {
		if (editor.isActive("image")) {
			const img = editor.view.dom.querySelector("img.ProseMirror-selectednode");
			if (img) {
				if (img.complete) {
					setImageFields(img);
				} else {
					img.addEventListener(
						"load",
						() => {
							setImageFields(img);
						},
						{ once: true },
					);
				}
			}
		} else {
			showEditor = false;
		}
	});

	function setImageFields(img) {
		showEditor = true;
		const width = img.naturalWidth;
		const height = img.naturalHeight;
		editImageFields.originalWidth = width;
		editImageFields.originalHeight = height;

		const currentWidth = img.getAttribute("width") || width;
		const currentHeight = img.getAttribute("height") || height;

		editImageFields.width = currentWidth;
		editImageFields.height = currentHeight;
	}
});
function updateImage(dim) {
	const ratio = editImageFields.originalWidth / editImageFields.originalHeight;
	if (editImageFields.constraint) {
		if (dim === "width") {
			editImageFields.height = Math.round(editImageFields.width / ratio);
		} else if (dim === "height") {
			editImageFields.width = Math.round(editImageFields.height * ratio);
		}
	}

	const map = {
		tl: "left top",
		tc: "center top",
		tr: "right top",
		cl: "left center",
		cc: "center center",
		cr: "right center",
		bl: "left bottom",
		bc: "center bottom",
		br: "right bottom",
	};

	const baseClass = `img-pos-${editImageFields.position}`;
	const classes = [baseClass];

	if (editImageFields.constraint) {
		classes.push("img-auto-height");
	}

	editor
		.chain()
		.focus()
		.updateAttributes("image", {
			width: editImageFields.width,
			height: editImageFields.height,
			class: classes.join(" "),
		})
		.run();
}

function reset() {
	editImageFields.width = editImageFields.originalWidth;
	editImageFields.height = editImageFields.originalHeight;
	editImageFields.position = "cc";
	editImageFields.constraint = true;
	updateImage();
}
</script>

<svelte:window
	onclick={(e) => {
		const target = e.target;
		if (!target.closest("img")) {
			lastSelectedImage = null;
			showEditor = false;
			return;
		}
		if (target == lastSelectedImage) {
			showEditor = false;
		} else {
			showEditor = true;
			lastSelectedImage = target;
		}
	}}
	onkeydown={(e) => {
		if (showEditor && e.key === "Escape") {
			console.log("??");
			showEditor = false;
		}
	}} />

<ButtonTooltip
	{icon}
	tooltip={tool.tooltip}
	hovered={activeOptions.has(tool.key)}
	active={activeOptions.has(tool.key)}
	onclick={browseImage}>
	{#if showEditor}
		<div class="tt-toolbar-options tt-shadow-lg">
			<div class="field">
				<span class="field-label a1">W</span>
				<span class="field-label a2">H</span>
				{#each ["width", "height"] as dim}
					<div class="input-container b{dim === 'width' ? 1 : 2}">
						<input
							type="text"
							placeholder={dim}
							bind:value={editImageFields[dim]}
							onchange={() => updateImage(dim)} />
						<span class="suffix">px</span>
					</div>
				{/each}

				<button
					class="tt-button b3"
					class:constraint={editImageFields.constraint}
					onclick={() => (editImageFields.constraint = !editImageFields.constraint)}>
					{#if editImageFields.constraint}
						<Icon icon="solar:link-minimalistic-2-linear" width="16" />
					{:else}
						<Icon icon="solar:link-broken-minimalistic-bold" width="16" class="expand-icon" />
					{/if}
				</button>
			</div>

			{#if !editImageFields.constraint}
				<div class="anchor-container">
					<span class="field-label">Anchor</span>
					<div class="anchors">
						{#each ["tl", "tc", "tr", "cl", "cc", "cr", "bl", "bc", "br"] as pos}
							<button
								class="tt-button anchor"
								class:active={editImageFields.position === pos}
								onclick={() => {
									editImageFields.position = pos;
									updateImage();
								}}>
								<span>{pos}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<button class="tt-button reset" onclick={reset}>
				<div class="icon">
					<Icon icon="lucide:refresh-cw" />
				</div>
				<span> Reset to Original </span>
			</button>
		</div>
	{/if}
</ButtonTooltip>

<style lang="scss">
.expand-icon {
	color: var(--mono-mid);
}
.tt-toolbar-options {
	cursor: auto;
	pointer-events: auto;
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	margin-top: 0.25rem;
	width: fit-content;
	font-size: 0.875rem;
	background-color: var(--bg-100);
	border: 1px solid var(--border);
	padding: 0.25rem;
	border-radius: 0.75rem;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	color: var(--text);
	span.field-label {
		text-align: center;
		color: var(--text);
		font-size: 0.75rem;
		margin-left: 0.25rem;
		opacity: 0.75;
	}

	.field {
		display: grid;
		grid-template-columns: 100px 100px 1.75rem;
		grid-template-rows: auto auto;
		gap: 0.125rem;
		.b1 {
			grid-column: 1;
			grid-row: 2;
		}
		.b2 {
			grid-column: 2;
			grid-row: 2;
		}
		.b3 {
			grid-row: 2;
			padding: 0;
			width: 1.75rem;
			height: 1.75rem;
			display: flex;
			justify-content: center;
			align-items: center;
			color: var(--text);
			&.constraint {
				color: var(--primary);
			}
		}

		.input-container {
			display: flex;
			align-items: center;
			border-radius: 0.25rem;
			padding-block: 2px;
			padding-inline: 0.25rem;
			border: 1px solid var(--border);
			justify-content: space-between;
			.suffix {
				color: var(--text);
				opacity: 0.75;
				font-size: 0.75rem;
			}
			input {
				border: 0;
				padding: 0;
				width: 100%;
				outline: none;
				border-radius: 0;
			}
		}
	}
	.anchor-container {
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		.field-label {
			width: 100px;
			text-align: left;
		}
		.anchors {
			display: grid;
			grid-template-columns: repeat(3, 0.75rem);
			grid-template-rows: repeat(3, 0.75rem);
			gap: 0.25rem;
			margin-top: 0.25rem;
			.anchor {
				width: 0.75rem;
				height: 0.75rem;
				border-radius: 0.25rem;
				background-color: var(--bg-200);
				border: 1px solid var(--border);
				span {
					visibility: hidden;
				}
				&.active {
					border: transparent;
					background-color: var(--primary);
				}
			}
		}
	}
	.reset {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.25rem;
		width: fit-content;
		margin-top: 0.5rem;
		padding-inline: 0.25rem 0.5rem;
		.icon {
			opacity: 0.5;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
}
</style>
