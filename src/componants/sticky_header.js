class Sticky_Header extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		//this.render();
	}

	static Create() {
		let sticky_header = document.createElement('sticky-header');
		sticky_header.Init();
		return sticky_header;
	}

	Init() {

		this.attachShadow({ mode: 'open' });
		const styleLink = document.createElement('link');
		styleLink.setAttribute('rel', 'stylesheet');
		styleLink.setAttribute('href', 'style/sticky-header.css');
		this.shadowRoot.appendChild(styleLink);

		const header = document.createElement('header');
		header.setAttribute('id', 'sticky-header');

		// Hamburger menu
		const hamburger = document.createElement('div');
		hamburger.setAttribute('id', 'hamburger');
		hamburger.innerHTML = '<div class="bar bar1"></div><div class="bar bar2"></div><div class="bar bar3"></div>'; // Unicode for hamburger icon

		// Search bar
		const search_Bar_Container = document.createElement('div');
		search_Bar_Container.setAttribute('class', 'autocomplete');
		this.searchBar = document.createElement('input');
		this.searchBar.setAttribute('id', 'search-bar');
		this.searchBar.setAttribute('placeholder', 'Search...');
		search_Bar_Container.appendChild(this.searchBar);


		// Logo
		const logo = document.createElement('img');
		logo.setAttribute('src', 'image/logo.svg');  // Update with the correct path to your logo.svg
		logo.setAttribute('alt', 'Logo');
		logo.style.height = '40px';

		// Append elements to the header
		header.appendChild(hamburger);
		header.appendChild(search_Bar_Container);
		header.appendChild(logo);

		// Add the header to the shadow DOM
		this.shadowRoot.appendChild(header);

		// Dispatch custom event on hamburger click
		hamburger.addEventListener('click', () => {
			const event = new CustomEvent('togglePanel', {
				detail: { action: 'toggle' },
				bubbles: true, // Allow event to bubble up the DOM
				composed: true // Allow the event to pass through shadow DOM boundaries
			});
			this.dispatchEvent(event);
		});
	}

	/**
	 * function to remove the "active" class from all autocomplete items:
	 * @param {List<Node>} nodes
	 */
	//  
	Remove_Active(nodes) {
		for (let node of nodes)
			node.classList.remove("autocomplete-active");
	}

	/**
	 * 
	 * @param {List<Node>} nodes 
	 * @returns 
	 */
	Add_Active(nodes,currentFocus) {
		/*a function to classify an item as "active":*/
		if (!nodes) return false;
		/*start by removing the "active" class on all items:*/
		Remove_Active(nodes);
		if (currentFocus >= nodes.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (nodes.length - 1);
		/*add class "autocomplete-active":*/
		nodes[currentFocus].classList.add("autocomplete-active");
	}

	Close_All_Lists(element) {
		/*close all autocomplete lists in the document,
		except the one passed as an argument:*/
		var autocomplete_elements = this.searchBar.parentNode.getElementsByClassName("autocomplete-items");
		for (let autocomplete_element of autocomplete_elements)
			if (element != autocomplete_element && element != this.searchBar)
				autocomplete_element.parentNode.removeChild(autocomplete_element);
	}

	Autocomplete( match_list) {
		/*the autocomplete function takes two arguments,
		the text field element and an listay of possible autocompleted values:*/
		var currentFocus;
		let that = this
		/*execute a function when someone writes in the text field:*/
		this.searchBar.addEventListener("input", function(e) {
			var autocomplete_container, element_container, val = this.value;
			/*close any already open lists of autocompleted values*/
			that.Close_All_Lists();
			if (!val) { return false;}
			currentFocus = -1;
			/*create a DIV element that will contain the items (values):*/
			autocomplete_container = document.createElement("DIV");
			autocomplete_container.setAttribute("id", this.id + "autocomplete-list");
			autocomplete_container.setAttribute("class", "autocomplete-items");
			/*append the DIV element as a child of the autocomplete container:*/
			that.searchBar.parentNode.appendChild(autocomplete_container);
			/*for each item in the listay...*/
			for (let match_element of match_list) {
			  /*check if the item starts with the same letters as the text field value:*/
			  if (match_element.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				/*create a DIV element for each matching element:*/
				element_container = document.createElement("DIV");
				/*make the matching letters bold:*/
				element_container.innerHTML = "<strong>" + match_element.substr(0, val.length) + "</strong>";
				element_container.innerHTML += match_element.substr(val.length);
				/*insert a input field that will hold the current listay item's value:*/
				element_container.innerHTML += "<input type='hidden' value='" + match_element + "'>";
				/*execute a function when someone clicks on the item value (DIV element):*/
				element_container.addEventListener("click", function(e) {
				/*insert the value for the autocomplete text field:*/
				that.searchBar.value = this.getElementsByTagName("input")[0].value;
					/*close the list of autocompleted values,
					(or any other open lists of autocompleted values:*/
					that.Close_All_Lists();
				});
				autocomplete_container.appendChild(element_container);
			  }
			}
		});

		/*execute a function presses a key on the keyboard:*/
		this.searchBar.addEventListener("keydown", function(e) {
			var autocomplete_container = document.getElementById(this.id + "autocomplete-list");
			if (autocomplete_container) autocomplete_container = autocomplete_container.getElementsByTagName("div");
			if (e.keyCode == 40) {
			  /*If the listow DOWN key is pressed,
			  increase the currentFocus variable:*/
			  currentFocus++;
			  /*and and make the current item more visible:*/
			  that.Add_Active(autocomplete_container, currentFocus);
			} else if (e.keyCode == 38) { //up
			  /*If the listow UP key is pressed,
			  decrease the currentFocus variable:*/
			  currentFocus--;
			  /*and and make the current item more visible:*/
			  that.Add_Active(autocomplete_container, currentFocus);
			} else if (e.keyCode == 13) {
			  /*If the ENTER key is pressed, prevent the form from being submitted,*/
			  e.preventDefault();
			  if (currentFocus > -1) {
				/*and simulate a click on the "active" item:*/
				if (autocomplete_container) autocomplete_container[currentFocus].click();
			  }
			}
		});
		
	
	  	/*execute a function when someone clicks in the document:*/
		document.addEventListener("click", function (e) {
			that.Close_All_Lists(e.target);
		});
	} 
}

// Define the custom element
customElements.define('sticky-header', Sticky_Header);

export default Sticky_Header;
