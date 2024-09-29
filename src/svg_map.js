class SVGMap {
	//https://codepen.io/mrobin604/pen/yjmrjj

	constructor(ressource_name) {
		this.ressource_name = ressource_name
		this.div = document.createElement('div');
		this.zoom = undefined;
	}

	async Draw(where) {
		let mapData = await LoadResourceScript(this.ressource_name);
		this.div.innerHTML = mapData;
		where.appendChild(this.div)
	}

	Get_SVG_Element()
	{
		return this.div.firstChild;
	}
}