<script setup>
import { reactive, ref, onMounted } from "vue";
import Modal from "./components/Modal.vue";

let crimes = ref([]);
let crime_url = ref("");
let latitude = ref(44.955139);
let longitude = ref(-93.102222);
let dialog_err = ref(false);
let red_markers = ref([]);
let maxIncidents = ref();
let startDate = ref();
let endDate = ref();
// selected crime will update when users click on a row
let selected_crime = reactive({
  case_number: "",
  date: "",
  time: "",
  code: "",
  incident: "",
  police_grid: "",
  neighborhood_number: "",
  block: "",
});
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
    { id: 1, location: [44.942068, -93.020521], marker: null },
    { id: 2, location: [44.977413, -93.025156], marker: null },
    { id: 3, location: [44.931244, -93.079578], marker: null },
    { id: 4, location: [44.956192, -93.060189], marker: null },
    { id: 5, location: [44.978883, -93.068163], marker: null },
    { id: 6, location: [44.975766, -93.113887], marker: null },
    { id: 7, location: [44.959639, -93.121271], marker: null },
    { id: 8, location: [44.9477, -93.128505], marker: null },
    { id: 9, location: [44.930276, -93.119911], marker: null },
    { id: 10, location: [44.982752, -93.14791], marker: null },
    { id: 11, location: [44.963631, -93.167548], marker: null },
    { id: 12, location: [44.973971, -93.197965], marker: null },
    { id: 13, location: [44.949043, -93.178261], marker: null },
    { id: 14, location: [44.934848, -93.176736], marker: null },
    { id: 15, location: [44.913106, -93.170779], marker: null },
    { id: 16, location: [44.937705, -93.136997], marker: null },
    { id: 17, location: [44.949203, -93.093739], marker: null },
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

  // find number of crimes in each neighborhood and
  // add to marker popups with
  let promises = [];
  // running in parallel
  //   console.log(crime_url.value);

  let neighborhoods = [
    { id: 1, label: "Conway/Battlecreek/Highwood", crimes: 0 },
    { id: 2, label: "Greater East Side", crimes: 0 },
    { id: 3, label: "West Side", crimes: 0 },
    { id: 4, label: "Dayton's Bluff", crimes: 0 },
    { id: 5, label: "Payne/Phalen", crimes: 0 },
    { id: 6, label: "North End", crimes: 0 },
    { id: 7, label: "Thomas/Dale(Frogtown)", crimes: 0 },
    { id: 8, label: "Summit/University", crimes: 0 },
    { id: 9, label: "West Seventh", crimes: 0 },
    { id: 10, label: "Como", crimes: 0 },
    { id: 11, label: "Hamline/Midway", crimes: 0 },
    { id: 12, label: "St. Anthony", crimes: 0 },
    { id: 13, label: "Union Park", crimes: 0 },
    { id: 14, label: "Macalester-Groveland", crimes: 0 },
    { id: 15, label: "Highland", crimes: 0 },
    { id: 16, label: "Summit Hill", crimes: 0 },
    { id: 17, label: "Capitol River", crimes: 0 },
  ];

  // create a promise to request the 1000 most recent
  const crimePromise = fetch(`${crime_url.value}/incidents?limit=1000`)
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        let crime = data[i];
        for (let j = 0; j < neighborhoods.length; j++) {
          let neighborhood = neighborhoods[j];
          if (neighborhood.id === crime.neighborhood_number) {
            neighborhood.crimes++;
          }
        }
      }
      //   data.forEach((crime) => {
      //     neighborhoods.forEach((neighborhood) => {
      //       if (neighborhood.id === crime.neighborhood_number) {
      //         neighborhood.crimes++;
      //       }
      //     });
      //   });
      console.log(neighborhoods);

      for (let i = 0; i < neighborhoods.length; i++) {
        let neighborhood = neighborhoods[i];
        map.neighborhood_markers[i].marker.bindPopup(
          `${neighborhood.label}: ${neighborhood.crimes} crimes committed`
        );
      }

      //   neighborhoods.forEach((neighborhood) => {
      //     try {
      //       map.neighborhood_markers[neighborhood.id].marker.bindPopup(
      //         `${neighborhood.label}: ${neighborhood.crimes} crimes committed`
      //       );
      //     } catch (error) {
      //       console.log("oh an error!");
      //     }
      //   });

      crimes.value = data;
    });

  promises.push(crimePromise);

  Promise.all(promises).then(() => {
    // console.log("done");
  });
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

  fetch(crime_url.value + "/new-incident", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(incident_data),
  }).then((response) => {
    console.log(response.status);
    if (response.status === 200) {
      console.log("added");

      //close popup
      closeModal();

      // reload first 1000 crimes
      fetch(`${crime_url.value}/incidents?limit=1000`)
        .then((result) => {
          return result.json();
        })
        .then((data) => {
          crimes.value = data;
        });

      // reload markers
      initializeCrimes();
    }
  });
}

