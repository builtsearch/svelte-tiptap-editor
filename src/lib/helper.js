/**
 * Returns a debounced version of the provided function, which delays invoking the function until after the specified wait time.
 *
 * @param {Function} func - The function to debounce. This function will be invoked after the delay has passed.
 * @param {number} delay - The delay in milliseconds before invoking the function.
 * @returns {Function} - The debounced function
 */
export function debounce(func, delay = 300) {
	/**
	 * @type {string | number | NodeJS.Timeout | undefined}
	 */
	let timeoutId;

	/**
	 * @param {any[]} args
	 * @this {any}
	 */
	function debounced(...args) {
		const context = this;

		clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			func.apply(context, args);
		}, delay);
	}

	return debounced;
}

export function fastRandom(length = 8, prefix = "") {
	return (
		prefix +
		Math.random()
			.toString(36)
			.substring(2, 2 + length)
	);
}

/**
 * Adjusts the position of a dropdown element to prevent overflow.
 * Shifts the element horizontally if it overflows the viewport.
 *
 * @param {HTMLElement} element - The dropdown element to adjust
 */
export function adjustDropdownPosition(element) {
	if (!element) return;

	const rect = element.getBoundingClientRect();
	const viewportWidth = window.innerWidth;

	// Check if element overflows on the right
	if (rect.right > viewportWidth) {
		const overflow = rect.right - viewportWidth;
		const currentTransform = element.style.transform || "";

		// Extract current translateX value or default to -50%
		let currentX = -50;
		const translateMatch = currentTransform.match(/translateX\((-?\d+(?:\.\d+)?%?)/);
		if (translateMatch) {
			const value = translateMatch[1];
			if (value.includes("%")) {
				currentX = parseFloat(value);
			} else {
				// If it's already in pixels, convert back to percentage
				currentX = (parseFloat(value) / rect.width) * 100;
			}
		}

		// Calculate adjustment needed in percentage
		const adjustmentPx = overflow + 24; // 8px gap from edge
		const adjustmentPercent = (adjustmentPx / rect.width) * 100;
		const newX = currentX - adjustmentPercent;

		element.style.transform = `translateX(${newX}%)`;
	}

	// Check if element overflows on the left
	if (rect.left < 0) {
		const overflow = Math.abs(rect.left);
		const currentTransform = element.style.transform || "";

		// Extract current translateX value or default to -50%
		let currentX = -50;
		const translateMatch = currentTransform.match(/translateX\((-?\d+(?:\.\d+)?%?)/);
		if (translateMatch) {
			const value = translateMatch[1];
			if (value.includes("%")) {
				currentX = parseFloat(value);
			} else {
				currentX = (parseFloat(value) / rect.width) * 100;
			}
		}

		// Calculate adjustment needed in percentage
		const adjustmentPx = overflow + 8; // 8px gap from edge
		const adjustmentPercent = (adjustmentPx / rect.width) * 100;
		const newX = currentX + adjustmentPercent;

		element.style.transform = `translateX(${newX}%)`;
	}
}
