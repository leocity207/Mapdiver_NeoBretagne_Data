class Page extends HTMLElement
{
	constructor(loader,main_page) {
		super();
	}

	Show() {
		this.style.display = 'block';
	}

	Hide() {
		this.style.display = 'none';
	}

	static Create() {
		return document.createElement("app-page");
	}
}

customElements.define("app-page", Page);

export default Page;
