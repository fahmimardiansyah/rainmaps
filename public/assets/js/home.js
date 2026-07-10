// ==============================
// HOME PAGE
// ==============================

// ---------- Bottom Sheet ----------
const sheet = document.getElementById("bottom-sheet");
const handle = document.getElementById("sheet-handle");

if (sheet && handle) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let startTranslate = 0;
    let currentTranslate = 0;
    let sheetState = "collapsed";

    const snapPoints = {
        collapsed: "sheet-collapsed",
        expanded: "sheet-expanded",
    };

    function updateSheetState(newState) {
        sheet.classList.remove(...Object.values(snapPoints));
        sheet.classList.add(snapPoints[newState]);
        sheetState = newState;
    }

    handle.addEventListener("pointerdown", (e) => {
        startY = e.clientY;
        isDragging = true;
        sheet.style.transition = "none";
        startTranslate = sheetState === "expanded" ? 0 : 320;
        handle.setPointerCapture(e.pointerId);
    });

    document.addEventListener("pointermove", (e) => {
        if (!isDragging) return;

        currentY = e.clientY;
        const delta = currentY - startY;

        currentTranslate = startTranslate + delta;

        currentTranslate = Math.max(0, Math.min(320, currentTranslate));

        sheet.style.transform = `translateY(${currentTranslate}px)`;
    });

    document.addEventListener("pointerup", (e) => {
        if (!isDragging) return;

        isDragging = false;
        sheet.style.transition = "transform .28s ease";

        const endY = e.clientY;
        const diff = endY - startY;

        if (Math.abs(diff) > 40) {
            if (diff < 0) {
                updateSheetState("expanded");
                sheet.style.transform = "";
            } else {
                updateSheetState("collapsed");
                sheet.style.transform = "";
            }
        }
    });
}

// ---------- Search ----------
// const searchInput = document.getElementById("searchDestination");

// if (searchInput) {
//     searchInput.addEventListener("focus", () => {
//         window.location.href = destinationPreviewUrl;
//     });
// }

// ==============================
// GOOGLE MAPS
// ==============================

let map;
let userMarker;
let destinationMarker;
let autocomplete;

window.initMap = function () {
    console.log("Google Maps Initialized");

    const mapElement = document.getElementById("map");

    if (!mapElement) return;

    map = new google.maps.Map(mapElement, {
        center: {
            lat: -7.946716,
            lng: 112.615208,
        },

        zoom: 16,

        disableDefaultUI: true,

        gestureHandling: "greedy",

        clickableIcons: false,

        streetViewControl: false,

        fullscreenControl: false,

        mapTypeControl: false,

        zoomControl: false,
    });

    getCurrentLocation();
};

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Browser tidak mendukung Geolocation");

        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Simpan lokasi user
            sessionStorage.setItem(
                "currentLocation",
                JSON.stringify(userLocation),
            );

            console.log(
                "Current Location Saved:",
                JSON.parse(sessionStorage.getItem("currentLocation")),
            );

            map.setCenter(userLocation);

            initAutocomplete();

            const accuracyCircle = new google.maps.Circle({
                strokeColor: "#4285F4",
                strokeOpacity: 0.15,
                strokeWeight: 2,
                fillColor: "#4285F4",
                fillOpacity: 0.15,
                map: map,
                center: userLocation,
                radius: position.coords.accuracy,
            });

            userMarker = new google.maps.Marker({
                position: userLocation,

                map: map,

                title: "Your Location",

                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                },
            });

            console.log(userLocation);

            loadCurrentWeather(userLocation);

            loadCurrentArea(userLocation);

            loadHourlyForecast(userLocation);
        },

        (error) => {
            console.error(error);

            alert("Lokasi tidak dapat diakses.");
        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0,
        },
    );
}
let selectedDestination = null;

function initAutocomplete() {
    console.log("Autocomplete Init");

    const input = document.getElementById("searchDestination");

    if (!input) return;

    autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ["formatted_address", "geometry", "name"],
    });

    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
            alert("Lokasi tidak ditemukan.");

            return;
        }

        const location = place.geometry.location;

        // Hapus marker lama
        if (destinationMarker) {
            destinationMarker.setMap(null);
        }

        // Marker tujuan
        destinationMarker = new google.maps.Marker({
            position: location,

            map: map,

            title: place.name,
        });

        // Geser map ke tujuan
        map.panTo(location);

        map.setZoom(16);

        // Simpan data tujuan
        selectedDestination = {
            name: place.name,

            address: place.formatted_address,

            lat: location.lat(),

            lng: location.lng(),
        };

        console.log("BEFORE SAVE");

        console.log(selectedDestination);

        // Simpan ke sessionStorage
        sessionStorage.setItem(
            "destination",
            JSON.stringify(selectedDestination),
        );

        console.log("AFTER SAVE");

        console.log(sessionStorage.getItem("destination"));

        // Tunggu sebentar agar user melihat marker
        setTimeout(() => {
            window.location.href = destinationPreviewUrl;
        }, 700);
    });
}

