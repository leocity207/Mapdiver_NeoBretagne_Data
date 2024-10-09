class Page extends HTMLElement
{
	constructor(loader,main_page) {
		super();
		this.m_loader = loader;
		this.m_main_page = main_page;
	}

	Show_Loader() {
		this.m_loader.show();
		this.m_main_page.hide();
	}

	Show_Page() {
		this.m_loader.hide();
		this.m_main_page.show();
	}

	static Create() {
		return document.createElement("app-page");
	}
}

customElements.define("app-page", Page);

export default Page;
