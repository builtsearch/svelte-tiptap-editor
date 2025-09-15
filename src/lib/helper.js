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
