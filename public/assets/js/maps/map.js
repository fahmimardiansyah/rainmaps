// ======================================
// GOOGLE MAPS MANAGER
// ======================================

let map = null;

window.createMap = function (containerId, options = {}) {

    const mapElement = document.getElementById(containerId);

    if (!mapElement) {
        console.error(`Map container "${containerId}" not found.`);
        return null;
    }

    map = new google.maps.Map(mapElement, {

        center: options.center || {
            lat: -7.946716,
            lng: 112.615208,
        },

        zoom: options.zoom || 16,

        disableDefaultUI: true,

        gestureHandling: "greedy",

        clickableIcons: false,

        fullscreenControl: false,

        streetViewControl: false,

        mapTypeControl: false,

        zoomControl: false,

        mapId: options.mapId || null,

    });

    console.log("Google Map Created");

    return map;

};

// callback Google
window.initMap = function () {

    console.log("Google Maps API Loaded");

};