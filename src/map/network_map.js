import SVG_Map from './svg_map.js';
import Utils from '../utils/utils.js';


/**
 * Network_Map inherit from SVG_Map and declare map with lines, tracks and station, to zoom to and get information off
 */
class Network_Map extends SVG_Map {

	/**
	* Setup all the callback on the map
	* @param Lines, list of Line Object
	* @param Station, list of Station Objects
	*/
	constructor(client_type, filename, map_config, network_config) {
		super(client_type, filename, map_config);

		this.network_config = network_config;

		this.#Handle_Mouse_Click_Track = this.#Handle_Mouse_Click_Track.bind(this);
		this.#Handle_Mouse_Click_Station = this.#Handle_Mouse_Click_Station.bind(this);

		this.lines = [];
		this.stations = [];
		this.selected_color = "default"
	}

	/*
	* Public function
	*/


	/**
	* Setup all the callback on the map
	* @param Lines, list of Line Object
	* @param Station, list of Station Objects
	*/
	Setup_Mouse_Handlers(lines, stations) {
		super.Setup_Mouse_Handlers();
		this.lines = lines
		this.stations = stations
		// all Line
		let tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID);
		for (let obj of tracks) {
			if(this.config.DEBUG) console.warn('set handler for tracks: '+obj.id) ;
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.#Handle_Mouse_Click_Track);
			obj.on('mouseover', this._Handle_Mouse_Over_Obj);
			obj.on('mouseout', this._Handle_Mouse_Out_Obj);
		}
		// all Track labels
		let line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID);
		for (let obj of line_labels) {
			if(this.config.DEBUG) console.warn('set handler for line label: '+obj.id) ;
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.#Handle_Mouse_Click_Track);
			obj.on('mouseover', this._Handle_Mouse_Over_Obj);
			obj.on('mouseout', this._Handle_Mouse_Out_Obj);
		}
		// all station
		let station_icons = this._Find_Map_Objs_By_Id(this.network_config.STATION_PREFIX_ID)
		for (let obj of station_icons) {
			if(this.config.DEBUG) console.warn('set handler for station: '+obj.id) ;
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.#Handle_Mouse_Click_Station);
			obj.on('mouseover', this._Handle_Mouse_Over_Obj);
			obj.on('mouseout', this._Handle_Mouse_Out_Obj);
		}
		// all station labels
		let station_labels = this._Find_Map_Objs_By_Id(this.network_config.STATION_LABEL_PREFIX_ID)
		for (let obj of station_labels) {
			if(this.config.DEBUG) console.warn('set handler for station: '+obj.id) ;
			obj.on('mouseup', this.#Handle_Mouse_Click_Station);
			obj.on('mouseover', this._Handle_Mouse_Over_Obj);
			obj.on('mouseout', this._Handle_Mouse_Out_Obj);
		}

		let to_be_deactivated = this.Find_Map_Objs_By_Classname("event-disable");
		for (let obj of to_be_deactivated) {
			obj.evented = false; // Disable events for the object
		}
		
	}

	/** 
	* Change the colore of the 'obj' to 'color' for the 'target' property
	* @param obj the object you want to change the color 
	* @param color the color in hexadecimal like #FFFFFF
	* @param target the target property of the object you want to change its color (can be 'strock' or 'fill')
	*/
	#Change_Obj_Color = (obj, color, target = 'stroke') => {
		let that = this;
		if(this.config.HARD_ANIMATION_TRANSITION)
			obj.set(target, color)
		else
			obj.animate(target, color, {
				"duration": this.config.COLOR_ANIMATION_TIME,
				onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
			});
	}

	Change_Color = (color) => {
		this.selected_color = color;
		this.Reset_Line_Highlight();
	}

	/** 
	* disable all other lines, mark the line with the line color handle labels too
	* @param line_codes List of line Codes for exmple [LER_BRE01,LGV_BRE03]
	*/
	Highlight_Lines = (line_codes) => {
	    if (this.config.DEBUG) console.log('Highlight_Lines called');
	
	    // Prepare sets for objects that need to be highlighted
	    const Tracks_to_higlight = new Set(line_codes.map(code => `${this.network_config.TRACK_PREFIX_ID}${code}`));
	    const labels_to_higlight = new Set(line_codes.map(code => `${this.network_config.LINE_LABEL_PREFIX_ID}${code}`));
	
	    // Precompute colors for each line code
	    const line_colors = {};
	    line_codes.forEach(code => {
	        const line_data = this.#Find_Line_Data_By_Id(code);
	        if (line_data) {
	            line_colors[`${this.network_config.TRACK_PREFIX_ID}${code}`] = line_data.color[this.selected_color];
	            line_colors[`${this.network_config.LINE_LABEL_PREFIX_ID}${code}`] = line_data.color[this.selected_color];
	        }
			else
				throw Error(`Code was not found inside the list: ${code}`);
	    });
	
	    // Get tracks and labels separately
	    const tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID, false);
	    const labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID, false);
	
	    // Process tracks
	    tracks.forEach(track => {
			const track_id_first_part = Utils.Get_First_Part(track.id)
	        if (Tracks_to_higlight.has(track_id_first_part)) 
	            this.#Change_Obj_Color(track, line_colors[track_id_first_part]);
	        else 
	            this.#Change_Obj_Color(track, this.network_config.DISABLE_ELEMENT_COLOR);
	    });
	
	    // Process labels
	    labels.forEach(label => {
			const label_id_first_part = Utils.Get_First_Part(label.id);
	        if (labels_to_higlight.has(label_id_first_part))
	            this.#Change_Obj_Color(label, line_colors[label_id_first_part], 'fill');
	        else
	            this.#Change_Obj_Color(label, this.network_config.DISABLE_ELEMENT_COLOR, 'fill');
	    });
		
	    this.fabric_canvas.requestRenderAll();
	};

	/**
	 * revert all line marking to the original color
	 */
	Reset_Line_Highlight = () => {
		this.Highlight_Lines([]);
	}



	/**
	 * highlight all line part(s) that are in connection with the to station.
	 * We can actually highlight the whole line and do not have to search line parts, because there is no destination given.
	 */
	Highlight_All_Lines_At_Station = (station_code) => {
		// get all line names, first in an array, after make a unique set
		let lines = this.stations[station_code].lines;
		this.Highlight_Lines(lines)
	}

	/**
	 * Zoom toward the line
	 * @param line_code where we want to zoom to
	 */
	Zoom_Highlighted_Line = (line_code) => {
		const line_data = this.#Find_Line_Data_By_Id(line_code)
		if (line_data !== undefined) {
			const station_codes = line_data.map_stations.split("-");
			this.Zoom_Highlighted_Tracks(station_codes)
		}
	}

	/**
	* @brief zoom to the higlighted station, and find the smalles bounding box that include all the line around the station
	* @param from_station_code starting station
	* @param to_station_code end station
	*/
	Zoom_Highlighted_Stations = (from_station_code, to_station_code) => {
		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		const highlight_pos_from_obj = all_highlights.find(x => x.id === `highlight_pos_${from_station_code}`)
		const highlight_pos_to_obj = all_highlights.find(x => x.id === `highlight_pos_${to_station_code}`)
		if (highlight_pos_from_obj !== undefined && highlight_pos_to_obj !== undefined) {
			let zoom_box = this.Zoom_Box_For_Objs(highlight_pos_from_obj, highlight_pos_to_obj);
			this.Animated_Pan_Zoom(zoom_box)
		} else
			if(this.config.DEBUG) console.warn('Zoom_Highlighted_Stations, cannot find from or to position object');
	}

	/**
	* optimize zoom_box for highlighted tracks find MAX stretch values for all Stations around highlighted tracks replacement for Zoom_Highlighted_Line & Zoom_Highlighted_Stations -> expects a set of station_codes
	* @param station_codes station that should be the center of the zoom
	*/
	Zoom_Highlighted_Tracks = (station_codes) => {
		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		let min_x = 0;
		let max_x = 0;
		let min_y = 0;
		let max_y = 0;

		for (const station_code of station_codes) {
			let highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`)
			if (highlight_pos_obj !== undefined) {
				let m_obj = highlight_pos_obj.calcTransformMatrix(false);
				let obj_x = m_obj[4]
				let obj_y = m_obj[5]

				if (min_x === 0) {
					min_x = obj_x;
					max_x = obj_x;
				} else if (obj_x < min_x)
					min_x = obj_x;
				else if (obj_x > max_x)
					max_x = obj_x;
				if (min_y === 0) {
					min_y = obj_y;
					max_y = obj_y;
				} else if (obj_y < min_y)
					min_y = obj_y;
				else if (obj_y > max_y)
					max_y = obj_y;
			} else
				if(this.config.DEBUG) console.log('highlight_pos_obj not found for:', station_code)
		}
		let bounds = {
			left: min_x,
			top: min_y,
			width: max_x - min_x,
			height: max_y - min_y,
			center_left: 0,
			center_top: 0,
			zoom_level: 2, // fix for now
		}
		const zoom_box = this._Optimize_Zoom_Box_For_Viewport(bounds, false)
		this.Animated_Pan_Zoom(zoom_box)
	}

	/**
	* if a station is not really visible, zoom it
	*/
	Zoom_Not_Visible_Station = (from_station_code) => {

		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		const highlight_pos_from_obj = all_highlights.find(x => x.id === `highlight_pos_${from_station_code}`)
		if (highlight_pos_from_obj !== undefined) {
			let zoom_box = this.Zoom_Box_For_Objs(highlight_pos_from_obj);
			this.Animated_Pan_Zoom(zoom_box)
		} 
		else
			if(this.config.DEBUG) console.warn('Zoom_Not_Visible_Station, cannot find from position object')
	}

	/**
	* mark the station with the right circle
	* @param station_code code of the station 
	* @param station_type if it's a from or to station
	*/
	Highlight_Station = (station_code, station_type) => {
		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		const highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`);
		let highlight_obj = undefined;

		if (station_type === 'from')
			highlight_obj = all_highlights.find(x => x.id === 'highlight_origin');
		else
			highlight_obj = all_highlights.find(x => x.id === 'highlight_destination');

		if (highlight_pos_obj !== undefined && highlight_obj !== undefined) {
			highlight_obj.set('left', highlight_pos_obj.left);
			highlight_obj.set('top', highlight_pos_obj.top);
			highlight_obj.set('visible', true);
		}
		this.fabric_canvas.requestRenderAll();
	}

	/**
	* remove all highlights for all stations
	*/
	Reset_All_Highlight_Station = () => {
		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		const highlight_origin_obj = all_highlights.find(x => x.id === 'highlight_origin');
		highlight_origin_obj.set('visible', false)
		const highlight_destination_obj = all_highlights.find(x => x.id === 'highlight_destination');
		highlight_destination_obj.set('visible', false)
		this.fabric_canvas.requestRenderAll()
	}

	/**
	* check if the station highlight is visible use a config specific margin for the borders
	*/
	Check_Station_Visible = (station_code) => {
		const all_highlights = this._Find_Map_Objs_By_Id('highlight_'); // get all, do a find on them here
		const highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`)
		if (highlight_pos_obj !== undefined) {
			let vpw = this.fabric_canvas.getWidth()
			let vph = this.fabric_canvas.getHeight()
			let m = highlight_pos_obj.calcTransformMatrix();
			let obj_p = fabric.util.transformPoint({ x: m[4], y: m[5] }, this.fabric_canvas.viewportTransform, false);
			let is_visible = true
			let additional_visible_space_margin = this.config.ADDITIONAL_VISIBLE_SPACE_MARGIN_DESKTOP
			if (this.client_type === 'mobile')
				additional_visible_space_margin = this.config.ADDITIONAL_VISIBLE_SPACE_MARGIN_MOBILE
			if (this.client_type !== 'mobile') {
				if (obj_p.y < additional_visible_space_margin ||
					obj_p.x < (additional_visible_space_margin + this.fabric_canvas._offset.left) ||
					obj_p.y > (vph - (additional_visible_space_margin + this.panel_header_height)) ||
					obj_p.x > (vpw - this.panel_detail_space - additional_visible_space_margin)) {
					is_visible = false
				}
			} else {
				if (obj_p.y < (this.panel_detail_space + additional_visible_space_margin) ||
					obj_p.x < (additional_visible_space_margin + this.fabric_canvas._offset.left) ||
					obj_p.y > (vph - (additional_visible_space_margin + this.panel_header_height)) ||
					obj_p.x > (vpw - additional_visible_space_margin)) {
					is_visible = false
				}
			}
			return is_visible
		}
		return true // return always true if undefined, else we start to trigger an animation on a non existent object
	}

	/**
	* Private function
	*/

	/**
	* Handle the when the user click on the map with a track to get more information
	* @param event comming from hammer
	*/
	#Handle_Mouse_Click_Track = (event) => {
		if (!event.currentSubTargets.length) 
			throw new Error("Event target container has nothing inside.");	
		if (!this._Check_Pointer_In_Range(event.pointer)) 
			return this.config.DEBUG ? console.log("mouse click pointer is not in range") : undefined;
		const target_id = event.currentSubTargets[0].id
		if (!target_id.length) 
			throw new Error("The target id is empty.");
		const track_code = this.#Find_Track_Code_In_Id(target_id);
		if (!track_code) 
			throw new Error("Track code not found.");
		history.pushState({ line: track_code }, "", track_code);
		document.dispatchEvent(new CustomEvent('line-click', { detail: track_code, type: "line"}));
	}

	/**
	* Handle when the user click on a station
	* @param event pointing to the station
	*/
	#Handle_Mouse_Click_Station = (event) => {
		if (!event.currentSubTargets.length) 
			throw new Error("Event target container has nothing inside.");	
		if (!this._Check_Pointer_In_Range(event.pointer))  // only if on same position
			return this.config.DEBUG ? console.log("mouse click pointer is not in range") : undefined;
		const target_id = event.currentSubTargets[0].id
		if (!target_id.length) 
			throw new Error("The target id is empty.");
		const station_code = this.#Find_Station_Code_In_Id(target_id);
		if (!station_code) 
			throw new Error("Station code not found.");
		history.pushState({ station: station_code }, "", station_code);
		document.dispatchEvent(new CustomEvent('station-click', { detail: station_code, type: "station"}));
	}

	/**
	* find line codes in label or line id
	*/
	#Find_Track_Code_In_Id = (id) => {
		if (id.indexOf(this.network_config.TRACK_PREFIX_ID) <= -1 && id.indexOf(this.network_config.LINE_LABEL_PREFIX_ID) <= -1)
			throw Error("Line not found");
		let ID_parts  = id.split('-')
		if(ID_parts.length < 2)
			throw Error("Line id length too short, Id was : " + id);
		return  ID_parts[1];
	}

	/**
	* find station code in station label or station icon
	*/
	#Find_Station_Code_In_Id(id) {
		if (id.indexOf(this.network_config.STATION_LABEL_PREFIX_ID) <= -1 && id.indexOf(this.network_config.STATION_PREFIX_ID) <= -1)
			throw Error("Station not found");
		let ID_parts  = id.split('-')
		if(ID_parts.length < 2)
			throw Error("Station id length too short, Id was : " + id);
		return  ID_parts[1];	
	}

	// find the line json object in all lines
	#Find_Line_Data_By_Id = (code) => {
		return this.lines[code];
	}

	// find the station json object in all stations
	#Find_Station_Data_By_Id = (code) => {
		return this.all_stations_json.find(x => x.code === code);
	}
}

export default Network_Map;
