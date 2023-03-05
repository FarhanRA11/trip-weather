/*
    route => waypoint (lat,lon,time,dist)
    waypoint => location name
    location => weather

    30 km/h --> 1km in 2min
*/
const urlSegment = window.location.search;
const parameters = urlSegment.substring(urlSegment.indexOf('?')+1).split('&');
const ori = parameters[0]; //lat,lon
const dest = parameters[1]; //lat,lon
const dep = parameters[2]; //YYYY-MM-DDThh:mm

// function to get route from origin and destination, no limit
async function get_route(){
    const fix_ori = ori.split(',').reverse().toString(); //lon,lat
    const fix_dest = dest.split(',').reverse().toString() //lon,lat

    const route_url = `http://router.project-osrm.org/route/v1/driving/${fix_ori};${fix_dest}?overview=false&steps=true`;
    const response_1 = await fetch(route_url, {
        method: 'GET'
    }).catch(err => console.error(err));

    const route_data = await response_1.json();
    const steps = route_data.routes[0].legs[0].steps;

    localStorage.setItem('route', route_data);
    show_results(steps);
}

// function for each waypoint to get city/district name, 2500/day & 1/sec
var address_list = [];
async function get_name(loc, c){
    const name_api_key = 'b1a8acdec4574fc98ec1b577ab778669';
    //b3bea85fe88146bf89d7c25c7c50f545
    //b1a8acdec4574fc98ec1b577ab778669
    let name_url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}/${step_time}&key=${name_api_key}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1`;
    let response_2 = await fetch(name_url, {method: 'GET'})
        .catch(err => console.error(err));

    let name_data = await response_2.json();
    let address = name_data.results[0].formatted.split(', ').slice(-4).join(', ').replace(/\s\d+/g, "").replace('unnamed road, ', '');
    console.log(address);
    
    if(!address_list.includes(address)){
        address_list.push(address);
        document.getElementById(`loc_${c}`).textContent = address;

        let weather = await get_weather(address);
        document.getElementById(`wea_${c}`).textContent = weather;
    }else{
        document.getElementById(`coor_${c}`).remove();
    }
}

// function for each city/district name to get weather, 1000/day
async function get_weather(ad){
    const weather_api_key = 'VZL3Q3HAS9A2H7BHMTH7YNLAW';
    let weather_url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/next12days?unitGroup=metric&key=${weather_api_key}&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,pressure,snow,temp,visibility,winddir,windspeed`;

    let response_3 = await fetch(weather_url, {method: 'GET'})
        .catch(err => console.error(err));

    let weather_data = await response_3.json();

    let icon = weather_data.days[0].hours[0].icon;
    let precip = weather_data.days[0].hours[0].precip;
    let temp = weather_data.days[0].hours[0].temp;
    let windspeed = weather_data.days[0].hours[0].windspeed;

    // show icon weather
    //document.getElementById('...').src = `./images/weather_icon/${icon}.png`;

    return `${icon}, precipitation: ${precip} mm, temperature: ${temp} C, wind: ${windspeed} km/h`;
}

// function to show the final result
function show_results(s){
    for(let counter=0; counter<s.length; counter++){
        let lat = s[counter].maneuver.location[1];
        let lon = s[counter].maneuver.location[0];
        let datetime = 
        
        document.getElementById('route_steps').innerHTML +=
            `
                <div id="coor_${counter}" class="coor"></div>
                <div id="loc_${counter}" class="loc"></div>
                <div id="wea_${counter}" class="wea"></div>
            `;
        
        console.log(counter)
        get_name(`${lat},${lon}`, counter)
        
        document.getElementById(`coor_${counter}`).innerHTML = `<br>${lat}, ${lon}`;
    }
}

// main function
window.onload = () => {
    document.getElementById('par').innerHTML = `${ori.split(',').reverse().toString()}<br>${dest.split(',').reverse().toString()}<br>${dep}`

    //get_route();
}