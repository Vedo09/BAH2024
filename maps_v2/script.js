document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'c7981bbbf316460e9565524340f6a3f2'; // Your OpenCage API key
    const openRouteKey = '5b3ce3597851110001cf624889bcfe633cf349c88f29f796e6b9b2f3'; // Your OpenRouteService API key

    // Prompt user to disable all extensions for smoother operation
    alert("For the best experience, please disable all browser extensions.");

    // Initialize the map and set its view to the initial coordinates and zoom level
    const map = L.map('map').setView([0, 0], 2);

    // Base layers
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://{s}.sat.owm.io/sql/{z}/{x}/{y}', {
        maxZoom: 19,
        attribution: '© OpenWeatherMap'
    });

    const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors, © OpenTopoMap'
    });

    const precipitation = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenWeatherMap'
    });

    // Add the streets layer to the map by default
    streets.addTo(map);

    // Layer control
    const baseLayers = {
        "Streets": streets,
        "Satellite": satellite,
        "Terrain": terrain,
        "Precipitation": precipitation
    };

    L.control.layers(baseLayers).addTo(map);

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

    // Function to find a place using OpenCage and add a marker
    function findPlace(place) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const placeLatLng = [data.results[0].geometry.lat, data.results[0].geometry.lng];
                    map.setView(placeLatLng, 15, { animate: true, duration: 1.5 });

                    // Add the marker to the map
                    L.marker(placeLatLng).addTo(map).bindPopup(`You searched for: ${place}`).openPopup();
                } else {
                    alert('Place not found!');
                }
            })
            .catch(error => console.error('Error fetching place:', error));
    }

    // Function to switch layers based on voice commands
    function switchLayer(layerName) {
        switch (layerName.toLowerCase()) {
            case 'streets':
                map.addLayer(streets);
                map.removeLayer(satellite);
                map.removeLayer(terrain);
                map.removeLayer(precipitation);
                break;
            case 'satellite':
                map.addLayer(satellite);
                map.removeLayer(streets);
                map.removeLayer(terrain);
                map.removeLayer(precipitation);
                break;
            case 'terrain':
                map.addLayer(terrain);
                map.removeLayer(streets);
                map.removeLayer(satellite);
                map.removeLayer(precipitation);
                break;
            case 'precipitation':
                map.addLayer(precipitation);
                map.removeLayer(streets);
                map.removeLayer(satellite);
                map.removeLayer(terrain);
                break;
            default:
                alert('Layer not recognized. Please say "streets", "satellite", "terrain", or "precipitation".');
        }
    }

    // Function to get coordinates of a place using OpenCage API
    function getCoordinates(place) {
        return fetch(`https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    return [data.results[0].geometry.lat, data.results[0].geometry.lng];
                } else {
                    throw new Error('Place not found!');
                }
            });
    }

    // Function to create a route using OpenRouteService API
    function createRoute(start, end) {
        getCoordinates(start).then(startCoords => {
            getCoordinates(end).then(endCoords => {
                const body = {
                    coordinates: [
                        [startCoords[1], startCoords[0]],
                        [endCoords[1], endCoords[0]]
                    ],
                    format: 'geojson'
                };

                fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson?api_key=${openRouteKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
                .then(response => response.json())
                .then(data => {
                    const route = data.features[0].geometry;
                    const routeLayer = L.geoJSON(route, {
                        style: {
                            color: 'blue',
                            weight: 4,
                            opacity: 0.7
                        }
                    }).addTo(map);

                    map.fitBounds(routeLayer.getBounds(), { animate: true, duration: 1.5 });

                    // Display route summary
                    const routeSummary = `Route from ${start} to ${end}`;
                    displayTranscript(routeSummary);
                })
                .catch(error => console.error('Error creating route:', error));
            }).catch(error => alert(error.message));
        }).catch(error => alert(error.message));
    }

    // Voice command setup using annyang
    if (annyang) {
        const commands = {
            'find *place': (place) => {
                const transcript = `Find: ${place}`;
                displayTranscript(transcript);
                console.log(transcript);
                findPlace(place);
            },
            'switch to streets': () => {
                switchLayer('streets');
                const transcript = 'Switch to: streets';
                displayTranscript(transcript);
                console.log(transcript);
            },
            'switch to satellite': () => {
                switchLayer('satellite');
                const transcript = 'Switch to: satellite';
                displayTranscript(transcript);
                console.log(transcript);
            },
            'switch to terrain': () => {
                switchLayer('terrain');
                const transcript = 'Switch to: terrain';
                displayTranscript(transcript);
                console.log(transcript);
            },
            'switch to precipitation': () => {
                switchLayer('precipitation');
                const transcript = 'Switch to: precipitation';
                displayTranscript(transcript);
                console.log(transcript);
            },
            'route from *start to *end': (start, end) => {
                const transcript = `Route from: ${start} to: ${end}`;
                displayTranscript(transcript);
                console.log(transcript);
                createRoute(start, end);
            }
        };

        annyang.addCommands(commands);
        annyang.start(); // Start voice control by default
    } else {
        console.log('Annyang not supported.');
    }

    // Function to display the spoken text in a transcript box
    function displayTranscript(text) {
        document.getElementById('transcript-box').textContent = text;
    }
});
