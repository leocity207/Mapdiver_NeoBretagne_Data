import App from "../app/app";
import App from "../app/app";

class Map_App extends App {

	////////
	
	constructor() {
		super();
	}

	Init() {
		super.Init();
		const map_container = document.createElement('div');
		map_container.setAttribute('id', 'map-container');
		this.main_page.appendChild(map_container);
		this.map_container = map_container;
	}

	static Create(){
		let elt = App.Create();
		elt.Init();
		return elt;
	}

}

export default Map_App;