function LoadResourceScript(resourcePath) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", window.location.href + resourcePath);
		xhr.send();
		xhr.responseType = "javascript";
		xhr.onload = () => {
			if (xhr.readyState == 4 && xhr.status == 200)
				resolve(xhr.response);
			else {
				console.log("Error: ${xhr.status} with request for resource :" + resourcePath);
				reject();
			}
		};
	});
}

function getScript(source) {
	return new Promise((resolve, reject) => {
		var script = document.createElement('script');
		var prior = document.getElementsByTagName('script')[0];
		script.async = 1;

		script.onload = script.onreadystatechange = function( _, isAbort ) {
			if(isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
				script.onload = script.onreadystatechange = null;
				script = undefined;
				resolve();
			}
			else
				resolve();
		};

		script.src = source;
		prior.parentNode.insertBefore(script, prior);
	});
}

async function Initialize() {
	let preloadDocuments = [
		{name:"svg_map.js"},
		{name:"zoom.js"}
	];

	// Launche the async preloading of all documents
	for(preloadDocument of preloadDocuments) {
		preloadDocument.defered = getScript(preloadDocument.name);
	}

	// Wait for all document to finish loading
	for (preloadDocument of preloadDocuments)
		await preloadDocument.defered;


	window.map = new SVGMap("map.svg");
	body = document.getElementsByTagName('body')[0];
	await window.map.Draw(body);

	window.zoom = new Zoom(window.map.Get_SVG_Element(),{x:6771, y:6086})


}

Initialize();
