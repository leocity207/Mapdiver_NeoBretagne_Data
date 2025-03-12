import { Subject, filter } from "../../libraries/RxJS_wrapper.js";

/**
 * Switch_Event
 * 
 * This class creates a toggle switch element that emits events when toggled.
 */
class Switch_Event extends HTMLElement {
    static switch_event_subject = new Subject();

    constructor() {
        super();
    }

    /**
     * Creates and initializes a Switch_Event instance.
     * @param {string} name - The identifier for the switch.
     * @param {string} text - The label text for the switch.
     * @returns {Switch_Event} A new instance of Switch_Event.
     */
    static Create(name, text) {
        const switch_event = document.createElement("switch-event");
        switch_event.Init(name, text);
        return switch_event;
    }

    /**
     * Initializes the switch component.
     * @param {string} name - The identifier for the switch.
     * @param {string} text - The label text for the switch.
     */
    Init(name, text) {
        this.name = name;
        this.attachShadow({ mode: "open" });

        const style_link = document.createElement("link");
        style_link.setAttribute("rel", "stylesheet");
        style_link.setAttribute("href", "style/switch.css");
        this.shadowRoot.appendChild(style_link);

        const master_switch = document.createElement("div");
        master_switch.classList.add("switch-container");

        const text_elt = document.createElement("text");
        text_elt.innerHTML = text;

        const label_switch = document.createElement("label");
        label_switch.classList.add("switch");

        const input_checkbox = document.createElement("input");
        input_checkbox.setAttribute("type", "checkbox");

        const span_checkbox = document.createElement("span");
        span_checkbox.classList.add("slider");

        label_switch.appendChild(input_checkbox);
        label_switch.appendChild(span_checkbox);
        master_switch.appendChild(text_elt);
        master_switch.appendChild(label_switch);

        span_checkbox.addEventListener("click", () => {
            Switch_Event.switch_event_subject.next({ name: this.name, state: !input_checkbox.checked });
        });

        this.shadowRoot.appendChild(master_switch);
    }

    /**
     * Returns an observable that listens for switch events with the specified name.
     * @param {string} name - The identifier for the switch.
     * @returns {Observable} An RxJS observable for the switch events.
     */
    static Get_Observable(name) {
        return Switch_Event.switch_event_subject.pipe(filter((event) => event.name === name));
    }
}

// Define the custom element
customElements.define("switch-event", Switch_Event);

export default Switch_Event;