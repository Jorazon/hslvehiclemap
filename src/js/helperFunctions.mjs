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

export function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
