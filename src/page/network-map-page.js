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

	constructor() {
		super();
	}

	On_Station_CLicked(event) {
		if(this.prev_event.type === 'line')
			this.map.Reset_All_Highlight_Station();
		this.map.Highlight_All_Lines_At_Station(event.detail);
		if(this.panel_detail_is_open) 
			this.map.Zoom_Highlighted_Stations(event.detail);
	}

	On_Line_CLicked(event) {
		if(this.prev_event.type === 'station')
			this.map.Reset_All_Highlight_Station();
		this.map.Highlight_Lines([event.detail]);
		if(this.panel_detail_is_open) 
			this.map.Zoom_Highlighted_Line(event.detail);
	}

	On_Pop_State(event) {
		if(!this.prev_event.type) 
			this.map.Initial_Zoom_Move();
		if(prev_event.type === 'station') {
			this.map.Reset_All_Highlight_Station();
			this.map.Reset_Line_Highlight();
		} else if(prev_event.type === 'line') 
			this.map.Reset_Line_Highlight();
	}

	On_Selected_By_Label(label) {
		let solutionKey = Object.keys(this.network_data.Stations).find(key => this.network_data.Stations[key].label === label);
		if(solutionKey)
			return this.On_Station_CLicked({type: 'station', detail: solutionKey});
		solutionKey = Object.keys(this.network_data.Lines).find(key => this.network_data.Lines[key].label === label);
		if(solutionKey)
			return this.On_Line_CLicked({type: 'line', detail: solutionKey})
		if(!solutionKey)
			return console.error("No solution found for label " + label);
	}
	/**
	 * Asynchronous function that initialize the map. the function resolve when the SVG is loaded and displayed inside the current node
	 */
	Initialize_Map = async () => {
		// Set variable
		this.prev_event = {type: undefined, detail: undefined};
		this.panel_detail_is_open = false;
		// Bind calback to this
		this.On_Line_CLicked = this.On_Line_CLicked.bind(this);
		this.On_Station_CLicked = this.On_Station_CLicked.bind(this);
		this.On_Pop_State = this.On_Pop_State.bind(this);
		// Link callback
		document.addEventListener("popstate", this.On_Pop_State);
		document.addEventListener("station-click", this.On_Station_CLicked);
		document.addEventListener("line-click", this.On_Line_CLicked);
		// Initialize map
		this.map = new Network_Map("Desktop", "image/map.svg", Config, Network_Config);
		await this.map.Setup("Fr", this.map_canvas);
		this.network_data = await Utils.Fetch_Resource("dyn/network_data")
		this.map.Setup_Mouse_Handlers(this.network_data.Lines, this.network_data.Stations);

		const labels = Object.values(this.network_data.Lines).map(line => line.label).concat(Object.values(this.network_data.Stations).map(station => station.label));
		this.sticky_header.Set_Autocomplete_List(labels).subscribe(label => this.On_Selected_By_Label(label));;
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
