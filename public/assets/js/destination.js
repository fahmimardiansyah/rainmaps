// ======================================
// DESTINATION PREVIEW PAGE
// ======================================
let map;
let destinationMarker;
let destinationData = null;
let directionsService;
let directionsRenderer;
let currentLocation;

// Marker cuaca (AdvancedMarkerElement) + progress animasi polyline saat ini
let weatherMarkers = []; // { fraction, marker, revealed }
let currentRouteProgress = 0;

// Polyline animasi rute
let grayRoutePolyline = null;
let blueRoutePolyline = null;

// Titik sample sepanjang rute (berdasarkan % JARAK, bukan index/garis lurus)
// Titik ke-3 sengaja 0.97 (97%), bukan 1 (100%) persis, supaya card cuaca
// tidak numpuk dengan pin destination merah -- tetap terlihat "dekat tujuan"
// tapi ada jarak visual yang cukup.
const SAMPLE_FRACTIONS = [0.25, 0.5, 0.97];

// Durasi animasi polyline (ms) - sesuai requirement 500-800ms
const ROUTE_ANIMATION_DURATION = 650;

// ---------- Start Navigation ----------
const startButton = document.getElementById("startNavigation");

if (startButton) {
    startButton.addEventListener("click", () => {
        window.location.href = navigationRouteUrl;
    });
}

// ---------- Close / Back to Home ----------
const closeButton = document.getElementById("closeToHome");

if (closeButton) {
    // Cegah event drag bottom-sheet ikut ke-trigger saat tombol X ditekan
    // (tombol ini ada di dalam #sheet-handle yang punya listener drag).
    closeButton.addEventListener("touchstart", (e) => e.stopPropagation());
    closeButton.addEventListener("mousedown", (e) => e.stopPropagation());

    closeButton.addEventListener("click", () => {
        window.location.href = homeUrl;
    });
}

// ---------- Bottom Sheet ----------
const sheet = document.getElementById("bottom-sheet");
const handle = document.getElementById("sheet-handle");

if (sheet && handle) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let startTranslateY = 0;

    // Snap point (% viewport)
    const snapPoints = [10, 45, 82];

    handle.addEventListener("touchstart", dragStart);
    handle.addEventListener("mousedown", dragStart);

    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("mousemove", dragMove);

    window.addEventListener("touchend", dragEnd);
    window.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
        isDragging = true;

        startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

        const style = window.getComputedStyle(sheet);
        const matrix = new WebKitCSSMatrix(style.transform);

        startTranslateY = matrix.m42;

        sheet.style.transition = "none";
    }

    function dragMove(e) {
        if (!isDragging) return;

        e.preventDefault();

        currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

        const diff = currentY - startY;

        const newTranslateY = startTranslateY + diff;

        const minTranslate = window.innerHeight * 0.05;

        const maxTranslate = window.innerHeight * 0.85;

        if (newTranslateY > minTranslate && newTranslateY < maxTranslate) {
            sheet.style.transform = `translateY(${newTranslateY}px)`;
        }
    }

    function dragEnd() {
        if (!isDragging) return;

        isDragging = false;

        const finalY = new WebKitCSSMatrix(
            window.getComputedStyle(sheet).transform,
        ).m42;

        const currentPercentage = (finalY / window.innerHeight) * 100;

        const closestSnap = snapPoints.reduce((prev, curr) => {
            return Math.abs(curr - currentPercentage) <
                Math.abs(prev - currentPercentage)
                ? curr
                : prev;
        });

        sheet.style.transition = "transform .35s ease";

        sheet.style.transform = `translateY(${closestSnap}vh)`;
    }

    window.addEventListener("load", () => {
        sheet.style.transform = "translateY(45vh)";
    });
}

// ==============================
// GOOGLE MAPS
// ==============================

