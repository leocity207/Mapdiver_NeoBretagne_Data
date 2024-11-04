class Util {
    static  Calc_Map_Animation_Timing = (point_diff_distance, zoom_diff_distance, client_type, config) => {
        let min_map_animation_time = config.MIN_MAP_ANIMATION_TIME_DESKTOP
        let max_map_animation_time = config.MAX_MAP_ANIMATION_TIME_DESKTOP
        if(client_type === 'mobile') {
            min_map_animation_time = config.MIN_MAP_ANIMATION_TIME_MOBILE
            max_map_animation_time = config.MAX_MAP_ANIMATION_TIME_MOBILE
        }
        let calc_animation_time = min_map_animation_time
        const move_speed = point_diff_distance / max_map_animation_time
        const zoom_speed = zoom_diff_distance / max_map_animation_time
        const factor = move_speed + zoom_speed
        calc_animation_time = max_map_animation_time - (factor * max_map_animation_time)
        const animation_time = calc_animation_time < min_map_animation_time ? min_map_animation_time : calc_animation_time
        if(config.debuf) console.log('move distance: '+point_diff_distance+' zoom distance: '+zoom_diff_distance+' resulting time in ms: '+animation_time);
        return animation_time
    }

    /*
        We need to convert some rgba values after animation to
        hex for comparison reasons
    */

    static Rgba_To_Hex = (rgba, with_alpha=false) => {
        if(rgba.indexOf('#') !== -1)
            return rgba
        let rgb = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        let hex_str = 	(rgb && rgb.length === 4) ? "#" +
                        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
        return 	hex_str.toUpperCase()
    }
}

export default Util