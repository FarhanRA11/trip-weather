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
const dep = decodeURIComponent(parameters[4].slice(3)); //YYYY-MM-DDThh:mm
var dep_unix = +new Date(dep); //13 dig number

// declare costom marker
var redIcon = L.icon({
    iconUrl: '../images/markers/red-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

var greenIcon = L.icon({
    iconUrl: '../images/markers/green-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

var blueIcon = L.icon({
    iconUrl: '../images/markers/blue-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

// get route from origin and destination, no limit
async function get_route(){
    const fix_ori = ori.split(',').reverse().toString(); //lon,lat
    const fix_dest = dest.split(',').reverse().toString() //lon,lat
    const route_url = `https://router.project-osrm.org/route/v1/driving/${fix_ori};${fix_dest}?overview=full&steps=true&annotations=true&alternatives=true`;

    fetch(route_url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                throw new Error('try reload the page.');
            }
            return response.json();
        })
        .then(data => {
            if(data.code === 'NoRoute'){
                alert("Sorry, Can't find the route. Go back and try different point");
                window.location('../');
            }

            data = data.routes[0].legs[0].steps;
            console.log(data);
            
            // push starting and destination point
            data.unshift({
                maneuver: {
                    location: [ori.split(',')[1], ori.split(',')[0]]
                },
                weight: 0,
                distance: 0.1,
                intersections: [
                    {
                        location: [ori.split(',')[1], ori.split(',')[0]]
                    }
                ]
            }); 
            data.push({
                maneuver: {
                    location: [dest.split(',')[1], dest.split(',')[0]]
                },
                weight: 0,
                distance: 0.1,
                intersections: [
                    {
                        location: [dest.split(',')[1], dest.split(',')[0]]
                    }
                ]
            });
        
            show_results(data);
        })
        .catch(err => {
            console.error("Problem found, ", err);
        });
}

// get city/district name for each waypoint, 2500/day & 1/sec
var address_list = [];
async function get_name(loc, c, pass_unix){//13 dig num
    const name_url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}&key=${res.as[0]}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1&abbrv=1`;

    fetch(name_url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                throw new Error("There's problem")
            }
        })
        .then(data => {
            data = data.results[0].components;

            const village = data.village;
            const neighbourhood = data.neighbourhood;
            const quarter = data.quarter;
            const suburb = data.suburb;
            const town = data.town;
            const city_district = data.city_district;
            const city = data.city;
            const county = data.county;
            const state_district = data.state_district;
            const state = data.state;
            const country = data.country;
            
            const list = [country, state, state_district, county, city, city_district, town, suburb, quarter, neighbourhood, village];
            const pattern = /[^a-zA-Z0-9().,"'\/\s]/;
            let new_list = [];

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
        
            if(!address_list.includes(address) || c === waypoints-1){
                address_list.push(address);
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
        })
        .catch(err => {
            console.error(err);
        })
}

// get weather for each city/district name to , 1000/day
async function get_weather(ad, unix, c){//13 dig num
    const weather_url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/${Math.round(unix/Math.pow(10,3))}?unitGroup=metric&key=${res.wr[0]}&include=current&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,precipprob,pressure,snow,snowdepth,temp,uvindex,visibility,winddir,windgust,windspeed`;

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
            data = data.currentConditions;

            const cloudcover = data.cloudcover;
            const dew = data.dew;
            const feelslike = data.feelslike;
            const humidity = data.humidity;
            const text = data.icon; //visible
            const precip = data.precip;
            const precipprob = data.precipprob; //visible
            const pressure = data.pressure;
            const snow = data.snow;
            const snowdepth = data.snowdepth;
            const temp = data.temp; //visible
            const uvindex = data.uvindex;
            const visibility = data.visibility;
            const winddir = data.winddir;
            const windgust = data.windgust;
            const windspeed = data.windspeed; //visible


            const weather = `
                <div class="wea-container">
                    <div class="visible">
                        <span>Condition: </span>${text.replaceAll('-', ' ')}
                        <br><span>Rain Probability: </span>${precipprob}%
                        <br><span>Temperature: </span>${temp}&deg;C
                        <br><span>Wind: </span><img src="../images/wind-dir.png" class="wind-dir" style="transform:rotate(${winddir}deg);"> ${windspeed} km/h
                    </div>
                    <div class="hidden">
                        <span>Precipitation: </span>${precip} mm
                        <br><span>Cloud cover: </span>${cloudcover}%
                        <br><span>Humidity: </span>${humidity}%
                        <br><span>Snow: </span>${snow} cm
                        <br><span>Snow depth: </span>${snowdepth} cm
                        <br><span>Feelslike: </span>${feelslike}&deg;C
                        <br><span>Dewpoint: </span>${dew}&deg;C
                        <br><span>Wind gust: </span>${windgust} km/h
                        <br><span>Pressure: </span>${pressure} hPa
                        <br><span>Visibility: </span>${visibility} km
                        <brz><span>Uvindex: </span>${uvindex}/10
                    </div>
                </div>
            `;

            document.getElementById(`wea_${c}`).innerHTML = weather;
            
            const time = new Date(unix).toLocaleString(
                'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    hour12: false
                }
            );        

            // bindPopup per button
            map.eachLayer(layer => {
                if(layer.options && layer.options.id === `mark_${c}`){
                    layer.bindPopup(`
                        <div class="bindPopup">
                            <div id="bp-ad">
                                <b>${ad}</b><br>
                                <i>${time}</i>
                            </div>
                            <div class="bp-icon-temp">
                                <img src="../images/weather_icon/${text}.png" class="icon" alt="icon">
                                <div>${temp}&deg;C</div>
                            </div>
                            <div>
                                <a class="details" href="#root_${c}">See weather details</a>
                            </div>
                        </div>
                    `)
                }
            })
        })
        .catch(err => {
            console.error("there's problem:", err);
        });    
}

