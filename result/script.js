/*
    route => waypoint (lat,lon,time,dist)
    waypoint => location name
    location => weather

    30 km/h --> 1km in 2min
*/
const urlSegment = window.location.search;
const parameters = urlSegment.substring(1).split('&');
var ori = `${decodeURIComponent(parameters[0].slice(8))},${decodeURIComponent(parameters[1].slice(8))}`; //lat,lon
var dest = `${decodeURIComponent(parameters[2].slice(8))},${decodeURIComponent(parameters[3].slice(8))}`; //lat,lon
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
        alert("Sorry, Can't find the route. Go back and try different point");
        window.location('../');
    }
    const steps = route_data.routes[0].legs[0].steps;

    steps.unshift({
        maneuver: {
            location: [ori.split(',')[1], ori.split(',')[0]]
        },
        weight: 0,
        intersections: []
    });
    steps.push({
        maneuver: {
            location: [dest.split(',')[1], dest.split(',')[0]]
        },
        weight: 0,
        intersections: []
    });

    show_results(steps);
}

// function, for each waypoint to get city/district name, 2500/day & 1/sec
var address_list = [];
async function get_name(loc, c, pass_unix){//13 dig num
    /* temporary
    const name_api_key = '85b3fdd0d84246c1835761c2448ea9f3';
    //b3bea85fe88146bf89d7c25c7c50f545 f
    //b1a8acdec4574fc98ec1b577ab778669 u
    //85b3fdd0d84246c1835761c2448ea9f3 a

    let name_url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}&key=${name_api_key}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1&abbrv=1`;
    let response_2 = await fetch(name_url, {method: 'GET'})
        .catch(err => console.error(err));

    let name_data = await response_2.json();
    */

    const res = await fetch('../data/address.json').catch(err => console.error(err));
    const name_data = await res.json();

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
    
    if(c === 0){
        document.getElementById('tt_ori').textContent += address.replaceAll(',',', ');
    }else if(c === waypoints-1){
        document.getElementById('tt_des').textContent += address.replaceAll(',',', ');
    }

    if(!address_list.includes(address)){
        // address_list.push(address); temporary
        document.getElementById(`loc_${c}`).textContent = address.replaceAll(',',', ');
        get_weather(address, pass_unix, c);
    }else{
        document.getElementById(`root_${c}`).remove();
        map.eachLayer(layer => {
            if(layer.options && layer.options.id === `mark_${c}`){
                map.removeLayer(layer);
            }
        });
    }
}

