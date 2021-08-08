function arcgisTOgeojson(geometry){//convert from arcgis to geojson
	
	//transform all path cordinate pairs to map pixels
	if(geometry.paths[0].lenth == 2){//if paths contains only one path just convert
		geometry.paths.forEach(path => {
			path[0] = fromLonLat(path[0]);
			path[1] = fromLonLat(path[1]);
		});
	}
	else {//if paths contains multiple subpaths combine them in one while converting
		wholePath = [];
		geometry.paths.forEach(path => {
			for (let i = 1; i < path.length; i++) {
				if(i==1){wholePath.push([fromLonLat(path[i-1]),fromLonLat(path[i])])}
				else{wholePath.push([wholePath[wholePath.length-1][1],fromLonLat(path[i])])}
			}
		});
		geometry.paths = wholePath;
	}
	
	//format geojson
	geojsonObject = {
		'type': 'FeatureCollection',
		'features': [
			{
				'type': 'Feature',
				'geometry': {
					'type': 'MultiLineString',
					'coordinates': geometry.paths
				}
			}
		]
	};
	return geojsonObject;//return geojson object
}

oldLayer = undefined;

async function getPath(number, dir){//get line path from api
	if(oldLayer){map.removeLayer(oldLayer)}//remove old layer if it exists
	
	//api query url
	query = `https://services1.arcgis.com/sswNXkUiRoWtrx0t/arcgis/rest/services/HSL_linjat_kevat2018/FeatureServer/0/query?where=NUMERO%20%3D%20'${number}'%20AND%20SUUNTA%20%3D%20'${dir}'&outFields=JL_LAJI&outSR=4326&f=json`;
	
	result = await fetchJSON(query);//fetch json from query
	
	if(!result.features[0]){console.log('Line has no path data'); return;}//if the path has no geometry stop function execution
	
	geojson = arcgisTOgeojson(result.features[0].geometry);//convert from arcgis to geojson
	
	path = new ol.format.GeoJSON().readFeatures(geojson);//geometry source is fetch result, projection is same as in query
	
	shapecolor = transithelper.transport_mode[transithelper.jl_laji[result.features[0].attributes.JL_LAJI]].color;//get color from transithelper based on query jl_laji
	
	//create style
	linestyle = new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: shapecolor,
			width: 5
		})
	});
	//create layer
	layer = new ol.layer.Vector({
		source: new ol.source.Vector({features: path}),
		style: linestyle
	});
	
	oldLayer = layer;//store layer reference in oldLayer for removing when a new path is requested
	
	map.addLayer(layer);//add layer
}