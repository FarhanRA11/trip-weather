var control = L.Routing.control({
    waypoints: oriDest,
    routeWhileDragging: true,
}).addTo(map);

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

    oriDest[0] = L.latLng(lat, lon)
    route()
    map.setView([lat, lon], 10);
    
    document.getElementById('loader1').style.display = null;
    document.getElementById('via').textContent = '';
    document.getElementById('reset-route').hidden = true;
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

var oriDest = [null, null];
function route(){
    control.setWaypoints(oriDest)
}

// main function
window.onload = () => {   
    document.getElementById('reset-route').hidden = true;
    
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

    const bounds = L.latLngBounds(
        L.latLng(-90, -180),
        L.latLng(90, 180)
    );

    control.on('routeselected', function(event){
        const len = event.route.waypoints.length;
        const list = event.route.waypoints.map(waypoint => waypoint.latLng);
        console.log(event);
        console.log(list);

        if(list.length > 2){
            document.getElementById('reset-route').hidden = false;

            let via = [];
            for(let i=0; i<list.slice(1, len - 1).length; i++){
                let element = `${list.slice(1, len - 1)[i].lat},${list.slice(1, len - 1)[i].lng}`;
                via.push(element);
            }
            console.log(via.join(';'));
            document.getElementById('via').textContent = `via: ${via.join('; ')}`;

            const form = document.getElementById('input_user');
            form.addEventListener('submit', event => {
                event.preventDefault();
                const url = new URL(form.action, window.location.origin);

                url.searchParams.set('oa', form.oa.value);
                url.searchParams.set('oo', form.oo.value);
                url.searchParams.set('da', form.da.value);
                url.searchParams.set('do', form.do.value);
                url.searchParams.set('t', form.t.value);
                url.searchParams.set('v', via.join(';'));

                window.location.href = url.toString();
            });
        }

        document.getElementById('coor_ori1').value = list[0].lat;
        document.getElementById('coor_ori2').value = list[0].lng;
        document.getElementById('coor_dest1').value = list[len - 1].lat;
        document.getElementById('coor_dest2').value = list[len - 1].lng;
    })

    document.getElementById('reset-route').addEventListener('click', event => {
        event.preventDefault();

        const waypoints = control.getWaypoints();
        const via = [waypoints[0], waypoints[waypoints.length - 1]];
        control.setWaypoints(via)

        document.getElementById('via').textContent = '';
        document.getElementById('reset-route').hidden = true;
    })

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
                oriDest[0] = L.latLng(lat, lon)
                route()
            }
            document.getElementById('popup-des').onclick = () => {
                oriDest[1] = L.latLng(lat, lon)
                route()
            }
        }
    });
    
    // Get date 10 day ahead range for routing
    var today = Date.now();
    var max_date = Date.now() + 864e6; // unix add 10 days (10*24*60*60*1000)
    document.getElementById('time_dep').min = formatted_datetime(today);
    document.getElementById('time_dep').max = formatted_datetime(max_date);
    setInterval(() => {
        today += 999;
        max_date += 999;
        document.getElementById('time_dep').min = formatted_datetime(today);
        document.getElementById('time_dep').max = formatted_datetime(max_date);
    }, 999);

    // searching user location
    document.getElementById('btn_myloc').onclick = () => {
        document.getElementById('loader1').style.display = 'flex';
        get_userloc();
    }
}