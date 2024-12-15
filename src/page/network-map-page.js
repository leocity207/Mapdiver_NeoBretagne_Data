import Network_Map from "../map/network_map.js";
import Map_Page from "./svg-map-page.js";
import Utils from "../utils/utils.js";
import { Config, Network_Config} from "../config/config.js"
/**
 * Network_Map_Station define a node that contain a Network_Map object
 * 
 * Map_App define a custom element named "svg-map-app"
 */
class Network_Map_Page extends Map_Page {

	////////
	
	constructor() {
		super();
	}

	/**
	 * Asynchronous function that initialize the map. the function resolve when the SVG is loaded and displayed inside the current node
	 */
	Initialize_Map = async () => {
		this.map = new Network_Map("Desktop", "image/map.svg", Config, Network_Config);
		await this.map.Setup("Fr", this.map_canvas);
		let network_data = await Utils.Fetch_Resource("dyn/network_data")
		this.map.Setup_Mouse_Handlers(network_data.Lines, network_data.Stations);
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

}

customElements.define("network-map-page", Network_Map_Page);

export default Network_Map_Page;