async function loadCurrentWeather(location) {
    const response = await fetch(
        `/weather/current?lat=${location.lat}&lng=${location.lng}`,
    );

    const weather = await response.json();

    console.log(weather);

    updateCurrentWeather(weather);

    updateRainInfo(weather);
}

function updateCurrentWeather(weather) {
    document.getElementById("weather-temperature").textContent =
        `${Math.round(weather.temperature)}°`;

    document.getElementById("weather-condition").textContent =
        weather.description;

    document.getElementById("weather-icon").textContent = getWeatherIcon(
        weather.condition,
    );

    updateRainInfo(weather);
}

const WEATHER_ICON = {
    CLEAR: "sunny",

    MOSTLY_CLEAR: "partly_cloudy_day",

    PARTLY_CLOUDY: "partly_cloudy_day",

    CLOUDS: "cloud",

    OVERCAST: "cloud",

    RAIN: "rainy",

    LIGHT_RAIN: "rainy",

    HEAVY_RAIN: "rainy",

    SHOWERS: "rainy",

    THUNDERSTORM: "thunderstorm",

    MIST: "foggy",

    FOG: "foggy",
};

function getWeatherIcon(condition) {
    return WEATHER_ICON[condition] || "cloud";
}

function loadCurrentArea(location) {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
        {
            location: location,
        },
        (results, status) => {
            if (status !== "OK" || !results.length) {
                console.error(status);

                return;
            }

            console.log(results[0].address_components);

            const area = getAreaName(results[0].address_components);

            document.getElementById("area-name").textContent = getAreaName(
                results[0].address_components,
            );
        },
    );
}

function getAreaName(components) {
    const priorities = [
        "neighborhood",

        "route",

        "sublocality",

        "locality",

        "administrative_area_level_4",

        "administrative_area_level_3",

        "administrative_area_level_2",
    ];

    for (const type of priorities) {
        const item = components.find((c) => c.types.includes(type));

        if (item) return item.long_name;
    }

    return "Unknown";
}

function updateRainInfo(weather) {
    const rainInfo = document.getElementById("rain-info");

    const rainIcon = document.getElementById("rain-icon");

    if (!rainInfo || !rainIcon) return;

    if (weather.rainProbability <= 0) {
        rainIcon.textContent = "wb_sunny";

        rainInfo.textContent = "No rain expected";

        return;
    }

    rainIcon.textContent = "rainy";

    rainInfo.textContent = `Rain chance ${weather.rainProbability}%`;
}

async function loadHourlyForecast(location) {
    const response = await fetch(
        `/weather/hourly?lat=${location.lat}&lng=${location.lng}`,
    );

    const forecast = await response.json();

    console.log(forecast);

    updateForecast(forecast);

    updateRainAlertCard(forecast);
}

function updateForecast(forecast) {
    forecast.forEach((item, index) => {
        const i = index + 1;

        document.getElementById(`forecast-time-${i}`).textContent =
            item.time + " WIB";

        document.getElementById(`forecast-temp-${i}`).textContent =
            `${item.temperature}°`;

        document.getElementById(`forecast-icon-${i}`).textContent =
            getWeatherIcon(item.condition);
    });
}

// function updateRainInfo(forecast){

//     const first = forecast[0];

//     const icon = document.getElementById("rain-icon");

//     const text = document.getElementById("rain-info");

//     if(first.rainProbability >= 60){

//         icon.textContent = "thunderstorm";

//         text.textContent = "Rain expected";

//     }

//     else if(first.rainProbability >= 30){

//         icon.textContent = "rainy";

//         text.textContent = "Rain possible";

//     }

//     else{

//         icon.textContent = "wb_sunny";

//         text.textContent = "No rain expected";

//     }

// }

async function loadHourlyForecast(location) {
    const response = await fetch(
        `/weather/hourly?lat=${location.lat}&lng=${location.lng}`,
    );

    const forecast = await response.json();

    console.log(forecast);

    updateForecast(forecast);

    updateRainAlertCard(forecast);
}

function updateRainAlertCard(forecast) {
    const title = document.getElementById("rain-alert-title");

    const description = document.getElementById("rain-alert-description");

    const icon = document.getElementById("rain-alert-icon");

    const rainy = forecast.find((item) => item.rainProbability >= 30);

    if (!rainy) {
        icon.textContent = "wb_sunny";

        title.textContent = "No rain expected";

        description.textContent = "Weather is expected to stay clear today.";

        return;
    }

    icon.textContent = "rainy";

    title.textContent = "Rain alert on your area";

    description.textContent = `${rainy.description} expected around ${rainy.time} WIB`;
}