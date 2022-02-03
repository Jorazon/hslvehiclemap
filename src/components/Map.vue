<template>
	<ol-map :loadTilesWhileAnimating="true" :loadTilesWhileInteracting="true" class="ol-map">
		<ol-view
			ref="view"
			:projection="projection"
			:center="center"
			:rotation="rotation"
			:zoom="zoom"
		/>
		<ol-tile-layer>
			<ol-source-xyz :url="url" :tileSize="[1024, 1024]" />
		</ol-tile-layer>
		<ol-vector-layer>
			<ol-source-vector>
				<ol-feature v-for="[key, vehicle] in vehicles" :key="key">
					<ol-geom-point
						:coordinates="epsg4326toepsg3857([vehicle.latitude, vehicle.longitude])"
					/>
					<ol-style>
						<!--ol-style-icon :src="markerIcon" :scale="0.15" :rotation="degToRad(vehicle.heading + 180)" /-->
						<ol-style-circle :radius="12">
							<ol-style-fill
								:color="transport.transport_mode[vehicle.type].color"
							></ol-style-fill>
							<ol-style-stroke color="black" :width="1"></ol-style-stroke>
						</ol-style-circle>
						<ol-style-text :text="vehicle.designation" />
					</ol-style>
				</ol-feature>
			</ol-source-vector>
		</ol-vector-layer>
	</ol-map>
</template>

<script>
import { ref } from "vue";
import { epsg4326toepsg3857, degToRad } from "@/js/helperFunctions.mjs";
import markerIcon from "@/assets/logo.png";
import transportAttributes from "@/assets/transitHelper.json";

export default {
	name: "Map",
	data() {
		return {
			vehicles: new Map(),
			transport: transportAttributes,
		};
	},
	setup() {
		const projection = ref("EPSG:3857");
		const helsinki = [24.94, 60.24];
		const center = ref(epsg4326toepsg3857(helsinki));
		const zoom = ref(11);
		const rotation = ref(0);
		const url = ref("https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}@2x.png");
		return {
			center,
			projection,
			zoom,
			rotation,
			url,
			markerIcon,
		};
	},
	created() {
		const mqtt = require("mqtt");
		const client = mqtt.connect("wss://mqtt.hsl.fi:443/");

		const vehicleBuffer = new Map();

		// update data only once every second
		window.setInterval(() => {
			this.vehicles = new Map(vehicleBuffer);
		}, 1000);

		client.on("connect", () => {
			client.subscribe("/hfp/v2/journey/ongoing/vp/#", (err) => {
				if (err) console.log(err);
			});
		});

		client.on("message", (topic, message) => {
			if (vehicleBuffer.size > 2000) client.end(); //handles overflows

			topic = topic.split("/");
			message = JSON.parse(message).VP;

			let vehicle = this.createVehicle(topic, message);

			vehicleBuffer.set(vehicle.uid, vehicle);

			window.top.document.title = `${vehicleBuffer.size} vehicles tracked`;
		});
	},
	methods: {
		epsg4326toepsg3857,
		degToRad,
		createVehicle: function(topic, message) {
			return {
				uid: `${topic[7]}/${topic[8]}`,
				type: topic[6],
				route: topic[9],
				direction: topic[10],
				destination: topic[11],
				nextStop: `HSL:${topic[13]}`,
				designation: message.desi,
				operator: message.oper,
				number: message.veh,
				speed: message.spd * 3.6, // km/h
				heading: message.hdg, // deg
				latitude: message.long, // deg
				longitude: message.lat, // deg
				acceleration: message.acc, // m/s^2
				delay: message.dl, // seconds (<0: behind, >0: ahead)
				doors: message.drst, // 0: closed 1: open
				label: message.label, //ferry name
			};
		},
	},
};
</script>

<style scoped>
.ol-map {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
</style>
