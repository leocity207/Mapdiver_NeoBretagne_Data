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
		this.network_data = await Utils.Fetch_Resource("dyn/network_data")
		this.map.Setup_Mouse_Handlers(this.network_data.Lines, this.network_data.Stations);
		this.addEventListener("popstate", (event) => {
			// If a state has been provided, we have a "simulated" page
			// and we update the current page.
			if (event.state) {
			  // Simulate the loading of the previous page
			  console.log(event.state);
			}
		});
		document.addEventListener("station-click", (event) => {
			// If a state has been provided, we have a "simulated" page
			// and we update the current page.
			if (event.state) {
			  // Simulate the loading of the previous page
			  console.log(event.state);
			}
		},true);
		document.addEventListener("line-click", (event) => {
			// If a state has been provided, we have a "simulated" page
			// and we update the current page.
			if (event.state) {
			  // Simulate the loading of the previous page
			  console.log(event.state);
			}
		},true);
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

	Update(URL) {
		const {
			map_loaded,
			json_loaded,
			pathname,
			panel_detail_is_open,
			panel_start_overlay_is_open,
			panel_detail_space,
			panel_header_height,
			client_type,
			window_width,
			window_height
		} = this.props
		
		const router_infos = build_router_infos(pathname)
		const prev_router_infos = build_router_infos(prev_props.pathname)

		map.update_client_type(client_type)
		map.update_router_infos(router_infos)
		map.update_panel_spaces(panel_detail_space, panel_header_height)
		map.update_start_panel_state(panel_start_overlay_is_open)
		
		/* 
		   	we can not use prev_props.json_loaded, we need a local state
		   	else we have a race condition which can lead to unset json
		   	and unset mouse handlers
		*/
		if (json_loaded && !this.state.setup_mouse_handlers_done && map_loaded) {
			//actually we should only add over and out mouse handlers if not mobile
			map.setup_mouse_handlers(this.context.general.all_lines, this.context.general.all_stations)
			this.setState({setup_mouse_handlers_done: true})
		}
		
		// all loaded
		if(json_loaded && map_loaded) {
			if(window_width !== prev_props.window_width || window_height !== prev_props.window_height) {
				if(client_type === 'desktop') { // only for desktop. Else we always rezoom when the user opens the screen keyboard
					map.zoom_check_map_resize(this.map_container.current.offsetWidth, this.map_container.current.offsetHeight)
				}
			}
			
			if(router_infos.type === 'home') {
				if(!prev_props.map_loaded) {
					map.initial_zoom_move()
				}
				if(prev_router_infos.type === 'station') {
					map.reset_all_highlight_station()
					map.reset_line_highlight()
				} else if(prev_router_infos.type === 'line') {
					map.reset_line_highlight()
				}
			}
			if(router_infos.type === 'line') {
				if(prev_router_infos.type === 'station') {
					map.reset_all_highlight_station()
				}
				map.highlight_line(router_infos.line_slug);
				if(panel_detail_is_open) { // animation are started when the detail panel is open
					map.zoom_highlighted_line(router_infos.line_slug);
				}
			}
			if(router_infos.type === 'station') {
                const from_station_origins_json = this.context.origins[router_infos.from_slug]
				let from_to_highlighted_tracks_stations = [] // f24+: we use this get the proper zoom_box
                if(from_station_origins_json !== undefined) {
                    map.update_from_station_origins_json(from_station_origins_json)
                } else {
                    map.update_from_station_origins_json({})
                }
                // reset all, does not "blink"
                map.reset_all_highlight_station()
                // do station highlight
                map.highlight_station(router_infos.from_slug, 'from')
                if(router_infos.to_slug !== undefined) {
                    const to_station_origins_json = this.context.origins[router_infos.to_slug]
                    if(to_station_origins_json !== undefined) {
                        map.update_to_station_origins_json(to_station_origins_json)
                    } else {
                        map.update_to_station_origins_json({})
                    }
                    map.highlight_station(router_infos.to_slug, 'to')
                    // highlight all lines connected, both stations
                    map.highlight_all_from_to_station_lines(router_infos.from_slug, router_infos.to_slug)
                } else {
                    // highlight all lines connected, only to "from" station
                    map.highlight_all_from_station_lines()
                }
                if(panel_detail_is_open) { // animation are started when the detail panel is open
                    if(router_infos.to_slug !== undefined) {
						// @Update f24 (Nov 2023): we use all stations around highlighted tracks to find the max stretch values for zoom_box
						if(from_station_origins_json.connected_stations.hasOwnProperty(router_infos.to_slug)){
					 		map.zoom_highlighted_tracks(from_station_origins_json.connected_stations[router_infos.to_slug].track_highlights_affected_stations);
						}else{
							map.zoom_highlighted_stations(router_infos.from_slug, router_infos.to_slug)
						}
                    } else { // single station, check if visible, if not, center and zoom it
                        map.zoom_not_visible_station(router_infos.from_slug)
                    }
                }
			}
		}
	}

}

customElements.define("network-map-page", Network_Map_Page);

export default Network_Map_Page;