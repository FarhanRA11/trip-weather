// function to convert unix time to formatted datetime YYYY-MM-DDThh:mm
function formatted_datetime(time){
	const year = new Date(time).getFullYear();
    const month = (new Date(time).getMonth() + 1).toString().padStart(2, '0');
    const date = new Date(time).getDate().toString().padStart(2, '0');
    const hour = new Date(time).getHours().toString().padStart(2, '0');
    const minute = new Date(time).getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${date}T${hour}:${minute}`;
}

// 3 functions to get user location
var lat;
var lon;

function get_userloc(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }else{
        alert("Can't find your location. Not supported by this browser.");
    }
}

function showPosition(position){
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    
    document.getElementById('coor_ori1').value = lat;
    document.getElementById('coor_ori2').value = lon;
    map.removeLayer(mark_ori);
    mark_ori = L.marker([lat, lon], {icon: redIcon}).addTo(map).bindPopup('Your Location');
    map.setView([lat, lon], 10);
    
    document.getElementById('loader1').style.display = null;
    alert('Found your location.');
}

function showError(error){
    switch(error.code){
        case error.PERMISSION_DENIED:
            alert('Please allow GPS access for this site and try again.');
            break;
        case error.POSITION_UNAVAILABLE:
            alert('Your location is unavailable. Check your internet and try again');
            break;
        case error.TIMEOUT:
            alert('Timed out. Proccess took too long.');
            break;
        case error.UNKNOWN_ERROR:
            alert('An unknown error occured.');
            break;
    }
}

// declare custom markers
var redIcon = L.icon({
    iconUrl: 'images/markers/red-icon.png',
    shadowUrl: 'images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

var blueIcon = L.icon({
    iconUrl: 'images/markers/blue-icon.png',
    shadowUrl: 'images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

// popup functions
function select_coor_ori(){
    map.removeLayer(mark_ori);
    mark_ori = L.marker([lat, lon], {icon: redIcon}).addTo(map).bindPopup('Starting Point');
    map.closePopup();
    document.getElementById('coor_ori1').value = lat;
    document.getElementById('coor_ori2').value = lon;
}
function select_coor_des(){
    map.removeLayer(mark_des);
    mark_des = L.marker([lat, lon], {icon: blueIcon}).addTo(map).bindPopup('Destination Point');
    map.closePopup();
    document.getElementById('coor_dest1').value = lat;
    document.getElementById('coor_dest2').value = lon;
}

// main function
window.onload = () => {
    // map boundries
    L.polygon([
        [91, 180.01],
        [-91, 180.01],
        [-91, 1440],
        [91, 1440]
    ], {color: 'red'}).addTo(map)
    L.polygon([
        [91, -180.01],
        [-91, -180.01],
        [-91, -1440],
        [91, -1440]
    ], {color: 'red'}).addTo(map)

    var bounds = L.latLngBounds(
        L.latLng(-90, -180),
        L.latLng(90, 180)
    );

    // select position on map
    map.on('click', (event) => {
        lat = event.latlng.lat.toFixed(6);
        lon = event.latlng.lng.toFixed(6);
        
        if(bounds.contains(L.latLng(lat, lon))){
            L.popup()
                .setLatLng(event.latlng)
                .setContent(
                    `
                        ${lat}, ${lon}
                        <div id="option_map">
                            <button class="btn_map" id="popup-ori">Set as Origin</button>
                            <button class="btn_map" id="popup-des">Set as Destination</button>
                        </div>
                `)
                .openOn(map);
            
            document.getElementById('popup-ori').onclick = () => {
                select_coor_ori();
            }
            document.getElementById('popup-des').onclick = () => {
                select_coor_des();
            }
        }
    });

    // Get date 10 day ahead range for routing
    let today = formatted_datetime(Date.now());
    let max_date = formatted_datetime(Date.now() + 10 * 24*60*60*1000); // unix add 10 days
    document.getElementById('time_dep').min = today;
    document.getElementById('time_dep').max = max_date;

    // searching user location
    $('#btn_myloc').click(function(){
        document.getElementById('loader1').style.display = 'flex';
        get_userloc();
    });

    // show loader
    $('#btn_search').click(function(){
        $('#input_user').on('submit', function(){
            $('#loader2').style.display = 'flex';
        })
    });
}