let isModalVisible = ref(false);

function showModal() {
  isModalVisible.value = true;
}

function closeModal() {
  isModalVisible.value = false;
}

function getCrimeColor(status) {
  if (
    status === "Agg. Assault" ||
    status === "Agg. Assault Dom." ||
    status === "Simple Assault Dom." ||
    status === "Rape"
  ) {
    return "violent-crime";
  } else if (
    status === "Theft" ||
    status === "Auto Theft" ||
    status === "Burglary" ||
    status === "Criminal Damage" ||
    status === "Robbery"
  ) {
    return "property-crime";
  } else if (status === "Narcotics") {
    return "drug-use-crime";
  } else {
    return "";
  }
}

function deleteIncident(number) {
  let deletion = {
    case_number: number,
  };
  console.log(JSON.stringify(deletion));

  fetch(crime_url.value + "/remove-incident", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deletion),
  }).then((response) => {
    console.log(response.status);
    if (response.status === 200) {
      console.log("deleted");
      // find index of item to be deleted in ref list
      let crimeIndex;

      for (let i = 0; i < crimes.value.length; i++) {
        if (crimes.value[i].case_number === number) {
          crimeIndex = i;
          break;
        }
      }

      // remove 1 item from list starting at crimeIndex
      crimes.value.splice(crimeIndex, 1);
    }
  });
}

let selectedIncidents = ref([]);
let incidents = ref([
  { id: 1, label: "Homicide" },
  { id: 2, label: "Rape" },
  { id: 3, label: "Robbery" },
  { id: 4, label: "Aggravated Assault" },
  { id: 5, label: "Burglary" },
  { id: 6, label: "Theft" },
  { id: 7, label: "Auto Theft" },
  { id: 8, label: "Arson" },
  { id: 9, label: "Domestic Assaults" },
  { id: 10, label: "Vandalism" },
  { id: 11, label: "Narcotics" },
  { id: 12, label: "Firearm Discharges" },
  { id: 13, label: "Proactive Police Visit" },
  { id: 14, label: "Other" },
]);

let selectedNeighborhoods = ref([]);
let neighborhoods = ref([
  { id: 1, label: "Conway/Battlecreek/Highwood" },
  { id: 2, label: "Greater East Side" },
  { id: 3, label: "West Side" },
  { id: 4, label: "Dayton's Bluff" },
  { id: 5, label: "Payne/Phalen" },
  { id: 6, label: "North End" },
  { id: 7, label: "Thomas/Dale(Frogtown)" },
  { id: 8, label: "Summit/University" },
  { id: 9, label: "West Seventh" },
  { id: 10, label: "Como" },
  { id: 11, label: "Hamline/Midway" },
  { id: 12, label: "St. Anthony" },
  { id: 13, label: "Union Park" },
  { id: 14, label: "Macalester-Groveland" },
  { id: 15, label: "Highland" },
  { id: 16, label: "Summit Hill" },
  { id: 17, label: "Capitol River" },
]);

function filteredCrimes() {}

// function filterCrimes() {
//   console.log(selectedIncidents.value);
//   console.log(selectedIncidents.value.length);
//   console.log(selectedNeighborhoods.value);
//   console.log(selectedNeighborhoods.value.length);
//   console.log(maxIncidents.value);
//   console.log(startDate.value);
//   console.log(endDate.value);
//   console.log("Button clicked!");
//   //fetch each selection separately and then add them all to crimes

