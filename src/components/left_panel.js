import Sticky_Header from "./sticky_header.js"
import Switch_Event from "./switch.js";

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

		
		this.left_panel.appendChild(Switch_Event.Create("color", "Simple color"));

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