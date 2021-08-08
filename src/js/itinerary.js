const graphqlURL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';//itinerary api url

const fromLonLat = ol.proj.fromLonLat;//fromLonLat function define

const karamalmi = [24.758209, 60.223959];

function polylineTOgeojson(flatCoordinates){//convert from arcgis to geojson
	fc = flatCoordinates;//make the name shorter
	
	wholePath = [];//init path
	
	prevcoord = fromLonLat([fc[0], fc[1]]);//init prevcoord as first coordinate pair
	for (let i = 2; i < fc.length; i+=2) {//for every lonlat pair
		coord = fromLonLat([fc[i], fc[i+1]]);//next coordinate pair
		wholePath.push([prevcoord,coord]);//add coordinates to path
		prevcoord = coord;//coord is new prevcoord
	}
	
	//format geojson
	geojsonObject = {
		'type': 'FeatureCollection',
		'features': [
			{
				'type': 'Feature',
				'geometry': {
					'type': 'MultiLineString',
					'coordinates': wholePath
				}
			}
		]
	};
	return geojsonObject;//return geojson object
}

async function getHSLItinerary(from, to){//get itinerary based on origin[lat, long], destination[lat, long]
	now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);//get time with double timezone offset so ISO string is timezone corrected
	now = now.toISOString().split(/T|\./);//split datestring on T or .
	
	data = `{
		plan(
			from: {lat: ${from[0]}, lon: ${from[1]}}
			to: {lat: ${to[0]}, lon: ${to[1]}}
			date: "${now[0]}",
			time: "${now[1]}",
			numItineraries: 1
		){
			itineraries {
				walkDistance
				duration
				legs {
					mode
					startTime
					endTime
					duration
					distance
					legGeometry {
						points
					}
					from {
						lat
						lon
						name
						stop {
							gtfsId
							name
						}
					},
					to {
						lat
						lon
						name
						stop {
							gtfsId
							name
						}
					}
					trip {
						gtfsId
						directionId
						routeShortName
					}
				}
			}
		}
	}`;//data for request
	
	let itinerary;//init itinerary
	
	await fetch(graphqlURL, {//fetch graphql response from api url
		method: 'POST',//post data
		headers: {//headers to tell we want graphql
			'Content-Type': 'application/graphql'
		},
		body: data//data for request
	})
	.then(response => json = response.json())//read response
	.then(json => itinerary = json.data.plan.itineraries[0])//get itinerary from response
	//console.log(json)
	return itinerary;//return response itinerary
}

function addMarker(lonlat,element,tooltip=false, id=''){//add plave marker to map
	if (tooltip){element.appendChild(createTooltip(tooltip));}//add tooltip if it is specified
	if (id!=''){element.id = id.toString()};
	overlay = new ol.Overlay({//create new overlaid marker
		position: fromLonLat(lonlat),
		positioning: 'bottom-center',//position origin is element bottom center
		element: element
	});
	map.addOverlay(overlay);//add overlay to map
	return overlay;
}

