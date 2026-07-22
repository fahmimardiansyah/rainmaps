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

//RAIN VISUALIZATION MODE (heatmap vs icon)
let visualizationMode = "heatmap";
let rainIconOverlay = null;
let heatmapPixelData = null; // cache: canvas ctx + bounds untuk baca warna pixel rainfalls.png
const RAIN_ICON_MIN_SPACING_METERS = 250; // jarak antar titik grid sampling (radius sebaran icon)

// Bounds & url yang sama dipakai heatmap overlay MAUPUN pixel sampling icon,
// biar dua-duanya selalu merujuk ke gambar & area yang identik.
const RAINFALL_IMAGE_URL = "/assets/images/rainfalls.png";
const RAINFALL_BOUNDS = {
    south: -8.9,
    west: 111.0,
    north: -7.1,
    east: 114.6,
};

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

// Visualization Mode Toggle Logic (Heatmap / Icon)
const legendModeBtnHeatmap = document.getElementById("legend-mode-btn-heatmap");
const legendModeBtnIcon = document.getElementById("legend-mode-btn-icon");

if (legendModeBtnHeatmap && legendModeBtnIcon) {
    legendModeBtnHeatmap.addEventListener("click", (e) => {
        e.stopPropagation();
        setVisualizationMode("heatmap");
    });

    legendModeBtnIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        setVisualizationMode("icon");
    });
}

function setVisualizationMode(mode) {
    if (mode === visualizationMode) return;

    visualizationMode = mode;
    legendPanel.dataset.legendMode = mode;

    const heatmapView = document.getElementById("legend-heatmap-view");
    const iconView = document.getElementById("legend-icon-view");

    const activeClasses = ["bg-white", "shadow-sm"];

    if (mode === "heatmap") {
        legendModeBtnHeatmap.classList.add(...activeClasses);
        legendModeBtnHeatmap.querySelector("span").classList.replace(
            "text-on-surface-variant",
            "text-primary",
        );

        legendModeBtnIcon.classList.remove(...activeClasses);
        legendModeBtnIcon.querySelector("span").classList.replace(
            "text-primary",
            "text-on-surface-variant",
        );

        heatmapView.classList.remove("hidden");
        iconView.classList.add("hidden");
    } else {
        legendModeBtnIcon.classList.add(...activeClasses);
        legendModeBtnIcon.querySelector("span").classList.replace(
            "text-on-surface-variant",
            "text-primary",
        );

        legendModeBtnHeatmap.classList.remove(...activeClasses);
        legendModeBtnHeatmap.querySelector("span").classList.replace(
            "text-primary",
            "text-on-surface-variant",
        );

        heatmapView.classList.add("hidden");
        iconView.classList.remove("hidden");
    }

    applyVisualizationModeToMap();
}

function applyVisualizationModeToMap() {
    if (!map) return;

    if (visualizationMode === "heatmap") {
        if (heatmapOverlay) heatmapOverlay.setMap(map);
        if (rainIconOverlay) rainIconOverlay.setMap(null);
    } else {
        if (heatmapOverlay) heatmapOverlay.setMap(null);

        if (rainIconOverlay) {
            rainIconOverlay.setMap(map);
        } else {
            loadRainIconMarkers();
        }
    }
}

