const url = "wss://mqtt.hsl.fi:443/"; //base socket url
//const vpos = '/hfp/v2/journey/ongoing/vp/train/#';//debug only train positions topic
const vpos = "/hfp/v2/journey/ongoing/vp/#"; //all vehicle positions topic

const fromLonLat = ol.proj.fromLonLat; //fromLonLat function define

const updateFPS = 2; //times per second to update vehicles on map

async function main() {
	//main function needed for async file read with fetchJSON()
	client = new Mosquitto(); //create new client

	transithelper = await fetchJSON("transitHelper.json"); //read transithelper.json

	createDots(); //create dots in helperFunctions.js

	client.onconnect = function() {
		//client on connect function
		//console.log("Connected");
		client.subscribe(vpos, 0); //subscribe to vehicel position topic
		//console.log("Subscribed");
	};
	client.ondisconnect = function() {
		//client on disconnect function
		//console.log("Lost connection to server");
		//console.log("Reconnecting...");
		main(); //reconnect
	};
	client.onmessage = function(topic, message) {
		//client on message receive function
		messageHandler(topic, message); //pass origin topic and message content to messageHandler()
	};

	client.connect(url); //connect to websocket url

	window.onbeforeunload = function(event) {
		client.disconnect();
	}; //disconnect socket before unloading page

	setInterval(updateDots, 1000 / updateFPS); //start dot update loop
	setInterval(updateInfo, 1000 / updateFPS); //start vehicle info panel update loop
	setInterval(ping, 30 * 1000); //ping mqtt server every 30s
}

var map = new ol.Map({
	//create map
	target: "map", //target document element with id 'map'
	layers: [
		//add layers
		new ol.layer.Tile({
			//create map tile layer
			//source: new ol.source.OSM()//OpenStreetMap source
			source: new ol.source.XYZ({
				//HSL background map tile source
				url:
					"https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}@2x.png",
				tileSize: 1024, //hsl tiles are 1024x1024px
			}),
		}),
	],
	view: new ol.View({
		//initialize map viewport
		center: ol.proj.fromLonLat([24.93, 60.23]), //coordinates for Helsinki
		zoom: 11.6, //zoom level
	}),
});

let transithelper; //create transithelper variable for writing in main()

let vehicleDots = {}; //create dot element storage object
let markers = {}; //create marker storage object

let infokey = ""; //init key for vehicle data

const origTitle = document.title; //get original page title

main(); //run main function
