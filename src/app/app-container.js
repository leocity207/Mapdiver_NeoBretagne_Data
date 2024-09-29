class App_Container
{
    constructor(div) {
        this.app_list = [];
        this.elt = document.createElement("div");
        this.elt.that = this;
        this.elt.classList.toggle("app-container");
        div.appendChild(this.elt);
    } 

    Add_App(app_elt) {
        this.app_list.push(app_elt);
        this.app_element.appendChild(app_elt.ge());
    }

    Get() {
        return this.elt;
    }
}

export default App_Container;