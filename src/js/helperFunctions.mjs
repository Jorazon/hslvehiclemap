function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJSON(file) {
	//file reader function
	let response = await fetch(file); //read content of file with fetch
	return response.json(); //return parsed json
}

/**
 * Converts coordinates from EPSG:4326 to EPSG:3857
 * https://gis.stackexchange.com/questions/142866/converting-latitude-longitude-epsg4326-into-epsg3857
 * @param {number[]} latlon EPSG:4326 longitude latitude coordinates
 * @returns {number[]} EPSG:3857 position
 */
export function epsg4326toepsg3857(latlon) {
	let coordinates = [...latlon];

	let smRadius = 6378136.98;
	let smRange = smRadius * Math.PI * 2.0;
	let smLonToX = smRange / 360.0;
	let smRadiansOverDegrees = Math.PI / 180.0;

	coordinates[0] = coordinates[0] * smLonToX;

	let y = coordinates[1];

	if (y > 86.0) {
		coordinates[1] = smRange;
	} else if (y < -86.0) {
		coordinates[1] = -smRange;
	} else {
		y = y * smRadiansOverDegrees;
		y = Math.log(Math.tan(y) + 1.0 / Math.cos(y));
		coordinates[1] = y * smRadius;
	}

	return coordinates;
}

function createDots() {
	//create base marker elements
	desi = document.createElement("p");
	desi.classList.add("desi");

	marker = document.createElement("div");
	marker.classList.add("marker");
	marker.appendChild(desi);

	arrow = document.createElement("div");
	arrow.classList.add("arrow");

	dot = document.createElement("div");
	dot.classList.add("dot");
	dot.appendChild(arrow);

	dotContainer = document.createElement("div");
	dotContainer.appendChild(dot);

	marker.appendChild(dotContainer);

	//get colors from transithelper
	colors = transithelper.transport_mode;

	//clone base marker element
	dotBus = marker.cloneNode(true);
	dotTram = marker.cloneNode(true);
	dotTrain = marker.cloneNode(true);
	dotMetro = marker.cloneNode(true);
	dotFerry = marker.cloneNode(true);
	dotUbus = marker.cloneNode(true);
	dotRobot = marker.cloneNode(true);

	//apply colors to cloned element dots
	dotBus.childNodes[1].firstChild.style = `background: ${colors.bus.color};`;
	dotTram.childNodes[1].firstChild.style = `background: ${colors.tram.color};`;
	dotTrain.childNodes[1].firstChild.style = `background: ${colors.train.color};`;
	dotMetro.childNodes[1].firstChild.style = `background: ${colors.metro.color};`;
	dotFerry.childNodes[1].firstChild.style = `background: ${colors.ferry.color};`;
	dotUbus.childNodes[1].firstChild.style = `background: ${colors.ubus.color};`;
	dotRobot.childNodes[1].firstChild.style = `background: ${colors.robot.color};`;

	//save clone elements to vehicleDots data object
	vehicleDots.bus = dotBus;
	vehicleDots.tram = dotTram;
	vehicleDots.train = dotTrain;
	vehicleDots.metro = dotMetro;
	vehicleDots.ferry = dotFerry;
	vehicleDots.ubus = dotUbus;
	vehicleDots.robot = dotRobot;
}

function createMarker() {
	marker = document.createElement("span");
	marker.innerText = "place";
	marker.classList.add("material-icons");
	marker.classList.add("place");
	return marker;
}

function createSchool() {
	marker = document.createElement("span");
	marker.innerText = "school";
	marker.classList.add("material-icons");
	marker.classList.add("place");
	return marker;
}

function createBrwewery() {
	brewery = document.createElement("span");
	brewery.innerText = "sports_bar";
	brewery.classList.add("material-icons");
	brewery.classList.add("brewery");
	return brewery;
}

function createTooltip(text) {
	tooltip = document.createElement("span");
	tooltip.innerHTML = text;
	tooltip.classList.add("tooltip");
	return tooltip;
}

function createTripID(routeShortName, color) {
	tripid = document.createElement("div");
	tripid.classList.add("tripid");
	tripid.innerText = routeShortName;
	tripid.style = `color: ${color}; border-color: ${color};`;
	return tripid;
}

function createTransfer(name, color) {
	transfer = document.createElement("div");
	transfer.classList.add("transfer");
	transfer.id = name;
	transfer.style = `color: ${color}; border-color: ${color};`;
	return transfer;
}

function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
