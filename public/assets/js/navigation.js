// NAVIGATION JS
let map;
let destinationMarker;
let destinationData = null;
let directionsService;
let directionsRenderer;
let currentLocation;
let userMarker;
let accuracyCircle;
let traveledPolyline;
let remainingPolyline;
let navigationSteps = [];
let currentStepIndex = 0;
let totalDistance = 0;
let totalDuration = 0;
let rainPointIndex = -1;
let rainSeverity = "Light";
let routeWeather = [];
//HEATMAP
let weatherLayer = null;
let followUser = true;
let isRecentering = false;
let simulationIndex = 0;
let simulationPath = [];
let heatmapOverlay;

const closeButton = document.getElementById("closeToDestination");
const DEV_MODE = true;
const relocateButton = document.getElementById("relocate-btn");

closeButton.addEventListener("click", () => {
    window.location.href = destinationPreviewUrl;
});
// Legend Toggle Logic
const legendPanel = document.getElementById("legend-panel");
const legendToggle = document.getElementById("legend-toggle");
const fullContent = document.getElementById("legend-full-content");
const minContent = document.getElementById("legend-min-content");

legendToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (legendPanel.classList.contains("legend-collapsed")) {
        legendPanel.classList.remove("legend-collapsed");
        legendPanel.style.width = "100%";
        setTimeout(() => {
            fullContent.classList.remove("hidden");
            minContent.classList.add("hidden");
        }, 100);
    } else {
        legendPanel.classList.add("legend-collapsed");
        legendPanel.style.width = "60px";
        fullContent.classList.add("hidden");
        minContent.classList.remove("hidden");
    }
});

// Rain Alert Toggle Logic
let alertMinimized = false;
function toggleAlert() {

    const alert = document.getElementById("rain-alert");

    if (!alert) return;

    const text = alert.querySelector(".alert-text");
    const close = alert.querySelector(".alert-close");
    const icon = document.getElementById("alert-icon");

    if (!alertMinimized) {

        alert.classList.add("alert-minimized");

        if (text) text.style.display = "none";
        if (close) close.style.display = "none";
        if (icon) icon.textContent = "warning";

        alertMinimized = true;

    } else {

        alert.classList.remove("alert-minimized");

        if (text) text.style.display = "";
        if (close) close.style.display = "";
        if (icon) icon.textContent = "cloudy_snowing";

        alertMinimized = false;
    }

}

const etaPanel = document.getElementById("eta-panel");
const etaToggle = document.getElementById("eta-toggle");
const etaContent = document.getElementById("eta-content");

etaPanel.classList.add("eta-expanded");

etaToggle.addEventListener("click", () => {
    const collapsed = etaPanel.classList.contains("eta-collapsed");

    if (collapsed) {
        etaPanel.classList.remove("eta-collapsed");
        etaPanel.classList.add("eta-expanded");
        etaContent.classList.remove("hidden");
    } else {
        etaPanel.classList.remove("eta-expanded");
        etaPanel.classList.add("eta-collapsed");
        etaContent.classList.add("hidden");
    }
});

// Interaction Feedback
document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", function () {
        this.classList.add("scale-95");
        setTimeout(() => this.classList.remove("scale-95"), 150);
    });
});

// ==============================
// GOOGLE MAPS
// ==============================

window.initMap = function () {
    console.log("Navigation Map Loaded");

    currentLocation = JSON.parse(sessionStorage.getItem("currentLocation"));
    destinationData = JSON.parse(sessionStorage.getItem("destination"));

    const defaultCenter = destinationData
        ? { lat: destinationData.lat, lng: destinationData.lng }
        : { lat: -7.946716, lng: 112.615208 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultCenter,
        zoom: 16,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        zoomControl: false,
    });

    map.addListener("dragstart", () => {
        followUser = false;
        toggleRelocateButton(true);
    });

    map.addListener("zoom_changed", () => {
        followUser = false;
        toggleRelocateButton(true);
    });

    directionsService = new google.maps.DirectionsService();

    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeOpacity: 0 },
    });

    directionsRenderer.setMap(map);

    createUserMarker();

    if (currentLocation && destinationData) {
        drawRoute();
        loadOpenWeatherLayer();
    }

    if (!DEV_MODE) {
        startLocationTracking();
    }

    function createUserMarker() {
        if (!currentLocation) return;

        userMarker = new google.maps.Marker({
            position: currentLocation,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#ff7acc",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
            },
            zIndex: 999,
        });

        accuracyCircle = new google.maps.Circle({
            strokeColor: "#ff7acc",
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: "#ff7acc",
            fillOpacity: 0.18,
            map: map,
            center: currentLocation,
            radius: 45,
        });
    }

    if (destinationData) {
        destinationMarker = new google.maps.Marker({
            position: { lat: destinationData.lat, lng: destinationData.lng },
            map,
            title: destinationData.name,
        });
    }
};

