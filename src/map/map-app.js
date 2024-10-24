import App from "../app/app";
import Map from "./svg_map"

class Map_App extends App {
	constructor() {
		super();
	}

	Initialize_Map(){
		this.map = new Map(this,"desktop","image/map.svg","bretagne-map")
	}

	static Create(){
		let elt = App.Create();
		return elt;
	}

}

export default Map_App;