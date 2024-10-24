import { fabric } from 'fabric';
import anime from 'animejs';
import Hammer from 'hammerjs';

class SVG_Map {
	constructor(client_type, filename, config) {

		this.filename = filename;
		SVG_Map.#Initialize_Fabric();
		this.config = config;

		// keep reference on the canvas and the svg main group
		this.fabric_canvas = null;
		this.svg_main_group = null;
		this.language = null;

		// from origins if a from station is selected
		this.from_station_origins_json = {}
		// to origins if a to station is selected
		this.to_station_origins_json = {}		

		// we need the router infos to assemble some of the urls
		/* 
			as for now we do not need them anymore, because
			in #Handle_Mouse_Click_Station we only set the from
			station from now one. But we keep it, if there
			is a later need
		*/
		this.router_infos = undefined //probably not needed

		// panel widths, to take into calculations
		this.panel_detail_space = 0 //probably not needed

		// panel header height
		this.panel_header_height = 0 //probably not needed

		// client type, can be mobile | tablet | desktop
		this.client_type = client_type;

		// keep object with animation parameters to stop it
		this.move_zoom_animation_obj = {
			x: 0,
			y: 0,
			zoom: 1
		}

		// binding this to event handlers
		this.#Handle_User_Mousewheel_Zoom = this.#Handle_User_Mousewheel_Zoom.bind(this);
		this.#Handle_User_Map_Move_Touch = this.#Handle_User_Map_Move_Touch.bind(this);
		this.#Handle_User_Gesture_Zoom = this.#Handle_User_Gesture_Zoom.bind(this);
		this.#Handle_Pinch_Start = this.#Handle_Pinch_Start.bind(this)
		this.#Handle_Pinch_End = this.#Handle_Pinch_End.bind(this)
		this._Handle_Mouse_Over_Obj = this._Handle_Mouse_Over_Obj.bind(this);
		this._Handle_Mouse_Out_Obj = this._Handle_Mouse_Out_Obj.bind(this);
		this.#Handle_Main_Group_Mousedown = this.#Handle_Main_Group_Mousedown.bind(this);
		// keep some position data for the check on moving
		this.last_bounding_data = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0
		}

		// are we in a animation run
		// never set this direct, use _Handle_Animation_State
		this.map_animation_run = false

		// save the start scale on gesture "pinch"
		this.pinch_start_scale = 0
		// save the last scale
		this.last_scale = 0

		// save the last pointer position on mousedown, to prevent ghost clicks
		this.last_pointer = undefined

