import App_Container from './app/app-container.js';
import App from "./app/app.js";

async function Initialize() {
	let app_container = new App_Container(document.getElementById('root'));
	app = new App("main");
	app_container.Add_App(app);
}

Initialize();
