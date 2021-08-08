function messageHandler(topic, message){//handle websocket messages
	//client.disconnect();//debug disconnect
	
	topic = topic.split('/');//split the topic for easier reading
	
	t_mode = topic[6];//vehicle type
	opr_id = topic[7];//vehicle operator
	veh_number = topic[8];//vehicle number (operators can have overlap)
	
	id = opr_id + veh_number;//unique identifier for vehicles based on operator and number
	
	data = JSON.parse(message).VP;//data has multiple event_type
	//console.log(data);
	//console.log(event_type);
	
	if (!markers.hasOwnProperty(id)){markers[id] = {};}//if marker with id doesn't exist create a blank storage object
	
	markers[id].data = data;//marker data is vehicle data
	markers[id].type = t_mode;//marker type is vehicle type
	markers[id].changed = true;//set marker changed attribute to true when a message for it comes
}

function ping(){//ping the client to prevent idle disconnect
	//console.log('ping');
	client.mqtt_ping();
}

function updateDots(){//dot updating function
	Object.keys(markers).forEach(key => {//do something for every marker in object
		overlay = map.getOverlayById(key);//try to get overlay with key
		
		isold = 60000 < new Date(Date.now() - new Date(markers[key].data.tst)).getTime();//vehicle is old if it hasnt updated in over a minute

		//if(isold){console.log('old vehicle deleted');}

		if (isold){//if vehicle is old
			map.removeOverlay(overlay);//remove its overlay
			delete markers[key];//remove its data from the marker storage object
		}
		else if (markers[key].changed) {//if the marker has got a new message since last update
			markers[key].changed = false;//set marker changed attribute to false
			if (!overlay){//if the marker doesn't exist
				overlay = new ol.Overlay({//create new overlaid marker
					id: key,//overlay html id is vehicle uid
					positioning: 'center-center',//position is element center
					element: (vehicleDots[markers[key].type].cloneNode(true)),//marker is clone of element in vehicleDots with type
				});
				element = overlay.getElement();//get element of overlay
				element.id = key;//set element id to key
				map.addOverlay(overlay);//add marker overlay to map
			}
			overlay.setPosition(fromLonLat([markers[key].data.long, markers[key].data.lat]))//set overlay position from coordinates
			overlay.getElement().childNodes[0].innerText = markers[key].data.desi;//set overlay text from designation
			overlay.getElement().childNodes[1].style = `transform: rotate(${markers[key].data.hdg}deg)`;//set overlay rotation from heading
		}
	});
}