window.initMap = function () {
    console.log("Destination Map Loaded");

    const defaultCenter = destinationData
        ? {
              lat: destinationData.lat,
              lng: destinationData.lng,
          }
        : {
              lat: -7.946716,
              lng: 112.615208,
          };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultCenter,
        zoom: 16,
        mapId: "GANTI_DENGAN_MAP_ID_ANDA", // isi dengan Map ID dari Cloud Console
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        zoomControl: false,
    });

    directionsService = new google.maps.DirectionsService();

    // suppressPolyline: true -> kita gambar polyline sendiri (grey + animasi biru)
    // suppressMarkers tetap true karena marker asal/tujuan sudah kita buat manual
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        suppressPolyline: true,
    });

    // -----------------------------------------------------------
    // Marker cuaca sekarang memakai google.maps.marker.AdvancedMarkerElement
    // (lihat renderWeatherMarkers() & revealWeatherMarkers() di bagian bawah
    // file). Posisinya berbasis LatLng dan di-manage otomatis oleh Google
    // Maps setiap repaint/pan/zoom, jadi tidak perlu proyeksi pixel manual
    // (fromLatLngToDivPixel) atau draw() manual seperti implementasi lama.
    // -----------------------------------------------------------

    currentLocation = JSON.parse(sessionStorage.getItem("currentLocation"));

    destinationData = JSON.parse(sessionStorage.getItem("destination"));

    directionsRenderer.setMap(map);

    createUserMarker();

    if (currentLocation && destinationData) {
        drawRoute();
    }

    function createUserMarker() {
        if (!currentLocation) return;

        new google.maps.Marker({
            position: currentLocation,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
            },
            zIndex: 999,
        });

        // Accuracy Circle
        new google.maps.Circle({
            strokeColor: "#2196F3",
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: "#2196F3",
            fillOpacity: 0.18,
            map: map,
            center: currentLocation,
            radius: 45,
        });
    }

    if (destinationData) {
        destinationMarker = new google.maps.Marker({
            position: {
                lat: destinationData.lat,
                lng: destinationData.lng,
            },
            map,
            title: destinationData.name,
        });

        updateDestinationCard();
    }
};

function updateDestinationCard() {
    const title = document.getElementById("destination-title");

    if (!title) return;

    title.textContent = destinationData.name;
}

function drawRoute() {
    directionsService.route(
        {
            origin: currentLocation,
            destination: {
                lat: destinationData.lat,
                lng: destinationData.lng,
            },
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === "OK") {
                // setDirections tetap dipanggil supaya peta auto-fit ke bounds rute.
                // Polyline tidak akan tergambar otomatis karena suppressPolyline: true.
                directionsRenderer.setDirections(result);

                const route = result.routes[0];
                const leg = route.legs[0];

                const fullPath = getFullRoutePath(route);
                const cumulativeDistances = buildCumulativeDistances(fullPath);

                updateBottomSheet(leg);
                animateRoutePolyline(fullPath);
                loadRouteWeather(fullPath, cumulativeDistances, leg);
            } else {
                console.error(status);
            }
        },
    );
}

function updateBottomSheet(leg) {
    document.getElementById("destination-info-title").textContent =
        destinationData.name;

    const minutes = Math.ceil(leg.duration.value / 60);
    const km = (leg.distance.value / 1000).toFixed(1);

    document.getElementById("eta-value").textContent = `${minutes} min`;
    document.getElementById("distance-value").textContent = `${km} km`;
}

// ======================================
// POLYLINE ANIMATION (FITUR 2)
// ======================================
// Menggambar polyline abu-abu (rute penuh) lebih dulu, lalu polyline biru
// yang "mengisi" mengikuti path yang sama secara bertahap dari titik awal
// menuju tujuan. Tidak memakai library tambahan, murni requestAnimationFrame.
function animateRoutePolyline(path) {
    // Bersihkan polyline lama jika ada (misal re-route)
    if (grayRoutePolyline) grayRoutePolyline.setMap(null);
    if (blueRoutePolyline) blueRoutePolyline.setMap(null);

    grayRoutePolyline = new google.maps.Polyline({
        path: path,
        strokeColor: "#B0BEC5",
        strokeOpacity: 0.9,
        strokeWeight: 8,
        map: map,
        zIndex: 1,
    });

    blueRoutePolyline = new google.maps.Polyline({
        path: [path[0]],
        strokeColor: "#2196F3",
        strokeOpacity: 1,
        strokeWeight: 8,
        map: map,
        zIndex: 2,
    });

    const totalPoints = path.length;
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / ROUTE_ANIMATION_DURATION, 1);

        currentRouteProgress = progress;
        revealWeatherMarkers(progress);

        const pointCount = Math.max(
            2,
            Math.ceil(progress * (totalPoints - 1)) + 1,
        );

        blueRoutePolyline.setPath(path.slice(0, pointCount));

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Pastikan path akhir benar-benar identik dengan rute asli
            blueRoutePolyline.setPath(path);
        }
    }

    requestAnimationFrame(step);
}

// ======================================
// UTIL: PATH & JARAK SEPANJANG POLYLINE
// ======================================