		this.pinch_zoom_click_deactivated = false
	}

	////////////////////
	/// Public function
	////////////////////

	////////////////////////////////////////
	/// @brief Setup the map to be viewd
	/// @param language language of the map
	/// @param id, id to create the canva to
	/// @param loader to show the main loader
	Setup = async (language, id, loader) => {
		/*
			Setup the canvas
			and load the svg
			resource. This is called
			by parent after adding
			the canvas element
		*/
		this.language = language
		loader.show();

		this.fabric_canvas = new fabric.Canvas(id, {
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
				let initial_zoom = this.#Best_Initial_Zoom(); // calculate the zoom that fits best
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
				loader.hide();
				resolve();
			});
		});
	}

	////////////////////////////////////////////
	/// @brief setup all the callback on the map
	/// @param Lines, list of Line Object
	/// @param Station, list of Station Objects
	Setup_Mouse_Handlers = (Lines, Station) => {
		this.Lines = Lines
		this.Station = Station

		this.fabric_canvas.on('mouse:wheel', this.#Handle_User_Mousewheel_Zoom);
		this.fabric_canvas.on('object:moving', this.#Handle_User_Map_Move_Touch);
		// gesture is not well handled with fabricjs, use hammerjs
		let hammer = new Hammer.Manager(this.fabric_canvas.upperCanvasEl); // Initialize hammer
		let pinch = new Hammer.Pinch({ threshold: 0.2 }) // Initialize pinch
		let tap = new Hammer.Tap()
		hammer.add([pinch, tap]);
		hammer.on('pinch', this.#Handle_User_Gesture_Zoom);
		hammer.on('pinchstart', this.#Handle_Pinch_Start)
		hammer.on('pinchend', this.#Handle_Pinch_End)
		hammer.on('pinchcancel', this.#Handle_Pinch_End)

		// main mouse down, prevent ghost clicks from dragging
		this.svg_main_group.on('mousedown', this.#Handle_Main_Group_Mousedown)
	}

		////////////////////////////////////////////////
	/// @brief find objects by complete classname, and optional type
	/// @param id       The id to match exactly
	/// @param obj_type The type of svg object
	Find_Map_Objs_By_Classname = (class_name, obj_type = undefined) => {
		let result_list = [];
		this.#Traverse_All_Canvas_Objects(this.fabric_canvas.getObjects(), 'class', class_name, result_list);
		if (obj_type !== undefined) {
			let typed_result_list = [];
			this.#Traverse_All_Canvas_Objects(result_list, 'type', obj_type, typed_result_list);
			return typed_result_list;
		} else 
			return result_list;
	}

	////////////////////////////////////////////////////////////////////////////////////
	/// @brief as we can not anmiate absolute pan x and y at the same time with given fabricjs functions. We take the animjs package todo the work.
	/// @param zoom_box The target to zoom too a object that contain 
	///                 center_left
	///                 center_top
	///                 zoom_level
	/// @param promise_callback_fnc callback function when the animation is finished
	Animated_Pan_Zoom = async (zoom_box = null) => {
		return new Promise((resolve, reject) => {
			// if an animation is running, interrupt it
			anime.remove(this.move_zoom_animation_obj)
			// reset animation state
			this._Handle_Animation_State(false);
			// reset data
			this.move_zoom_animation_obj = {
				x: 0,
				y: 0,
				zoom: 1
			}

			let that = this;

			const Move_Zoom_Animation = () => {
				
				let orig_zoom = this.fabric_canvas.getZoom();
				this.fabric_canvas.setZoom(1); // this is very important!
				let vpw = that.fabric_canvas.getWidth()
				let vph = that.fabric_canvas.getHeight()
				let target_x = 0
				let target_y = 0
				if (this.client_type !== 'mobile') { // panel is left
					target_x = (zoom_box.center_left - (((vpw - this.panel_detail_space) / zoom_box.zoom_level) / 2))
					target_y = (zoom_box.center_top - ((vph / zoom_box.zoom_level) / 2))
				} else { // do not take any panel space into account
					target_x = (zoom_box.center_left - ((vpw / zoom_box.zoom_level) / 2))
					target_y = (zoom_box.center_top - ((vph / zoom_box.zoom_level) / 2))
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
				const zoom_diff_distance = zoom_box.zoom_level > orig_zoom ? zoom_box.zoom_level - orig_zoom : orig_zoom - zoom_box.zoom_level
				const animation_time = calc_map_animation_timing(point_diff_distance, zoom_diff_distance, this.client_type)
				let mza = anime({
					targets: that.move_zoom_animation_obj,
					zoom: zoom_box.zoom_level,
					x: target_x,
					y: target_y,
					easing: DEFAULT_ANIMATION_EASING,
					duration: animation_time,
					update: function () {
						that.fabric_canvas.setZoom(1); // this is very important!
						that.fabric_canvas.absolutePan({ x: that.move_zoom_animation_obj.x, y: that.move_zoom_animation_obj.y });
						that.fabric_canvas.setZoom(that.move_zoom_animation_obj.zoom);
						that.fabric_canvas.renderAll();
					}
				});
				mza.finished.then(Animation_Finished);
			}

			const Animation_Finished = () => {
				this.fabric_canvas.requestRenderAll();
				this._Handle_Animation_State(false);
				if (promise_callback_fnc !== null) {
					promise_callback_fnc();
				}
			}

			// only start if not running
			if (!this.map_animation_run) {
				this._Handle_Animation_State(true);
				Move_Zoom_Animation();
			} else
				console.warn('animation is already running!');
		});
	}

	/////////////////////////////////////////////////////////////////////////
	/// @brief set the new width and heights, center and zoom to the whole map
	/// @param map_containter_width width of the new map
	/// @param map_container_height height of the new map
	Zoom_Check_Map_Resize = (map_containter_width, map_container_height) => {
		this.fabric_canvas.setWidth(map_containter_width)
		this.fabric_canvas.setHeight(map_container_height)
		this.fabric_canvas.calcOffset()
		this.fabric_canvas.requestRenderAll()
		// do recalc and center
		const initial_zoom = this.#Best_Initial_Zoom()
		this.fabric_canvas.setZoom(initial_zoom)
		this.fabric_canvas.viewportCenterObject(this.svg_main_group)
	}

	///////////////////////////////////////////////////////////////////////////////
	/// @brief Initial animation toward the initial ID of an element inside the map
	/// @note this function is synchronous and wait for the end of the animation
	Initial_Zoom_Move = async () => {
		return new Promise((resolve, reject) => {
			if(this.config.DEBUG) console.log('initial zoom move!');

			let that = this
			let zoom_step = this.config.INITIAL_ZOOM_MOVE_STEP_DESKTOP
			let animation_time = this.config.INITIAL_ZOOM_MOVE_TIME_DESKTOP
			if (this.client_type === 'mobile') {
				zoom_step = this.config.INITIAL_ZOOM_MOVE_STEP_MOBILE
				animation_time = this.config.INITIAL_ZOOM_MOVE_TIME_MOBILE
			}

			const Move_Zoom_Animation = () => {
				const background_res = this._Find_Map_Objs_By_Id(Config.INITIAL_CENTERING_OBJECT_ID, true, 'polygon');
				if (background_res.length === 1) {
					const background = background_res[0];
					let zoom_box = this.Zoom_Box_For_Objs(background)
					let orig_zoom = this.fabric_canvas.getZoom()
					let target_zoom = orig_zoom + zoom_step
					this.fabric_canvas.setZoom(1)
					let vpw = this.fabric_canvas.width / target_zoom
					let vph = this.fabric_canvas.height / target_zoom
					let target_x = (zoom_box.center_left - vpw / 2)
					let target_y = (zoom_box.center_top - vph / 2)
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
						easing: Config.DEFAULT_ANIMATION_EASING,
						duration: animation_time,
						update: function () {
							that.fabric_canvas.setZoom(1); // this is very important!
							that.fabric_canvas.absolutePan({ x: initial_zoom_move_obj.x, y: initial_zoom_move_obj.y });
							that.fabric_canvas.setZoom(initial_zoom_move_obj.zoom);
							that.fabric_canvas.renderAll();
						}
					});
					mza.finished.then(resolve);
				}
			}
			setTimeout(Move_Zoom_Animation, Config.INITIAL_ZOOM_MOVE_DELAY);
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// @brief find the rectangle around one or two objects on the map. If only one object is given, calculate it for only one object
	///        use different spacing if one or two objects are given
	/// @todo check if spacing is sufficient for mobile too!
	/// @return new bounds that can be used for zooming inside the ''Animated_Pan_Zoom'' function
	Zoom_Box_For_Objs = (obj_1, obj_2 = undefined) => {
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
		let x_obj_1_left = m_obj_1[4] - obj_1.width / 2 // translation in X left
		let x_obj_1_right = m_obj_1[4] + obj_1.width / 2 // translation in X right
		let y_obj_1_top = m_obj_1[5] - obj_1.height / 2 // translation in Y top
		let y_obj_1_bottom = m_obj_1[5] + obj_1.height / 2 // translation in Y bottom
		let x_b_left, x_b_right, y_b_top, y_b_bottom
		if (obj_2 !== undefined) {
			let m_obj_2 = obj_2.calcTransformMatrix(false);
			let x_obj_2_left = m_obj_2[4] - obj_2.width / 2 // translation in X left
			let x_obj_2_right = m_obj_2[4] + obj_2.width / 2 // translation in X right
			let y_obj_2_top = m_obj_2[5] - obj_2.height / 2 // translation in Y top
			let y_obj_2_bottom = m_obj_2[5] + obj_2.height / 2 // translation in Y bottom
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
		if (obj_2 === undefined) {
			extra_space = true;
		}
		bounds = this._Optimize_Zoom_Box_For_Viewport(bounds, extra_space);
		return bounds;
	}

	//////////////////////
	/// Protected function
	//////////////////////

	/////////////////////////////////////////////////////////////////////////////////////
	// @brief Handle when the user hover on a object isnide the canva to change the cursor
	_Handle_Mouse_Over_Obj = () => {
		this.fabric_canvas.hoverCursor = "pointer";
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// @brief Handle when the user hover on a object isnide the canva to change the cursor
	_Handle_Mouse_Out_Obj = () => {
		this.fabric_canvas.hoverCursor = "move";
	}

		////////////////////////////////////////////////
	/// @brief find objects by complete id, and optional type
	/// @param id          The id to match exactly
	/// @param exact_Match If true the id must exactly match otherwise its partial ID
	/// @param obj_type    The type of svg object
	_Find_Map_Objs_By_Id = (id, exact_Match, obj_type = undefined) => {
		let result_list = [];
		this.#Traverse_All_Canvas_Objects(this.fabric_canvas.getObjects(), 'id', id, result_list, exact_Match);
		if (obj_type !== undefined) {
			let typed_result_list = [];
			this.#Traverse_All_Canvas_Objects(result_list, 'type', obj_type, typed_result_list, exact_Match);
			return typed_result_list;
		} else 
			return result_list;
	}

	////////////////////////////////////////////////////
	/// @brief find the best bounds for the image
	/// @params bounds     Should be a box where to zoom
	///                    center_left
	///                    center_top
	///                    left
	///                    top
	///                    width
	///                    height
	///                    zoom_level
	/// @param extra_space extra space around the box
	/// @return new bounds that can be used for zooming inside the ''Animated_Pan_Zoom'' function
	_Optimize_Zoom_Box_For_Viewport = (bounds, extra_space) => {
		bounds.center_left = bounds.left + (bounds.width / 2) + (this.fabric_canvas._offset.left / 2);
		let vpw = 0
		let vph = 0

		// add bound space for desktop or tablet
		let bound_space = this.config.ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP
		if (extra_space === true) {
			bound_space = this.config.ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_DESKTOP
		}
		if (this.client_type !== 'mobile') {
			bounds.center_top = bounds.top + (bounds.height / 2) + (this.panel_header_height / 2);
			vpw = this.fabric_canvas.getWidth() - this.panel_detail_space
			vph = this.fabric_canvas.getHeight()
		} else {
			bounds.center_top = bounds.top + (bounds.height / 2) - ((this.panel_header_height + this.panel_detail_space) / 2)
			vpw = this.fabric_canvas.getWidth()
			vph = this.fabric_canvas.getHeight() - this.panel_detail_space - this.panel_header_height
			// adjust bound space for mobile
			bound_space = this.config.ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE
			if (extra_space === true) {
				bound_space = this.config.ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_MOBILE
			}
		}

		let zw = vpw / (bounds.width + bound_space);
		let zh = vph / (bounds.height + bound_space);
		let z = zw < zh ? zw : zh;
		if (z > this.config.MAX_ZOOM_IN) {
			z = this.config.MAX_ZOOM_IN;
		}
		bounds.zoom_level = z;
		return bounds;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/// @brief check if start and current pointer are in a range, else we do not handle click events. on desktop they are always on the same spot. With gestures they can differ around 5 - 10 pixels...
	/// @param pointer coordinate of the pointer
	_Check_Pointer_In_Range = (pointer) => {
		let diff_x = this.last_pointer.x > pointer.x ? this.last_pointer.x - pointer.x : pointer.x - this.last_pointer.x
		let diff_y = this.last_pointer.y > pointer.y ? this.last_pointer.y - pointer.y : pointer.y - this.last_pointer.y

		if (diff_x < this.config.TAP_MAX_DIFF && diff_y < this.config.TAP_MAX_DIFF)
			return true
		else 
			return false
	}

	/////////////////////////////////////////////////////////////
	/// @brief set local state and lock/unlocks the movement axis
	/// @param run state of the animation true if it's runing or false if not
	_Handle_Animation_State = (run) => {

		this.map_animation_run = run;
		// lock/unlock the mouse moving
		if (run) {
			this.svg_main_group.lockMovementX = true;
			this.svg_main_group.lockMovementY = true;
		} else {
			this.svg_main_group.lockMovementX = false;
			this.svg_main_group.lockMovementY = false;
		}
	}
	
	////////////////////
	/// Private function
	////////////////////

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// @brief Handle when the user start a pinching event (save start scale and deactivate movement and lock movement to prevent jiggling around)
	// @param event a hammer event
	#Handle_Pinch_Start = (event) => {
		this.svg_main_group.lockMovementX = true;
		this.svg_main_group.lockMovementY = true;
		this.pinch_start_scale = event.scale
		this.last_scale = event.scale
	}

	//////////////////////////////////////////////////////
	// @brief Handle when the user finish a pinching event (activate movement and remove the move lock)
	// @param event a hammer event
	#Handle_Pinch_End = (event) => {
		this.last_scale = event.scale
		this.svg_main_group.lockMovementX = false;
		this.svg_main_group.lockMovementY = false;
	}

	////////////////////////////////////////////////////////
	// @brief Handle when the user do a zoom with his finger
	// @param event a hammer event
	#Handle_User_Gesture_Zoom = (event) => {
		// uses pinch event from hammerjs
		if (!this.map_animation_run) { 
			if (this.last_scale !== event.scale) {
				this.last_scale = event.scale;
				const current_viewport_transform = this.fabric_canvas.viewportTransform;
				let zoom = this.fabric_canvas.getZoom();

				zoom *= 0.999 ** (this.config.PINCH_STEP_FACTOR * (this.pinch_start_scale - event.scale))

				if (zoom > this.config.MAX_ZOOM_IN) zoom = this.config.MAX_ZOOM_IN;
				if (zoom < this.config.MAX_ZOOM_OUT) zoom = this.config.MAX_ZOOM_OUT;
				// check if the map still would cover the canvas
				if (this.svg_main_group !== null) { // but be safe, else do nothing
					this.fabric_canvas.zoomToPoint({ x: event.center.x, y: event.center.y }, zoom);
					const calc_bounds = this.svg_main_group.getBoundingRect(false, true);
					if ((calc_bounds.left + calc_bounds.width) < this.fabric_canvas.getWidth() || calc_bounds.left > 0)
						this.fabric_canvas.setViewportTransform(current_viewport_transform);
					if ((calc_bounds.top + calc_bounds.height) < this.fabric_canvas.getHeight() || calc_bounds.top > 0)
						this.fabric_canvas.setViewportTransform(current_viewport_transform);
					this.fabric_canvas.requestRenderAll();
				}
			}
		}
	}

	////////////////////////////////////////////////////////
	// @brief Zoom into map with normalized delta. If the zoom would reveal the background just apply the current viewport Transform means, nothing happens
	// @param event a hammer event
	// @todo if zoomed in a corner and near the edge, no zoom out is possible, we should actually pan and zoom
	#Handle_User_Mousewheel_Zoom = (opt) => {
		if (!this.map_animation_run) {
			const normalized = normalizeWheel(opt.e);
			const current_viewport_transform = this.fabric_canvas.viewportTransform;
			let zoom = this.fabric_canvas.getZoom();
			zoom *= 0.999 ** normalized.pixelY;
			if (zoom > this.config.MAX_ZOOM_IN) zoom = this.config.MAX_ZOOM_IN;
			if (zoom < this.config.MAX_ZOOM_OUT) zoom = this.config.MAX_ZOOM_OUT;
			// check if the map still would cover the canvas
			if (this.svg_main_group !== null) { // but be safe, else do nothing
				this.fabric_canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
				const calc_bounds = this.svg_main_group.getBoundingRect(false, true);
				if ((calc_bounds.left + calc_bounds.width) < this.fabric_canvas.getWidth() || calc_bounds.left > 0)
					this.fabric_canvas.setViewportTransform(current_viewport_transform);
				if ((calc_bounds.top + calc_bounds.height) < this.fabric_canvas.getHeight() || calc_bounds.top > 0)
					this.fabric_canvas.setViewportTransform(current_viewport_transform);
			}
		}
		opt.e.preventDefault();
		opt.e.stopPropagation();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// @brief called when the user drag the map wit hthe mouse or touch. keep the map inside the canva avoid showing the background
	// @param opt is the hammer event when we are moving around
	#Handle_User_Map_Move_Touch = (opt) => {
		// if we have a pinch gesture going on, return and let hammerjs handle it in #Handle_User_Gesture_Zoom
		if (opt.e.touches && opt.e.touches.length === 2) { return; }

		if (!this.map_animation_run) {
			const obj = opt.target
			const calc_bounds = obj.getBoundingRect(false, true);
			if (calc_bounds.left > 0) {
				obj.set('left', this.last_bounding_data.left);
				obj.setCoords();
			} else {
				this.last_bounding_data.left = obj.left;
			}
			if (calc_bounds.top > 0) {
				obj.set('top', this.last_bounding_data.top);
				obj.setCoords();
			} else {
				this.last_bounding_data.top = obj.top;
			}
			const bottom = (calc_bounds.top + calc_bounds.height) - this.fabric_canvas.getHeight();
			if (bottom < 0) {
				obj.set('top', this.last_bounding_data.bottom);
				obj.setCoords();
			} else {
				this.last_bounding_data.bottom = obj.top;
			}
			const right = (calc_bounds.left + calc_bounds.width) - this.fabric_canvas.getWidth();
			if (right < 0) {
				obj.set('left', this.last_bounding_data.right);
				obj.setCoords();
			} else {
				this.last_bounding_data.right = obj.left;
			}
		}
	}

	///////////////////////////////////////////////////////////////
	// @bried save the last pointer position to prevent ghost click
	// @param event hammer overn
	#Handle_Main_Group_Mousedown = (event) => {
		this.last_pointer = event.pointer
	}

	/////////////////////////////////////////////////////////////////////////////////////////////
	/// @brief find the right zoom to show the initialized map by using the main centering object
	/// @return the scale value as float
	#Best_Initial_Zoom = () => {
		let initial_zoom = this.config.INITIAL_ZOOM; // return that if object not found
		const background_res = this._Find_Map_Objs_By_Id(Config.INITIAL_CENTERING_OBJECT_ID, true, 'polygon');
		if (background_res.length === 1) {
			const background = background_res[0];
			let vpw = this.fabric_canvas.getWidth()
			let vph = this.fabric_canvas.getHeight()
			let zw = 0
			let zh = 0
			let z = 0
			let additional_bound_zoom_space = this.config.INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP
			if (this.client_type === 'mobile') {
				additional_bound_zoom_space = this.config.INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE
			}
			// check if backround is smaller than the viewport -> we do not cover
			if (background.width < vpw || background.height < vph) {
				if (background.width < vpw)
					zw = vpw / (this.svg_main_group.width)
				else
					zw = vpw / (background.width + additional_bound_zoom_space);
				if (background.height < vph)
					zh = vph / (this.svg_main_group.height)
				else
					zh = vph / (background.height + additional_bound_zoom_space);
				z = zw > zh ? zw : zh;
			} else { // it would cover the viewport
				zw = vpw / (background.width + additional_bound_zoom_space);
				zh = vph / (background.height + additional_bound_zoom_space);

				z = zw < zh ? zw : zh;

				// on some screen proportions there is a correction needed!
				let z_cor = 0
				if ((this.svg_main_group.width * z) < vpw) {
					const diff = vpw - (this.svg_main_group.width * z)
					z_cor = ((this.svg_main_group.width - diff) / vpw) / 100
				}
				if ((this.svg_main_group.height * z) < vph) {
					const diff = vph - (this.svg_main_group.height * z)
					z_cor = ((this.svg_main_group.height - diff) / vph) / 100
				}
				z += z_cor

			}
			if (z > this.config.MAX_ZOOM_IN) // prevent to much zoom
				z = this.config.MAX_ZOOM_IN;
			initial_zoom = z;
		} else
			console.warn('Best_Initial_Zoom: Cannot calculate initial zoom, object not found!');
		return initial_zoom;
	}

	///////////////////////////////////////////////////////////////////////
	/// @brief recursive traverse through all objects, find attr with value
	/// @param objects        An array object where we will look for
	/// @param attr           The attribute we are checking of the objects
	/// @param val            The value of the attribute we are looking for
	/// @param result_list    The result list that will contain all the objects that match the ''val'' for this ''attribut''
	/// @param val_full_match If true value should be completly equals if false the value of the attribute should only include ''val''
	#Traverse_All_Canvas_Objects = (objects, attr, val, result_list, val_full_match = true) => {
		for (let obj of objects) {
			if (obj['type'].includes('group'))
				this.#Traverse_All_Canvas_Objects(obj.getObjects(), attr, val, result_list, val_full_match);
			else {
				//console.warn('traverse, attr is: '+obj[attr])
				if (val_full_match === true) 
					if (obj[attr] === val)
						result_list.push(obj);
				else 
					if (obj[attr].includes(val)) 
						result_list.push(obj);
			}
		}
	}

	///////////////////////////
	/// Private static function
	///////////////////////////

	static #Initialize_Fabric() {
		// adjust some stuff in the library for better randering
		fabric.Object.prototype.objectCaching = false;
		// we need to add "class" as a attribute to the parser, else it get's lost!
		fabric.SHARED_ATTRIBUTES.push('class')
		// add it to the objects we need, because shared attributes above is merged with them on library initialization :-()
		fabric.Path.ATTRIBUTE_NAMES.push('class')
		fabric.Line.ATTRIBUTE_NAMES.push('class')
		fabric.Text.ATTRIBUTE_NAMES.push('class')
		fabric.Rect.ATTRIBUTE_NAMES.push('class')
		fabric.Circle.ATTRIBUTE_NAMES.push('class')
		fabric.Polygon.ATTRIBUTE_NAMES.push('class')
	}

}

export default SVG_Map;