// function, for each city/district name to get weather, 1000/day
const compass = [
    'north', 'north - north east', 'north east', 'east - north east', 'east', 'east - south east', 'south east', 'south - south east', 'south', 'south - south west', 'south west', 'west - south west', 'west', 'west - north west', 'north west', 'north - north west', 'north'
]
async function get_weather(ad, unix, c){//13 dig num
    /* temporary
    const weather_api_key = 'C3M5RHSXUYS3EBRA9WCUTY93A';
    //VZL3Q3HAS9A2H7BHMTH7YNLAW f
    //C3M5RHSXUYS3EBRA9WCUTY93A u
    let weather_url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/${Math.round(unix/Math.pow(10,3))}?unitGroup=metric&key=${weather_api_key}&include=current&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,precipprob,pressure,snow,snowdepth,temp,uvindex,visibility,winddir,windgust,windspeed`;


    fetch(weather_url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                document.getElementById(`root_${c}`).remove();
                map.eachLayer((layer) => {
                    if(layer.options && layer.options.id === `mark_${c}`){
                        map.removeLayer(layer);
                    }
                });
                throw new Error('address not found');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            data = data.currentConditions;

            const cloudcover = data.cloudcover;
            const dew = data.dew;
            const feelslike = data.feelslike;
            const humidity = data.humidity;
            const text = data.icon; //
            const precip = data.precip;
            const precipprob = data.precipprob; //
            const pressure = data.pressure;
            const snow = data.snow;
            const snowdepth = data.snowdepth;
            const temp = data.temp; //
            const uvindex = data.uvindex;
            const visibility = data.visibility;
            const winddir = compass[Math.round(((data.winddir)%360) / 22.5)];
            const windgust = data.windgust;
            const windspeed = data.windspeed; //


            let weather = `
                situation: ${text.replaceAll('-', ' ')}
                <br>rain probability: ${precipprob}%
                <br>precipitation: ${precip} mm
                <br>cloud cover: ${cloudcover}%
                <br>humidity: ${humidity}%
                <br>snow: ${snow} cm
                <br>snow depth: ${snowdepth} cm
                <br>temperature: ${temp}&deg;C
                <br>feelslike: ${feelslike}&deg;C
                <br>dewpoint: ${dew}&deg;C
                <br>wind speed: ${windspeed} km/h
                <br>wind gust: ${windgust} km/h
                <br>wind direction: ${winddir}
                <br>pressure: ${pressure} hPa
                <br>visibility: ${visibility}km
                <br>uvindex: ${uvindex}/10
                `;
            document.getElementById(`wea_${c}`).innerHTML = weather;
            // bindPopup per button here
            
            map.eachLayer(layer => {
                if(layer.options && layer.options.id === `mark_${c}`){
                    layer.bindPopup(`
                    <div class="bindPopup">
                        <img src="../images/weather_icon/${text}.png" class="icon" alt="icon">
                        <div class="temp">${temp}&degC</div>
                        <a class="see_more" href="#root_${c}">See details</a>
                    </div>
                    `)
                }
            })
        })
        .catch(err => {
            console.error("there's problem:", err);
        });
        end temporary (weather)
        */

    const res = await fetch('../data/weather.json').catch(err => console.error(err));
    var data = await res.json();

    data = data.currentConditions;

    const cloudcover = data.cloudcover;
    const dew = data.dew;
    const feelslike = data.feelslike;
    const humidity = data.humidity;
    const text = data.icon; //
    const precip = data.precip;
    const precipprob = data.precipprob; //
    const pressure = data.pressure;
    const snow = data.snow;
    const snowdepth = data.snowdepth;
    const temp = data.temp; //
    const uvindex = data.uvindex;
    const visibility = data.visibility;
    const winddir = compass[Math.round(((data.winddir)%360) / 22.5)];
    const windgust = data.windgust;
    const windspeed = data.windspeed; //


    let weather = `
        situation: ${text.replaceAll('-', ' ')}
        <br>rain probability: ${precipprob}%
        <br>precipitation: ${precip} mm
        <br>cloud cover: ${cloudcover}%
        <br>humidity: ${humidity}%
        <br>snow: ${snow} cm
        <br>snow depth: ${snowdepth} cm
        <br>temperature: ${temp}&deg;C
        <br>feelslike: ${feelslike}&deg;C
        <br>dewpoint: ${dew}&deg;C
        <br>wind speed: ${windspeed} km/h
        <br>wind gust: ${windgust} km/h
        <br>wind direction: ${winddir}
        <br>pressure: ${pressure} hPa
        <br>visibility: ${visibility}km
        <br>uvindex: ${uvindex}/10
        `;
    document.getElementById(`wea_${c}`).innerHTML = weather;
    // bindPopup per button here
    
    map.eachLayer(layer => {
        if(layer.options && layer.options.id === `mark_${c}`){
            layer.bindPopup(`
            <div class="bindPopup">
                <div id="bp-ad">
                    ${ad}
                </div>
                <div class="bp-icon-temp">
                    <img src="../images/weather_icon/${text}.png" class="icon" alt="icon">
                    <div>${temp}&deg;C</div>
                </div>
                <div>
                    <a class="details" href="#root_${c}">See details</a>
                </div>
            </div>
            `)
        }
    })
}

// function to show the final result
var waypoints;
function show_results(s){
    waypoints = s.length;
    for(let i=0; i<waypoints; i++){
        let lat = s[i].maneuver.location[1];
        let lon = s[i].maneuver.location[0];
        let duration = (s[i].weight + s[i].intersections.length*3)*1000;
        dep_unix += duration;

        L.marker([lat,lon], {id: `mark_${i}`}).addTo(map);
        map.setView([lat, lon], 10)

        document.getElementById('route_steps').innerHTML +=
            `
                <div id="root_${i}">
                    <div id="coor_${i}" class="coor"></div>
                    <div id="loc_${i}" class="loc"></div>
                    <div id="wea_${i}" class="wea"></div>
                </div>
            `;
        
        get_name(`${lat},${lon}`, i, dep_unix)//13 dig num
        
        document.getElementById(`coor_${i}`).textContent = 
            new Date(dep_unix).toLocaleString(
                'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    hour12: false
                }
            );
    }
}

async function important(){
    const r = await fetch('../data/default.json').catch(err => console.error(err));
    const k = await r.json();
    console.log(k);
}

// main function
window.onload = () => {
    important();

    document.getElementById('tt_coords').textContent = `(${ori.split(',').reverse().join(', ')}) to (${dest.split(',').reverse().join(', ')})`;

    document.getElementById('tt_deptime').textContent += new Date(dep_unix).toLocaleString(
        'en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            hour12: false
        }
    )

    get_route();
}