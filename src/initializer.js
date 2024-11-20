import App_Container from './app/app-container.js';
import Map_App from './page/svg-map-app.js';
import Page from './page/page.js';
import Train_Animation from './loader/Train_Animation.js';


async function Initialize() {
	let expandingList = App_Container.Create();
	document.getElementById('root').appendChild(expandingList);

	let page = Page.Create();
	let loader = Train_Animation.Create();
	let app = Map_App.Create(loader,page,null);
	expandingList.Add_App(app);
	await app.Initialize_Map();
	
}

Initialize();
