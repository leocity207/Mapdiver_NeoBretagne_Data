import App from "../app/app.js";
import SVG_Map from "../map/svg_map.js";
import Config from "../config/config.js"

/**
 * Map_App are object that define a node containing a SVG_Map for manipulation and display
 * 
 * Map_App define a custom element named "svg-map-app"
 */
class Map_App extends App {

	////////
	m_map;
	
	constructor() {
		super();
	}

	/**
	* Initialize an Map_App object after it has been instantiated
	* @protected
	*/
	Init(loader, main_page, icon) 
	{
		super.Init(loader, main_page, icon);
		const map_container = document.createElement('div');
		map_container.setAttribute('id', 'map-container');
		const map_canvas = document.createElement('canvas');
		map_container.appendChild(map_canvas);
		map_canvas.setAttribute('id', 'map-canvas');
		this.main_page.appendChild(map_container);
		this.map_container = map_container;
		this.map_canvas = map_canvas;
	}

	/**
	 * Asynchronous function that initialize the map. the function resolve when the SVG is loaded and displayed inside the current node
	 */
	Initialize_Map = async () => {
		this.Loading();
		this.map = new SVG_Map("Desktop", "image/map.svg", Config);
		await this.map.Setup("Fr", this.map_canvas);
		this.map.Setup_Mouse_Handlers();
		this.Loaded();
		await this.map.Initial_Zoom_Move();	
	}

	/**
	 * Create a Map_App object and initialize it.
	 * 
	 * @returns {Map_App} an Page Object
	 */
	static Create(loader, main_page, icon) {
		let elt = document.createElement("svg-map-app");
		elt.Init(loader, main_page, icon);
		return elt;
	}
}

customElements.define("svg-map-app", Map_App);

export default Map_App;