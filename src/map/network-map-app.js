import Map_App from "./svg-map-app.js";
import Network_Map from "./network_map.js";

class Network_Map_App extends Map_App {

	////////
	
	constructor() {
		super();
	}

	Initialize_Map = async () => {
		this.map = new Network_Map("Desktop","image/map.svg","bretagne-map")
	}

	static Create(loader, main_page, icon) {
		let elt = document.createElement("app-app");
		elt.loader = loader;
		elt.main_page = main_page;
		elt.icon = icon;
		elt.Init();
		return elt;
	}

	static Create(){
		let elt = Network_Map_App.Create();
		return elt;
	}

}

export default Network_Map_App;