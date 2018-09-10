let jsicon = {}

{

	const iconDirectory = "./icons";
	const iconFileExtension = "svg";
	
	// takes icon parameters and returns the path to the icon svg
	const getIconPath = (iconName, iconSize, iconStyle) => 
		`${iconDirectory}/${iconSize}/${iconName}-${iconStyle}.${iconFileExtension}`;

	// this stops us requesting the same icons multiple times
	let iconCache = {};

	// returns (promise) the icon svg data for an icon's information
	async function getSvgData(iconName, iconSize, iconStyle) {
		//promisify it
		return new Promise((resolve, reject) => {

			// check in the cache
			let path = getIconPath(iconName, iconSize, iconStyle);
			if(iconCache[path]) resolve(iconCache[path].cloneNode(true));

			// build an ajax request
			let xhr = new XMLHttpRequest();
			xhr.open("GET", path);
			xhr.overrideMimeType("image/svg+xml");

			// called on success
			xhr.onload = function() {
				if (this.status < 200 || this.status >= 300) {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
					return;
				}
				let data = xhr.responseXML.documentElement;
				iconCache[path] = data;
				resolve(getSvgData(iconName, iconSize, iconStyle));
			}

			// called on error
			xhr.onerror = function(){
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}

			// send request
			xhr.send();

		});
		
	}
	
	// loads icon svg data into the given element
	async function loadIconInto(el, iconName, iconSize, iconStyle) {
		try {
			let data = await getSvgData(iconName, iconSize, iconStyle);
			el.appendChild(data);
		} catch(err) {
			console.error(`Can't load icon ${iconName} at size ${iconSize} of style ${iconStyle}`);
		}
	}

	// attempts to get data and add an icon into the element
	function tryAddElementIcon(el) {
		if(el.tagName.toLowerCase() == "j-icon") {
			let iconName, iconSize, iconStyle;
			for(let cls of el.classList) {
				if(cls.startsWith("ji-")) {
					if(cls.startsWith("ji-size-")) {
						iconSize = cls.substring(8);
					} else if(cls.startsWith("ji-style-")) {
						iconStyle = cls.substring(9);
					} else {
						iconName = cls.substring(3);
					}
				}
			}
			loadIconInto(el, iconName, iconSize, iconStyle);
		}
	}

	// observer function to check for new icons
	function observeDomChanges(mutations) {
		if (mutations[0].addedNodes)
			mutations[0].addedNodes.forEach(tryAddElementIcon);
	}

	// when the document is ready
	document.addEventListener("DOMContentLoaded", function(event) {
		// add existing icons
		for(let el of document.getElementsByTagName("j-icon")) {
			tryAddElementIcon(el);
		}

		// check for new icons
		let observer = new MutationObserver(observeDomChanges);
		observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
	});

	//now for the fun stuff, public api

	jsicon.createElement = (iconName, iconSize, iconStyle) => {
		let el = document.createElement("j-icon");
		el.classList.add(`ji-${iconName}`, `ji-size-${iconSize}`, `ji-style-${iconStyle}`);
		return el;
	}

}