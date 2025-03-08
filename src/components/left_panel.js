class LeftPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.panelVisible = false; // Start with panel hidden
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
        const leftPanel = document.createElement('div');
        leftPanel.setAttribute('id', 'left-panel');
        leftPanel.style.position = 'fixed';
        leftPanel.style.left = '-250px'; // Start hidden
        leftPanel.style.top = '0';
        leftPanel.style.height = '100%';
        leftPanel.style.width = '250px';
        leftPanel.style.backgroundColor = '#333';
        leftPanel.style.color = 'white';
        leftPanel.style.transition = 'left 0.3s ease';
        leftPanel.style.padding = '10px';

        // Add content to the left panel
        leftPanel.innerHTML = `<h3>Menu</h3><p>Some options here.</p>`;

        // Append the left panel to the shadow DOM
        this.shadowRoot.appendChild(leftPanel);
    }

    togglePanel() {
        const leftPanel = this.shadowRoot.querySelector('#left-panel');
        this.panelVisible = !this.panelVisible;
        leftPanel.style.left = this.panelVisible ? '0px' : '-250px';
    }
}

// Define the custom element
customElements.define('left-panel', LeftPanel);