function startLocationTracking() {
    if (!navigator.geolocation) {
        alert("Browser tidak mendukung Geolocation.");
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            updateUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        },
        (error) => {
            console.error(error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
}

function drawRoute() {
    directionsService.route(
        {
            origin: currentLocation,
            destination: { lat: destinationData.lat, lng: destinationData.lng },
            travelMode: google.maps.TravelMode.DRIVING,
        },
        async (result, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(result);

                simulationPath = buildSimulationPath(
                    result.routes[0].overview_path,
                );

                await loadRouteWeather(result);

                createRoutePolylines();
                startNavigationAnimation();

                const leg = result.routes[0].legs[0];

                totalDistance = leg.distance.value;
                totalDuration = leg.duration.value;
                navigationSteps = leg.steps;

                updateInstructionCard();
                updateNavigationPanel(leg);
                loadHeatmapOverlay();

                if (DEV_MODE) {
                    setTimeout(() => {
                        startSimulation();
                    }, 1500);
                }
            } else {
                console.error(status);
            }
        },
    );
}

function startNavigationAnimation() {
    if (!currentLocation) return;

    focusOnUser(currentLocation, 16);

    setTimeout(() => {
        focusOnUser(currentLocation, 17);
    }, 300);

    setTimeout(() => {
        focusOnUser(currentLocation, 18);
    }, 600);
}

function focusOnUser(position, zoom = 18) {
    if (!map || !position) return;
    map.panTo(position);
    map.setZoom(zoom);
}

function updateUserLocation(position) {
    currentLocation = position;

    if (userMarker) {
        userMarker.setPosition(position);
    }

    if (followUser) {
        focusOnUser(currentLocation);
    }
    if (accuracyCircle) {
        accuracyCircle.setCenter(currentLocation);
    }
}

function updateNavigationPanel(leg) {
    const minutes = Math.ceil(leg.duration.value / 60);
    const distance = (leg.distance.value / 1000).toFixed(1);

    document.getElementById("nav-eta").textContent = minutes;
    document.getElementById("nav-distance").textContent = distance;
    document.getElementById("nav-speed").textContent = "--";

    const arrival = new Date(Date.now() + leg.duration.value * 1000);

    document.getElementById("nav-arrival-time").textContent =
        arrival.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
}

function startSimulation() {
    if (!simulationPath.length) return;

    simulationIndex = 0;

    const interval = setInterval(() => {
        if (simulationIndex >= simulationPath.length) {
            clearInterval(interval);
            return;
        }

        const point = simulationPath[simulationIndex];

        updateUserLocation(point);
        updateRouteProgress();
        updateRemainingInfo();
        updateRainAlert();

        if (simulationIndex < simulationPath.length - 1) {
            const heading = calculateHeading(
                point,
                simulationPath[simulationIndex + 1],
            );
            map.setHeading(heading);
        }

        simulationIndex++;
    }, 350);
}

function interpolatePoints(start, end, count = 20) {
    const points = [];

    for (let i = 0; i <= count; i++) {
        const t = i / count;

        points.push({
            lat: start.lat() + (end.lat() - start.lat()) * t,
            lng: start.lng() + (end.lng() - start.lng()) * t,
        });
    }

    return points;
}

function buildSimulationPath(path) {
    let smooth = [];

    for (let i = 0; i < path.length - 1; i++) {
        smooth.push(...interpolatePoints(path[i], path[i + 1], 15));
    }

    return smooth;
}

function calculateHeading(from, to) {
    const dLng = to.lng - from.lng;
    const dLat = to.lat - from.lat;
    return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function createRoutePolylines() {
    if (remainingPolyline) {
        remainingPolyline.setMap(null);
    }

    if (traveledPolyline) {
        traveledPolyline.setMap(null);
    }

    remainingPolyline = new google.maps.Polyline({
        path: simulationPath,
        strokeColor: "#ff7acc",
        strokeWeight: 8,
        strokeOpacity: 1,
        map: map,
    });

    traveledPolyline = new google.maps.Polyline({
        path: [],
        strokeColor: "#ffe6f8",
        strokeWeight: 8,
        strokeOpacity: 1,
        map: map,
    });
}

function updateRouteProgress() {
    if (!remainingPolyline || !traveledPolyline) return;

    traveledPolyline.setPath(simulationPath.slice(0, simulationIndex + 1));
    remainingPolyline.setPath(simulationPath.slice(simulationIndex));
}

function updateInstructionCard() {
    if (!navigationSteps.length) return;

    const step = navigationSteps[currentStepIndex];

    document.getElementById("instruction-distance").textContent =
        `In ${step.distance.text}`;

    const instruction = formatInstruction(step);
    const road = getRoadName(step);

    document.getElementById("instruction-text").innerHTML = road
        ? `${instruction}<br>
       <span class="text-primary">${road}</span>`
        : instruction;

    const nextStep = navigationSteps[currentStepIndex + 1];

    document.getElementById("next-instruction").textContent = nextStep
        ? formatInstruction(nextStep)
        : "Arrive at destination";
}

function formatInstruction(step) {
    if (!step) return "Continue";

    switch (step.maneuver) {
        case "turn-left":
            return "Turn Left";
        case "turn-right":
            return "Turn Right";
        case "keep-left":
            return "Keep Left";
        case "keep-right":
            return "Keep Right";
        case "merge":
            return "Merge";
        case "roundabout-right":
            return "Enter Roundabout";
        case "uturn-left":
            return "Make a U-turn";
    }

    const text = step.instructions.replace(/<[^>]+>/g, "").toLowerCase();

    if (text.includes("belok kiri")) return "Turn Left";
    if (text.includes("belok kanan")) return "Turn Right";
    if (text.includes("terus")) return "Continue Straight";
    if (text.includes("arah barat laut")) return "Head Northwest";
    if (text.includes("arah timur laut")) return "Head Northeast";
    if (text.includes("arah tenggara")) return "Head Southeast";
    if (text.includes("arah barat daya")) return "Head Southwest";
    if (text.includes("arah utara")) return "Head North";
    if (text.includes("arah selatan")) return "Head South";
    if (text.includes("arah timur")) return "Head East";
    if (text.includes("arah barat")) return "Head West";

    return "Continue";
}

function getRoadName(step) {
    const text = step.instructions.replace(/<[^>]+>/g, "");
    const match = text.match(/Jl\.\s([A-Za-zÀ-ÿ0-9.\-\s]+)/);

    if (!match) return "";

    let road = match[0];

    road = road
        .split(" menuju")[0]
        .split(" ke")[0]
        .split(" lalu")[0]
        .split(" Lewati")[0]
        .split("(")[0]
        .trim();

    const words = road.split(" ");

    if (words.length > 5) {
        road = words.slice(0, 5).join(" ");
    }

    return road;
}

function checkNextInstruction() {
    if (currentStepIndex >= navigationSteps.length - 1) return;

    const target = navigationSteps[currentStepIndex].end_location;

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        target,
    );

    if (distance < 25) {
        currentStepIndex++;
        updateInstructionCard();
    }
}

function updateRemainingInfo() {
    const progress = simulationIndex / (simulationPath.length - 1);
    const remainingDistance = totalDistance * (1 - progress);
    const remainingDuration = totalDuration * (1 - progress);

    document.getElementById("nav-distance").textContent = (
        remainingDistance / 1000
    ).toFixed(1);

    document.getElementById("nav-eta").textContent = Math.max(
        0,
        Math.ceil(remainingDuration / 60),
    );
}

function updateRainAlert() {
    const alertText = document.getElementById("alert-text");
    const shortText = document.getElementById("rain-info");

    if (!alertText) return;

    if (rainPointIndex < 0) {
        alertText.textContent = "No rain expected";

        if (shortText) {
            shortText.textContent = "Clear Route";
        }

        const alertIcon = document.getElementById("alert-icon");

        if (alertIcon) {
            alertIcon.textContent = "wb_sunny";
        }

        return;
    }

    const remainingPoints = rainPointIndex - simulationIndex;

    if (remainingPoints <= 0) {
        alertText.textContent = `${rainSeverity} rain now`;

        if (shortText) {
            shortText.textContent = "Rain Now";
        }

        return;
    }

    const progress = remainingPoints / simulationPath.length;
    const remainingKm = ((progress * totalDistance) / 1000).toFixed(1);

    alertText.textContent = `${rainSeverity} rain ahead in ${remainingKm} km`;

    if (shortText) {
        shortText.textContent = `Rain in ${remainingKm} km`;
    }
}

async function loadRouteWeather(result) {
    const points = result.routes[0].overview_path;
    const total = points.length;

    const samples = [
        points[Math.floor(total * 0.25)],
        points[Math.floor(total * 0.5)],
        points[Math.floor(total * 0.75)],
    ];

    routeWeather = [];

    for (const point of samples) {
        const weather = await getWeatherAtPoint(point.lat(), point.lng());
        routeWeather.push(weather);
    }

    console.log("Route Weather:", routeWeather);

    determineRainPoint();
}

async function getWeatherAtPoint(lat, lng) {
    const response = await fetch(`/weather/current?lat=${lat}&lng=${lng}`);
    return await response.json();
}

function determineRainPoint() {
    rainPointIndex = -1;
    rainSeverity = "Light";

    for (let i = 0; i < routeWeather.length; i++) {
        const weather = routeWeather[i];

        if (weather.rainProbability >= 30) {
            const ratios = [0.25, 0.5, 0.75];

            rainPointIndex = Math.floor(simulationPath.length * ratios[i]);

            if (weather.rainProbability > 80) {
                rainSeverity = "Heavy";
            } else if (weather.rainProbability > 50) {
                rainSeverity = "Moderate";
            } else {
                rainSeverity = "Light";
            }

            break;
        }
    }
}

//HEATMAP

async function loadOpenWeatherLayer() {
    const response = await fetch("/openweather/tile");
    const data = await response.json();
    createWeatherLayer(data);
}

function createWeatherLayer(data) {
    weatherLayer = new google.maps.ImageMapType({
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.45,
        getTileUrl(coord, zoom) {
            return `https://tile.openweathermap.org/map/${data.layer}/${zoom}/${coord.x}/${coord.y}.png?appid=${data.apiKey}`;
        },
    });

    map.overlayMapTypes.push(weatherLayer);
}

//RELOCATE BUTTON LOGIC
function toggleRelocateButton(show) {
    if (!relocateButton) return;

    if (show) {
        relocateButton.classList.remove("hidden");
    } else {
        relocateButton.classList.add("hidden");
    }
}

relocateButton.addEventListener("click", () => {
    followUser = true;
    focusOnUser(currentLocation);
    toggleRelocateButton(false);
});

function zoomToUser(position) {
    if (!map || !position) return;
    map.panTo(position);
    map.setZoom(18);
}

// Class overlay custom (bukan google.maps.GroundOverlay) supaya gambar heatmap
// bisa dianimasikan pakai CSS (transform/@keyframes). GroundOverlay bawaan
// Google tidak punya API untuk itu -- posisinya fixed & tidak bisa di-CSS.
// Class didefinisikan di dalam function (bukan top-level) karena butuh
// google.maps.OverlayView yang baru tersedia setelah Maps API selesai load.
function createDriftingHeatmapOverlay(bounds, imageUrl) {
    class DriftingHeatmapOverlay extends google.maps.OverlayView {
        constructor(bounds, url) {
            super();
            this.bounds = bounds;
            this.url = url;
            this.div = null;
        }

        onAdd() {
            this.div = document.createElement("div");
            this.div.className = "heatmap-drift-wrapper";

            const img = document.createElement("img");
            img.src = this.url;
            img.className = "heatmap-drift-img";
            this.div.appendChild(img);

            this.getPanes().overlayLayer.appendChild(this.div);
        }

        draw() {
            const projection = this.getProjection();
            if (!projection) return;

            const sw = projection.fromLatLngToDivPixel(
                this.bounds.getSouthWest(),
            );
            const ne = projection.fromLatLngToDivPixel(
                this.bounds.getNorthEast(),
            );

            if (!sw || !ne) return;

            this.div.style.left = `${sw.x}px`;
            this.div.style.top = `${ne.y}px`;
            this.div.style.width = `${ne.x - sw.x}px`;
            this.div.style.height = `${sw.y - ne.y}px`;
        }

        onRemove() {
            if (this.div) {
                this.div.remove();
                this.div = null;
            }
        }
    }

    return new DriftingHeatmapOverlay(bounds, imageUrl);
}

function loadHeatmapOverlay() {
    const image = "/assets/images/rainfall_heatmap.png";

    const bounds = new google.maps.LatLngBounds(
        { lat: -8.9, lng: 111.0 }, // south-west
        { lat: -7.1, lng: 114.6 }, // north-east
    );

    if (heatmapOverlay) {
        heatmapOverlay.setMap(null);
    }

    heatmapOverlay = createDriftingHeatmapOverlay(bounds, image);
    heatmapOverlay.setMap(map);
}