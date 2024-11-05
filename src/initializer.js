import App_Container from './app/app-container.js';
import Map_App from './map/svg-map-app.js';
import Page from './loader/Train_Animation.js';
import Train_Animation from './loader/Train_Animation.js';


async function Initialize() {
	let expandingList = App_Container.Create();
	document.getElementById('root').appendChild(expandingList);

	let page = Page.Create();
	let loader = Train_Animation.Create();
	let app = Map_App.Create(loader,page,null);
	app.Loading();
	expandingList.Add_App(app);
	await app.Initialize_Map();
	

}

Initialize();