//   for (let i = 0; i < selectedIncidents.value.length; i++) {
//     console.log(selectedIncidents.value[i]);
//   }

//   for (let i = 0; i < selectedIncidents.value.length; i++) {
//     fetch(`${crime_url.value}/incidents?`);
//   }
//   for (let i = 0; i < selectedNeighborhoods.value.length; i++) {
//     fetch(`${crime_url.value}/incidents?`);
//   }

//   //fetch(`${crime_url.value}/incidents?`)

//   // crimes = .... find a way to update crimes based on filtered data
// }

function filterCrimes() {
  console.log("Button clicked!");
  let string = `${crime_url.value}/incidents?`;

  if (selectedNeighborhoods.value.length > 0) string = string + `neighborhood=`;
  for (let i = 0; i < selectedNeighborhoods.value.length; i++) {
    if (i == selectedNeighborhoods.value.length - 1)
      string = string + `${selectedNeighborhoods.value[i]}`;
    else string = string + `${selectedNeighborhoods.value[i]},`;
  }
  console.log(string);
  // if(selectedIncidents.value.length > 0)
  //   string = string + '?code='

  // let maxIncidents = getElementById('maxIncidents');
  // let startDatee = getElementById('start');
  // let endDatee = getElementById('end');

  fetch(string)
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      crimes.value = data;
      console.log(data);
    });
}

function updateSelectedCrime(crime) {
  // handle deselection
  if (isSelectedCrime(crime)) {
    selected_crime.case_number = "";
    selected_crime.date = "";
    selected_crime.time = "";
    selected_crime.code = "";
    selected_crime.incident = "";
    selected_crime.police_grid = "";
    selected_crime.neighborhood_number = "";
    selected_crime.block = "";
    return;
  }

  selected_crime.case_number = crime.case_number;
  selected_crime.date = crime.date;
  selected_crime.time = crime.time;
  selected_crime.code = crime.code;
  selected_crime.incident = crime.incident;
  selected_crime.police_grid = crime.police_grid;
  selected_crime.neighborhood_number = crime.neighborhood_number;
  selected_crime.block = crime.block;

  // place a marker on the map at the crime's location
  // use cleaned address
  let address = removeXs(crime.block);

  let full_address = address + ", Saint Paul, Minnesota";
  console.log(map.center.address);
  console.log(full_address);

  fetch(
    `https://nominatim.openstreetmap.org/search?q=${full_address}&format=json&limit=1`
  )
    .then((result) => {
      console.log("RECEIVED RESPONSE");
      return result.json();
    })
    .then((data) => {
      //   console.log("TEST");
      //   console.log(data);

      // remove old marker
      if (red_markers.value.length > 0) {
        map.leaflet.removeLayer(red_markers.value[0]);
        red_markers.value = [];
      }

      // define red icon
      // I chose that icon size cuz those are half the dimensions of the img
      // and the img is 50x82
      // the anchor is just half of the width and the full height, so that the
      // bottom point of the icon lines up with the location it represents
      let redIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      let marker = L.marker([data[0].lat, data[0].lon], {
        icon: redIcon,
      }).addTo(map.leaflet);
      marker.bindPopup(
        `<b>Case Number:</b> ${crime.case_number}<br><b>Date:</b> ${crime.date}<br><b>Time:</b> ${crime.time}<br><b>Code:</b> ${crime.code}<br><b>Incident:</b> ${crime.incident}<br><b>Police Grid:</b> ${crime.police_grid}<br><b>Neighborhood Number:</b> ${crime.neighborhood_number}<br><b>Block:</b> ${crime.block}`
      );

      red_markers.value.push(marker);
    });
}

function isSelectedCrime(crime) {
  return selected_crime.case_number === crime.case_number;
}

