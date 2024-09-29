

class Map {
	constructor(id,client_type,filename) {
        if(!fabric)
            throw "fabric is needed for this class to work";
        if(!Hammer)
            throw "hammer is nedded for this calss to work"

        this.filename = filename;
		// create a canvas element for later use, "detached" from react lifecycle
		this.canvas_element_id = id
		this.canvas_element = document.createElement('canvas');
		
		// adjust some stuff in the library
		fabric.Object.prototype.objectCaching = false; // if true, everything get's blurry
		// we need to add "class" as a attribute to the parser, else it get's lost!
		fabric.SHARED_ATTRIBUTES.push('class')
		// add it to the objects we need, because shared attributes above is merged with them on library initialization :-()
		fabric.Path.ATTRIBUTE_NAMES.push('class')
		fabric.Line.ATTRIBUTE_NAMES.push('class')
		fabric.Text.ATTRIBUTE_NAMES.push('class')
		fabric.Rect.ATTRIBUTE_NAMES.push('class')
		fabric.Circle.ATTRIBUTE_NAMES.push('class')
		fabric.Polygon.ATTRIBUTE_NAMES.push('class')
		
		// keep reference on the canvas and the svg main group
		this.fabric_canvas = null;
		this.svg_main_group = null;
		
		// i18n language
		this.language = null;
		
		// all lines with code and color
		this.all_lines_json = {}
		// all stations
		this.all_stations_json = {}
		// from origins if a from station is selected
		this.from_station_origins_json = {}
		// to origins if a to station is selected
		this.to_station_origins_json = {}		
		
		// we need the router infos to assemble some of the urls
		/* 
			as for now we do not need them anymore, because
			in handle_mouse_click_station we only set the from
			station from now one. But we keep it, if there
			is a later need
		*/
		this.router_infos = undefined
		this.panel_start_overlay_is_open = undefined
		
		// panel widths, to take into calculations
		this.panel_detail_space = 0
		
		// panel header height
		this.panel_header_height = 0
		
		// client type, can be mobile | tablet | desktop
		this.client_type = client_type;
		
		// keep object with animation parameters to stop it
		this.move_zoom_animation_obj = {
			x: 0,
			y: 0,
			zoom: 1
		}
		
		// binding this to event handlers
		this.handle_user_mousewheel_zoom = this.handle_user_mousewheel_zoom.bind(this);
		this.handle_user_map_move_touch = this.handle_user_map_move_touch.bind(this);
		this.handle_user_gesture_zoom = this.handle_user_gesture_zoom.bind(this);
		this.handle_pinch_start = this.handle_pinch_start.bind(this)
		this.handle_pinch_end = this.handle_pinch_end.bind(this)
		this.handle_mouse_over_obj = this.handle_mouse_over_obj.bind(this);
		this.handle_mouse_out_obj = this.handle_mouse_out_obj.bind(this);
		this.handle_mouse_click_track = this.handle_mouse_click_track.bind(this);
		// keep some position data for the check on moving
		this.last_bounding_data = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0
		}
		// are we in a animation run
		// never set this direct, use _handle_animation_state
		this.map_animation_run = false
		
		// save the start scale on gesture "pinch"
		this.pinch_start_scale = 0
		// save the last scale
		this.last_scale = 0
		
		// save the last pointer position on mousedown, to prevent ghost clicks
		this.last_pointer = undefined
		
