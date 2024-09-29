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
		script.type = "application/javascript"
		prior.parentNode.insertBefore(script, prior);
	});
}

async function Initialize() {
	let preloadDocuments = [
		{name:"fabric.js"},
		{name:"hammer.js"},
		{name:"config.js"},
		{name:"animejs.js"},
		{name:"map.js"},
		{name:"normalizeWheel.js"}
	];

	// Launche the async preloading of all documents
	for(preloadDocument of preloadDocuments) {
		preloadDocument.defered = getScript(preloadDocument.name);
	}

	for (preloadDocument of preloadDocuments)
		await preloadDocument.defered;

	window.map = new Map("map-canvas", "desktop", "map-suisse.svg")
	await window.map.setup();
	window.map.initial_zoom_move();
	window.map.setup_mouse_handlers(null,null);

}

Initialize();
