/*
    route => waypoint (lat,lon,time,dist)
    waypoint => location name
    location => weather

    30 km/h --> 1km in 2min
*/
const urlSegment = window.location.search;
const parameters = urlSegment.substring(1).split('&');
const ori = `${decodeURIComponent(parameters[0].slice(8))},${decodeURIComponent(parameters[1].slice(8))}`; //lat,lon
const dest = `${decodeURIComponent(parameters[2].slice(8))},${decodeURIComponent(parameters[3].slice(8))}`; //lat,lon
var dep = decodeURIComponent(parameters[4].slice(3)); //YYYY-MM-DDThh:mm
var dep_unix = +new Date(dep); //13 dig number

// function to get route from origin and destination, no limit
async function get_route(){
    const fix_ori = ori.split(',').reverse().toString(); //lon,lat
    const fix_dest = dest.split(',').reverse().toString() //lon,lat

    const route_url = `http://router.project-osrm.org/route/v1/driving/${fix_ori};${fix_dest}?overview=false&steps=true`;
    const response_1 = await fetch(route_url, {method: 'GET'})
        .catch(err => console.error(err));

    const route_data = await response_1.json();
    if(route_data.code === 'NoRoute'){
        alert("Sorry, Can't find the route. Go back and try different point")
    }
    const steps = route_data.routes[0].legs[0].steps;
    console.log(steps);

    show_results(steps);
}

// function, for each waypoint to get city/district name, 2500/day & 1/sec
var address_list = [];
async function get_name(loc, c, pass_unix){//13 dig num
    const name_api_key = 'b3bea85fe88146bf89d7c25c7c50f545';
    //b3bea85fe88146bf89d7c25c7c50f545
    //b1a8acdec4574fc98ec1b577ab778669
    let name_url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}&key=${name_api_key}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1&abbrv=1`;
    let response_2 = await fetch(name_url, {method: 'GET'})
        .catch(err => console.error(err));

    let name_data = await response_2.json();

    let village = name_data.results[0].components.village;
    let neighbourhood = name_data.results[0].components.neighbourhood;
    let quarter = name_data.results[0].components.quarter;
    let suburb = name_data.results[0].components.suburb;
    let city_district = name_data.results[0].components.city_district;
    let city = name_data.results[0].components.city;
    let county = name_data.results[0].components.county;
    let state_district = name_data.results[0].components.state_district;
    let state = name_data.results[0].components.state;
    let country = name_data.results[0].components.country;

    const list = [country, state, state_district, county, city, city_district, suburb, quarter, neighbourhood, village];
    let pattern = /[^a-zA-Z0-9().,"'\/\s]/;
    var new_list = [];
    
    for(let i=0; i<11; i++) {
        if(list[i] !== undefined && !pattern.test(list[i])) {
            new_list.push(list[i]);
            if(new_list.length === 4){
                break;
            }
        }
    }

    let address = new_list.reverse().join(',');
    
    if(!address_list.includes(address)){
        address_list.push(address);
        document.getElementById(`loc_${c}`).textContent = address;

        let weather = await get_weather(address, pass_unix, c);//13 dig num
        document.getElementById(`wea_${c}`).innerHTML = weather;
    }else{
        document.getElementById(`root_${c}`).remove();
    }
}

// function, for each city/district name to get weather, 1000/day
async function get_weather(ad, unix, c){//13 dig num
    console.log(new Date(unix).toLocaleString())
    const weather_api_key = 'VZL3Q3HAS9A2H7BHMTH7YNLAW';
    let weather_url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/${Math.round(unix/Math.pow(10,3))}?unitGroup=metric&key=${weather_api_key}&include=current&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,precipprob,pressure,snow,snowdepth,temp,uvindex,visibility,winddir,windgust,windspeed`;

    let response_3 = await fetch(weather_url, {method: 'GET'})
        .catch(err => console.error(err));
    let weather_data = await response_3.json();

    let cloudcover = weather_data.days[0].cloudcover;
    let dew = weather_data.days[0].dew;
    let feelslike = weather_data.days[0].feelslike;
    let humidity = weather_data.days[0].humidity;
    let icon = weather_data.days[0].icon; //
    let precip = weather_data.days[0].precip;
    let precipprob = weather_data.days[0].precipprob; //
    let pressure = weather_data.days[0].pressure;
    let snow = weather_data.days[0].snow;
    let snowdepth = weather_data.days[0].snowdepth;
    let temp = weather_data.days[0].temp; //
    let uvindex = weather_data.days[0].uvindex;
    let visibility = weather_data.days[0].visibility;
    let winddir = weather_data.days[0].winddir;
    let windgust = weather_data.days[0].windgust;
    let windspeed = weather_data.days[0].windspeed; //

    document.getElementById(`ico_${c}`).src = `../images/weather_icon/${icon}.png`;

    //send to cookie --> weather, unix
    document.cookie = `${ad}=${JSON.stringify(weather_data.days[0])}; expires=${new Date(Date.now() + 1728000000).toUTCString()}`;

    document.getElementById(`det_${c}`).href = `../html/details.html?${ad}`

    return `${icon}, rain probability: ${precipprob}%, temperature: ${temp}&degC, wind: ${windspeed} km/h`;
}

// function to show the final result
function show_results(s){
    for(let i=0; i<s.length; i++){
        let lat = s[i].maneuver.location[1];
        let lon = s[i].maneuver.location[0];
        let duration = (s[i].duration)*1000;
        dep_unix += duration;
        
        document.getElementById('route_steps').innerHTML +=
            `
                <div id="root_${i}">
                    <div id="coor_${i}" class="coor"></div>
                    <div id="loc_${i}" class="loc"></div>
                    <img id="ico_${i}" class="icon" src="" alt="icon"></img>
                    <div id="wea_${i}" class="wea"></div>
                    <a href="" id="det_${i}" class="see_details">See Details</a>
                </div>
            `;
        
        get_name(`${lat},${lon}`, i, dep_unix)//13 dig num
        
        document.getElementById(`coor_${i}`).innerHTML = 
            `<br><br>${lat}, ${lon}<br>${new Date(dep_unix).toLocaleString(
                'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    hour12: false
                }
            )}`;
    }
}

// main function
window.onload = () => {
    document.getElementById('par').innerHTML = `${ori.split(',').reverse().toString()}<br>${dest.split(',').reverse().toString()}<br>${dep}`

    get_route();
}