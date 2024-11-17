
/**
 * Loader are displayable element that containe a simple animation used for stand by.
 * 
 * You should generaly not use this class by itself as it does only display a white page, but instead create you own Animation inheriting this class
 * 
 * This class create a custome element named "app-loader"
 * 
 */
class Loader extends HTMLElement
{
	constructor() {
		super();
	}

	/**
	 * Show the Loader
	 */
	Show() {
		this.style.display = 'block';
	}

	/**
	 * Hide the Loader
	 */
	Hide() {
		this.style.display = 'none';
	}

	/**
	 * Create a Loader Element
	 * @returns  {Loader} a ready to be use loader
	 */
	static Create() {
		return document.createElement("app-loader");
	}
}

customElements.define("app-loader", Loader);

export default Loader;
