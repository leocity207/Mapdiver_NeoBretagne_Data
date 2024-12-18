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
	}

	/** 
	* disable all other lines, mark the line with the line color handle labels too
	* @param line_code The code of the line to show
	*/
	Highlight_Line = (line_code) => {
		if(this.config.DEBUG) console.log('Highlight_Line called');
		let that = this
		// handle track
		let tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID, false);
		for (const obj of tracks) {
			if (obj.id.indexOf(this.network_config.TRACK_PREFIX_ID + `${line_code}`) === -1) {
				if(this.config.HARD_ANIMATION_TRANSITION)
					obj.set('stroke', DISABLE_ELEMENT_COLOR);
				else
					obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
						"duration": this.config.COLOR_ANIMATION_TIME,
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
			}
		}
		const specific_tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID + `${line_code}`, false);
		const line_data = this.#Find_Line_Data_By_Id(line_code)
		for (const obj of specific_tracks) {
			if(this.config.HARD_ANIMATION_TRANSITION)
				obj.set('stroke', line_data.color)
			else
				obj.animate("stroke", line_data.color, {
					"duration": this.config.COLOR_ANIMATION_TIME,
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
		}
		// handle labels
		let line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID, false, 'path');
		for (const obj of line_labels) {
			if (obj.id.indexOf(this.network_config.LINE_LABEL_PREFIX_ID + `${line_code}`) === -1) {
				const cid = this.#Find_Track_Code_In_Id(obj.id);
				const cld = this.#Find_Line_Data_By_Id(cid);
				let obj_fill = Utils.Rgba_To_Hex(obj.get('fill'));
				if (cld.color === obj_fill) {
					if(this.config.HARD_ANIMATION_TRANSITION)
						obj.set('fill', DISABLE_ELEMENT_COLOR);
					else
						obj.animate("fill", DISABLE_ELEMENT_COLOR, {
							"duration": this.config.COLOR_ANIMATION_TIME,
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});
				}
			}
		}
		const specific_line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID + `${line_code}`, false);
		for (const obj of specific_line_labels) {
			let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) 
			if (line_data.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
				if(this.config.HARD_ANIMATION_TRANSITION)
					obj.set('fill', line_data.color)
				else
					obj.animate("fill", line_data.color, {
						"duration": this.config.COLOR_ANIMATION_TIME,
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
			}
		}
		this.fabric_canvas.requestRenderAll();
	}

	/**
	 * revert all line marking to the original color
	 */
	Reset_Line_Highlight = () => {
		// tracks
		let that = this
		let tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID, false);
		for (let obj of tracks) {
			const line_code = this.#Find_Track_Code_In_Id(obj.id)
			const line_data = this.#Find_Line_Data_By_Id(line_code)
			if(this.config.HARD_ANIMATION_TRANSITION)
				obj.set('stroke', line_data.color)
			else
				obj.animate("stroke", line_data.color, {
					"duration": this.config.COLOR_ANIMATION_TIME,
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
		}
		// labels
		let line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID, false, 'path');
		for (const obj of line_labels) {
			const line_code = this.#Find_Track_Code_In_Id(obj.id)
			const line_data = this.#Find_Line_Data_By_Id(line_code)
			let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
			if (DISABLE_ELEMENT_COLOR === obj_fill) {
				if(this.config.HARD_ANIMATION_TRANSITION)
					obj.set('fill', line_data.color); 
				else
					obj.animate("fill", line_data.color, {
						"duration": this.config.COLOR_ANIMATION_TIME,
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
			}
		}
		this.fabric_canvas.requestRenderAll()
	}

	/**
	 * highlight all line part(s) that are in connection with the to station.
	 * We can actually highlight the whole line and do not have to search line parts, because there is no destination given.
	 */
	Highlight_All_From_Station_Lines = () => {
		// get all line names, first in an array, after make a unique set
		let that = this
		let lines_arr = []
		for (const entry of Object.entries(this.from_station_origins_json.connected_stations)) {
			for (const h_entry of Object.entries(entry[1].track_highlights)) {
				lines_arr.push(h_entry[0])
			}
		}
		const lines = [...new Set(lines_arr)]
		// handle tracks
		let tracks = this._Find_Map_Objs_By_Id(this.network.TRACK_PREFIX_ID);
		for (let obj of tracks) { // disable all that are not in the lines array, for color setting without animation this would not be needed
			let disable = true
			for (const line_code of lines) { // extra for loop for animate cycle
				if (obj.id.indexOf(this.network.TRACK_PREFIX_ID + `${line_code}_`) !== -1) {
					disable = false
					break
				}
			}
			if (disable) {
				if(this.config.HARD_ANIMATION_TRANSITION)
					obj.set('stroke', DISABLE_ELEMENT_COLOR)
				else
					obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
						"duration": this.config.COLOR_ANIMATION_TIME,
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
			}
		}
		for (const line_code of lines) {
			const specific_tracks = this._Find_Map_Objs_By_Id(this.network.TRACK_PREFIX_ID + `${line_code}`);
			const line_data = this.#Find_Line_Data_By_Id(line_code)
			for (let obj of specific_tracks) {
				if(this.config.HARD_ANIMATION_TRANSITION)
					obj.set('stroke', line_data.color)
				else
					obj.animate("stroke", line_data.color, {
						"duration": this.config.COLOR_ANIMATION_TIME,
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
			}
		}
		// handle labels
		let line_labels = this._Find_Map_Objs_By_Id(this.network.LINE_LABEL_PREFIX_ID, 'path');
		for (const obj of line_labels) { // disable all that are not in the lines array, for color setting without animation this would not be needed
			let disable = true
			for (const line_code of lines) { // extra for loop for animate cycle
				if (obj.id.indexOf(this.network.LINE_LABEL_PREFIX_ID + `${line_code}_`) !== -1) {
					disable = false
					break
				}
			}
			if (disable) {
				const cid = this.#Find_Track_Code_In_Id(obj.id)
				const cld = this.#Find_Line_Data_By_Id(cid)
				let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				if (cld.color === obj_fill) {
					if(this.config.HARD_ANIMATION_TRANSITION)
						obj.set('fill', DISABLE_ELEMENT_COLOR);
					else
						obj.animate("fill", DISABLE_ELEMENT_COLOR, {
							"duration": this.config.COLOR_ANIMATION_TIME,
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});
				}
			}
		}
		for (const line_code of lines) {
			const spezific_line_labels = this._Find_Map_Objs_By_Id(this.network.LINE_LABEL_PREFIX_ID + `${line_code}_`)
			for (const obj of spezific_line_labels) {
				const cid = this.#Find_Track_Code_In_Id(obj.id)
				const cld = this.#Find_Line_Data_By_Id(cid)
				let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				if (cld.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
					if(this.config.HARD_ANIMATION_TRANSITION)
						obj.set('fill', cld.color)
					else
						obj.animate("fill", cld.color, {
							"duration": this.config.COLOR_ANIMATION_TIME,
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});
				}
			}
		}
	}

	/**
	 * highlight all line part(s) that are in connection with the to and from station disable the rest. If there is no connection, disable all lines and labels
	 * this function might need few tweeking
	 * @param from_station_code starting station point
	 * @param to_station_code   end station code
	 */
	Highlight_All_From_To_Station_Lines = (from_station_code, to_station_code) => {
		let that = this
		let tmp_lines_obj = {}
		let anim_line_codes_arr = [] // used for animation check only

		
		const to_connected_stations = this.from_station_origins_json.connected_stations[to_station_code]
		if(this.config.DEBUG) console.log('to_connected_stations', to_connected_stations);
		if(from_connected_stations !== undefined && to_connected_stations !== undefined) {
			if (to_connected_stations !== undefined) {
				for (const [line_code, entries] of Object.entries(to_connected_stations.track_highlights)) {
					if (!(line_code in tmp_lines_obj))
						tmp_lines_obj[line_code] = []
					tmp_lines_obj[line_code].push(...entries)
					anim_line_codes_arr.push(...entries)
				}
				// make unique sets
				let lines_obj = {}
				for (const [line_code, entries] of Object.entries(tmp_lines_obj)) {
					if (!(line_code in lines_obj))
						lines_obj[line_code] = [...new Set(entries)]
				}
				const anim_line_codes = [...new Set(anim_line_codes_arr)] // only used for animation
				// tracks
				let tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID);
				for (let obj of tracks) { // disable all
					let disable = true
					for (const line_code of anim_line_codes) { // extra for loop for animate cycle
						if (obj.id === this.network_config.TRACK_PREFIX_ID + `${line_code}`) {
							disable = false
							break
						}
					}
					if (disable) {
						if(this.config.HARD_ANIMATION_TRANSITION)
							obj.set('stroke', DISABLE_ELEMENT_COLOR);
						else
							obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
								"duration": this.config.COLOR_ANIMATION_TIME,
								onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
							});
					}
				}
				for (const [line_code, lines] of Object.entries(lines_obj)) {
					const line_data = this.#Find_Line_Data_By_Id(line_code)
					for (const full_line_code of lines) {
						const specific_track = tracks.find(x => x.id === this.network_config.TRACK_PREFIX_ID + `${full_line_code}`);
						if (specific_track !== undefined) {
							if(this.config.HARD_ANIMATION_TRANSITION)
								specific_track.set('stroke', line_data.color)
							else
								specific_track.animate("stroke", line_data.color, {
									"duration": this.config.COLOR_ANIMATION_TIME,
									onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
								});
						}
					}
				}
				// labels
				let line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID, 'path');
				for (const obj of line_labels) {
					let disable = true
					for (const line_code of anim_line_codes) { // extra for loop for animate cycle
						if (obj.id.indexOf(`line_label_${line_code}`) !== -1) {
							disable = false
							break
						}
					}
					if (disable) {
						const cid = this.#Find_Track_Code_In_Id(obj.id)
						const cld = this.#Find_Line_Data_By_Id(cid)
						let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
						if (cld.color === obj_fill) {
							if(this.config.HARD_ANIMATION_TRANSITION)
								obj.set('fill', DISABLE_ELEMENT_COLOR);
							else
								obj.animate("fill", DISABLE_ELEMENT_COLOR, {
									"duration": this.config.COLOR_ANIMATION_TIME,
									onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
								});
						}
					}
				}
				for (const entry of Object.entries(lines_obj)) {
					for (const full_line_code of entry[1]) {
						const spezific_line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID + `${full_line_code}`)
						for (const obj of spezific_line_labels) {
							const cid = this.#Find_Track_Code_In_Id(obj.id)
							const cld = this.#Find_Line_Data_By_Id(cid)
							let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
							if (cld.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
								if(this.config.HARD_ANIMATION_TRANSITION)
									obj.set('fill', cld.color)
								else
									obj.animate("fill", cld.color, {
										"duration": this.config.COLOR_ANIMATION_TIME,
										onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
									});
							}
						}
					}
				}
			} else {
				// tracks
				let tracks = this._Find_Map_Objs_By_Id(this.network_config.TRACK_PREFIX_ID);
				for (const obj of tracks) { // disable all
					if(this.config.HARD_ANIMATION_TRANSITION)
						obj.set('stroke', DISABLE_ELEMENT_COLOR);
					else
						obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
							"duration": this.config.COLOR_ANIMATION_TIME,
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});
				}
				// labels
				let line_labels = this._Find_Map_Objs_By_Id(this.network_config.LINE_LABEL_PREFIX_ID, 'path');
				for (const obj of line_labels) {
					const cid = this.#Find_Track_Code_In_Id(obj.id)
					const cld = this.#Find_Line_Data_By_Id(cid)
					let obj_fill = Utils.Rgba_To_Hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
					if (cld.color === obj_fill) {
						if(this.config.HARD_ANIMATION_TRANSITION)
							obj.set('fill', DISABLE_ELEMENT_COLOR);
						else
							obj.animate("fill", DISABLE_ELEMENT_COLOR, {
								"duration": this.config.COLOR_ANIMATION_TIME,
								onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
							});
					}
				}
				if(this.config.DEBUG) console.log('from_connected_stations or to_connected_stations is undefined');
				if(this.config.DEBUG) console.log('from_connected_stations: ',from_connected_stations);
				if(this.config.DEBUG) console.log('to_connected_stations: ',to_connected_stations);
			}
		}
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
		if (event.currentSubTargets.length) {
			if (this._Check_Pointer_In_Range(event.pointer)) { // only if on same position
				const target_id = event.currentSubTargets[0].id
				const track_code = this.#Find_Track_Code_In_Id(target_id);
				if (track_code !== '') 
					resolve_url('line', { line_slug: track_code })
			}
		}
	}

	/**
	* Handle when the user click on a station
	* @param event pointing to the station
	*/
	#Handle_Mouse_Click_Station = (event) => {
		if (event.currentSubTargets.length) {
			if (this._Check_Pointer_In_Range(event.pointer)) { // only if on same position
				const target_id = event.currentSubTargets[0].id
				if (target_id !== null) {
					const station_code = this.Find_Station_Code_In_Id(target_id);
					if (station_code !== '')
						resolve_url('station_from', { from_slug: station_code });
				}
			}
		}
	}

	/**
	* find line codes in label or line id
	*/
	#Find_Track_Code_In_Id = (id) => {
		const regex = /^line_label_([a-zA-Z0-9]+)_|^track_([a-zA-Z0-9]+)_/;
		let match = regex.exec(id)
		if (match !== null) {
			let filtered_match = match.filter(e => e !== undefined)
			return filtered_match.length ? filtered_match.slice(-1).pop() : '';
		} else
			return '';
	}

	/**
	* find station code in station label or station icon
	*/
	Find_Station_Code_In_Id(id) {
		if (id.indexOf('station_label_') > -1) {
			let id_arr = id.split('label_');
			if (id_arr[1].indexOf('_') > -1)
				return id_arr[1].split('_')[0];
			else
				return id_arr[1];
		} else if (id.indexOf('station_icon_') > -1) {
			let id_arr = id.split('icon_');
			if (id_arr[1].indexOf('_') > -1)
				return id_arr[1].split('_')[0];
			else 
				return id_arr[1];
		}
	}

	// find the line json object in all lines
	#Find_Line_Data_By_Id = (code) => {
		return this.lines.find(x => x.code === code);
	}

	// find the station json object in all stations
	#Find_Station_Data_By_Id = (code) => {
		return this.all_stations_json.find(x => x.code === code);
	}
}

export default Network_Map;