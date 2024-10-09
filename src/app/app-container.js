import App from './app.js';


//////////////////////////////////////////////////////////////////////////////////////
/// @brief App container are element that display Apps with a left bare side if needed
class App_Container extends HTMLElement
{

	////////
	/// CTOR
	////////
	constructor() {
		super();
		this.m_app_list = [];
		this.m_current_app = undefined;
		this.panel = App_Container.#Create_Left_Panel();
		this.app_window = App_Container.#Create_App_Windows();
	}

	Init() {
		this.appendChild(this.panel);
		this.appendChild(this.app_window);
	}


	///////////
	/// METHODS
	///////////

	////////////////////////////////////////////////////
	/// @brief add a new app to the container
	/// @param new_app the app it should be a App object
	Add_App(new_app) {
		if(!new_app instanceof App)
			throw "new_app parameter should be an App object"
		this.m_app_list.push(new_app);
		if(this.m_app_list.length > 1)
			this.app_window.style.display = 'block';
		if(this.m_app_list.length === 1)
			this.app_window.appendChild(new_app);
		
	}

	//////////////////
	/// STATIC METHODS
	//////////////////

	//////////////////////////////////////////////////////////////////////
	/// @brief create an App_Container object and initialize it
	/// @return a new instance App_Container ready to be added to the DOM
	static Create() {
		let elt = document.createElement("app-container");
		elt.Init();
		return elt;
	}

	////////////////////////////////////////////////////////////
	/// @brief create the left panel Div that contains app icons
	/// @return a HTMLDivElement
	static #Create_Left_Panel() {
		let elt = document.createElement("div");
		elt.classList.add("panel");
		elt.style.display = 'none';
		return elt;
	}

	////////////////////////////////////////////////////////////
	/// @brief create the main app display Div that contains app icons
	/// @return a HTMLDivElement
	static #Create_App_Windows() {
		let elt = document.createElement("div");
		elt.classList.add("app-window");
		return elt;
	}

}

customElements.define("app-container", App_Container);

export default App_Container;

