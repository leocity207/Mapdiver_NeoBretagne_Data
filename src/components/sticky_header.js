import { Subject } from "../../libraries/RxJS_wrapper.js";

/**
 * The **Sticky Header** is a user interface element that remains fixed at the top of the page, ensuring important navigation components are always accessible, even as the user scrolls.
 * 
 * Structure
 * ---------
 * 
 * The Sticky Header consists of three key components:
 *
 * - **Left Section:** A **hamburger menu** that triggers a click event when selected.
 * - **Center Section:** A **search bar** that accepts a list of searchable elements and emits an event when an item is selected.
 * - **Right Section:** A **logo** that can be displayed for branding purposes.
 *
 */
class Sticky_Header extends HTMLElement {
    static subject_hamburger = new Subject();
    static subject_autocomplete = new Subject();

    constructor() {
        super();
    }

    /**
     * Creates and initializes a Sticky_Header instance.
     * @returns {Sticky_Header} A new instance of Sticky_Header.
     */
    static Create() {
        const sticky_header = document.createElement("sticky-header");
        sticky_header.Init();
        return sticky_header;
    }

    /**
     * #PROTECTED#
     * 
     * Initializes the sticky header and its elements.
     */
    Init() {
        this.attachShadow({ mode: "open" });
        
        const style_link = document.createElement("link");
        style_link.setAttribute("rel", "stylesheet");
        style_link.setAttribute("href", "style/sticky-header.css");
        this.shadowRoot.appendChild(style_link);

        const header = document.createElement("header");
        header.setAttribute("id", "sticky-header");
        this.shadowRoot.appendChild(header);

        const hamburger = document.createElement("div");
        hamburger.setAttribute("id", "hamburger");
        hamburger.innerHTML = `
            <div class="bar bar1"></div>
            <div class="bar bar2"></div>
            <div class="bar bar3"></div>
        `;
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            Sticky_Header.subject_hamburger.next();
        });

        const search_bar_container = document.createElement("div");
        search_bar_container.setAttribute("class", "autocomplete");
        this.search_bar = document.createElement("input");
        this.search_bar.setAttribute("id", "search-bar");
        this.search_bar.setAttribute("placeholder", "Recherche par ligne/gare");
        search_bar_container.appendChild(this.search_bar);

        const logo = document.createElement("img");
        logo.setAttribute("src", "image/logo.svg");

        header.appendChild(hamburger);
        header.appendChild(search_bar_container);
        header.appendChild(logo);
    }

    /**
     * Returns the RxJS subject for hamburger menu clicks.
     * 
     * @returns {Subject} Subject that emits when the hamburger menu is clicked.
     */
    static On_Hamburger_Clicked() {
        return Sticky_Header.subject_hamburger;
    }

    /**
     * Removes the 'active' class from all autocomplete items.
     * 
     * @param {NodeList} nodes - List of nodes to update.
     * 
     * @access private
     */
    Remove_Active_Items(nodes) {
        nodes.forEach(node => node.classList.remove("autocomplete-active"));
    }

    /**
     * Adds the 'active' class to an autocomplete item.
     * 
     * @param {NodeList} nodes - List of nodes to update.
     * @param {number} current_focus - Current focused index.
     * 
     * @access private
     */
    Add_Active_Item(nodes, current_focus) {
        if (!nodes) return;
        this.Remove_Active_Items(nodes);
        if (current_focus >= nodes.length) current_focus = 0;
        if (current_focus < 0) current_focus = nodes.length - 1;
        nodes[current_focus].classList.add("autocomplete-active");
    }

    /**
     * Closes all autocomplete lists except the given element.
     * @param {HTMLElement} element - Element to keep open.
     * 
     * @access private
     */
    Close_All_Lists(element) {
        const autocomplete_elements = this.search_bar.parentNode.getElementsByClassName("autocomplete-items");
        for (let autocomplete_element of autocomplete_elements) {
            if (element !== autocomplete_element && element !== this.search_bar) {
                autocomplete_element.parentNode.removeChild(autocomplete_element);
            }
        }
    }

    /**
     * Initializes autocomplete functionality with a list of suggestions.
     * @param {Array<string>} match_list - List of suggestions.
     * @returns {Subject} Subject that emits the selected autocomplete value.
     */
    Set_Autocomplete_List(match_list) {
        let current_focus;
        const that = this;

        this.search_bar.addEventListener("input", function () {
            const val = this.value;
            that.Close_All_Lists();
            if (!val) return false;
            
            current_focus = -1;
            const autocomplete_container = document.createElement("div");
            autocomplete_container.setAttribute("id", this.id + "autocomplete-list");
            autocomplete_container.setAttribute("class", "autocomplete-items");
            that.search_bar.parentNode.appendChild(autocomplete_container);
            
            match_list.forEach(match_element => {
                if (match_element.toUpperCase().startsWith(val.toUpperCase())) {
                    const element_container = document.createElement("div");
                    element_container.innerHTML = `<strong>${match_element.substr(0, val.length)}</strong>${match_element.substr(val.length)}`;
                    element_container.innerHTML += `<input type='hidden' value='${match_element}'>`;
                    element_container.addEventListener("click", function () {
                        that.search_bar.value = "";
                        that.Close_All_Lists();
                        Sticky_Header.subject_autocomplete.next(this.getElementsByTagName("input")[0].value);
                    });
                    autocomplete_container.appendChild(element_container);
                }
            });
        });

        this.search_bar.addEventListener("keydown", function (e) {
            let autocomplete_container = document.getElementById(this.id + "autocomplete-list");
            if (autocomplete_container) autocomplete_container = autocomplete_container.getElementsByTagName("div");
            if (e.keyCode === 40) {
                current_focus++;
                that.Add_Active_Item(autocomplete_container, current_focus);
            } else if (e.keyCode === 38) {
                current_focus--;
                that.Add_Active_Item(autocomplete_container, current_focus);
            } else if (e.keyCode === 13) {
                e.preventDefault();
                if (current_focus > -1 && autocomplete_container) {
                    autocomplete_container[current_focus].click();
                }
            }
        });

        document.addEventListener("click", function (e) {
            that.Close_All_Lists(e.target);
        });

        return Sticky_Header.subject_autocomplete;
    }
}

// Define the custom element
customElements.define("sticky-header", Sticky_Header);

export default Sticky_Header;
