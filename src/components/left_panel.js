import Sticky_Header from "./sticky_header.js"

class LeftPanel extends HTMLElement {
	constructor() {
		super();
	}

	static Create() {
		let left_panel = document.createElement('left-panel');
		left_panel.Init();
		return left_panel;
	}

	Init() {
		// Create the left panel
		this.attachShadow({ mode: 'open' });

		const style_link = document.createElement('link');
		style_link.setAttribute('rel', 'stylesheet');
		style_link.setAttribute('href', 'style/left-panel.css');
		this.shadowRoot.appendChild(style_link);

		this.panel_visible = false; // Start with panel hidden
		this.left_panel = document.createElement('div');
		this.left_panel.classList.add('left-panel');

		const title = document.createElement('div');
		title.classList.add('title');
		title.innerHTML = "Liaisons grandes lignes directes";
		this.left_panel.appendChild(title);
		const subtitle = document.createElement('div');
		subtitle.classList.add('text');
		subtitle.innerHTML = "Sélectionnez votre ligne/gare de départ sur la carte ou utilisez le champ de saisie";
		this.left_panel.appendChild(subtitle);
		const title_option = document.createElement('div');
		title_option.classList.add('title');
		title_option.innerHTML = "Option:";
		this.left_panel.appendChild(title_option);

		
		const master_switch = document.createElement('div');
		master_switch.classList.add('switch-container');
		master_switch.innerHTML = " <text>Simple</text>\
									<label class='switch'>\
										<input type='checkbox'>\
										<span class='slider'></span>\
								   </label>";
		this.left_panel.appendChild(master_switch);

		// Append the left panel to the shadow DOM
		this.shadowRoot.appendChild(this.left_panel);
		Sticky_Header.subject_hamberger.subscribe(() => this.togglePanel());
	}

	togglePanel() {
		this.panel_visible = !this.panel_visible;
		if(this.panel_visible)
			this.left_panel.classList.add("open");
		else
			this.left_panel.classList.remove("open");
	}
}

// Define the custom element
customElements.define('left-panel', LeftPanel);

export default LeftPanel;