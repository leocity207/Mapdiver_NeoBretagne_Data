import App_Container from './app/app-container.js';
import App from './app/app.js';
import Page from './loader/Train_Animation.js';
import Loader from './app/page.js';
import Train_Animation from './loader/Train_Animation.js';


async function Initialize() {
	let expandingList = App_Container.Create();
	document.getElementById('root').appendChild(expandingList);

	let page = Page.Create();
	let loader = Train_Animation.Create();
	let app = App.Create(loader,page,null);
	expandingList.Add_App(app);

}

Initialize();