// Rain Alert Toggle Logic
let alertMinimized = false;
function toggleAlert() {
    const alert = document.getElementById("rain-alert");
    const text = alert.querySelector("#alert-text");
    const close = alert.querySelector(".alert-close");
    const icon = document.getElementById("alert-icon");

    if (!alertMinimized) {
        alert.classList.add("alert-minimized");
        text.style.display = "none";
        close.style.display = "none";
        icon.innerHTML = "warning";
        alertMinimized = true;
    } else {
        alert.classList.remove("alert-minimized");
        text.style.display = "block";
        close.style.display = "block";
        icon.innerHTML = "cloudy_snowing";
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

    map.addListener("idle", () => {
        scheduleRainIconRefresh();
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

// ==============================
// RAIN ICON VISUALIZATION
// ==============================

// Load gambar rainfalls.png ke canvas tersembunyi supaya kita bisa baca
// warna pixel di titik lat/lng manapun -- tanpa nambah API call weather.
function loadHeatmapPixelData() {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        heatmapPixelData = {
            ctx,
            width: canvas.width,
            height: canvas.height,
        };

        console.log("Heatmap pixel data ready:", canvas.width, canvas.height);
    };

    img.onerror = () => {
        console.error("Gagal load rainfalls.png untuk pixel sampling");
    };

    img.src = RAINFALL_IMAGE_URL;
}

// Ambil warna RGB di titik lat/lng tertentu dari gambar rainfalls.png
function getPixelColorAt(lat, lng) {
    if (!heatmapPixelData) return null;

    const { ctx, width, height } = heatmapPixelData;

    const xRatio =
        (lng - RAINFALL_BOUNDS.west) /
        (RAINFALL_BOUNDS.east - RAINFALL_BOUNDS.west);
    const yRatio =
        (RAINFALL_BOUNDS.north - lat) /
        (RAINFALL_BOUNDS.north - RAINFALL_BOUNDS.south);

    if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) return null;

    const px = Math.min(width - 1, Math.max(0, Math.floor(xRatio * width)));
    const py = Math.min(height - 1, Math.max(0, Math.floor(yRatio * height)));

    const [r, g, b, a] = ctx.getImageData(px, py, 1, 1).data;

    return { r, g, b, a };
}

// Klasifikasi warna pixel jadi salah satu dari 4 kategori icon.
// CATATAN: threshold hue di bawah ini estimasi awal berdasarkan skema warna
// rainbow umum (biru/putih = ringan -> hijau/kuning -> merah = ekstrem).
// Perlu di-kalibrasi ulang sambil lihat hasil asli di rainfalls.png --
// tinggal geser angka HUE_THRESHOLDS di bawah, tidak perlu ubah logic lain.
const HUE_THRESHOLDS = {
    lightMax: 200, // biru/cyan -> Hujan Ringan
    heavyMax: 90, // hijau/kuning -> Hujan Deras
    // sisanya (oranye/merah) -> Hujan Lebat
};
const MIN_SATURATION_FOR_RAIN = 0.12; // di bawah ini dianggap "Berawan" (netral/putih)

function classifyRainIntensity(rgb) {
    if (!rgb || rgb.a < 20) return "clear"; // area transparan = tidak ada data

    const { r, g, b } = rgb;
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const lightness = (max + min) / 2;
    const saturation =
        max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));

    // Nyaris putih/pucat di tepi gradient blur -> tidak perlu icon
    if (saturation < MIN_SATURATION_FOR_RAIN || lightness > 0.92) {
        return "clear";
    }

    let hue = 0;
    const d = max - min;
    if (d !== 0) {
        switch (max) {
            case r / 255:
                hue = ((g / 255 - b / 255) / d) % 6;
                break;
            case g / 255:
                hue = (b / 255 - r / 255) / d + 2;
                break;
            default:
                hue = (r / 255 - g / 255) / d + 4;
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
    }

    if (hue >= HUE_THRESHOLDS.lightMax) return "light";
    if (hue >= HUE_THRESHOLDS.heavyMax) return "heavy";
    return "extreme";
}

// Konversi meter ke derajat lat/lng (dipakai buat spacing grid)
function metersToDegreesLat(meters) {
    return meters / 111320;
}

function metersToDegreesLng(meters, atLat) {
    return meters / (111320 * Math.cos((atLat * Math.PI) / 180));
}

// Sample grid titik di SELURUH area map yang sedang terlihat (viewport),
// bukan cuma di sepanjang rute -- supaya icon nyebar kayak di desain.
// Grid dipotong (clip) ke RAINFALL_BOUNDS karena di luar itu tidak ada
// data warna untuk dibaca.
function sampleGridPointsForIcons() {
    if (!map) return [];

    const viewBounds = map.getBounds();
    if (!viewBounds) return [];

    const south = Math.max(viewBounds.getSouthWest().lat(), RAINFALL_BOUNDS.south);
    const north = Math.min(viewBounds.getNorthEast().lat(), RAINFALL_BOUNDS.north);
    const west = Math.max(viewBounds.getSouthWest().lng(), RAINFALL_BOUNDS.west);
    const east = Math.min(viewBounds.getNorthEast().lng(), RAINFALL_BOUNDS.east);

    if (south >= north || west >= east) return [];

    const midLat = (south + north) / 2;
    const latStep = metersToDegreesLat(RAIN_ICON_MIN_SPACING_METERS);
    const lngStep = metersToDegreesLng(RAIN_ICON_MIN_SPACING_METERS, midLat);

    const points = [];

    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            // Sedikit jitter acak supaya sebarannya kelihatan lebih organik,
            // tidak kaku kayak grid sempurna
            const jitterLat = (Math.random() - 0.5) * latStep * 0.4;
            const jitterLng = (Math.random() - 0.5) * lngStep * 0.4;

            points.push({ lat: lat + jitterLat, lng: lng + jitterLng });
        }
    }

    return points;
}

const MAX_RAIN_ICON_MARKERS = 120; // batas aman biar performa map tetap ringan

