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

// not yet fixed


// function to get route from origin and destination, no limit
async function get_route(rk){
    console.log(rk.re[0]) //test
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

            console.log(data);
            data = data.routes[0].legs[0].steps;
            
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
        
            show_results(data, rk);
        })
        .catch(err => {
            console.error("Problem found, ", err);
        });
}

// function, for each waypoint to get city/district name, 2500/day & 1/sec
var address_list = [];
async function get_name(loc, c, pass_unix, code, rk){//13 dig num
    console.log(rk.as[0]) //test
    const res = await fetch('../data/address.json').catch(err => console.error(err));
    const name_data = await res.json();
    const data = name_data.results[0].components;

    let village = data.village;
    let neighbourhood = data.neighbourhood;
    let quarter = data.quarter;
    let suburb = data.suburb;
    let town = data.town;
    let city_district = data.city_district;
    let city = data.city;
    let county = data.county;
    let state_district = data.state_district;
    let state = data.state;
    let country = data.country;

    const list = [country, state, state_district, county, city, city_district, town, suburb, quarter, neighbourhood, village];
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

    if(!address_list.includes(address) || c === waypoints-1){
        document.getElementById(`loc_${code}`).textContent = address.replaceAll(',',', ');
        get_weather(address, pass_unix, c, code, rk);
    }else{
        document.getElementById(`root_${code}`).remove();
        map.eachLayer(layer => {
            if(layer.options && layer.options.id === `mark_${code}`){
                map.removeLayer(layer);
            }
        });
    }
}

// function, for each city/district name to get weather, 1000/day
async function get_weather(ad, unix, c, code, rk){//13 dig num
    console.log(rk.wr[0]) //test
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
    const winddir = data.winddir;
    const windgust = data.windgust;
    const windspeed = data.windspeed; //


    let weather = 
        `
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
                <br><span>Uvindex: </span>${uvindex}/10
            </div>
        </div>
        `;
        
    document.getElementById(`wea_${code}`).innerHTML = weather;
    
    // bindPopup per button here
    const time = new Date(unix).toLocaleString(
        'en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            hour12: false
        }
    );
    map.eachLayer(layer => {
        if(layer.options && layer.options.id === `mark_${code}`){
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
                    <a class="details" href="#root_${code}">See weather details</a>
                </div>
            </div>
            `)
        }
    })
}

// function to show the final result
var waypoints;
var lat2 = ori.split(',')[0];
var lon2 = ori.split(',')[1];
var counter = 0;

function show_results(s, rk){
    waypoints = s.length;
    for(let i=0; i<waypoints; i++){
        let total_duration = s[i].weight*1000;
        let partial_duration = total_duration/s[i].intersections.length;

        for(let j=0; j<s[i].intersections.length; j++){
            let code = `${i}/${j}`
            let x = s[i].intersections[j].location[1];
            let y = s[i].intersections[j].location[0];
            let dist = Math.sqrt((x-lat2)**2 + (y-lon2)**2, 2)
            dep_unix += partial_duration;
            
            if(dist >= 0.04 || i === 0 || i === waypoints-1){ // 1km --> 0.009
                lat2 = x;
                lon2 = y;
                counter++
                console.log(counter)
                if(i === 0){
                    L.marker([lat2,lon2], {
                        id: `mark_${code}`,
                        icon: redIcon
                    }).addTo(map);
                }else if(i === waypoints-1){
                    L.marker([lat2,lon2], {
                        id: `mark_${code}`,
                        icon: blueIcon
                    }).addTo(map);
                    map.setView([lat2, lon2], 10)
                }else{
                    L.marker([lat2,lon2], {
                        id: `mark_${code}`,
                        icon: greenIcon
                    }).addTo(map);
                }

                document.getElementById('route_steps').innerHTML +=
                `
                    <div id="root_${code}" class="grid-item">
                        <b><div id="loc_${code}" class="loc"></div></b>
                        <i><div id="time_${code}" class="time"></div></i>
                        <div id="wea_${code}" class="wea"></div>
                    </div>
                `;
                
                get_name(`${lat2},${lon2}`, i, dep_unix, code, rk); //13 dig num
            }            
        }
    }

    document.getElementById('tt_deptime').innerHTML += ` to ${
        new Date(dep_unix).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'medium',
                hour12: false
            })
    }`
}

// main function
window.onload = () => {
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

    fetch('../data/default.json', {method: 'GET'})
        .then(r => r.json())
        .then(res => get_route(res))
}