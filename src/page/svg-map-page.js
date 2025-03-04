import Page from "./page.js";
import SVG_Map from "../map/svg_map.js";
import {Config} from "../config/config.js"
import Sticky_Header from "../componants/sticky_header.js"

/**
 * Map_App are object that define a node containing a SVG_Map for manipulation and display
 * 
 * Map_App define a custom element named "svg-map-app"
 */
class Map_Page extends Page {

	////////
	m_map;
	
	constructor() {
		super();
	}

	/**
	 * Initialize an Map_App object after it has been instantiated
	 * @protected
	 *
	 * This function create a container and a canvas inside it. The container is used to scale the canvas
	 * and the canvas is used as the context for the fabric.js canvas
	 */
	Init() {
		super.Init();

		const sticky_header = Sticky_Header.Create();
		this.shadowRoot.appendChild(sticky_header);

		// create a container to hold the canvas
		const map_container = document.createElement('div');
		map_container.setAttribute('id', 'map-container');

		// create a canvas inside the container
		const map_canvas = document.createElement('canvas');
		map_container.appendChild(map_canvas);
		map_canvas.setAttribute('id', 'map-canvas');

		// add the container to the shadow root
		this.shadowRoot.appendChild(map_container);

		// keep a reference to the container and the canvas
		this.map_container = map_container;
		this.map_canvas = map_canvas;
		this.sticky_header = sticky_header;
	}

	/**
	 * Asynchronous function that initialize the map. the function resolve when the SVG is loaded and displayed inside the current node
	 */
	Initialize_Map = async () => {
		this.map = new SVG_Map("Desktop", "image/map.svg", Config);
		await this.map.Setup("Fr", this.map_canvas);
		this.map.Setup_Mouse_Handlers();
	}

	Initial_Zoom_Move = async () => {
		await this.map.Initial_Zoom_Move();
	}

	/**
	 * Create a Map_Page object and initialize it.
	 *
	 * @returns {Map_Page} a Page Object
	 */
	static Create() {
		const element = document.createElement('svg-map-page');
		element.Init();
		return element;
	}
}

customElements.define("svg-map-page", Map_Page);

export default Map_Page;