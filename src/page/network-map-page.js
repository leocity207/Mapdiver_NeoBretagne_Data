import Network_Map from "../map/network_map.js";
import Map_Page from "./svg-map-page.js";

/**
 * Network_Map_App define a node that contain a Network_Map object
 * 
 * Map_App define a custom element named "svg-map-app"
 */
class Network_Map_App extends Map_Page {

	////////
	
	constructor() {
		super();
	}

	/**
	 * Asynchronous function that initialize the map. the function resolve when the SVG is loaded and displayed inside the current node
	 */
	Initialize_Map = async () => {
		this.map = new Network_Map("Desktop","image/map.svg","bretagne-map")
	}

	/**
	 * Create a Map_App object and initialize it.
	 * 
	 * @returns {Map_App} an Page Object
	 */
	static Create() {
		let elt = document.createElement("network-map-page");
		elt.Init();
		return elt;
	}

	static Create(){
		let elt = Network_Map_App.Create();
		return elt;
	}

}

customElements.define("network-map-page", Network_Map_App);

export default Network_Map_App;