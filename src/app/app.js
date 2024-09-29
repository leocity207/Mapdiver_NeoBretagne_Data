class App
{
    constructor(name) {
        this.elt = document.createElement("div");
        this.elt.app = this;
        this.name = name;
    }

    Get() {
        return this.elt;
    }
}