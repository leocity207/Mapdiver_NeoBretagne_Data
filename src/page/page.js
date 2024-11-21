
/**
 * Page are displayable element generaly found inside an App, they are gracefull container
 * 
 *  this class create a custome element named "app-page"
 */
class Page extends HTMLElement
{
	constructor() {
		super();
	}

	/**
	 * Initialize a Page object after it has been instantiated
	 * @protected
	 */
	Init() {
		// Create a shadow root for the page
		this.attachShadow({ mode: "open" });
		// Add a link to the stylesheet for the page
		const styleLink = document.createElement('link');
		styleLink.setAttribute('rel', 'stylesheet');
		styleLink.setAttribute('href', 'style/app.css');
		this.shadowRoot.appendChild(styleLink);
	}

	/**
	 * Show the Page
	 */
	Show() {
		this.style.display = 'block';
	}

	/**
	 * Hide the page
	 */
	Hide() {
		this.style.display = 'none';
	}

	/**
	 * Create a Page object and initialize it.
	 * 
	 * @returns {Page} an Page Object
	 */
	static Create() {
		return document.createElement("app-page");
	}
}

customElements.define("app-page", Page);

export default Page;
