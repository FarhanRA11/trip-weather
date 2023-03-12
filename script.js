// function to convert unix time to formatted datetime YYYY-MM-DDThh:mm
function formatted_datetime(time){
	const year = new Date(time).getFullYear();
    const month = (new Date(time).getMonth() + 1).toString().padStart(2, '0');
    const date = new Date(time).getDate().toString().padStart(2, '0');
    const hour = new Date(time).getHours().toString().padStart(2, '0');
    const minute = new Date(time).getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${date}T${hour}:${minute}`;
}

// 3 function to get user location
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
    alert('Found your location.');
    lat = position.coords.latitude;
    lon = position.coords.longitude;

    document.getElementById('coor_ori1').value = lat;
    document.getElementById('coor_ori2').value = lon;

    console.log(lat, lon);
    map.removeLayer(mark_ori);
    mark_ori = L.marker([lat, lon]).addTo(map).bindPopup('your position');
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

function select_coor_ori(){
    map.removeLayer(mark_ori);
    mark_ori = L.marker([lat, lon]).addTo(map).bindPopup('your origin');
    document.getElementById('coor_ori1').value = lat;
    document.getElementById('coor_ori2').value = lon;
}

function select_coor_des(){
    map.removeLayer(mark_des);
    mark_des = L.marker([lat, lon]).addTo(map).bindPopup('your destination');
    document.getElementById('coor_dest1').value = lat;
    document.getElementById('coor_dest2').value = lon;
}

// main function
window.onload = () => {
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
                            <button onclick="select_coor_ori()" class="btn_map">Set as Origin</button>
                            <button onclick="select_coor_des()" class="btn_map">Set as Destination</button>
                        </div>
                `)
                .openOn(map);
        }
    });

    // Get date 10 day ahead range for routing
    let today = formatted_datetime(Date.now());
    let max_date = formatted_datetime(Date.now() + 10 * 24*60*60*1000); // unix add 10 days
    document.getElementById('time_dep').min = today;
    document.getElementById('time_dep').max = max_date;

    // searching user location
    document.getElementById('btn_myloc').onclick = () => {
        get_userloc();
    }
}