import App_Container from './app/app-container.js';
import App from './app/app.js';
import Network_Map_Page from './page/network-map-page.js';
import Train_Animation from './loader/Train_Animation.js';


async function Initialize() {
	let expandingList = App_Container.Create();
	document.getElementById('root').appendChild(expandingList);

	let map_page = Network_Map_Page.Create();
	let loader = Train_Animation.Create();
	let app = App.Create(loader,map_page,null);
	expandingList.Add_App(app);
	app.Loading();
	await app.Page.Initialize_Map();
	app.Loaded();
	await app.Page.Initial_Zoom_Move();
}

Initialize();
