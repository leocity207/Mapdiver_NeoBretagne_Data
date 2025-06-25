

/**
 * Base configuration for the SVG map Object
 */
export const Config = {

	/**
	 * if debug log should be enabled
	 */
	DEBUG: false,

	/**
	 * Initial Zoom value if we cannot zoom on object ID
	 */
	INITIAL_ZOOM : 0.7,
	/**
	 * Initial object ID to center the view on
	 */
	INITIAL_CENTERING_OBJECT_ID: "FR-BRE",

	/**
	 * add this to bound zoom calculation to not be on the canvas border
	 */
	INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP : 200,
	INITIAL_ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE : 150,

	/**
	 * max zoom in by scrolling
	 */
	MAX_ZOOM_IN : 2.1,

	/**
	 * max zoom out, never reached, because the max zoom out is restricted if the map would not cover the canvas
	 */
	MAX_ZOOM_OUT : 0.01,

	/**
	 *  min animation time in ms
	 */
	MIN_MAP_ANIMATION_TIME_DESKTOP : 1500, // min animation time in ms
	MIN_MAP_ANIMATION_TIME_MOBILE : 750, // min animation time in ms

	/**
	 *  max animation time in ms
	 */
	MAX_MAP_ANIMATION_TIME_DESKTOP : 2500, // max animaton time in ms
	MAX_MAP_ANIMATION_TIME_MOBILE : 2000, // max animaton time in ms

	/**
	 * Initial zoom move delay before starting the animation in ms
	 */
	INITIAL_ZOOM_MOVE_DELAY : 600,

	/**
	 * Initial animation duration in ms
	 */
	INITIAL_ZOOM_MOVE_TIME_DESKTOP : 2000,
	INITIAL_ZOOM_MOVE_TIME_MOBILE : 2000,

	/**
	 * Initial zoom step to be added to the current zoom to get the correct zoom
	 */
	INITIAL_ZOOM_MOVE_STEP_DESKTOP : 0.18,
	INITIAL_ZOOM_MOVE_STEP_MOBILE : 0.3,

	/**
	 * add this to bound zoom calculation to not be on the canvas border
	 */
	ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_DESKTOP : 1000,
	ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_MOBILE : 500,

	/**
	 * add this as visible space margin, for the object is visible in canvas check
	 */
	ADDITIONAL_VISIBLE_SPACE_MARGIN_DESKTOP : 60,
	ADDITIONAL_VISIBLE_SPACE_MARGIN_MOBILE : 10,

	/**
	 * default easing animation
	 */
	DEFAULT_ANIMATION_EASING : 'inOutQuart',

	/**
	 * if the transition between animation should be hard or eased
	 */
	HARD_ANIMATION_TRANSITION: false,

	/**
	 * factor to multiplicate the scale result when the user scrol
	 */
	PINCH_STEP_FACTOR : 40,

	/**
	 * max difference between tap coordinates to recognize click on a element
	 */
	TAP_MAX_DIFF : 10,
}

/**
 * Config for the Network Page object
 */
export const Network_Config = {

	/**
	 * Track or Line prefix ID
	 */
	TRACK_PREFIX_ID: 'L-',

	/**
	 * Line label prefix ID
	 */
	LINE_LABEL_PREFIX_ID: 'LT-',

	/**
	 * Station Icon prefix ID
	 */
	STATION_PREFIX_ID: 'S-',

	/**
	 * Station label Prefix ID
	 */
	STATION_LABEL_PREFIX_ID: 'ST-',

	/**
	 * Color change animation time (lines, labels)
	 * When the user select
	 */
	COLOR_ANIMATION_TIME : 150,

	/**
	 * Color to use when a line is disabled
	 */
	DISABLE_ELEMENT_COLOR: '#CECECE'
}