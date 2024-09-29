
 const INITIAL_ZOOM = 0.7; // initial zoom, perhaps this needs a calculation
 const MAX_ZOOM_IN = 2.1; // max zoom in
 const MAX_ZOOM_OUT = 0.01; // max zoom out, never reached, because the max zoom out is restricted if the map would not cover the canvas

//  const MIN_MAP_ANIMATION_TIME_DESKTOP = 500 // min animation time in ms
//  const MAX_MAP_ANIMATION_TIME_DESKTOP = 1700 // max animaton time in ms
//
//  const MIN_MAP_ANIMATION_TIME_MOBILE = 250 // min animation time in ms
//  const MAX_MAP_ANIMATION_TIME_MOBILE = 1500 // max animaton time in ms

 const MIN_MAP_ANIMATION_TIME_DESKTOP = 1500 // min animation time in ms
 const MAX_MAP_ANIMATION_TIME_DESKTOP = 2500 // max animaton time in ms

 const MIN_MAP_ANIMATION_TIME_MOBILE = 750 // min animation time in ms
 const MAX_MAP_ANIMATION_TIME_MOBILE = 2000 // max animaton time in ms


//  const INITIAL_ZOOM_MOVE_DELAY = 500 // wait until moving
//  const INITIAL_ZOOM_MOVE_TIME_DESKTOP = 500 // animation duration
//  const INITIAL_ZOOM_MOVE_TIME_MOBILE = 500 // animation duration
//  const INITIAL_ZOOM_MOVE_STEP_DESKTOP = 0.1 // zoom step in
//  const INITIAL_ZOOM_MOVE_STEP_MOBILE = 0.05 // zoom step in

 const INITIAL_ZOOM_MOVE_DELAY = 600 // wait until moving
 const INITIAL_ZOOM_MOVE_TIME_DESKTOP = 2000 // animation duration
 const INITIAL_ZOOM_MOVE_TIME_MOBILE = 2000 // animation duration
 const INITIAL_ZOOM_MOVE_STEP_DESKTOP = 0.18 // zoom step in
 const INITIAL_ZOOM_MOVE_STEP_MOBILE = 0.3 // zoom step in


 const COLOR_ANIMATION_TIME = 150 // color change animation time (lines, labels)

 const ADDITIONAL_BOUND_ZOOM_SPACE_DESKTOP = 200; // add this to bound zoom calculation to not be on the canvas border
 const ADDITIONAL_BOUND_ZOOM_SPACE_MOBILE = 150; // add this to bound zoom calculation to not be on the canvas border
 const ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_DESKTOP = 1000; // add this to bound zoom calculation to not be on the canvas border
 const ADDITIONAL_SINGLE_BOUND_ZOOM_SPACE_MOBILE = 500; // add this to bound zoom calculation to not be on the canvas border

 const ADDITIONAL_VISIBLE_SPACE_MARGIN_DESKTOP = 60 // add this as visible space margin, for the object is visible in canvas check
 const ADDITIONAL_VISIBLE_SPACE_MARGIN_MOBILE = 10 // add this as visible space margin, for the object is visible in canvas check

 const DEFAULT_ANIMATION_EASING = 'easeInOutQuart'
 const SWITZERLAND_BACKGROUND_OBJ_ID = 'switzerland-background'
 const PINCH_STEP_FACTOR = 40 // factor to multiplicate the scale result
 const TAP_MAX_DIFF = 10 // max difference between tap coordinates to recognize click on a element
