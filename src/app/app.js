import Loader from '../loader/loader.js';
import Page from '../page/page.js'; 


/**
 * App object that represent a working app
 * 
 * App are made of two thing A main page node object and a loader animation displayed
 * 
 * App register a "Loading" and "Done" event to display loading element
 * 
 * Every element inside the App is inside a ShadowDom
 * 
 * App define a custom element named "app-app"
*/
class App extends HTMLElement
{

	/////////
	/// CTOR
	constructor() {
		super();
	}

	////////////
	/// METHOD
	////////////

	/**
	* Initialize an App object after it has been instantiated
	* @protected
	*/
	Init(loader, main_page, icon) {
		this.loader = loader;
		this.main_page = main_page;
		this.icon = icon;
		let shadow = this.attachShadow({ mode: "open" });
		const link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', 'style/app.css');
		shadow.appendChild(link);
		shadow.appendChild(this.loader);
		shadow.appendChild(this.main_page);
	}

	/**
	 * Show the App
	 */
	Show() {
		this.style.display = 'block';
	}

	/**
	 * Hide the App
	 */
	Hide() {
		this.style.display = 'none';
	}

	/**
	 * Show the page and Hide the loader
	 */
	Loaded() {
		this.main_page.Show();
		this.loader.Hide();
	}

	/**
	 * Hide the page and show the loader
	 */
	Loading() {
		this.main_page.Hide();
		this.loader.Show();
	}

	//////////////////
	/// STATIC METHODS
	//////////////////

	/**
	 * create an App object and initialize it
	 * @param {Loader} loader 
	 * @param {Page} main_page 
	 * @param {Icon} icon 
	 * @returns {App} a new instance App (it should be added to the dom via an App_Container object)
	 */
	static Create(loader, main_page, icon) {
		let elt = document.createElement("app-app");
		elt.Init(loader, main_page, icon);
		return elt;
	}

}

customElements.define("app-app", App);

export default App;