function removeXs(str) {
  // replace X's in the address number with zeroes
  // address number is first item in address, followed by zero

  // split into individual items
  let address = str.split(" ");

  // replace X's in address number with zeroes
  address[0] = address[0].replace(/X/g, "0");

  // join back into string
  return address.join(" ");
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
      placeholder="http://localhost:5173"
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
  <br />

  <div
    class="center"
    style="display: flex; flex-direction: column; align-items: center"
  >
    <h1 style="text-align: center">Crime Color Legend</h1>
    <div style="display: flex; align-items: center; width: 20em">
      <p style="margin: auto">Narcotics:</p>
      <div
        class="colored-square"
        style="background-color: #4d79ff; margin-left: 2em"
      ></div>
    </div>
    <div style="display: flex; align-items: center; width: 20em">
      <p style="margin: auto">Property Crimes:</p>
      <div
        class="colored-square"
        style="background-color: #ffff66; margin-left: 2em"
      ></div>
    </div>
    <div style="display: flex; align-items: center; width: 20em">
      <p style="margin: auto">Violent Crimes:</p>
      <div
        class="colored-square"
        style="background-color: #d32323; margin-left: 2em"
      ></div>
    </div>
  </div>

  <br />
  <h3
    style="
      display: flex;
      align-items: center;
      text-align: center;
      justify-content: center;
    "
  >
    Filter Crime
  </h3>
  <div id="app">
    <p style="margin: 2em">Incidents:</p>
    <div
      style="
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        margin: 2em;
        font-size: 0.8rem;
      "
    >
      <div
        v-for="(item, index) in incidents"
        :key="index"
        style="margin-right: 2em; margin-bottom: 2em"
      >
        <input type="checkbox" v-model="selectedIncidents" :value="item.id" />
        {{ item.label }}
      </div>
    </div>
  </div>

  <div id="app">
    <p style="margin: 2em">Neighborhoods:</p>
    <div
      style="
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        margin: 2em;
        font-size: 0.8rem;
      "
    >
      <div
        v-for="(item, index) in neighborhoods"
        :key="index"
        style="margin-right: 2em; margin-bottom: 2em"
      >
        <input
          type="checkbox"
          v-model="selectedNeighborhoods"
          :value="item.id"
        />
        {{ item.label }}
      </div>
    </div>
  </div>

  <!-- Max Incidents Search -->
  <div style="margin: 2em">
    <label>Max Incidents:</label>
    <input type="number" v-model="maxIncidents" />

    <!-- Date Range Search -->
    <label>Start Date:</label>
    <input type="date" v-model="startDate" />
    <label>End Date:</label>
    <input type="date" v-model="endDate" />
  </div>

  <div>
    <button class="button" v-on:click="filterCrimes">Apply Filters</button>
  </div>

  <div class="center">
    <table>
      <thead>
        <tr>
          <th>Case #</th>
          <th>Date</th>
          <th>Time</th>
          <th>Code</th>
          <th>Incident</th>
          <th>Police Grid</th>
          <th>Neighborhood #</th>
          <th>Block</th>
          <th>Delete Row</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="crime in crimes"
          :key="crime.case_number"
          :class="getCrimeColor(crime.incident)"
          :id="isSelectedCrime(crime) ? 'selected-crime' : ''"
          @click="updateSelectedCrime(crime)"
        >
          <td>{{ crime.case_number }}</td>
          <td>{{ crime.date }}</td>
          <td>{{ crime.time }}</td>
          <td>{{ crime.code }}</td>
          <td>{{ crime.incident }}</td>
          <td>{{ crime.police_grid }}</td>
          <td>{{ crime.neighborhood_number }}</td>
          <td>{{ crime.block }}</td>
          <td class="center">
            <button
              class="delete-btn"
              @click="deleteIncident(crime.case_number)"
            >
              X
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <Modal v-show="isModalVisible" @close="closeModal">
    <template #header><p>Add Incident</p></template>

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

.violent-crime {
  background-color: #d32323;
}

.property-crime {
  background-color: #ffff66;
}

.drug-use-crime {
  background-color: #4d79ff;
}

.center-text {
  text-align: center;
}

.colored-square {
  height: 2rem;
  width: 2rem;
}

.delete-btn {
  background-color: #d32323;
  color: #ffff;
  width: 2em;
  height: 2em;
  border-radius: 2em;
}

.delete-btn:hover {
  background-color: #000;
  color: #d32323;
}

#selected-crime {
  background-color: #c4c4c4;
}
</style>