		this.pinch_zoom_click_deactivated = false
	}
	
	setup = async (language) => {
		/*
			Setup the canvas
			and load the svg
			resource. This is called
			by parent after adding
			the canvas element
		*/
		this.language = language
		
		//store.dispatch(loader_global_show());
		this.fabric_canvas = new fabric.Canvas(this.canvas_element_id, {
			imageSmoothingEnabled: false,
			width: window.innerWidth,
			height: window.innerHeight,
			allowTouchScrolling: true,
			selection: false,
		});
		// load map from public folder
		return new Promise((resolve, reject) => {
			fabric.loadSVGFromURL(this.filename, (objects, options) => {
				let obj = fabric.util.groupSVGElements(objects, options);
				obj.set('originX', 'center');
				obj.set('originY', 'center');
				obj.set('subTargetCheck', true); // if false, no mouse event gets propagated to any child
				obj.set('skipOffscreen', true); // skip rendering outside of canvas
				obj.set('hasControls', false); // remove any handlers for rotation or scale
				this.fabric_canvas.add(obj);
				this.svg_main_group = obj;
				let initial_zoom = this.zoom_value_for_ch(); // calculate the zoom that fits best
				this.fabric_canvas.setZoom(initial_zoom);
				this.fabric_canvas.viewportCenterObject(obj); // center the svg in the viewport, take zoom into account
				this.fabric_canvas.requestRenderAll()
				// fill check bound data with initial values
				this.last_bounding_data = {
					left: obj.left,
					top: obj.top,
					right: obj.left,
					bottom: obj.top
				}
				//store.dispatch(loader_global_hide());
				//store.dispatch(set_map_loaded());
				resolve();
			});
		});
	}
	
	// save start scale and deactivate movement
	handle_pinch_start = (event) => {
		// lock movement to prevent jiggling around
		this.svg_main_group.lockMovementX = true;
		this.svg_main_group.lockMovementY = true;
		this.pinch_start_scale = event.scale
		this.last_scale = event.scale
	}
	
	// activate movement
	handle_pinch_end = (event) => {
		this.last_scale = event.scale
		//remove the move lock
		this.svg_main_group.lockMovementX = false;
		this.svg_main_group.lockMovementY = false;
	}
	
	setup_mouse_handlers = (all_lines_json, all_stations_json) => {
		this.all_lines_json = all_lines_json
		this.all_stations_json = all_stations_json
		
		this.fabric_canvas.on('mouse:wheel', this.handle_user_mousewheel_zoom);
		this.fabric_canvas.on('object:moving', this.handle_user_map_move_touch);
		// gesture is not well handled with fabricjs, use hammerjs
		let hammer = new Hammer.Manager(this.fabric_canvas.upperCanvasEl); // Initialize hammer
		let pinch = new Hammer.Pinch({threshold: 0.2}) // Initialize pinch
		let tap = new Hammer.Tap()
		hammer.add([pinch, tap]);
		hammer.on('pinch', this.handle_user_gesture_zoom);
		hammer.on('pinchstart', this.handle_pinch_start)
		hammer.on('pinchend', this.handle_pinch_end)
		hammer.on('pinchcancel', this.handle_pinch_end)
		
		// main mouse down, prevent ghost clicks from dragging
		this.svg_main_group.on('mousedown', this.handle_main_group_mousedown)
		
		// all tracks
		let tracks = this.find_map_objs_by_part_id('track_');
		for(let obj of tracks) {
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.handle_mouse_click_track);
			obj.on('mouseover', this.handle_mouse_over_obj);
			obj.on('mouseout', this.handle_mouse_out_obj);
		}
		// all track labels
		let line_labels = this.find_map_objs_by_part_id('line_label_');
		for(let obj of line_labels) {
			//console.warn('set handler for id: '+obj.id)
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.handle_mouse_click_track);
			obj.on('mouseover', this.handle_mouse_over_obj);
			obj.on('mouseout', this.handle_mouse_out_obj);
		}
		// all station icons
		let station_icons = this.find_map_objs_by_part_id('station_icon_')
		for(let obj of station_icons) {
			obj.set('perPixelTargetFind', true); // if false, the event is triggered on the "bounding" box. We do not want that.
			obj.on('mouseup', this.handle_mouse_click_station);
			obj.on('mouseover', this.handle_mouse_over_obj);
			obj.on('mouseout', this.handle_mouse_out_obj);
		}
		// all station labels
		let station_labels = this.find_map_objs_by_part_id('station_label_')
		for(let obj of station_labels) {
			obj.on('mouseup', this.handle_mouse_click_station);
			obj.on('mouseover', this.handle_mouse_over_obj);
			obj.on('mouseout', this.handle_mouse_out_obj);
		}
	}
	
	/*
		save the last pointer position to prevent
		ghost clicks
	*/
	handle_main_group_mousedown = (event) => {
		this.last_pointer = event.pointer
	}
	
	/*
		Update methods, to update data that
		changes regulary
	*/
	
	update_from_station_origins_json = (from_station_origins_json) => {
		this.from_station_origins_json = from_station_origins_json
	}
	
	update_to_station_origins_json = (to_station_origins_json) => {
		this.to_station_origins_json = to_station_origins_json
	}
	
	update_client_type = (client_type) => {
		this.client_type = client_type
	}
	
	update_panel_spaces = (panel_detail_space, panel_header_height) => {
		this.panel_detail_space = panel_detail_space
		this.panel_header_height = panel_header_height
	}
	
	update_router_infos = (router_infos) => {
		this.router_infos = router_infos
	}
	
	update_start_panel_state = (panel_start_overlay_is_open) => {
		this.panel_start_overlay_is_open = panel_start_overlay_is_open
	}
	
	/*
		HELPER METHODS
	*/
	
	_handle_animation_state = (run) => {
		/*
			set local state
			and lock/unlocks the movement
			axis
		*/
		this.map_animation_run = run;
		// lock/unlock the mouse moving
		if(run) {
			this.svg_main_group.lockMovementX = true;
			this.svg_main_group.lockMovementY = true;
		} else {
			this.svg_main_group.lockMovementX = false;
			this.svg_main_group.lockMovementY = false;
		}
	}
	
	_traverse_all_canvas_objects = (objects, attr, val, result_list, val_full_match=true) => {
		/*
			recursive traverse through all objects, find attr with value
		*/
		for(let obj of objects){
			if(obj['type'].includes('group')){
				this._traverse_all_canvas_objects(obj.getObjects(), attr, val, result_list, val_full_match);
			} else {
				//console.warn('traverse, attr is: '+obj[attr])
				if(val_full_match === true) {
					if(obj[attr] === val){
						result_list.push(obj);
					}
				} else {
					if(obj[attr].includes(val)) {
						result_list.push(obj);
					}
				}
			}
		}
	}
	
	// find line codes in label or line id
	_find_track_code_in_id = (id) => {
		const regex = /^line_label_([a-zA-Z0-9]+)_|^track_([a-zA-Z0-9]+)_/;
		let match = regex.exec(id)
		if(match !== null) {
			let filtered_match = match.filter(e => e !== undefined)
			return  filtered_match.length ? filtered_match.slice(-1).pop(): ''
		} else {
			return ''
		}
	}
	
	// find station code in station label or station icon
	_find_station_code_in_id = (id) => {
		// const regex = /^station_label_([a-zA-Z0-9]+)$|^station_icon_([a-zA-Z0-9]+)/;
		// let match = regex.exec(id)
		// if(match !== null) {
		// 	let filtered_match = match.filter(e => e !== undefined)
		// 	return  filtered_match.length ? filtered_match.slice(-1).pop(): ''
		// } else {
		// 	return ''
		// }

		// handle ID's with Illustrator generated appended unique part (added if 2 AI-Layers with same name exist)
		// Example: station_label_GEAP_00000103241371855642884410000012931726214500122256_
		if(id.indexOf('station_label_') > -1){
			let id_arr = id.split('label_');
			if(id_arr[1].indexOf('_') > -1){
				return id_arr[1].split('_')[0];
			}else{
				return id_arr[1]
			}
		}else if(id.indexOf('station_icon_') > -1) {
			let id_arr = id.split('icon_');
			if(id_arr[1].indexOf('_') > -1){
				return id_arr[1].split('_')[0];
			}else{
				return id_arr[1]
			}
		}
	}
	
	// find the line json object in all lines
	_find_line_data_by_id = (code) => {
		return this.all_lines_json.find(x => x.code === code)
	}
	
	// find the station json object in all stations
	_find_station_data_by_id = (code) => {
		return this.all_stations_json.find(x => x.code === code)
	}
	
	find_map_objs_by_id = (id, obj_type=undefined) => {
		/* 
			find objects by id, and optional type
		*/
		let result_list = [];
		this._traverse_all_canvas_objects(this.fabric_canvas.getObjects(), 'id', id, result_list);
		if(obj_type !== undefined) {
			let typed_result_list = []; 
			this._traverse_all_canvas_objects(result_list, 'type', obj_type, typed_result_list);
			return typed_result_list;
		} else { 
			return result_list;
		}
	}
	
	find_map_objs_by_part_id = (id, obj_type=undefined) => {
		/* 
			find objects by id, and optional type
		*/
		let result_list = [];
		this._traverse_all_canvas_objects(this.fabric_canvas.getObjects(), 'id', id, result_list, false);
		if(obj_type !== undefined) {
			let typed_result_list = []; 
			this._traverse_all_canvas_objects(result_list, 'type', obj_type, typed_result_list, false);
			return typed_result_list;
		} else { 
			return result_list;
		}
	}
	
	find_map_objs_by_classname = (class_name, obj_type=undefined) => {
		/*
			find objects by class name, and optional type
			Be sure you added the class attribute for the
			specific object in the constructor
		*/
		let result_list = [];
		this._traverse_all_canvas_objects(this.fabric_canvas.getObjects(), 'class', class_name, result_list);
		if(obj_type !== undefined) {
			let typed_result_list = []; 
			this._traverse_all_canvas_objects(result_list, 'type', obj_type, typed_result_list);
			return typed_result_list;
		} else { 
			return result_list;
		}
	}
	
	// disable all other lines, mark the line with the line color
	// handle labels too
	highlight_line = (line_code) => {
		console.log('highlight_line called')
		let that = this
		// handle track
		let tracks = this.find_map_objs_by_part_id('track_');
		for(const obj of tracks) {
			if(obj.id.indexOf(`track_${line_code}_`) === -1) {
				//obj.set('stroke', DISABLE_ELEMENT_COLOR); // hard change
				obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
		}
		const specific_tracks = this.find_map_objs_by_part_id(`track_${line_code}_`);
		const line_data = this._find_line_data_by_id(line_code)
		for(const obj of specific_tracks) {
			//obj.set('stroke', line_data.color) // hard change
			obj.animate("stroke", line_data.color, {
				"duration": COLOR_ANIMATION_TIME, 
				onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
			});
		}
		// handle labels
		let line_labels = this.find_map_objs_by_part_id('line_label_', 'path');
		for(const obj of line_labels) {
			if(obj.id.indexOf(`line_label_${line_code}_`) === -1) {
				const cid = this._find_track_code_in_id(obj.id)
				const cld = this._find_line_data_by_id(cid)
				let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				// console.log(cld.color, obj_fill); // DEBUG Line Label not fading inactive @f24: Solution was HEX in line.xlsx must be UPPERCASE
				if(cld.color === obj_fill) {
					// console.log('disable label animation added')
					//obj.set('fill', DISABLE_ELEMENT_COLOR); // hard change
					obj.animate("fill", DISABLE_ELEMENT_COLOR, {
						"duration": COLOR_ANIMATION_TIME, 
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
				}
			}
		}
		const specific_line_labels = this.find_map_objs_by_part_id(`line_label_${line_code}_`);
		for(const obj of specific_line_labels) {
			let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
			if(line_data.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
				//obj.set('fill', line_data.color) // hard change
				obj.animate("fill", line_data.color, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
		}
		this.fabric_canvas.requestRenderAll()
	}
	
		
	// revert all line marking to the original color
	reset_line_highlight = () => {
		// tracks
		let that = this
		let tracks = this.find_map_objs_by_part_id('track_');
		for(let obj of tracks) {
			const line_code = this._find_track_code_in_id(obj.id)
			const line_data = this._find_line_data_by_id(line_code)
			//obj.set('stroke', line_data.color) // hard change
			obj.animate("stroke", line_data.color, {
				"duration": COLOR_ANIMATION_TIME, 
				onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
			});
		}
		// labels
		let line_labels = this.find_map_objs_by_part_id('line_label_', 'path');
		for(const obj of line_labels) {
			const line_code = this._find_track_code_in_id(obj.id)
			const line_data = this._find_line_data_by_id(line_code)
			let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
			if(DISABLE_ELEMENT_COLOR === obj_fill) {
				//obj.set('fill', line_data.color); // hard change
				obj.animate("fill", line_data.color, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
		}
		this.fabric_canvas.requestRenderAll()
	}
	
	/*
		highlight all line part(s) that are in connection with the to station.
		We can actually highlight the whole line and do not have to search
		line parts, because there is no destination given.
	*/
	highlight_all_from_station_lines = () => {
		// get all line names, first in an array, after make a unique set
		let that = this
		let lines_arr = []
		for (const entry of Object.entries(this.from_station_origins_json.connected_stations)) {
			for(const h_entry of Object.entries(entry[1].track_highlights)) {
				lines_arr.push(h_entry[0])
			}
		}
		const lines = [...new Set(lines_arr)]
		// handle tracks
		let tracks = this.find_map_objs_by_part_id('track_');
		for(let obj of tracks) { // disable all that are not in the lines array, for color setting without animation this would not be needed
			let disable = true
			for(const line_code of lines) { // extra for loop for animate cycle
				if(obj.id.indexOf(`track_${line_code}_`) !== -1) {
					disable = false
					break
				}
			}
			if(disable) {
				obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
		}
		for(const line_code of lines) {
			const specific_tracks = this.find_map_objs_by_part_id(`track_${line_code}_`);
			const line_data = this._find_line_data_by_id(line_code)
			for(let obj of specific_tracks) {
				//obj.set('stroke', line_data.color)
				obj.animate("stroke", line_data.color, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
		}
		// handle labels
		let line_labels = this.find_map_objs_by_part_id('line_label_', 'path');
		for(const obj of line_labels) { // disable all that are not in the lines array, for color setting without animation this would not be needed
			let disable = true
			for(const line_code of lines) { // extra for loop for animate cycle
				if(obj.id.indexOf(`line_label_${line_code}_`) !== -1) {
					disable = false
					break
				}
			}
			if(disable) {
				const cid = this._find_track_code_in_id(obj.id)
				const cld = this._find_line_data_by_id(cid)
				let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				if(cld.color === obj_fill) {
					//obj.set('fill', DISABLE_ELEMENT_COLOR);
					obj.animate("fill", DISABLE_ELEMENT_COLOR, {
						"duration": COLOR_ANIMATION_TIME, 
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
				}
			}
		}
		for(const line_code of lines) {
			const spezific_line_labels = this.find_map_objs_by_part_id(`line_label_${line_code}_`)
			for(const obj of spezific_line_labels) {
				const cid = this._find_track_code_in_id(obj.id)
				const cld = this._find_line_data_by_id(cid)
				let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				if(cld.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
					//obj.set('fill', cld.color)
					obj.animate("fill", cld.color, {
						"duration": COLOR_ANIMATION_TIME, 
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
				}
			}
		}
	}
	
	/*
		highlight all line part(s) that are in connection with the to and from station
		disable the rest. If there is no connection, disable all lines and labels
	*/
	highlight_all_from_to_station_lines = (from_station_code, to_station_code) => {
		let that = this
		let tmp_lines_obj = {}
		let anim_line_codes_arr = [] // used for animation check only

		// @Update f24-> Bug showed up at case ANN -> CHEB, because Stop at CHEB is only in one Direction
		// -> double flipflop direction is not needed -> using Origin.connected_stations[to_station_code].track_highlights holds all info
		// Removed Code here

		// TODO: remove Code after testing
		// const from_connected_stations = this.to_station_origins_json.connected_stations[from_station_code]
		const to_connected_stations = this.from_station_origins_json.connected_stations[to_station_code]
		// console.log('from_connected_stations',from_connected_stations)
		console.log('to_connected_stations',to_connected_stations)
		// if(from_connected_stations !== undefined && to_connected_stations !== undefined) {
		if(to_connected_stations !== undefined) {
			// for(const [line_code, entries] of Object.entries(from_connected_stations.track_highlights)) {
			// 	if(!(line_code in tmp_lines_obj)) {
			// 		tmp_lines_obj[line_code] = []
			// 	}
			// 	tmp_lines_obj[line_code].push(...entries)
			// 	anim_line_codes_arr.push(...entries)
			// }
			for(const [line_code, entries] of Object.entries(to_connected_stations.track_highlights)) {
				if(!(line_code in tmp_lines_obj)) {
					tmp_lines_obj[line_code] = []
				}
				tmp_lines_obj[line_code].push(...entries)
				anim_line_codes_arr.push(...entries)
			}
			// make unique sets
			let lines_obj = {}
			for(const [line_code, entries] of Object.entries(tmp_lines_obj)) {
				if(!(line_code in lines_obj)) {
					lines_obj[line_code] = [...new Set(entries)]
				}
			}
			const anim_line_codes = [...new Set(anim_line_codes_arr)] // only used for animation
			// tracks
			let tracks = this.find_map_objs_by_part_id('track_');
			for(let obj of tracks) { // disable all
				let disable = true
				for(const line_code of anim_line_codes) { // extra for loop for animate cycle

					// if(obj.id.indexOf(`track_${line_code}`) !== -1) { // old version -> does not remove color for "track_IC8_FF_WF" because "track_IC8_FF_W" matches - Case orig:Winterthur->dest:Frauenfeld
                    if(obj.id === `track_${line_code}`) {
						disable = false
						break
					}
				}
				if(disable) {
					//obj.set('stroke', DISABLE_ELEMENT_COLOR);
					obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
						"duration": COLOR_ANIMATION_TIME, 
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});	
				}
			}
			for(const [line_code, lines] of Object.entries(lines_obj)) {
				const line_data = this._find_line_data_by_id(line_code)
				for(const full_line_code of lines) {
					const specific_track = tracks.find(x => x.id === `track_${full_line_code}`);
					if(specific_track !== undefined) {
						//specific_track.set('stroke', line_data.color)
						specific_track.animate("stroke", line_data.color, {
							"duration": COLOR_ANIMATION_TIME, 
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});	
					}
				}
			}
			// labels
			let line_labels = this.find_map_objs_by_part_id('line_label_', 'path');
			for(const obj of line_labels) {
				let disable = true
				for(const line_code of anim_line_codes) { // extra for loop for animate cycle
					if(obj.id.indexOf(`line_label_${line_code}`) !== -1) {
						disable = false
						break
					}
				}
				if(disable) {
					const cid = this._find_track_code_in_id(obj.id)
					const cld = this._find_line_data_by_id(cid)
					let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
					if(cld.color === obj_fill) {
						//obj.set('fill', DISABLE_ELEMENT_COLOR);
						obj.animate("fill", DISABLE_ELEMENT_COLOR, {
							"duration": COLOR_ANIMATION_TIME, 
							onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
						});	
					}
				}
			}
			for(const entry of Object.entries(lines_obj)) {
				for(const full_line_code of entry[1]) {
					const spezific_line_labels = this.find_map_objs_by_part_id(`line_label_${full_line_code}`)
					for(const obj of spezific_line_labels) {
						const cid = this._find_track_code_in_id(obj.id)
						const cld = this._find_line_data_by_id(cid)
						let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
						if(cld.color === obj_fill || obj_fill === DISABLE_ELEMENT_COLOR) {
							//obj.set('fill', cld.color)
							obj.animate("fill", cld.color, {
								"duration": COLOR_ANIMATION_TIME, 
								onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
							});	
						}
					}
				}
			}
		} else {
			// tracks
			let tracks = this.find_map_objs_by_part_id('track_');
			for(const obj of tracks) { // disable all
				//obj.set('stroke', DISABLE_ELEMENT_COLOR);
				obj.animate("stroke", DISABLE_ELEMENT_COLOR, {
					"duration": COLOR_ANIMATION_TIME, 
					onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
				});
			}
			// labels
			let line_labels = this.find_map_objs_by_part_id('line_label_', 'path');
			for(const obj of line_labels) {
				const cid = this._find_track_code_in_id(obj.id)
				const cld = this._find_line_data_by_id(cid)
				let obj_fill = rgba_to_hex(obj.get('fill')) // after animation the values are in rgba, convert it for compare
				if(cld.color === obj_fill) {
					//obj.set('fill', DISABLE_ELEMENT_COLOR);
					obj.animate("fill", DISABLE_ELEMENT_COLOR, {
						"duration": COLOR_ANIMATION_TIME, 
						onChange: that.fabric_canvas.requestRenderAll.bind(that.fabric_canvas)
					});
				}
			}
			// console.log('from_connected_stations or to_connected_stations is undefined')
			// console.log('from_connected_stations: ',from_connected_stations)
			// console.log('to_connected_stations: ',to_connected_stations)
		}
	}

	// @Update f24 (Nov 2023): use new version zoom_highlighted_tracks
	zoom_highlighted_line = (line_code) => {
		const line_data = this._find_line_data_by_id(line_code)
		if(line_data !== undefined) {
			const station_codes = line_data.map_stations.split("-");
			this.zoom_highlighted_tracks(station_codes)
		}
	}

	// f24: this is still used when from -> to has no result (=no highlighted tracks)
	zoom_highlighted_stations = (from_station_code, to_station_code) => {
		const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
		const highlight_pos_from_obj = all_highlights.find(x => x.id === `highlight_pos_${from_station_code}`)
		const highlight_pos_to_obj = all_highlights.find(x => x.id === `highlight_pos_${to_station_code}`)
		if(highlight_pos_from_obj !== undefined && highlight_pos_to_obj !== undefined) {
			let zoom_box = this.zoom_box_for_objs(highlight_pos_from_obj, highlight_pos_to_obj);
			this.animated_pan_zoom(zoom_box)
		} else {
			console.warn('zoom_highlighted_stations, cannot find from or to position object')
		}
	}

	// @Update f24 (Nov 2023) - optimize zoom_box for highlighted tracks
	// find MAX stretch values for all Stations around highlighted tracks
	// replacement for zoom_highlighted_line & zoom_highlighted_stations
	// -> expects a set of station_codes
	zoom_highlighted_tracks = (station_codes) => {
		const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
		let min_x = 0;
		let max_x = 0;
		let min_y = 0;
		let max_y = 0;

		for(const station_code of station_codes){
			let highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`)
			if(highlight_pos_obj !== undefined){
				let m_obj = highlight_pos_obj.calcTransformMatrix(false);
				let obj_x = m_obj[4]
				let obj_y = m_obj[5]

				if(min_x === 0){
					min_x = obj_x;
					max_x = obj_x;
				}else if(obj_x < min_x){
					min_x = obj_x;
				}else if(obj_x > max_x){
					max_x = obj_x;
				}
				if(min_y === 0){
					min_y = obj_y;
					max_y = obj_y;
				}else if(obj_y < min_y){
					min_y = obj_y;
				}else if(obj_y > max_y){
					max_y = obj_y;
				}
			}else{
				console.log('highlight_pos_obj not found for:', station_code)
			}
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
		const zoom_box = this.optimize_zoom_box_for_viewport(bounds, false)
		this.animated_pan_zoom(zoom_box)
	}
	
	// if a station is not really visible, zoom it
	zoom_not_visible_station = (from_station_code) => {
		const is_visible = this.check_station_visible(from_station_code)

		// 22.6.2023:  Deactivated if(!is_visible) -> NOW always zoom & center to station -> (also on click, autocomplete, ...)
		//if(!is_visible) {
		 	const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
			const highlight_pos_from_obj = all_highlights.find(x => x.id === `highlight_pos_${from_station_code}`)
			if(highlight_pos_from_obj !== undefined) {
				let zoom_box = this.zoom_box_for_objs(highlight_pos_from_obj);
				this.animated_pan_zoom(zoom_box)
			} else {
				console.warn('zoom_not_visible_station, cannot find from position object')
			}
		//}
	}
	
	// mark the station with the right circle
	highlight_station = (station_code, station_type) => {
		const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
		const highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`)
		let highlight_obj = undefined
		if(station_type === 'from') {
			highlight_obj = all_highlights.find(x => x.id === 'highlight_origin');
		} else {
			highlight_obj = all_highlights.find(x => x.id === 'highlight_destination');
		}
		if(highlight_pos_obj !== undefined && highlight_obj !== undefined) {
			highlight_obj.set('left', highlight_pos_obj.left)
			highlight_obj.set('top', highlight_pos_obj.top)
			highlight_obj.set('visible', true)
		}
		this.fabric_canvas.requestRenderAll()
	}
	
	// remove all highlights for all stations
	reset_all_highlight_station = () => {
		const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
		const highlight_origin_obj = all_highlights.find(x => x.id === 'highlight_origin');
		highlight_origin_obj.set('visible', false)
		const highlight_destination_obj = all_highlights.find(x => x.id === 'highlight_destination');
		highlight_destination_obj.set('visible', false)
		this.fabric_canvas.requestRenderAll()
	}
	
	animated_pan_zoom = (zoom_box, promise_callback_fnc=null) => {
		/*
			as we can not anmiate absolute pan
			x and y at the same time with given
			fabricjs functions. We take the animjs
			package todo the work.
			setZoom(1) is very important, do not remove them
		*/
		
		// if an animation is running, interrupt it
		anime.remove(this.move_zoom_animation_obj)
		// reset animation state
		this._handle_animation_state(false);
		// reset data
		this.move_zoom_animation_obj = {
			x: 0,
			y: 0,
			zoom: 1
		}
		
		let that = this;
		
		const move_zoom_animation = () => {
			let orig_zoom = this.fabric_canvas.getZoom();
			this.fabric_canvas.setZoom(1); // this is very important!
			let vpw = that.fabric_canvas.getWidth()
			let vph = that.fabric_canvas.getHeight()
			let target_x = 0
			let target_y = 0
			if(this.client_type !== 'mobile') { // panel is left
				target_x = (zoom_box.center_left - (((vpw - this.panel_detail_space) / zoom_box.zoom_level) / 2))
				target_y = (zoom_box.center_top - ((vph / zoom_box.zoom_level ) / 2))
			} else { // do not take any panel space into account
				target_x = (zoom_box.center_left - ((vpw / zoom_box.zoom_level) / 2))
				target_y = (zoom_box.center_top - ((vph / zoom_box.zoom_level ) / 2))
			}
			let vpt = that.fabric_canvas.viewportTransform;
			this.move_zoom_animation_obj.x = fabric.util.invertTransform(vpt)[4];
			this.move_zoom_animation_obj.y = fabric.util.invertTransform(vpt)[5];
			this.move_zoom_animation_obj.zoom = orig_zoom;
			this.fabric_canvas.setZoom(orig_zoom); // zoom back without changing the view
			// find the bigger distance that we have to move
			const move_x = target_x > this.move_zoom_animation_obj.x ? target_x - this.move_zoom_animation_obj.x : this.move_zoom_animation_obj.x - target_x
			const move_y = target_y > this.move_zoom_animation_obj.y ? target_y - this.move_zoom_animation_obj.y : this.move_zoom_animation_obj.y - target_y
			const point_diff_distance = move_x > move_y ? move_x : move_y
			// find the zoom difference
			const zoom_diff_distance = zoom_box.zoom_level > orig_zoom ? zoom_box.zoom_level - orig_zoom: orig_zoom - zoom_box.zoom_level
			const animation_time = calc_map_animation_timing(point_diff_distance, zoom_diff_distance, this.client_type)
			let mza = anime({
				targets: that.move_zoom_animation_obj,
				zoom: zoom_box.zoom_level,
				x: target_x,
				y: target_y,
				easing: DEFAULT_ANIMATION_EASING,
				duration: animation_time, 
				update: function() {
					that.fabric_canvas.setZoom(1); // this is very important!
					that.fabric_canvas.absolutePan({x: that.move_zoom_animation_obj.x, y: that.move_zoom_animation_obj.y});
					that.fabric_canvas.setZoom(that.move_zoom_animation_obj.zoom);
					that.fabric_canvas.renderAll();
				}
			});
			mza.finished.then(animation_finished);
		}
		
		const animation_finished = () => {
			this.fabric_canvas.requestRenderAll();
			this._handle_animation_state(false);
			if(promise_callback_fnc !== null) {
				promise_callback_fnc();
			}
		}
		
		// only start if not running
		if(!this.map_animation_run) {
			this._handle_animation_state(true);
			move_zoom_animation();
		} else {
			console.warn('animation is already running!');
		}
	}
	
	/* 	
		check if the station highlight is visible
		use a config specific margin for the borders
	*/
	check_station_visible = (station_code) => {
		const all_highlights = this.find_map_objs_by_part_id('highlight_'); // get all, do a find on them here
		const highlight_pos_obj = all_highlights.find(x => x.id === `highlight_pos_${station_code}`)
		if(highlight_pos_obj !== undefined) {
			let vpw = this.fabric_canvas.getWidth()
			let vph = this.fabric_canvas.getHeight()
			let m = highlight_pos_obj.calcTransformMatrix();
			let obj_p = fabric.util.transformPoint({x: m[4], y: m[5]}, this.fabric_canvas.viewportTransform, false);
			let is_visible = true
			let additional_visible_space_margin = ADDITIONAL_VISIBLE_SPACE_MARGIN_DESKTOP
			if(this.client_type === 'mobile') {
				additional_visible_space_margin = ADDITIONAL_VISIBLE_SPACE_MARGIN_MOBILE
			}
			if(this.client_type !== 'mobile') {
				if(obj_p.y < additional_visible_space_margin || 
				   obj_p.x < (additional_visible_space_margin + this.fabric_canvas._offset.left) || 
				   obj_p.y > (vph - (additional_visible_space_margin + this.panel_header_height)) || 
				   obj_p.x > (vpw - this.panel_detail_space - additional_visible_space_margin)) {
					is_visible = false
				}
			} else {
				if(obj_p.y < (this.panel_detail_space + additional_visible_space_margin) || 
				   obj_p.x < (additional_visible_space_margin + this.fabric_canvas._offset.left) || 
				   obj_p.y > (vph - (additional_visible_space_margin + this.panel_header_height)) || 
				   obj_p.x > (vpw  - additional_visible_space_margin)) {
					is_visible = false
				}
			}
			return is_visible
		}
		return true // return always true if undefined, else we start to trigger an animation on a non existent object
	}
	
	// set the new width and heights, center and zoom to ch
	zoom_check_map_resize = (map_containter_width, map_container_height) => {
		this.fabric_canvas.setWidth(map_containter_width)
		this.fabric_canvas.setHeight(map_container_height)
		this.fabric_canvas.calcOffset()
		this.fabric_canvas.requestRenderAll()
		// do recalc and center
		const initial_zoom = this.zoom_value_for_ch()
		this.fabric_canvas.setZoom(initial_zoom)
		this.fabric_canvas.viewportCenterObject(this.svg_main_group)
	}
	
	initial_zoom_move = () => {
		// console.log('initial zoom move!')
		let that = this
		let zoom_step = INITIAL_ZOOM_MOVE_STEP_DESKTOP
		let animation_time = INITIAL_ZOOM_MOVE_TIME_DESKTOP
		if(this.client_type === 'mobile') {
			zoom_step = INITIAL_ZOOM_MOVE_STEP_MOBILE
			animation_time = INITIAL_ZOOM_MOVE_TIME_MOBILE
		}
		const animation_finished = () => {
			//store.dispatch(toggle_panel_start_overlay_open(true))
		}
		
		const move_zoom_animation = () => {
			const ch_background_res = this.find_map_objs_by_id(SWITZERLAND_BACKGROUND_OBJ_ID, 'polygon');
			if(ch_background_res.length === 1) {
				const ch_background = ch_background_res[0];
				let zoom_box = this.zoom_box_for_objs(ch_background)
				let orig_zoom = this.fabric_canvas.getZoom()
				let target_zoom = orig_zoom + zoom_step
				this.fabric_canvas.setZoom(1) 
				let vpw = this.fabric_canvas.width / target_zoom
				let vph = this.fabric_canvas.height / target_zoom
				let target_x = (zoom_box.center_left - vpw / 2)
				let target_y = (zoom_box.center_top -  vph / 2)
				this.fabric_canvas.setZoom(orig_zoom)
				
				let vpt = that.fabric_canvas.viewportTransform;
				let initial_zoom_move_obj = {
					zoom: orig_zoom,
					x: fabric.util.invertTransform(vpt)[4],
					y: fabric.util.invertTransform(vpt)[5]
				}
				let mza = anime({
					targets: initial_zoom_move_obj,
					zoom: target_zoom,
					x: target_x,
					y: target_y,
					easing: DEFAULT_ANIMATION_EASING,
					duration: animation_time, 
					update: function() {
						that.fabric_canvas.setZoom(1); // this is very important!
						that.fabric_canvas.absolutePan({x: initial_zoom_move_obj.x, y: initial_zoom_move_obj.y});
						that.fabric_canvas.setZoom(initial_zoom_move_obj.zoom);
						that.fabric_canvas.renderAll();
					}
				});
				mza.finished.then(animation_finished);
			}
		}
		setTimeout(move_zoom_animation, INITIAL_ZOOM_MOVE_DELAY)
	}
	
	zoom_value_for_ch = () => {
		/*
			find the right zoom
			to show the initialized
			map
		*/
		let initial_zoom = INITIAL_ZOOM; // return that if object not found
		const ch_background_res = this.find_map_objs_by_id(SWITZERLAND_BACKGROUND_OBJ_ID, 'polygon');
		if(ch_background_res.length === 1) {
			const ch_background = ch_background_res[0];
			let vpw = this.fabric_canvas.getWidth()
			let vph = this.fabric_canvas.getHeight()
			let zw = 0
			let zh = 0
			let z = 0
			let additional_bound_zoom_space = ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP
			if(this.client_type === 'mobile') {
				additional_bound_zoom_space = ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE
			}
			// check if ch is smaller than the viewport -> we do not cover
			if(ch_background.width < vpw || ch_background.height < vph) {
				if(ch_background.width < vpw) {
					zw = vpw / (this.svg_main_group.width)
				} else {
					zw = vpw / (ch_background.width + additional_bound_zoom_space);
				}
				if(ch_background.height < vph) {
					zh = vph / (this.svg_main_group.height)
				} else {
					zh = vph / (ch_background.height + additional_bound_zoom_space);
				}
				z = zw > zh ? zw : zh;
			} else { // it would cover the viewport
				zw = vpw / (ch_background.width + additional_bound_zoom_space);
				zh = vph / (ch_background.height + additional_bound_zoom_space);
				
				z = zw < zh ? zw : zh;
				
				// on some screen proportions there is a correction needed!
				let z_cor = 0
				if((this.svg_main_group.width * z) < vpw) {
					const diff = vpw - (this.svg_main_group.width * z)
					z_cor = ((this.svg_main_group.width - diff) / vpw) / 100
				}
				if((this.svg_main_group.height * z) < vph) {
					const diff = vph - (this.svg_main_group.height * z)
					z_cor = ((this.svg_main_group.height - diff) / vph) / 100
				}
				z += z_cor
				
			}
			if(z > MAX_ZOOM_IN) { // prevent to much zoom
				z = MAX_ZOOM_IN;
			}
			initial_zoom = z;
		} else {
			console.warn('zoom_value_for_ch: Cannot calculate initial zoom, object not found!');
		}
		return initial_zoom;
	}

	// @Update f24 (Nov 2023) - taken from "zoom_box_for_objs". Now also used by "zoom_highlighted_tracks"
	optimize_zoom_box_for_viewport = (bounds, extra_space) => {
		bounds.center_left = bounds.left + (bounds.width / 2) + (this.fabric_canvas._offset.left / 2);
		let vpw = 0
		let vph = 0

		// add bound space for desktop or tablet
		let bound_space = ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP
		if(extra_space === true) {
			bound_space = ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_DESKTOP
		}
		if(this.client_type !== 'mobile') {
			bounds.center_top = bounds.top  + (bounds.height / 2) + (this.panel_header_height / 2);
			vpw = this.fabric_canvas.getWidth() - this.panel_detail_space
			vph = this.fabric_canvas.getHeight()
		} else {
			bounds.center_top = bounds.top  + (bounds.height / 2) - ((this.panel_header_height + this.panel_detail_space) / 2)
			vpw = this.fabric_canvas.getWidth()
			vph = this.fabric_canvas.getHeight() - this.panel_detail_space - this.panel_header_height
			// adjust bound space for mobile
			bound_space = ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE
			if(extra_space === true) {
				bound_space = ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_MOBILE
			}
		}

		let zw = vpw / (bounds.width + bound_space);
		let zh = vph / (bounds.height + bound_space);
		let z = zw < zh ? zw : zh;
		if(z > MAX_ZOOM_IN) {
			z = MAX_ZOOM_IN;
		}
		bounds.zoom_level = z;
		return bounds;
	}
	
	zoom_box_for_objs = (obj_1, obj_2=undefined) => {
		/*
			find the rectangle around two objects
			on the map. 
			If only one object is given, 
			calculate it for only one object
			
			use different spacing if one or
			two objects are given
			
			@TODO: check if spacing is sufficient
			for mobile too!
		*/
		let bounds = {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			center_left: 0,
			center_top: 0,
			zoom_level: 2, // fix for now
		}
		let m_obj_1 = obj_1.calcTransformMatrix(false);
		let x_obj_1_left = m_obj_1[4] - obj_1.width/2 // translation in X left
		let x_obj_1_right = m_obj_1[4] + obj_1.width/2 // translation in X right
		let y_obj_1_top = m_obj_1[5] - obj_1.height/2 // translation in Y top
		let y_obj_1_bottom = m_obj_1[5] + obj_1.height/2 // translation in Y bottom
		let x_b_left, x_b_right, y_b_top, y_b_bottom
		if(obj_2 !== undefined) {
			let m_obj_2 = obj_2.calcTransformMatrix(false);
			let x_obj_2_left = m_obj_2[4] - obj_2.width/2 // translation in X left
			let x_obj_2_right = m_obj_2[4] + obj_2.width/2 // translation in X right
			let y_obj_2_top = m_obj_2[5] - obj_2.height/2 // translation in Y top
			let y_obj_2_bottom = m_obj_2[5] + obj_2.height/2 // translation in Y bottom
			x_b_left = x_obj_1_left < x_obj_2_left ? x_obj_1_left : x_obj_2_left;
			x_b_right = x_obj_1_right > x_obj_2_right ? x_obj_1_right : x_obj_2_right;
			y_b_top = y_obj_1_top < y_obj_2_top ? y_obj_1_top : y_obj_2_top;
			y_b_bottom = y_obj_1_bottom > y_obj_2_bottom ? y_obj_1_bottom : y_obj_2_bottom;
		} else {
			x_b_left = x_obj_1_left
			x_b_right = x_obj_1_right
			y_b_top = y_obj_1_top
			y_b_bottom = y_obj_1_bottom
		}
		
		bounds.left = x_b_left;
		bounds.top = y_b_top;
		bounds.width = x_b_right - x_b_left;
		bounds.height = y_b_bottom - y_b_top;

		let extra_space = false;
		if(obj_2 === undefined){
			extra_space = true;
		}
		bounds = this.optimize_zoom_box_for_viewport(bounds, extra_space);
		return bounds;
	}
	
	/*
		EVENT HANDLERS FOR USER ACTIONS
	*/
	
	/*
		check if start and current pointer
		are in a range, else we do not handle
		click events. on desktop they are always
		on the same spot. With gestures they
		can differ around 5 - 10 pixels...
	*/
	
	_check_pointer_in_range = (pointer) => {
		let diff_x = this.last_pointer.x > pointer.x ? this.last_pointer.x - pointer.x : pointer.x - this.last_pointer.x
		let diff_y = this.last_pointer.y > pointer.y ? this.last_pointer.y - pointer.y : pointer.y - this.last_pointer.y
		
		if(diff_x < TAP_MAX_DIFF && diff_y < TAP_MAX_DIFF) {
			return true
		} else {
			return false
		}
	}
	
	handle_mouse_click_station = (event) => {
		if(event.currentSubTargets.length) {
			if(this._check_pointer_in_range(event.pointer)) { // only if on same position
				const target_id = event.currentSubTargets[0].id
				if(target_id !== null) {
					const station_code = this._find_station_code_in_id(target_id);
					if(station_code !== '') {
						// always set the origin
						const url = resolve_url('station_from', {from_slug: station_code})
						//store.dispatch(push(url))
						// this code would set destination if origin is already set. 
						/*if(this.router_infos.type === 'station' && this.router_infos.from_slug !== null) {
							if(this.router_infos.from_slug !== station_code) { // if user clicks on the same, no reaction
								const url = resolve_url('station_from_to', {from_slug: this.router_infos.from_slug, to_slug: station_code})
								store.dispatch(push(url))
							}
						} else {
							const url = resolve_url('station_from', {from_slug: station_code})
							store.dispatch(push(url))
						}*/
					}
				}
			}
		}
	}
	
	handle_mouse_click_track = (event) => {
		if(event.currentSubTargets.length) {
			if(this._check_pointer_in_range(event.pointer)) { // only if on same position
				const target_id = event.currentSubTargets[0].id
				const track_code = this._find_track_code_in_id(target_id);
				if(track_code !== '') {
					const url = resolve_url('line', {line_slug: track_code})
					//store.dispatch(push(url))
				}
			}
		}
	}
	
	handle_mouse_over_obj = (event) => {
		this.fabric_canvas.hoverCursor = "pointer";
	}
	
	handle_mouse_out_obj = (event) => {
		this.fabric_canvas.hoverCursor = "move";
	}
	
	handle_user_map_move_touch = (opt) => {
		/*
			called it a user drags the map
			with the mouse or touches it.
			keep the map inside of the canvas
			do not show background.
		*/
		// close the start panel if it is still open
		if(this.panel_start_overlay_is_open !== undefined && this.panel_start_overlay_is_open) {
			this.panel_start_overlay_is_open = false // set it already, to prevent double call
			//store.dispatch(toggle_panel_start_overlay_open(false))
		}
		// if we have a pinch gesture going on, return and let hammerjs handle it in handle_user_gesture_zoom
		if (opt.e.touches && opt.e.touches.length === 2) {return;}
		
		if(!this.map_animation_run) {
			const obj = opt.target
			const calc_bounds = obj.getBoundingRect(false, true);
			if(calc_bounds.left > 0) {
				obj.set('left', this.last_bounding_data.left);
				obj.setCoords();
			} else {
				this.last_bounding_data.left = obj.left;
			}
			if(calc_bounds.top > 0) {
				obj.set('top', this.last_bounding_data.top);
				obj.setCoords();
			} else {
				this.last_bounding_data.top = obj.top;
			}
			const bottom = (calc_bounds.top + calc_bounds.height) - this.fabric_canvas.getHeight();
			if(bottom < 0) {
				obj.set('top', this.last_bounding_data.bottom);
				obj.setCoords();
			} else {
				this.last_bounding_data.bottom = obj.top;
			}
			const right = (calc_bounds.left + calc_bounds.width) - this.fabric_canvas.getWidth();
			if(right < 0) {
				obj.set('left', this.last_bounding_data.right);
				obj.setCoords();
			} else {
				this.last_bounding_data.right = obj.left;
			}
		}
	}
	
	handle_user_gesture_zoom = (event) => {
		/*
			uses pinch event from hammerjs
		*/
		if(!this.map_animation_run) {
			// close the start panel if it is still open
			if(this.panel_start_overlay_is_open !== undefined && this.panel_start_overlay_is_open) {
				this.panel_start_overlay_is_open = false // set it already, to prevent double call
				//store.dispatch(toggle_panel_start_overlay_open(false))
			}
			if(this.last_scale !== event.scale) {
				this.last_scale = event.scale
				const current_viewport_transform = this.fabric_canvas.viewportTransform;
				let zoom = this.fabric_canvas.getZoom();
					
				zoom *= 0.999 ** (PINCH_STEP_FACTOR*(this.pinch_start_scale - event.scale))
					
				if (zoom > MAX_ZOOM_IN) zoom = MAX_ZOOM_IN;
				if (zoom < MAX_ZOOM_OUT) zoom = MAX_ZOOM_OUT;
				// check if the map still would cover the canvas
				if(this.svg_main_group !== null) { // but be safe, else do nothing
					this.fabric_canvas.zoomToPoint({ x: event.center.x, y: event.center.y }, zoom);
					const calc_bounds = this.svg_main_group.getBoundingRect(false, true);
					if((calc_bounds.left + calc_bounds.width) < this.fabric_canvas.getWidth() || calc_bounds.left > 0) {
						this.fabric_canvas.setViewportTransform(current_viewport_transform);
					} 
					if((calc_bounds.top + calc_bounds.height) < this.fabric_canvas.getHeight() || calc_bounds.top > 0) {
						this.fabric_canvas.setViewportTransform(current_viewport_transform);
					}
					this.fabric_canvas.requestRenderAll()
				}
			}
		}
	}
	
	handle_user_mousewheel_zoom = (opt) => {
		/*
			zoom into map with normalized delta
			if the zoom would reveal the background
			just apply the current viewport Transform
			means, nothing happens.
			TODO: if zoomed in a corner and near the
			edge, no zoom out is possible, we should
			actually pan and zoom
		*/
		if(!this.map_animation_run) {
			// close the start panel if it is still open
			if(this.panel_start_overlay_is_open !== undefined && this.panel_start_overlay_is_open) {
				this.panel_start_overlay_is_open = false // set it already, to prevent double call
				//store.dispatch(toggle_panel_start_overlay_open(false))
			}
			const normalized = normalizeWheel(opt.e);
			const current_viewport_transform = this.fabric_canvas.viewportTransform;
			let zoom = this.fabric_canvas.getZoom();
			zoom *= 0.999 ** normalized.pixelY;
			if (zoom > MAX_ZOOM_IN) zoom = MAX_ZOOM_IN;
			if (zoom < MAX_ZOOM_OUT) zoom = MAX_ZOOM_OUT;
			// check if the map still would cover the canvas
			if(this.svg_main_group !== null) { // but be safe, else do nothing
				this.fabric_canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
				const calc_bounds = this.svg_main_group.getBoundingRect(false, true);
				if((calc_bounds.left + calc_bounds.width) < this.fabric_canvas.getWidth() || calc_bounds.left > 0) {
					this.fabric_canvas.setViewportTransform(current_viewport_transform);
				} 
				if((calc_bounds.top + calc_bounds.height) < this.fabric_canvas.getHeight() || calc_bounds.top > 0) {
					this.fabric_canvas.setViewportTransform(current_viewport_transform);
				}
			}
		}
		opt.e.preventDefault();
		opt.e.stopPropagation();
	}
}