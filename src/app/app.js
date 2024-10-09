import Loader from '../loader/loader.js';
import Page from './page.js'; 


//////////////////////////////////////////////////////////////////////////////////////
/// App object that represent a working app
/// App are made of two thing A main page node object and a loader animation displayed
/// App register a "Loading" and "Done" event to display loading element 
class App extends HTMLElement
{

	/////////
	/// CTOR
	/////////
	constructor() {
		super();
	}

	////////////
	/// METHOD
	////////////

	////////////////////////////////////////////////////////////
	/// @brief Initialize and app after it has been instantiated
	Init() {
		if(!this.loader || !this.main_page)
			throw "missing value to init an App."
		let shadow = this.attachShadow({ mode: "open" });
		const link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', 'style/app.css');
		shadow.appendChild(link);
		shadow.appendChild(this.loader);
		shadow.appendChild(this.main_page);
		//to be removed
		this.loader.Show();
		this.main_page.Hide();
	}

	///////////////////////
	/// @brief Show the app
	Show() {
		this.style.display = 'block';
	}

	///////////////////////
	/// @brief Hide the app
	Hide() {
		this.style.display = 'none';
	}

	//////////////////
	/// STATIC METHODS
	//////////////////

	///////////////////////////////////////////////////////////////////////////////////////////
	/// @brief create an App object and initialize it
	/// @return a new instance App (it should be added to the dom via an App_Container object)
	static Create(loader, main_page, icon) {
		let elt = document.createElement("app-app");
		elt.loader = loader;
		elt.main_page = main_page;
		elt.icon = icon;
		elt.Init();
		return elt;
	}

}

customElements.define("app-app", App);

export default App;
