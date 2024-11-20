import Loader from './loader.js';

/**
 * A simple Train Animation that implement a Loader
 * 
 * This class create a custome element named "train-animation"
 */
class Train_Animation extends Loader {

	constructor() {
		super();
	}

	/**
	* Initialize an the train animation to be the right size object after it has been instantiated
	* you should not need to use this function
	* @protected
	*/
	Init() {
		let iframe = document.createElement("iframe");
		iframe.src = 'image/train-animation.svg';
		iframe.width = '100%';
		iframe.height = '100%';
		let shadow = this.attachShadow({ mode: "open" });
		shadow.appendChild(iframe);
	}

	/**
	 * Create a Train animation Object ready to be added to the Dom or used inside an App
	 * @returns {Train_Animation} A ready to be used Train animation.
	 */
	static Create() {
		let elt = document.createElement("train-animation");
		elt.Init();
		return elt;
	}
}

customElements.define("train-animation", Train_Animation);

export default Train_Animation;