function layerLegs(legs){//add legs to map as vector layers
	oldLayers.forEach(old => map.removeLayer(old));//remove old layers
	oldLayers = [];//clear oldLayers
	oldOverlays.forEach(old => map.removeOverlay(old));//remove old overlays
	oldOverlays = [];//clear oldOverlays
	
	legs.forEach((leg, i) => {//for each leg of the journey
		
		polypath = new ol.format.Polyline().readGeometry(leg.legGeometry.points);//read path from legGeometry
		
		geojson = polylineTOgeojson(polypath.flatCoordinates);//convert polypath to geojson
		
		path = new ol.format.GeoJSON().readFeatures(geojson);//convert polyline to geojson
		
		shapecolor = transithelper.transport_mode[leg.mode.toLowerCase()].color;//get color from transithelper
		
		if (leg.mode != 'WALK'){//if itinerary leg is not walking
			coords = polypath.flatCoordinates;//get polypath coordinates
			halflength = coords.length/2|0;//get half the length of coords
			halflength += (halflength%2==0)?0:1;//make it a multiple of 2
			midpoint = [coords[halflength],coords[halflength+1]];//get middle coordinate pair
			oldOverlays.push(addMarker(midpoint,createTripID(leg.trip.routeShortName,shapecolor)));//add trip id marker to path middle and add it to storage for later removal
		}
		
		//create style
		linestyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: shapecolor,
				width: 5,
				lineDash: ((leg.mode == 'WALK')?[.1,8]:null)//dashed line if mode is walk
			})
		});
		//create layer
		layer = new ol.layer.Vector({
			source: new ol.source.Vector({features: path}),
			style: linestyle
		});
		
		oldLayers[i] = layer;//store layer reference in oldLayers for removing at the start
		
		map.addLayer(layer);//add layer
	});
}

const ItinerarySteps = document.getElementById('ItineraryStepsList');//get itinerary steps list element

function itineraryInfo(itinerary){//add itinerary data to map
	oldSubs.forEach(topic => {//for every topic
		client.unsubscribe(topic);//unsubscribe from topic
	}); 
	oldSubs = [];//clear old topics
	
	Object.keys(markers).forEach(key => {//for every marker
		map.removeOverlay(map.getOverlayById(key));//remove marker from map
	});
	markers = {};//clear vehicle markers
	
	layerLegs(itinerary.legs);//add leg lines to map
	
	transfers.forEach(overlay => {//for every marker
		map.removeOverlay(overlay);//remove marker from map
	});
	transfers = [];
	
	ItinerarySteps.parentElement.classList.remove('hidden');//show step list
	while(ItinerarySteps.firstChild){ItinerarySteps.removeChild(ItinerarySteps.firstChild)};//clear all child elements
	
	itinerary.legs.forEach(leg => {//for each leg of the itinerary
		mode = leg.mode.toLowerCase();//convert mode to lowercase 
		if (mode != 'walk'){//if transport mode isn't walking
			dir = +leg.trip.directionId + 1;//directionId is 0:1 topic dir is 1:2
			route = leg.trip.gtfsId.slice(4,8);//get roite id from trip info
			time = `${leg.trip.gtfsId.slice(-4,-2)}:${leg.trip.gtfsId.slice(-2)}`;//get vehicle start time from trip info
			topic = `/hfp/v2/journey/ongoing/vp/${mode}/+/+/${route}/${dir}/+/${time}/#`;//show all matching vehicles
			//console.log(topic);
			oldSubs.push(topic);//add topic to subs array
			client.subscribe(topic, 0);//subscribe to topic
			
			//add stop markers
			name = leg.from.name;//get stop name to use as tooltip and id
			if (!transfers.includes(name)){//if id hasnt been added (some legs have same end stop as another legs start stop)
				transfernode = createTransfer(name, transithelper.transport_mode[mode].color);//create stop marker with helper function
				transfers.push(addMarker([leg.from.lon,leg.from.lat],transfernode,name,name));//add marker to map and to list for later removing
			}
			name = leg.to.name;//get stop name...
			if (!transfers.includes(name)){//if id hasnt been added...
				transfernode = createTransfer(name, transithelper.transport_mode[mode].color);//create stop marker...
				transfers.push(addMarker([leg.to.lon,leg.to.lat],transfernode,name,name));//add marker to map and to list...
			}
		}
		//update step list
		content = '';//init content string
		mode = leg.mode.toLowerCase();//get leg mode in lowercase
		switch (mode) {//leg mode switch (is switch for possible later added functionality)
			case 'walk'://if leg is walking
				if (leg.to.name == 'Destination'){//if leg ends in destination
					content = `Walk ${leg.distance|0} m to your destination.`;//add destination step
				}
				else {//else
					content = `Walk ${leg.distance|0} m to ${leg.to.name}.`;//add walkign step
				}
				break;
		
			default://if leg is not walking
				content = `Take ${mode} ${leg.trip.routeShortName} to ${leg.to.name}.`;//add step with mode, route and stop name
				break;
		}
		
		item = document.createElement('li');//create list element
		item.innerText = content;//add contetnt to element
		ItinerarySteps.appendChild(item);//add element to list
	});
}

