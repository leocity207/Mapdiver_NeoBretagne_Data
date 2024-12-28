
/**
 * General Scope for utilitary function
 */
class Utils {

	/**
	 * Transform a RGBA color into a HexString 
	 * @param {String} rgba rgba code like "#1234FE" 
	 * @param {Boolean} with_alpha if there are digit for the alpha canal and if it should be transcribed
	 * @returns {String} the hex string of the color
	 */
	static Rgba_To_Hex = (rgba, with_alpha=false) => {
		if(rgba.indexOf('#') !== -1)
			return rgba
		let rgb = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
		let hex_str = 	(rgb && rgb.length === 4) ? "#" +
						("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
						("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
						("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
		return 	hex_str.toUpperCase()
	}

	/**
	 * check the bound of the value and put it in bound if needed
	 * @param {Float} value The value to check if in bound
	 * @param {Float} min the min value
	 * @param {Float} max the max value
	 * @returns 
	 */
	static Round_Bound = (value, min, max) => {
		return Math.min(Math.max(value, min), max);
	}

	static Wait = async (t) =>
	{ 
		return new Promise((resolve, reject) => setTimeout(resolve, t))
	}

	/**
	 * Fetches JSON data from the given endpoint.
	 * @param {string} endpoint - The API endpoint to fetch data from.
	 * @returns {Promise<object>} - A promise that resolves to the JSON data.
	 * @throws {Error} - Throws an error if the fetch fails or the response is invalid.
	*/
	static Fetch_Resource = async (endpoint) =>
	{
		try {
			const response = await fetch(endpoint, {
				method: "GET", // Explicitly specifying GET for clarity
				headers: {
					"Content-Type": "application/json", // Ensures the server understands JSON
					"Accept": "application/json" // Requests JSON response
				}
			});

			// Check if the response status is OK (200-299)
			if (!response.ok)
				throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);

			const data = await response.json(); // Parse JSON from the response
			return data;
		} catch (error) {
			console.error("Error fetching resource:", error.message);
			throw error; // Re-throw the error for further handling
		}
	}

	/**
	 * Extracts the first part of a string that consists of two sections separated by a hyphen (`-`).
	 * If the input contains more than two sections (separated by hyphens), only the first two sections are returned.
	 * If the input contains only one section or is already in the form of `X-X`, it returns the input as is.
	 *
	 * @param {string} input - The input string to process. The string should be in the form of `X-X` or `X-X-X` (or similar).
	 * @returns {string} The first two sections of the input string, separated by a hyphen, or the input string itself if no hyphen is present.
	 *
	 * @example
	 * getFirstPart("abc-def");
	 * // Returns: "abc-def"
	 *
	 * @example
	 * getFirstPart("abc-def-ghi");
	 * // Returns: "abc-def"
	 *
	 * @example
	 * getFirstPart("single-part");
	 * // Returns: "single-part"
	 */
	static Get_First_Part = function(input) {
		const match = input.match(/^([^-]+-[^-]+)/);
		return match ? match[0] : input;
	}
  
}

export default Utils