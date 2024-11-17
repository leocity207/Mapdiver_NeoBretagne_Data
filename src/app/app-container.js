import App from './app.js';


/**
 *  App_container are element that display *Apps*.
 *  
 * 	When more than one *App* is added to the container  it create a left bare side to switch between app.
 *  
 * 	When multiple *App* are being used it is recommended to set the Icon inside the *App* in order to display it inside the left bare side.
 * 
 *  every element contained inside the container is inside a ShadowDom
 * 
 *  this class create a custome element named "app-container"
 */
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

	/**
	* Initialize the App_Container
	* @protected
	*/
	Init() {
		let shadow = this.attachShadow({ mode: "open" });
		const link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', 'style/app-container.css');
		shadow.appendChild(link);
		shadow.appendChild(this.panel);
		shadow.appendChild(this.app_window);
	}


	///////////
	/// METHODS
	///////////

	/**
	* add a new app to the container
	* @param {App} new_app the App that should  be added to the container
	*/
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

	/**
	* create an App_Container object and initialize it ready to be added to the DOM
	*
	* @return a new instance App_Container ready to be added to the DOM
	*/
	static Create() {
		let elt = document.createElement("app-container");
		elt.Init();
		return elt;
	}

	/*
	* Create the left panel Div that contains app icons.
	*
	* @return HTMLDivElement of class *panel*
	* @private 
	*/
	static #Create_Left_Panel() {
		let elt = document.createElement("div");
		elt.classList.add("panel");
		elt.style.display = 'none';
		return elt;
	}

	/*
	* create the main app display Div that contains app icons
	* @return HTMLDivElement of class *app-window*
	* @private
	*/
	static #Create_App_Windows() {
		let elt = document.createElement("div");
		elt.classList.add("app-window");
		return elt;
	}

}

customElements.define("app-container", App_Container);

export default App_Container;

