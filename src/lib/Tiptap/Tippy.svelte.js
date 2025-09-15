import tippy from "tippy.js";
import "tippy.js/animations/shift-away.css";

export function tippyTooltip(
	content,
	{
		allowHtml = false,
		target = null,
		click = false,
		delay = 0,
		kbd = null,
		maxWidth = 350,
		touch = "delayed",
	} = {},
) {
	const touchDelay = 250;

	const isTouchDevice = navigator.maxTouchPoints > 0;
	if (isTouchDevice && touch === "delayed") {
		if (delay == 0) {
			delay = touchDelay;
		}
		touch = ["hold", touchDelay];
	}

	if (kbd && kbd.length > 0) {
		content += "<br/><div class='kbd-container'>";
		for (const key of kbd) {
			content += `<kbd>${key}</kbd>`;
		}
		content += "</div>";
		allowHtml = true;
	}

	return (element) => {
		let container = document.querySelector(".tt-tippy");
		if (!container) {
			container = document.createElement("div");
			container.className = "tt-tippy";
			document.body.appendChild(container);
		}

		const tooltip = tippy(element, {
			content,
			maxWidth,
			theme: "light",
			delay: [delay, 0],
			animation: "shift-away",
			allowHTML: allowHtml,
			touch,
			trigger: click ? "click" : "mouseenter focus",
			appendTo: () => container,
			onShow(instance) {
				const dropdown = element.querySelector(".tt-toolbar-options");
				if (dropdown && dropdown.matches(":hover")) {
					return false; // cancel tooltip
				}
			},
		});

		return tooltip.destroy;
	};
}
