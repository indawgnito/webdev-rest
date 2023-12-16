<script setup>
import { reactive, ref, onMounted } from "vue";
import Modal from "./components/Modal.vue";

let crime_url = ref("");
let latitude = ref(44.955139);
let longitude = ref(-93.102222);
let dialog_err = ref(false);
let map = reactive({
  leaflet: null,
  center: {
    lat: 44.955139,
    lng: -93.102222,
    address: "",
  },
  zoom: 12,
  bounds: {
    nw: { lat: 45.008206, lng: -93.217977 },
    se: { lat: 44.883658, lng: -92.993787 },
  },
  neighborhood_markers: [
    { location: [44.942068, -93.020521], marker: null },
    { location: [44.977413, -93.025156], marker: null },
    { location: [44.931244, -93.079578], marker: null },
    { location: [44.956192, -93.060189], marker: null },
    { location: [44.978883, -93.068163], marker: null },
    { location: [44.975766, -93.113887], marker: null },
    { location: [44.959639, -93.121271], marker: null },
    { location: [44.9477, -93.128505], marker: null },
    { location: [44.930276, -93.119911], marker: null },
    { location: [44.982752, -93.14791], marker: null },
    { location: [44.963631, -93.167548], marker: null },
    { location: [44.973971, -93.197965], marker: null },
    { location: [44.949043, -93.178261], marker: null },
    { location: [44.934848, -93.176736], marker: null },
    { location: [44.913106, -93.170779], marker: null },
    { location: [44.937705, -93.136997], marker: null },
    { location: [44.949203, -93.093739], marker: null },
  ],
});

// Vue callback for once <template> HTML has been added to web page
onMounted(() => {
  // Create Leaflet map (set bounds and valied zoom levels)
  map.leaflet = L.map("leafletmap").setView(
    [map.center.lat, map.center.lng],
    map.zoom
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 11,
    maxZoom: 18,
  }).addTo(map.leaflet);
  map.leaflet.setMaxBounds([
    [44.883658, -93.217977],
    [45.008206, -92.993787],
  ]);

  map.leaflet.on("moveend", () => {
    map.center.lat = map.leaflet.getCenter().lat;
    map.center.lng = map.leaflet.getCenter().lng;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${map.center.lat}&lon=${map.center.lng}&format=json`
    )
      .then((result) => {
        return result.json();
      })
      .then((data) => {
        // console.log(data);
        map.center.address =
          data.address.road +
          ", " +
          data.address.city +
          ", " +
          data.address.state;
      });
  });

  // Get boundaries for St. Paul neighborhoods
  let district_boundary = new L.geoJson();
  district_boundary.addTo(map.leaflet);
  fetch("data/StPaulDistrictCouncil.geojson")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.features.forEach((value) => {
        district_boundary.addData(value);
      });

      for (let i = 0; i < map.neighborhood_markers.length; i++) {
        map.neighborhood_markers[i].marker = L.marker(
          map.neighborhood_markers[i].location
        ).addTo(map.leaflet);
      }
    })
    .catch((error) => {
      //   console.log("Error:", error);
    });
});

// FUNCTIONS
// Function called once user has entered REST API URL
function initializeCrimes() {
  // TODO: get code and neighborhood data
  //       get initial 1000 crimes
}

// Function called when user presses 'OK' on dialog box
function closeDialog() {
  let dialog = document.getElementById("rest-dialog");
  let url_input = document.getElementById("dialog-url");
  if (crime_url.value !== "" && url_input.checkValidity()) {
    dialog_err.value = false;
    dialog.close();
    initializeCrimes();
  } else {
    dialog_err.value = true;
  }
}

// Function called when user presses 'Go' button
function updateLocationLatLong() {
  if (map.leaflet) {
    // update the map's center to the new location
    map.leaflet.setView([map.center.lat, map.center.lng], 14);
    console.log(typeof map.center.lat);
  }
}

function updateLocationAddress() {
  if (map.leaflet) {
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${map.center.address}&format=json&limit=1`
    )
      .then((result) => {
        return result.json();
      })
      .then((data) => {
        let location = data[0];
        if (
          location.lat > 44.883658 &&
          location.lat < 45.008206 &&
          location.lon > -93.217977 &&
          location.lon < -92.993787
        ) {
          map.leaflet.setView([location.lat, location.lon], 14);
        } else {
          document.getElementById("error-message").style.display = "block";
          setTimeout(() => {
            document.getElementById("error-message").style.display = "none";
          }, 3000);
        }
      });
  }
}

