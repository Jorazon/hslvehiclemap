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
				<ol-feature v-for="(vehicle, index) in vehicles" :key="index">
					<ol-geom-point
						:coordinates="
							epsg4326toepsg3857([
								vehicle.latitude,
								vehicle.longitude,
							])
						"
					/>
					<ol-style>
						<ol-style-icon
							:src="markerIcon"
							:scale="0.1"
							:rotation="vehicle.heading"
						/>
					</ol-style>
				</ol-feature>
			</ol-source-vector>
		</ol-vector-layer>
	</ol-map>
</template>

<script>
import { ref } from "vue";
import { epsg4326toepsg3857 } from "@/js/helperFunctions.mjs";
import markerIcon from "@/assets/logo.png";
export default {
	name: "Map",
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
	data() {
		return {
			vehicles: [
				{
					designation: "551",
					direction: "1",
					operator: 12,
					number: 10,
					speed: 1, // m/s
					heading: 45,
					latitude: 24.94,
					longitude: 60.24,
					acceleration: 0, // m/s^2
					delay: -60,
					doors: 0,
					route: "2551",
					label: "lautta",
				},
			],
		};
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
</style>
