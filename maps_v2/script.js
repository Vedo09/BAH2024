document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'c7981bbbf316460e9565524340f6a3f2'; // Your OpenCage API key

    // Prompt user to disable all extensions for smoother operation
    alert("For the best experience, please disable all browser extensions.");

    // Initialize the map and set its view to the initial coordinates and zoom level
    const map = L.map('map').setView([0, 0], 2);

    // Add a tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marker for user's location
    let userMarker;

    // Function to update the user's location on the map
    function updateLocation(position) {
        const { latitude, longitude } = position.coords;
        const userLatLng = [latitude, longitude];

        if (userMarker) {
            userMarker.setLatLng(userLatLng);
        } else {
            userMarker = L.marker(userLatLng).addTo(map);
        }

        map.setView(userLatLng, 15, { animate: true, duration: 1.5 }); // Smooth zoom to user's location
    }

    // Error handler for geolocation
    function locationError(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    // Request user's location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateLocation, locationError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }

    // Function to find a place using OpenCage and add a red pin
    function findPlace(place) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const placeLatLng = [data.results[0].geometry.lat, data.results[0].geometry.lng];
                    map.setView(placeLatLng, 15, { animate: true, duration: 1.5 });

                    // Create a custom red marker
                    const redIcon = new L.Icon({
                        iconUrl: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FF0000',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [21, 34],
                        iconAnchor: [10, 34],
                        popupAnchor: [0, -34],
                        shadowSize: [35, 16],
                        shadowAnchor: [10, 14]
                    });

                    // Add the red marker to the map
                    L.marker(placeLatLng, { icon: redIcon }).addTo(map).bindPopup(`You searched for: ${place}`).openPopup();
                } else {
                    alert('Place not found!');
                }
            })
            .catch(error => console.error('Error fetching place:', error));
    }

    // Voice command setup using Artyom.js
    const artyom = new Artyom();

    artyom.addCommands({
        indexes: ["find *place"],
        smart: true,
        action: (i, wildcard) => {
            findPlace(wildcard);
        }
    });

    // Functions to start and stop voice recognition
    function startVoiceControl() {
        artyom.initialize({
            lang: "en-US",
            continuous: true,
            listen: true,
            debug: true,
            speed: 1
        }).then(() => {
            console.log("Artyom has been successfully initialized.");
        }).catch(err => {
            console.error("Artyom couldn't be initialized: ", err);
        });
    }

    function stopVoiceControl() {
        artyom.fatality().then(() => {
            console.log("Artyom has been stopped.");
        }).catch(err => {
            console.error("Artyom couldn't be stopped: ", err);
        });
    }

    // Event listeners for start and stop buttons
    document.getElementById('start').addEventListener('click', startVoiceControl);
    document.getElementById('stop').addEventListener('click', stopVoiceControl);
});