function submitIncident() {
  let case_number = document.getElementById("case_number").value;
  let date = document.getElementById("date").value;
  let time = document.getElementById("time").value;
  let code = document.getElementById("code").value;
  let incident = document.getElementById("incident").value;
  let police_grid = document.getElementById("police_grid").value;
  let neighborhood_number = document.getElementById(
    "neighborhood_number"
  ).value;
  let block = document.getElementById("block").value;

  let incident_data = {
    case_number: case_number,
    date: date,
    time: time + ":00",
    code: code,
    incident: incident,
    police_grid: police_grid,
    neighborhood_number: neighborhood_number,
    block: block,
  };
  console.log(incident_data);
  console.log(crime_url.value + "/new-incident");

  fetch(crime_url.value + "/new-incident", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(incident_data),
  }).then((response) => {
    return response.text();
  });
}

let isModalVisible = ref(false);

function showModal() {
  isModalVisible.value = true;
}

function closeModal() {
  isModalVisible.value = false;
}
</script>

<template>
  <dialog id="rest-dialog" open>
    <h1 class="dialog-header">St. Paul Crime REST API</h1>
    <label class="dialog-label">URL: </label>
    <input
      id="dialog-url"
      class="dialog-input"
      type="url"
      v-model="crime_url"
      placeholder="http://localhost:8000"
    />
    <p class="dialog-error" v-if="dialog_err">Error: must enter valid URL</p>
    <br />
    <button class="button" type="button" @click="closeDialog">OK</button>
  </dialog>
  <div class="grid-container">
    <div class="grid-x grid-padding-x">
      <div id="leafletmap" class="cell auto"></div>
    </div>
  </div>
  <div class="lat-long-container">
    <input
      id="lat"
      class="dialog-input lat-long-input"
      type="number"
      v-model="map.center.lat"
    />
    <input
      id="lng"
      class="dialog-input lat-long-input"
      type="number"
      v-model="map.center.lng"
    />
    <button
      class="button lat-long-btn"
      type="button"
      @click="updateLocationLatLong"
    >
      Go
    </button>
  </div>
  <div class="center">
    <input
      id="address"
      class="address-input"
      type="text"
      v-model="map.center.address"
    />
    <button
      class="button lat-long-btn"
      type="button"
      @click="updateLocationAddress"
    >
      Go
    </button>
  </div>
  <hr />
  <div class="center">
    <p id="error-message">Location address outside of bounds</p>
  </div>
  <div class="center">
    <button type="button" class="addincident" @click="showModal">
      Add Incident
    </button>
  </div>

  <Modal v-show="isModalVisible" @close="closeModal">
    <template #header
      ><p>Add Incident</p>
      <p>test</p></template
    >

    <template #body>
      <form class="put-incident" @submit.prevent="submitIncident">
        <input id="case_number" placeholder="Case #" required />
        <input id="date" type="date" required />
        <input id="time" type="time" required />
        <input id="code" placeholder="Code" required />
        <input id="incident" placeholder="Incident" required />
        <input id="police_grid" placeholder="Police Grid" required />
        <input id="neighborhood_number" placeholder="Neighborhood #" required />
        <input id="block" placeholder="Block" required />
        <!-- On click event, make PUT request to api-->
        <button class="addbtn" type="submit">Add</button>
      </form>
    </template>
  </Modal>
</template>

<style>
#rest-dialog {
  width: 20rem;
  margin-top: 1rem;
  z-index: 1000;
}

#leafletmap {
  height: 500px;
}

#go-btn {
  /* background-color: #4287f5; */
  background-color: #1779ba;
  color: white;
  width: 10em;
  height: 2em;
  border-radius: 2em;
}

#error-message {
  display: none;
  color: red;
}

.center {
  display: flex;
  justify-content: center;
}

.search-input {
  width: 10rem;
  text-align: center;
}

.search-label {
  font-size: x-large;
  text-align: center;
}

.dialog-header {
  font-size: 1.2rem;
  font-weight: bold;
}

.dialog-label {
  font-size: 1rem;
}

.dialog-input {
  font-size: 1rem;
  width: 100%;
}

.lat-long-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.lat-long-input {
  max-width: 10rem;
  margin: 0.5rem;
}

.put-incident {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
  gap: 10px;
}

.put-incident input {
  margin: 0.5rem;
  flex: 1;
  min-width: 12rem;
  max-width: 30rem;
  padding: 0.5rem;
  border-radius: 0.2rem;
  border: 1px solid darkgray;
}

.put-incident input::placeholder {
  color: rgb(152, 152, 152);
}

.address-input {
  max-width: 20rem;
  margin: 0.5rem;
}

.lat-long-btn {
  border-radius: 0.2rem;
  padding: 0.6rem 0.8rem;
  font-size: 1.1rem;
  margin: 0.3rem;
}

.dialog-error {
  font-size: 1rem;
  color: #d32323;
}

.addincident {
  background-color: #40d92c;
  color: black;
  border-radius: 0.3rem;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
}

.addincident:hover {
  background-color: #2c9d1f;
}
</style>
