import Sticky_Header from "./sticky_header.js";
import Switch_Event from "./switch.js";

/**
 * Left_Panel
 * 
 * This class creates a left-side panel for user interactions.
 */
class Left_Panel extends HTMLElement {
    constructor() {
        super();
    }

    /**
     * Creates and initializes a Left_Panel instance.
     * @returns {Left_Panel} A new instance of Left_Panel.
     */
    static Create() {
        const left_panel = document.createElement("left-panel");
        left_panel.Init();
        return left_panel;
    }

    /**
     * Initializes the left panel and its elements.
     */
    Init() {
        this.attachShadow({ mode: "open" });

        const style_link = document.createElement("link");
        style_link.setAttribute("rel", "stylesheet");
        style_link.setAttribute("href", "style/left-panel.css");
        this.shadowRoot.appendChild(style_link);

        this.panel_visible = false; // Start with panel hidden
        this.left_panel = document.createElement("div");
        this.left_panel.classList.add("left-panel");

        const title = document.createElement("div");
        title.classList.add("title");
        title.innerHTML = "Liaisons grandes lignes directes";
        this.left_panel.appendChild(title);

        const subtitle = document.createElement("div");
        subtitle.classList.add("text");
        subtitle.innerHTML = "Sélectionnez votre ligne/gare de départ sur la carte ou utilisez le champ de saisie";
        this.left_panel.appendChild(subtitle);

        const title_option = document.createElement("div");
        title_option.classList.add("title");
        title_option.innerHTML = "Option:";
        this.left_panel.appendChild(title_option);

        this.left_panel.appendChild(Switch_Event.Create("color", "Simple color"));

        this.shadowRoot.appendChild(this.left_panel);
        Sticky_Header.On_Hamburger_Clicked().subscribe(() => this.Toggle_Panel());
    }

    /**
     * Toggles the visibility of the left panel.
     */
    Toggle_Panel() {
        this.panel_visible = !this.panel_visible;
        if (this.panel_visible) {
            this.left_panel.classList.add("open");
        } else {
            this.left_panel.classList.remove("open");
        }
    }
}

// Define the custom element
customElements.define("left-panel", Left_Panel);

export default Left_Panel;
