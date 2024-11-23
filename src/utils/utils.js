
/**
 * General Scope for utilitary function
 */
class Utils {

    /**
     * Transform a RGBA color into a HexString 
     * @param {String} rgba rgba code like "#1234FE" 
     * @param {Boolean} with_alpha if there are digit for the alpha canal and if it should be transcribed
     * @returns {String} the hex string of the color
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

    static Round_Bound = (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    }

    static Wait = async (t) =>
    { 
        return new Promise((resolve, reject) => setTimeout(resolve, t))
    }
}

export default Utils