// Menggabungkan path detail dari setiap step (bukan overview_path yang kasar)
// supaya sample point benar-benar mengikuti bentuk jalan, bukan garis lurus.
function getFullRoutePath(route) {
    const path = [];

    route.legs.forEach((leg) => {
        leg.steps.forEach((step) => {
            step.path.forEach((latLng) => {
                path.push(latLng);
            });
        });
    });

    return path;
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

// Haversine distance (meter). Sengaja tidak memakai google.maps.geometry
// supaya tidak menambah dependency/library baru pada konfigurasi Maps.
function haversineDistance(a, b) {
    const R = 6371000;

    const dLat = toRad(b.lat() - a.lat());
    const dLng = toRad(b.lng() - a.lng());
    const lat1 = toRad(a.lat());
    const lat2 = toRad(b.lat());

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const h =
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function buildCumulativeDistances(path) {
    const cumulative = [0];

    for (let i = 1; i < path.length; i++) {
        const d = haversineDistance(path[i - 1], path[i]);
        cumulative.push(cumulative[i - 1] + d);
    }

    return cumulative;
}

// Mencari titik pada jarak tertentu di sepanjang polyline (interpolasi linear
// antar vertex terdekat).
function getPointAtDistance(path, cumulative, targetDistance) {
    const totalDistance = cumulative[cumulative.length - 1];
    const clamped = Math.min(Math.max(targetDistance, 0), totalDistance);

    for (let i = 1; i < cumulative.length; i++) {
        if (cumulative[i] >= clamped) {
            const segStart = cumulative[i - 1];
            const segEnd = cumulative[i];

            const segFraction =
                segEnd - segStart === 0
                    ? 0
                    : (clamped - segStart) / (segEnd - segStart);

            const p1 = path[i - 1];
            const p2 = path[i];

            const lat = p1.lat() + (p2.lat() - p1.lat()) * segFraction;
            const lng = p1.lng() + (p2.lng() - p1.lng()) * segFraction;

            return new google.maps.LatLng(lat, lng);
        }
    }

    return path[path.length - 1];
}

// ======================================
// WEATHER ALONG ROUTE (FITUR 1)
// ======================================

async function loadRouteWeather(fullPath, cumulativeDistances, leg) {
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    const totalDurationSeconds = leg.duration.value;
    const now = Date.now();

    // 3 titik sample: 25%, 50%, 97% (mendekati titik tujuan) JARAK sepanjang
    // polyline (bukan index array)
    const samples = SAMPLE_FRACTIONS.map((fraction) => {
        const targetDistance = fraction * totalDistance;

        const position = getPointAtDistance(
            fullPath,
            cumulativeDistances,
            targetDistance,
        );

        // ETA dihitung dari durasi rute (bukan dari jam forecast API)
        const arrivalTime = new Date(
            now + fraction * totalDurationSeconds * 1000,
        );

        return { fraction, position, arrivalTime };
    });

    // Fetch weather SEKALI per titik, hasilnya dipakai ulang untuk
    // tabel maupun marker (tidak ada request dobel).
    const weatherList = [];

    for (const sample of samples) {
        const weather = await getWeatherAtPoint(
            sample.position.lat(),
            sample.position.lng(),
        );

        weatherList.push(weather);
    }

    // Debug sementara: cek field yang dikembalikan endpoint /weather/current.
    // Kalau field temperature/condition/rainProbability tidak ada di sini,
    // berarti sumber masalah ada di response API, bukan di positioning.
    console.log("[loadRouteWeather] weatherList:", weatherList);
    console.log("[loadRouteWeather] samples:", samples);

    updateWeatherForecast(weatherList, samples);
    updateWeatherMarkerContent(weatherList, samples);
    updateRainAlert(weatherList, samples, Math.ceil(totalDurationSeconds / 60));
    renderWeatherMarkers(samples);
}

async function getWeatherAtPoint(lat, lng) {
    const response = await fetch(`/weather/current?lat=${lat}&lng=${lng}`);
    return await response.json();
}

function formatTimeWIB(date) {
    return (
        date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        }) + " WIB"
    );
}

function updateWeatherForecast(weatherList, samples) {
    weatherList.forEach((weather, index) => {
        const row = index + 1;

        document.getElementById(`weather-time-${row}`).textContent =
            formatTimeWIB(samples[index].arrivalTime);

        document.getElementById(`weather-icon-${row}`).textContent =
            getMaterialWeatherIcon(weather.condition);

        document.getElementById(`weather-temp-${row}`).textContent =
            `${weather.temperature}°/${weather.rainProbability}%`;
    });

    // Blade menyediakan 4 baris (row ke-4 adalah placeholder "expanded view"),
    // sedangkan spesifikasi hanya meminta 3 titik (25/50/75%). Baris ke-4
    // disembunyikan lewat JS supaya tidak menampilkan data dummy "--.--".
    // Tidak perlu mengubah struktur Blade, cukup toggle class hidden.
    const row4Time = document.getElementById("weather-time-4");
    if (row4Time && row4Time.parentElement) {
        row4Time.parentElement.classList.add("hidden");
    }
}

