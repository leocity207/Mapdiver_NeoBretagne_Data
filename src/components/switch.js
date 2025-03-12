import { Subject }  from "../../libraries/RxJS_wrapper.js";

class Switch_Event extends HTMLElement {

	static switch_event_subject = new Subject();
	constructor() {
		super();
	}

	static Create(name, text) {
		let switch_event = document.createElement('switch-event');
		switch_event.Init(name, text);
		return switch_event;
	}

	Init(name, text) {
		this.name = name;
		// Create the left panel
		this.attachShadow({ mode: 'open' });

		const style_link = document.createElement('link');
		style_link.setAttribute('rel', 'stylesheet');
		style_link.setAttribute('href', 'style/switch.css');
		this.shadowRoot.appendChild(style_link);

		
		const master_switch = document.createElement('div');
		master_switch.classList.add('switch-container');
		master_switch.innerHTML = " <text>" + text + "</text>\
									<label class='switch'>\
										<input type='checkbox'>\
										<span class='slider'></span>\
								   </label>";

		// Append the left panel to the shadow DOM
		this.shadowRoot.appendChild(master_switch);
	}
}

// Define the custom element
customElements.define('switch-event', Switch_Event);

export default Switch_Event;