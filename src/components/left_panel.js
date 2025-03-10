class LeftPanel extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    static Create() {
        let left_panel = document.createElement('left-panel');
        left_panel.Init();
        return left_panel;
    }

    Init() {
        // Create the left panel
        this.attachShadow({ mode: 'open' });
        this.panel_visible = false; // Start with panel hidden
        this.left_panel = document.createElement('div');
        this.left_panel.classList.add('left-panel');

        // Add content to the left panel
        this.left_panel.innerHTML = '<h3>Menu</h3><p>Some options here.</p>';

        // Append the left panel to the shadow DOM
        this.shadowRoot.appendChild(left_panel);
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
