import Loader from '../loader/loader.js';

class Train_Animation extends Loader {

	constructor() {
		super();
	}

	Init() {
		let iframe = document.createElement("iframe");
		iframe.src = 'image/train-animation.svg';
		iframe.width = '100%';
		iframe.height = '100%';
		let shadow = this.attachShadow({ mode: "open" });
		shadow.appendChild(iframe);
	}

	static Create() {
		let elt = document.createElement("train-animation");
		elt.Init();
		return elt;
	}
	
}

customElements.define("train-animation", Train_Animation);

export default Train_Animation;
