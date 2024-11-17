
/**
 * Page are displayable element generaly found inside an App, they are gracefull container
 * 
 *  this class create a custome element named "app-page"
 */
class Page extends HTMLElement
{
	constructor(loader,main_page) {
		super();
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