// show results
var waypoints;
let lat2 = ori.split(',')[0];
let lon2 = ori.split(',')[1];
function show_results(s){
    waypoints = s.length;
    for(let i=0; i<waypoints; i++){
        //-------------------------------

        let total_duration = s[i].weight*1000;
        let partial_duration = total_duration/s[i].intersections.length;
        for(let j=0; j<s[i].intersections.length; j++){
            let x = s[i].intersections[j].location[1];
            let y = s[i].intersections[j].location[0];
            let dist = Math.sqrt((x-lat2)**2 + (y-lon2)**2, 2)
            
            if(dist >= 0.01 || i === waypoints-1){
                dep_unix += partial_duration;
                lat2 = x;
                lon2 = y;

                if(i===0){
                    L.marker([lat2,lon2], {
                        id: `mark_${i}`,
                        icon: redIcon
                    }).addTo(map);
                }else if(i===waypoints-1){
                    L.marker([lat2,lon2], {
                        id: `mark_${i}`,
                        icon: blueIcon
                    }).addTo(map);
                    map.setView([lat2, lon2], 10)
                }else{
                    L.marker([lat2,lon2], {
                        id: `mark_${i}`,
                        icon: greenIcon
                    }).addTo(map);
                }

                document.getElementById('route_steps').innerHTML +=
                `
                    <div id="root_${i}" class="grid-item">
                        <b><div id="loc_${i}" class="loc"></div></b>
                        <i><div id="time_${i}" class="time"></div></i>
                        <div id="wea_${i}" class="wea"></div>
                    </div>
                `;

                get_name(`${lat2},${lon2}`, i, dep_unix); //13 dig num
            }            
        }
    }

    document.getElementById('tt_deptime').innerHTML += `to ${
        new Date(dep_unix).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'medium',
                hour12: false
            })
    }`
}

async function important(){
    let res = await fetch('../data/default.json');
    res = await res.json();
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

    get_route();
}