/*
    route => waypoint (lat,lon,time,dist)
    waypoint => location name
    location => weather
*/

var lat = '';
var lon = '';
const ori = '110.217390,-7.836583'; //lon,lat
const des = '110.371749,-7.766113'; //lon,lat
const dep = '';

// 3 function to get user location
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
}

function showError(error){
    switch(error.code){
        case error.PERMISSION_DENIED:
            alert('Please allow GPS access for this site.');
            break;
        case error.POSITION_UNAVAILABLE:
            alert('Your location is unavailable.');
            break;
        case error.TIMEOUT:
            alert('Timed out. Proccess took too long.');
            break;
        case error.UNKNOWN_ERROR:
            alert('An unknown error occured.');
            break;
    }
}

// function to convert unix time to formatted date YYYY-MM-DDThh:mm
function formatted_date(time){
	const year = new Date(time).getFullYear();
    const month = (new Date(time).getMonth() + 1).toString().padStart(2, '0');
    const date = new Date(time).getDate().toString().padStart(2, '0');
    const hour = new Date(time).getHours().toString().padStart(2, '0');
    const minute = new Date(time).getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${date}T${hour}:${minute}`;
}

// function to get route from origin and destination
async function get_route(){
    const route_url = `http://router.project-osrm.org/route/v1/driving/${ori};${des}?overview=false&steps=true`;
    const response_1 = await fetch(route_url, {
        method: 'GET'
    }).catch(err => console.error(err));

    const route_data = await response_1.json();
    const steps = route_data.routes[0].legs[0].steps;

    localStorage.setItem('route', route_data)
    show_result(steps);
}

// function for each waypoint to get city/district name
async function get_name(loc){
    const name_api_key = 'b3bea85fe88146bf89d7c25c7c50f545';
    let name_url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}&key=${name_api_key}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1`;
    let response_2 = await fetch(name_url, {method: 'GET'})
        .catch(err => console.error(err));

    let name_data = await response_2.json();
    //let address = name_data.results[0].formatted.split(', ').slice(-4).toString();
    
    get_weather(address);
}

// function for each city/district name to get weather
async function get_weather(ad){
    const weather_api_key = 'VZL3Q3HAS9A2H7BHMTH7YNLAW';
    let weather_url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/${dep}?unitGroup=metric&key=${weather_api_key}&contentType=json`;
}

// function to show the final result
function show_result(s){
    for(let i=0; i<s.length; i++){
        let lat = s[i].maneuver.location[1];
        let lon = s[i].maneuver.location[0];

        let address = get_name(`${lat}${lon}`);
    }
}

// main function
window.onload = () => {
    // Get date 10 day ahead range for routing
    let today = formatted_date(Date.now());
    let max_date = formatted_date(Date.now() + 10 * 86400000); // unix add 10 days
    document.getElementById('time_dep').min = today;
    document.getElementById('time_dep').max = max_date;

    get_route();
}