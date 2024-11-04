import Map_App from "./svg-map-app";
import Network_Map from "./network_map";

class Network_Map_App extends Map_App {

	////////
	
	constructor() {
		super();
	}

	Initialize_Map = async () => {
		this.map = new Network_Map("Desktop","image/map.svg","bretagne-map")
	}

	static Create(){
		let elt = Network_Map_App.Create();
		return elt;
	}

}

export default Network_Map_App;