/**
 * Sticky Header
 * 
 * This class creates a sticky header that remains at the top of the page.
 */
class Sticky_Header extends HTMLElement {
	constructor() {
		super();
	}

	/**
	 * Factory constructor to create a Sticky_Header instance.
	 * @returns {Sticky_Header}
	 */
	static Create() {
		let sticky_header = document.createElement('sticky-header');
		sticky_header.Init();
		return sticky_header;
	}

	/**
	 * Initializes the Sticky Header object.
	 */
	Init() {
		this.attachShadow({ mode: 'open' });
		const style_link = document.createElement('link');
		style_link.setAttribute('rel', 'stylesheet');
		style_link.setAttribute('href', 'style/sticky-header.css');
		this.shadowRoot.appendChild(style_link);

		// Create the header
		const header = document.createElement('header');
		header.setAttribute('id', 'sticky-header');
		this.shadowRoot.appendChild(header);

		// Create the hamburger menu
		const hamburger = document.createElement('div');
		hamburger.setAttribute('id', 'hamburger');
		hamburger.innerHTML = '<div class="bar bar1"></div>\
							   <div class="bar bar2"></div>\
							   <div class="bar bar3"></div>';
		
		hamburger.addEventListener('click', () => {
			hamburger.classList.toggle('active');
			if (this.callback_hamburger) this.callback_hamburger();
		});

		// Search bar
		const search_bar_container = document.createElement('div');
		search_bar_container.setAttribute('class', 'autocomplete');
		this.search_bar = document.createElement('input');
		this.search_bar.setAttribute('id', 'search-bar');
		this.search_bar.setAttribute('placeholder', 'Recherche par ligne/gare');
		search_bar_container.appendChild(this.search_bar);

		// Logo
		const logo = document.createElement('img');
		logo.setAttribute('src', 'image/logo.svg');

		// Append elements to the header
		header.appendChild(hamburger);
		header.appendChild(search_bar_container);
		header.appendChild(logo);
	}

	/**
	 * Adds a callback function for the hamburger menu.
	 * @param {Function} callback - Function to execute on click.
	 */
	Set_Hamburger_Click_Callback(callback) {
		this.callback_hamburger = callback;
	}

	/**
	 * Removes the 'active' class from all autocomplete items.
	 * @param {NodeList} nodes - List of nodes to update.
	 */
	Remove_Active_Items(nodes) {
		nodes.forEach(node => node.classList.remove("autocomplete-active"));
	}

	/**
	 * Adds the 'active' class to an autocomplete item.
	 * @param {NodeList} nodes - List of nodes to update.
	 * @param {number} current_focus - Current focused index.
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
	 * Initializes autocomplete functionality by passing the list and callback when items is selected.
	 * @param {Array<string>} match_list - List of suggestions.
	 * @param {Function} on_choice - Callback when an item is selected.
	 */
	Set_Autocomplete_List_Callbacks(match_list, on_choice) {
		let current_focus;
		let that = this;
		
		this.search_bar.addEventListener("input", function () {
			let val = this.value;
			that.Close_All_Lists();
			if (!val) return false;
			
			current_focus = -1;
			let autocomplete_container = document.createElement("div");
			autocomplete_container.setAttribute("id", this.id + "autocomplete-list");
			autocomplete_container.setAttribute("class", "autocomplete-items");
			that.search_bar.parentNode.appendChild(autocomplete_container);
			
			match_list.forEach(match_element => {
				if (match_element.toUpperCase().startsWith(val.toUpperCase())) {
					let element_container = document.createElement("div");
					element_container.innerHTML = `<strong>${match_element.substr(0, val.length)}</strong>${match_element.substr(val.length)}`;
					element_container.innerHTML += `<input type='hidden' value='${match_element}'>`;
					element_container.addEventListener("click", function () {
						that.search_bar.value = "";
						that.Close_All_Lists();
						on_choice(this.getElementsByTagName("input")[0].value);
					});
					autocomplete_container.appendChild(element_container);
				}
			});
		});

		this.search_bar.addEventListener("keydown", function (e) {
			let autocomplete_container = document.getElementById(this.id + "autocomplete-list");
			if (autocomplete_container) autocomplete_container = autocomplete_container.getElementsByTagName("div");
			if (e.keyCode == 40) {
				current_focus++;
				that.Add_Active_Item(autocomplete_container, current_focus);
			} else if (e.keyCode == 38) {
				current_focus--;
				that.Add_Active_Item(autocomplete_container, current_focus);
			} else if (e.keyCode == 13) {
				e.preventDefault();
				if (current_focus > -1 && autocomplete_container) {
					autocomplete_container[current_focus].click();
				}
			}
		});

		document.addEventListener("click", function (e) {
			that.Close_All_Lists(e.target);
		});
	}
}

// Define the custom element
customElements.define('sticky-header', Sticky_Header);

export default Sticky_Header;
