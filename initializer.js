function LoadResourceScript(resourcePath) {
	return  new Promise((resolve, reject) => {
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

async function Initialize() {
	resource = await LoadResourceScript("map.svg");
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	var img1 = new Image();
	var svg = new Blob([resource], {type: 'image/svg+xml'});
	var DOMURL = window.URL || window.webkitURL || window;
	var url = DOMURL.createObjectURL(svg);
	img1.onload = function() {
	ctx.drawImage(img1, 0, 0);
	DOMURL.revokeObjectURL(url);
	}
	canvas.width = 6771,50049;
	canvas.height = 6086,00195;
	img1.src = url;
	body = document.getElementsByTagName('body')[0];
	body.appendChild(canvas)
}

Initialize();