async function addBreweries(){//add brewery markers
	brewerylist = await fetchJSON('panimot.json');//read data from panimot.json
	brewerylist.panimot.sort((a,b) => a.lat - b.lat);//sort markers by latitude so northest is first to avoid tooltip overlap
	brewerylist.panimot.forEach((brew,i) => {//add all breweries
		//position from lonlat, clone brewery marker node, add link logo name and address to tooltip, index
		addMarker([brew.lon,brew.lat],brewery.cloneNode(true),
		`<a href="${brew.link}" target="_blank"><img class="brewlogo" src="${brew.logo}" alt="${brew.nimi} logo"></a><p>${brew.nimi}</p><p class="address">${brew.osoite}</p>`,'brew'+i);
	})
}

async function path2brew(evt){
	if (evt.target.className.includes('brewery')){
		brewerymark = brewerylist.panimot[parseInt(evt.target.id.slice(-1))];
		brewLocation = [brewerymark.lat,brewerymark.lon];
		itinerary = await getHSLItinerary(karamalmi.slice().reverse(),brewLocation);//get itinerary based on origin and destination coordinates
		itineraryInfo(itinerary);
	}
}

var map = new ol.Map({//create map
	target: 'map',//target document element with id 'map'
	interactions : ol.interaction.defaults({doubleClickZoom :false}),
	layers: [//add layers
		new ol.layer.Tile({//create map tile layer
			//source: new ol.source.OSM()//OpenStreetMap source
			source: new ol.source.XYZ({//HSL background map tile source
				url: 'https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}@2x.png',
				tileSize: 512//hsl tiles are 512x512px
			})
		})
	],
	view: new ol.View({//initialize map viewport
		center: ol.proj.fromLonLat([24.7305015, 60.1943475]),//map center coordinates from average of extents fro markers
		zoom: 12//zoom level
	})
});

document.addEventListener('click', evt => path2brew(evt));

async function main(){//main function needed for asyncs
	transithelper = await fetchJSON('transitHelper.json');//read transithelper.json
	createDots();//create vehicle dots
	await addBreweries();//add breweries
	
	//create and add origin marker
	origin = createSchool();
	origin.classList.add('school');
	addMarker(karamalmi, origin, 'Karamalmi Campus');
	
	overlayelements = document.getElementsByClassName('ol-overlay-container');
	
	const updateFPS = 2;//times per second to update vehicles on map
	
	setInterval(updateDots,1000/updateFPS)//start dot update loop
	setInterval(ping,30*1000)//ping mqtt server every 30s
}

//init storage objects
transithelper = {};
vehicleDots = {};
markers = {};
brewerylist = {};
transfers = [];
oldLayers = [];
oldOverlays = [];
oldSubs = [];

place = createMarker();//create place marker
brewery = createBrwewery();//create brewery marker

client = new Mosquitto();//create new mqtt client

client.onconnect = function() {//client on connect function
	//console.log("Connected");
	main();//run main function after successful connect
};
client.ondisconnect = function() {//client on disconnect function
	console.log("Lost connection to server");//inform of disconnection
};
client.onmessage = function(topic, message) {//client on message receive function
	//console.log(topic, JSON.parse(message).VP);
	messageHandler(topic, message);//pass origin topic and message content to messageHandler()
};

const url = 'wss://mqtt.hsl.fi:443/';//base socket url
client.connect(url);//connect to websocket url

window.onbeforeunload = function(event) {client.disconnect();};//disconnect socket before unloading page