import { fabric } from '../../libraries/fabric_wrapper.js';
import { anime } from '../../libraries/animejs_wrapper.js';
import { Hammer } from '../../libraries/hammer_wrapper.js';
import {normalizeWheel} from '../../libraries/normalizeWheel.js';
import Utils from '../utils/utils.js';


/**
 * SVG_Map declare a picture SVG map where we can manipulate object and zoom to object inside the map
 */
class SVG_Map {

	/**
	 * 
	 * @param {String} client_type if you areusing mobile or desktop
	 * @param {String} filename the filename of the svg map
	 * @param {Object} config config of the svg map (see config)
	 */
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

	/**
	* Setup the map to be viewd
	* @param {String} language language of the map
	* @param {String} id id to create the canva to
	*/
	Setup = (language, id) => {
		/*
			Setup the canvas
			and load the svg
			resource. This is called
			by parent after adding
			the canvas element
		*/
		this.language = language

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
				this.fabric_canvas.requestRenderAll();
				// fill check bound data with initial values
				this.last_bounding_data = {
					left: obj.left,
					top: obj.top,
					right: obj.left,
					bottom: obj.top
				};
				resolve();
			});
		});
	}

	/**
	 * Setup all the callback on the map
	 */
	Setup_Mouse_Handlers = () => {

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

	/**
	* find objects by complete classname, and optional type
	* @param {String} class_name   The class to match exactly
	* @param {class_name} obj_type The type of svg object
	*/
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

	/**
	* @brief as we can not anmiate absolute pan x and y at the same time with given fabricjs functions. We take the animjs package todo the work.
	* @param {Bound} zoom_box The target to zoom too an object that contain 
	*                 center_left
	*                 center_top
	*                 zoom_level
	* @param {function} promise_callback_fnc callback function when the animation is finished
	*/
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
				let viewport_width = that.fabric_canvas.getWidth()
				let viewport_height = that.fabric_canvas.getHeight()
				let target_x = 0
				let target_y = 0
				if (this.client_type !== 'mobile') { // panel is left
					target_x = (zoom_box.center_left - (((viewport_width - this.panel_detail_space) / zoom_box.zoom_level) / 2))
					target_y = (zoom_box.center_top - ((viewport_height / zoom_box.zoom_level) / 2))
				} else { // do not take any panel space into account
					target_x = (zoom_box.center_left - ((viewport_width / zoom_box.zoom_level) / 2))
					target_y = (zoom_box.center_top - ((viewport_height / zoom_box.zoom_level) / 2))
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
				const animation_time = Calc_Map_Animation_Timing(point_diff_distance, zoom_diff_distance)
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

	/**
	* Set the new width and heights, center and zoom to the whole map
	* @param {Number} map_containter_width width of the new map
	* @param {Number} map_container_height height of the new map
	*/
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

	/**
	* Initial animation toward the initial ID of an element inside the map
	* This function is synchronous and wait for the end of the animation
	*/
	async Initial_Zoom_Move() {

		const background_object = this._Find_Map_Objs_By_Id(this.config.INITIAL_CENTERING_OBJECT_ID, true, 'path')[0];
		if (!background_object) return;

		// This create flicking animation maybe it should not be used
		await new Promise(resolve => setTimeout(resolve, this.config.INITIAL_ZOOM_MOVE_DELAY));

		if(this.config.DEBUG) console.log('initial zoom move!');
		this.map_animation_run = true;

		const zoom_box = this.Zoom_Box_For_Objs(background_object);
		const orig_zoom = this.fabric_canvas.getZoom();
		const target_zoom = orig_zoom + this.config.INITIAL_ZOOM_MOVE_STEP_DESKTOP;

		this.fabric_canvas.setZoom(1);
		const viewport_width = this.fabric_canvas.width / target_zoom;
		const viewport_height = this.fabric_canvas.height / target_zoom;
		const target_x = (zoom_box.center_left - viewport_width / 2);
		const target_y = (zoom_box.center_top - viewport_height / 2);

		const initial_zoom_move_obj = {
			zoom: orig_zoom,
			x: fabric.util.invertTransform(this.fabric_canvas.viewportTransform)[4],
			y: fabric.util.invertTransform(this.fabric_canvas.viewportTransform)[5]
		};

		await anime({
			targets: initial_zoom_move_obj,
			zoom: target_zoom,
			x: target_x,
			y: target_y,
			easing: this.config.DEFAULT_ANIMATION_EASING,
			duration: this.config.INITIAL_ZOOM_MOVE_TIME_DESKTOP,
			update: () => {
				this.fabric_canvas.setZoom(1); // this is very important!
				this.fabric_canvas.absolutePan({ x: initial_zoom_move_obj.x, y: initial_zoom_move_obj.y });
				this.fabric_canvas.setZoom(initial_zoom_move_obj.zoom);
				this.fabric_canvas.renderAll();
			}
		});

		this.map_animation_run = false;
	}

	/**
	 * Find the rectangle around one or two objects on the map. If only one object is given, calculate it for only one object
	 *
	 * @param {Object} obj1 - the first object to calculate the bounds for
	 * @param {Object} [obj2] - the second object to calculate the bounds for (if given)
	 * @return {Bound} new bounds that can be used for zooming inside the ''Animated_Pan_Zoom'' function
	 */
	Zoom_Box_For_Objs(obj1, obj2 = undefined) {
		let bounds = {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			center_left: 0,
			center_top: 0,
			zoom_level: 2, // fix for now
		};

		// Compute the bounds for each objects
		const { left: obj_1_left, right: obj_1_right, top: obj_1_top, bottom: obj_1_bottom } = this._GetObjectBounds(obj1);
		let obj_2_left, obj_2_right, obj_2_top, obj_2_bottom;
		if (obj2 !== undefined) {
			({ left: obj_2_left, right: obj_2_right, top: obj_2_top, bottom: obj_2_bottom } = this._GetObjectBounds(obj2));
		}

		// find the min and max of the two objects bounds
		bounds.left   = Math.min(obj_1_left  , obj_2_left   ?? obj_1_left);
		bounds.width  = Math.max(obj_1_right , obj_2_right  ?? obj_1_right) - bounds.left;
		bounds.top    = Math.min(obj_1_top   , obj_2_top    ?? obj_1_top);
		bounds.height = Math.max(obj_1_bottom, obj_2_bottom ?? obj_1_bottom) - bounds.top;

		// add extra space if only a second ovject is present
		const extraSpace = obj2 === undefined;
		bounds = this._Optimize_Zoom_Box_For_Viewport(bounds, extraSpace);
		return bounds;
	}

	_GetObjectBounds(object) {
		const matrix = object.calcTransformMatrix(false);
		const xLeft = matrix[4] - object.width / 2;
		const xRight = matrix[4] + object.width / 2;
		const yTop = matrix[5] - object.height / 2;
		const yBottom = matrix[5] + object.height / 2;

		return { left: xLeft, right: xRight, top: yTop, bottom: yBottom };
	}

	//////////////////////
	/// Protected function
	//////////////////////

	/**
	* Handle when the user hover on a object isnide the canva to change the cursor
	* @protected
	*/
	_Handle_Mouse_Over_Obj = () => {
		this.fabric_canvas.hoverCursor = "pointer";
	}

	/**
	* Handle when the user hover on a object isnide the canva to change the cursor
	* @protected
	*/
	_Handle_Mouse_Out_Obj = () => {
		this.fabric_canvas.hoverCursor = "move";
	}

	/**
	* Find objects by complete id, and optional type
	* @param {String}  id          The id to match exactly
	* @param {Boolean} exact_Match If true the id must exactly match otherwise its partial ID
	* @param {String}  obj_type    The type of svg object
	* @returns {fabric.Object[]}  The list of objects that match the conditions
	* @protected
	*/
	_Find_Map_Objs_By_Id(id, exact_Match, obj_type = undefined)  {
		let result_list = [];
		this.#Traverse_All_Canvas_Objects(this.fabric_canvas.getObjects(), 'id', id, result_list, exact_Match);
		if (obj_type !== undefined) {
			let typed_result_list = [];
			this.#Traverse_All_Canvas_Objects(result_list, 'type', obj_type, typed_result_list, exact_Match);
			return typed_result_list;
		} 
		return result_list;
	}

	/**
	* Find the best bounds for the image, taking into account the client type and the viewport size
	* @param {Bounds} bounds     Should be a box where to zoom
	*                    center_left
	*                    center_top
	*                    left
	*                    top
	*                    width
	*                    height
	*                    zoom_level
	* @param {Boolean} extra_space extra space around the box
	* @return new bounds that can be used for zooming inside the ''Animated_Pan_Zoom'' function
	* @protected
	*/
	_Optimize_Zoom_Box_For_Viewport(bounds, extra_space) {
		// Compute the center of the box
		bounds.center_left = bounds.left + (bounds.width / 2) + (this.fabric_canvas._offset.left / 2);

		// Depending on the client type (mobile or desktop) we need to adjust the top and the viewport size
		if(this.client_type === 'mobile') {
			// We add the header height and the detail space to the top
			var additional_bounding_zoom_space = extra_space ? this.config.ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_MOBILE : this.config.ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE 
			bounds.center_top = bounds.top + (bounds.height / 2) + (this.panel_header_height / 2);

			// We substract the detail space and the header height from the viewport height
			var viewport_width = this.fabric_canvas.getWidth();
			var viewport_height = this.fabric_canvas.getHeight()  - this.panel_detail_space - this.panel_header_height;
		}
		else {
			// We substract the header height and the detail space from the top
			var additional_bounding_zoom_space = extra_space ? this.config.ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_DESKTOP : this.config.ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP 
			bounds.center_top = bounds.top + (bounds.height / 2) - ((this.panel_header_height + this.panel_detail_space) / 2);

			// We substract the detail space from the viewport width
			var viewport_width = this.fabric_canvas.getWidth() - this.panel_detail_space;
			var viewport_height = this.fabric_canvas.getHeight();
		}

		// Compute the zoom level
		const zoomWidth = viewport_width / (bounds.width + additional_bounding_zoom_space); 
		const zoomHeight = viewport_height / (bounds.height + additional_bounding_zoom_space); 
		const zoomLevel = Math.min(zoomWidth, zoomHeight);
		bounds.zoom_level = Math.min(this.config.MAX_ZOOM_IN, zoomLevel);
	
		return bounds;
	}

	/**
	* Check if start and current pointer are in a range, else we do not handle click events. on desktop they are always on the same spot. With gestures they can differ around 5 - 10 pixels...
	* @param {Point} pointer coordinate of the pointer
	* @returns {Boolean}
	* @protected
	*/
	_Check_Pointer_In_Range(pointer) {
		let diff_x = this.last_pointer.x > pointer.x ? this.last_pointer.x - pointer.x : pointer.x - this.last_pointer.x
		let diff_y = this.last_pointer.y > pointer.y ? this.last_pointer.y - pointer.y : pointer.y - this.last_pointer.y

		if (diff_x < this.config.TAP_MAX_DIFF && diff_y < this.config.TAP_MAX_DIFF)
			return true
		else 
			return false
	}

	/**
	* Set local state and lock/unlocks the movement axis
	* @param {Boolean} run state of the animation true if it's runing or false if not
	*/
	_Handle_Animation_State = (run) => {

		this.map_animation_run = run;
		// lock/unlock the mouse moving
		this.svg_main_group.lockMovementX = run ? true : false; 
		this.svg_main_group.lockMovementY = run ? true : false;
	}

	/**
	 * Calculate the animation time for the map animation based on the distance the user
	 * moved their finger and the zoom difference.
	 * The formula is designed to make the animation time longer when the zoom distance and point distance are far apart.
	 *
	 * @param {number} point_diff_distance The distance in pixels the user moved their finger.
	 * @param {number} zoom_diff_distance The difference in zoom level.
	 * @returns {number} The animation time in milliseconds.
	 * @protected
	 */
	_calcMapAnimationTiming(point_diff_distance, zoom_diff_distance) {
		// The minimum and maximum animation times are different for desktop and mobile
		// devices. The times are set in the config object.
		const min_animation_time = this.client_type === 'desktop'
			? this.config.MIN_MAP_ANIMATION_TIME_DESKTOP
			: this.config.MIN_MAP_ANIMATION_TIME_MOBILE;
		const max_animation_time = this.client_type === 'desktop'
			? this.config.MAX_MAP_ANIMATION_TIME_DESKTOP
			: this.config.MAX_MAP_ANIMATION_TIME_MOBILE;

		// Calculate the speed of the movement and the zoom difference in pixels per
		// millisecond.
		const move_speed = point_diff_distance / max_animation_time;
		const zoom_speed = zoom_diff_distance / max_animation_time;

		// Calculate a factor that will be used to calculate the animation time. The
		// factor is a value between 0 and 1 that indicates how slow we should go considering the distances and zoom diference
		const factor = move_speed + zoom_speed;

		// Calculate the animation time by subtracting the factor from the maximum
		// animation time. If the result is smaller than the minimum animation time,
		// use the minimum animation time.
		const calculated_animation_time = max_animation_time - (factor * max_animation_time);
		return calculated_animation_time < min_animation_time
			? min_animation_time
			: calculated_animation_time;

	}

	
	////////////////////
	/// Private function
	////////////////////

	/**
	* Handle when the user start a pinching event (save start scale and deactivate movement and lock movement to prevent jiggling around)
	* @param {Event} event a hammer event
	* @private
	*/
	#Handle_Pinch_Start = (event) => {
		this.svg_main_group.lockMovementX = true;
		this.svg_main_group.lockMovementY = true;
		this.pinch_start_scale = event.scale
		this.last_scale = event.scale
	}

	/**
	* Handle when the user finish a pinching event (activate movement and remove the move lock)
	* @param {Event} event a hammer event
	* @private
	*/
	#Handle_Pinch_End = (event) => {
		this.last_scale = event.scale
		this.svg_main_group.lockMovementX = false;
		this.svg_main_group.lockMovementY = false;
	}

	/**
	* Handle when the user do a zoom with his finger
	* @param {Event} event a hammer event
	* @private
	*/
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

	/**
	* Zoom into map with normalized delta. If the zoom would reveal the background, nothing happens.
	* @param {Event} event A hammer event.
	* @todo If zoomed in a corner and near the edge, no zoom out is possible; we should actually pan and zoom.
	* @private
	*/
	#Handle_User_Mousewheel_Zoom = (event) => {
		// Return early if a map animation is running
		if (this.map_animation_run) return;

		// Normalize the wheel event delta for consistent zoom behavior
		const normalized = normalizeWheel(event.e);

		// Get the current viewport transform and calculate the new zoom level
		const current_viewport_transform = this.fabric_canvas.viewportTransform;
		let zoomLevel = this.fabric_canvas.getZoom() * Math.pow(0.999, normalized.pixelY);

		// Bound the zoomLevel within the defined max and min limits
		zoomLevel = Utils.Round_Bound(zoomLevel, this.config.MAX_ZOOM_OUT, this.config.MAX_ZOOM_IN);

		// If the main SVG group exists, apply zoom to the point
		if (this.svg_main_group !== null) {
			this.fabric_canvas.zoomToPoint({ x: event.e.offsetX, y: event.e.offsetY }, zoomLevel);
			const bounding_rect = this.svg_main_group.getBoundingRect(false, true);

			// Check if the zoom would expose the background and revert if necessary
			if ((bounding_rect.left + bounding_rect.width) < this.fabric_canvas.getWidth() || bounding_rect.left > 0)
				this.fabric_canvas.setViewportTransform(current_viewport_transform);
			if ((bounding_rect.top + bounding_rect.height) < this.fabric_canvas.getHeight() || bounding_rect.top > 0)
				this.fabric_canvas.setViewportTransform(current_viewport_transform);
		}

		// Prevent default scrolling behavior and stop event propagation
		event.e.preventDefault();
		event.e.stopPropagation();
	}

	/**
	* Called when the user drags the map with the mouse or touch. Keep the map inside the canvas, avoiding showing the background.
	* @param {Event} event is the hammer event when we are moving around
	* @private
	*/
	#Handle_User_Map_Move_Touch = (event) => {
		// if we have a pinch gesture going on, return and let hammerjs handle it in #Handle_User_Gesture_Zoom
		if (event.e.touches && event.e.touches.length === 2 || this.map_animation_run) return;

		const object = event.target;
		const bounding_rect = object.getBoundingRect(false, true);
		const object_left = object.left;
		const object_top = object.top;

		// Check if the left side of the map is out of bounds
		if (bounding_rect.left > 0) 
			object.set('left', this.last_bounding_data.left);
		else
			this.last_bounding_data.left = object_left;

		// Check if the top side of the map is out of bounds
		if (bounding_rect.top > 0)
			object.set('top', this.last_bounding_data.top);
		else
			this.last_bounding_data.top = object_top;

		// Check if the bottom side of the map is out of bounds
		const bottom = (bounding_rect.top + bounding_rect.height) - this.fabric_canvas.getHeight();
		if (bottom < 0)
			object.set('top', this.last_bounding_data.bottom);
		else
			this.last_bounding_data.bottom = object_top;

		// Check if the right side of the map is out of bounds
		const right = (bounding_rect.left + bounding_rect.width) - this.fabric_canvas.getWidth();
		if (right < 0)
			object.set('left', this.last_bounding_data.right);
		else
			this.last_bounding_data.right = object_left;

		object.setCoords();
	}


	/**
	* Save the last pointer position to prevent ghost click
	* @param {Event} event hammer event
	* @private
	*/
	#Handle_Main_Group_Mousedown = (event) => {
		this.last_pointer = event.pointer
	}

	/**
	 * Calculate the optimal initial zoom for displaying the map using the main centering object.
	 * @return {number} The optimal scale value as a float.
	 * @private
	 */
	#Best_Initial_Zoom() {
		// Find the centering object by ID
		const centering_objects = this._Find_Map_Objs_By_Id(this.config.INITIAL_CENTERING_OBJECT_ID, true, 'path');

		// Check if exactly one centering object is found
		if (centering_objects.length !== 1) {
			if (this.config.DEBUG) console.warn('Best_Initial_Zoom: Cannot calculate initial zoom, object not found!');
			return this.config.INITIAL_ZOOM;
		}

		const centering_object = centering_objects[0];
		const viewport_width = this.fabric_canvas.getWidth();
		const viewport_height = this.fabric_canvas.getHeight();

		// Determine additional bound space based on client type
		const additionalBoundSpace = this.client_type === 'mobile'
			? this.config.INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE
			: this.config.INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP;

		let zoom_width, zoom_height, calculated_zoom;

		// Check if centering object is smaller than the viewport
		if (centering_object.width < viewport_width || centering_object.height < viewport_height) {
			zoom_width = viewport_width / this.svg_main_group.width;
			zoom_height = viewport_height / this.svg_main_group.height;

			// Adjust zoom width if centering object width exceeds viewport
			if (centering_object.width >= viewport_width)
				zoom_width = viewport_width / (centering_object.width + additionalBoundSpace);

			// Adjust zoom height if centering object height exceeds viewport
			if (centering_object.height >= viewport_height)
				zoom_height = viewport_height / (centering_object.height + additionalBoundSpace);

			calculated_zoom = Math.max(zoom_width, zoom_height);
		} else {
			zoom_width = viewport_width / (centering_object.width + additionalBoundSpace);
			zoom_height = viewport_height / (centering_object.height + additionalBoundSpace);

			calculated_zoom = Math.min(zoom_width, zoom_height);

			let correction_factor = 0;

			// Correct zoom if scaled group width is less than viewport width
			if ((this.svg_main_group.width * calculated_zoom) < viewport_width) {
				const width_difference = viewport_width - (this.svg_main_group.width * calculated_zoom);
				correction_factor = ((this.svg_main_group.width - width_difference) / viewport_width) / 100;
			}

			// Correct zoom if scaled group height is less than viewport height
			if ((this.svg_main_group.height * calculated_zoom) < viewport_height) {
				const height_difference = viewport_height - (this.svg_main_group.height * calculated_zoom);
				correction_factor = ((this.svg_main_group.height - height_difference) / viewport_height) / 100;
			}

			calculated_zoom += correction_factor;
		}

		// Bound the calculated zoom value within defined limits
		return Utils.Round_Bound(calculated_zoom, this.config.MAX_ZOOM_OUT, this.config.MAX_ZOOM_IN);
	}

	/**
	 * Recursively traverse through all objects, find attribute with value
	 *
	 * @param {Object[]} objects         An array of objects where we will look for
	 * @param {string}   attributeName   The attribute we are checking of the objects
	 * @param {string}   attributeValue  The value of the attribute we are looking for
	 * @param {Object[]} result          The result list that will contain all the objects that match the attributeValue for this attributeName
	 * @param {boolean}  fullMatch       If true, the attributeValue should be exactly equal to the object's attribute value. If false, the attributeValue should be a substring of the object's attribute value
	*/
	#Traverse_All_Canvas_Objects = (objects, attributeName, attributeValue, result, fullMatch = true) => {
		for (const obj of objects) {
			if (obj.type.includes('group'))
				this.#Traverse_All_Canvas_Objects(obj.getObjects(), attributeName, attributeValue, result, fullMatch);
			else {
				if (fullMatch)
					if (obj[attributeName] === attributeValue)
						result.push(obj);
				else 
					if (obj[attributeName].includes(attributeValue))
						result.push(obj);
			}
		}
	}

	///////////////////////////
	/// Private static function
	///////////////////////////

	// Staticaly initialize fabric
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