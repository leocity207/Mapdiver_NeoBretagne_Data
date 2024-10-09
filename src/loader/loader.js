class Loader extends HTMLElement
{
	constructor() {
		super();
	}

	Show() {
		this.style.display = 'block';
	}

	Hide() {
		this.style.display = 'none';
	}

	static Create() {
		return document.createElement("app-loader");
	}
}

customElements.define("app-loader", Loader);

export default Loader;
