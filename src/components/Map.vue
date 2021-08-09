<template>
	<ol-map
		:loadTilesWhileAnimating="true"
		:loadTilesWhileInteracting="true"
		class="ol-map"
	>
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
						:coordinates="
							epsg4326toepsg3857([
								vehicle.latitude,
								vehicle.longitude,
							])
						"
					/>
					<ol-style>
						<!--ol-style-icon :src="markerIcon" :scale="0.15"
						:rotation="(vehicle.heading * Math.PI) / 180.0" /-->
						<ol-style-circle :radius="12">
							<ol-style-fill
								:color="
									transport.transport_mode[vehicle.type].color
								"
							></ol-style-fill>
							<ol-style-stroke
								color="black"
								:width="1"
							></ol-style-stroke>
						</ol-style-circle>
						<ol-style-text :text="vehicle.designation" />
					</ol-style>
				</ol-feature>
			</ol-source-vector>
		</ol-vector-layer>
	</ol-map>
</template>

<script>
//transport.tranport_mode[vehicle.type].color
import { ref } from "vue";
import { epsg4326toepsg3857 } from "@/js/helperFunctions.mjs";
import markerIcon from "@/assets/logo.png";
import json from "@/assets/transitHelper.json";

export default {
	name: "Map",
	data() {
		return {
			vehicles: {},
			transport: json,
		};
	},
	setup() {
		const projection = ref("EPSG:3857");
		const center = ref(epsg4326toepsg3857([24.94, 60.24]));
		const zoom = ref(11);
		const rotation = ref(0);
		const url = ref(
			"https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}@2x.png",
		);
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
		this.vehicles = new Map();

		console.log(this.transport.transport_mode["bus"].color);

		const mqtt = require("mqtt");
		const client = mqtt.connect("wss://mqtt.hsl.fi:443/");

		client.on("connect", () => {
			client.subscribe("/hfp/v2/journey/ongoing/vp/#", (err) => {
				if (err) console.log(err);
			});
		});
		client.on("message", (topic, message) => {
			if (this.vehicles.size > 5000) client.end();

			topic = topic.split("/");
			message = JSON.parse(message).VP;

			let vehicle = {
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
				delay: message.dl, // s (<0: behind, >0: ahead)
				doors: message.drst, // 0: closed 1: open
				label: message.label, //ferry name
			};

			this.vehicles.set(vehicle.uid, vehicle);
		});
	},
	methods: {
		epsg4326toepsg3857,
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
.bus {
	filter: ;
}
</style>