function updateWeatherMarkerContent(weatherList, samples) {
    weatherList.forEach((weather, index) => {
        const row = index + 1;
        const marker = document.getElementById(`weather-marker-${row}`);

        if (!marker) return;

        marker.classList.remove("hidden");

        document.getElementById(`marker-temp-${row}`).textContent =
            `${weather.temperature}°`;

        document.getElementById(`marker-time-${row}`).textContent =
            samples[index].arrivalTime
                .toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

        document.getElementById(`marker-icon-${row}`).textContent =
            getMaterialWeatherIcon(weather.condition);
    });
}

function renderWeatherMarkers(samples) {
    // Bersihkan marker lama (misal saat re-route)
    weatherMarkers.forEach((w) => (w.marker.map = null));
    weatherMarkers = [];

    samples.forEach((sample, index) => {
        const row = index + 1;
        const el = document.getElementById(`weather-marker-${row}`);

        if (!el) return;

        el.classList.remove("hidden");

        // Dibuat dengan map: null dulu -> baru "ditampilkan" (map: map)
        // saat progress animasi polyline mencapai fraction marker ini.
        // Posisinya berbasis LatLng, jadi otomatis ikut pan/zoom tanpa
        // perlu proyeksi pixel manual.
        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: null,
            position: sample.position,
            content: el,
            zIndex: 50,
        });

        weatherMarkers.push({
            fraction: sample.fraction,
            marker: marker,
            revealed: false,
        });
    });

    // Kalau weather API selesai fetch SETELAH animasi polyline sudah lewat
    // threshold tertentu (kasus umum, network call biasanya > durasi animasi),
    // langsung tampilkan yang sudah "terlewati" tanpa menunggu event lain.
    revealWeatherMarkers(currentRouteProgress);
}

function revealWeatherMarkers(progress) {
    weatherMarkers.forEach((w) => {
        if (!w.revealed && progress >= w.fraction) {
            w.marker.map = map;
            w.revealed = true;
        }
    });
}

function getMaterialWeatherIcon(type) {
    switch (type) {
        case "CLEAR":
        case "MOSTLY_CLEAR":
            return "wb_sunny";

        case "PARTLY_CLOUDY":
            return "partly_cloudy_day";

        case "MOSTLY_CLOUDY":
        case "CLOUDY":
            return "cloud";

        case "RAIN":
            return "rainy";

        case "THUNDERSTORM":
            return "thunderstorm";

        default:
            return "cloud";
    }
}

// ======================================
// RAIN ALERT
// ======================================
// Mengambil probabilitas hujan TERBESAR dari 3 titik (bukan yang pertama
// ditemukan di atas ambang batas), lalu ETA dihitung dari fraction jarak
// titik tersebut terhadap total durasi rute.
function updateRainAlert(weatherList, samples, totalMinutes) {
    const title = document.getElementById("rain-alert-title");
    const subtitle = document.getElementById("rain-alert-subtitle");
    const icon = document.getElementById("rain-alert-icon");
    const shortInfo = document.getElementById("rain-info");
    const shortIcon = document.getElementById("rain-info-icon");

    if (!title || !subtitle || !icon) return;

    let maxIndex = -1;
    let maxProbability = -1;

    weatherList.forEach((weather, index) => {
        if (weather.rainProbability > maxProbability) {
            maxProbability = weather.rainProbability;
            maxIndex = index;
        }
    });

    if (maxIndex === -1 || maxProbability < 20) {
        title.textContent = "No rain expected";
        subtitle.textContent = "Clear weather is expected along your route.";
        icon.textContent = "wb_sunny";

        shortInfo.textContent = "Clear Route";
        shortIcon.textContent = "wb_sunny";
        return;
    }

    const eta = Math.max(
        1,
        Math.round(samples[maxIndex].fraction * totalMinutes),
    );

    let level = "Light";
    let iconName = "rainy";

    if (maxProbability >= 80) {
        level = "Heavy";
        iconName = "thunderstorm";
    } else if (maxProbability >= 50) {
        level = "Moderate";
        iconName = "rainy";
    }

    const label = level === "Heavy" ? "Heavy rain ahead" : "Rain alert on route";
    const etaLabel = `${eta} minute${eta > 1 ? "s" : ""}`;

    title.textContent = label;
    subtitle.textContent = `${level} rain expected in approximately ${etaLabel} along your route.`;
    icon.textContent = iconName;

    shortInfo.textContent = `Rain in ${eta} min`;
    shortIcon.textContent = iconName;
}