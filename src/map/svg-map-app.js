import App from "../app/app.js";
import SVG_Map from "./svg_map.js";
import Config from "../config/config.js"

class Map_App extends App {

	////////
	m_map;
	
	constructor() {
		super();
	}

	Init(loader, main_page, icon) 
	{
		super.Init(loader, main_page, icon);
		const map_container = document.createElement('div');
		map_container.setAttribute('id', 'map-container');
		const map_canvas = document.createElement('canvas');
		map_container.appendChild(map_canvas);
		map_canvas.setAttribute('id', 'map-canvas');
		this.main_page.appendChild(map_container);
		this.map_container = map_container;
		this.map_canvas = map_canvas;
	}

	Initialize_Map = async () => {
		this.Loading();
		this.map = new SVG_Map("Desktop", "image/map.svg", Config);
		await this.map.Setup("Fr", this.map_canvas)
		this.Loaded();
		this.map.Initial_Zoom_Move();
	}

	static Create(loader, main_page, icon) {
		let elt = document.createElement("svg-map-app");
		elt.Init(loader, main_page, icon);
		return elt;
	}
}

customElements.define("svg-map-app", Map_App);

export default Map_App;