function loadRainIconMarkers() {
    if (!heatmapPixelData) {
        // Gambar belum selesai dimuat, coba lagi sebentar lagi
        setTimeout(loadRainIconMarkers, 300);
        return;
    }

    const points = sampleGridPointsForIcons();
    const markers = [];

    for (const point of points) {
        if (markers.length >= MAX_RAIN_ICON_MARKERS) break;

        const color = getPixelColorAt(point.lat, point.lng);
        const category = classifyRainIntensity(color);

        if (category === "clear") continue; // tidak perlu icon kalau cerah

        markers.push({ lat: point.lat, lng: point.lng, category });
    }

    console.log(`Rain icon markers: ${markers.length} dari ${points.length} titik grid`);

    if (rainIconOverlay) {
        rainIconOverlay.setMap(null);
    }

    rainIconOverlay = createRainIconOverlay(markers);

    if (visualizationMode === "icon") {
        rainIconOverlay.setMap(map);
    }
}

// Refresh marker (throttled) tiap kali user selesai pan/zoom map,
// supaya sebaran icon selalu mengikuti area yang lagi dilihat.
let rainIconRefreshTimeout = null;
function scheduleRainIconRefresh() {
    if (visualizationMode !== "icon") return;

    clearTimeout(rainIconRefreshTimeout);
    rainIconRefreshTimeout = setTimeout(loadRainIconMarkers, 400);
}

const RAIN_ICON_STYLE = {
    light: { icon: "water_drop", color: "#0061a4" },
    heavy: { icon: "rainy", color: "#db7900" },
    extreme: { icon: "thunderstorm", color: "#ba1a1a" },
};

// Overlay custom (pola sama seperti DriftingHeatmapOverlay) yang render
// semua marker icon rain sekaligus sebagai div HTML biasa -- supaya bisa
// pakai font Material Symbols yang sudah dimuat di seluruh app, tanpa
// perlu generate gambar/canvas per marker.
function createRainIconOverlay(markers) {
    class RainIconOverlay extends google.maps.OverlayView {
        constructor(markers) {
            super();
            this.markers = markers;
            this.container = null;
        }

        onAdd() {
            this.container = document.createElement("div");
            this.container.style.position = "absolute";

            this.markers.forEach((m) => {
                const style = RAIN_ICON_STYLE[m.category];

                const el = document.createElement("div");
                el.className =
                    "rain-icon-marker absolute flex items-center justify-center rounded-full bg-white shadow-lg";
                el.style.width = "32px";
                el.style.height = "32px";
                el.style.transform = "translate(-50%, -50%)";

                const icon = document.createElement("span");
                icon.className = "material-symbols-outlined !text-lg";
                icon.style.color = style.color;
                icon.textContent = style.icon;

                el.appendChild(icon);
                this.container.appendChild(el);
                m._el = el;
            });

            this.getPanes().overlayLayer.appendChild(this.container);
        }

        draw() {
            const projection = this.getProjection();
            if (!projection) return;

            this.markers.forEach((m) => {
                const pos = projection.fromLatLngToDivPixel(
                    new google.maps.LatLng(m.lat, m.lng),
                );

                if (!pos || !m._el) return;

                m._el.style.left = `${pos.x}px`;
                m._el.style.top = `${pos.y}px`;
            });
        }

        onRemove() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
        }
    }

    return new RainIconOverlay(markers);
}

function loadHeatmapOverlay() {
    // Bounds seluas Jawa Timur (SAMA seperti gambar rainfall_heatmap.png
    // yang dipakai -- gambar ini sudah di-generate supaya titik panas
    // (merah) jatuh presisi di Malang, Surabaya, dan Sidoarjo untuk bounds
    // ini secara spesifik. Jangan ubah angka bounds ini tanpa generate
    // ulang gambarnya, karena posisinya saling terkait.
    const bounds = new google.maps.LatLngBounds(
        { lat: RAINFALL_BOUNDS.south, lng: RAINFALL_BOUNDS.west },
        { lat: RAINFALL_BOUNDS.north, lng: RAINFALL_BOUNDS.east },
    );

    if (heatmapOverlay) {
        heatmapOverlay.setMap(null);
    }

    heatmapOverlay = createDriftingHeatmapOverlay(bounds, RAINFALL_IMAGE_URL);

    if (visualizationMode === "heatmap") {
        heatmapOverlay.setMap(map);
    }

    // Siapkan data pixel dari gambar yang sama untuk kebutuhan icon markers,
    // supaya kedua mode visualisasi selalu merujuk ke sumber data yang identik.
    loadHeatmapPixelData();
}