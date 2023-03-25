const urlSegment = window.location.search;
const parameters = urlSegment.substring(1).split('&');
const ori = `${decodeURIComponent(parameters[0].slice(8))},${decodeURIComponent(parameters[1].slice(8))}`; //lat,lon
const dest = `${decodeURIComponent(parameters[2].slice(8))},${decodeURIComponent(parameters[3].slice(8))}`; //lat,lon
const dep = decodeURIComponent(parameters[4].slice(3)); //YYYY-MM-DDThh:mm
var dep_unix = +new Date(dep); //13 dig number
const min = new Date(Date.now()).getMinutes();

const firebaseConfig = {
    apiKey: "AIzaSyBp1U9X57a-whj7dwR0EiK1vU8ASl5cep4",
    authDomain: "trip-weather-2eb1e.firebaseapp.com",
    databaseURL: "https://trip-weather-2eb1e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "trip-weather-2eb1e",
    storageBucket: "trip-weather-2eb1e.appspot.com",
    messagingSenderId: "779746910333",
    appId: "1:779746910333:web:e1f5976267d8355444d114",
    measurementId: "G-M7516H1K0W"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// declare costom marker
const redIcon = L.icon({
    iconUrl: '../images/markers/red-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

const greenIcon = L.icon({
    iconUrl: '../images/markers/green-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

const blueIcon = L.icon({
    iconUrl: '../images/markers/blue-icon.png',
    shadowUrl: '../images/markers/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    popupAnchor: [0, -40]
});

// function to get route from origin and destination, no limit
function get_route(rk){
    //console.log(rk.re[min%1]) //test
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
    //console.log(rk.as[min%3]) //test
    const res = await fetch('../data/address.json').catch(err => console.error(err));
    const name_data = await res.json();
    const data = name_data.results[0].components;

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

    const address = new_list.reverse().join(',');
    
    if(c === 0){
        document.getElementById('tt_ori').textContent += address.replaceAll(',',', ');
    }else if(c === waypoints-1){
        document.getElementById('tt_des').textContent += address.replaceAll(',',', ');
        document.getElementById('loader1').remove();
        document.getElementById('loader2').remove();
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
    //console.log(rk.wr[min%2]) //test
    const res = await fetch('../data/weather.json').catch(err => console.error(err));
    let data = await res.json();

    data = data.currentConditions;

    const cloudcover = data.cloudcover;
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

    function descUV(uv){
        if (uv < 2.5) {
            return 'Low';
        } else if (uv >= 2.5 && uv < 5.5) {
            return 'Moderate';
        } else if (uv >= 5.5 && uv < 7.5) {
            return 'High';
        } else if (uv >= 7.5 && uv < 10) {
            return 'Very-High';
        } else {
            return 'Extreme';
        }
    }

    const weather = `
        <button class="accordion" id="acd-${code}">
            <div class="wea-grid">
                <div class="wea-comp">
                    <img src="../images/weather_icon/${text}.png" class="icon-det">
                    ${text.replaceAll('-', ' ')}
                </div>
                <div class="wea-comp">
                    <img src="../images/components/rainprob.png" class="icon-det">
                    ${precipprob}%
                </div>
                <div class="wea-comp">
                    <img src="../images/components/temp-${Math.floor(temp/10)+1}.png" class="icon-det">
                    ${temp}&deg;C
                </div>
                <div class="wea-comp">
                    <img src="../images/components/wind.png" class="icon-det">
                    <div>
                        <img src="../images/components/wind-dir.png" class="wind-dir" style="transform:rotate(${winddir}deg);"> ${windspeed} km/h
                    </div>
                </div>
            </div>
        </button>
        <div class="panel wea-grid">
            <div class="wea-comp">
                <img src="../images/components/precip.png" class="icon-det">
                <span>Precipitation</span>${precip} mm
            </div>
            <div class="wea-comp">
                <img src="../images/components/cloud.png" class="icon-det">
                <span>Cloud Cover</span>${cloudcover}%
            </div>
            <div class="wea-comp">
                <img src="../images/components/humidity.png" class="icon-det">
                <span>Humidity</span>${humidity}%
            </div>
            <div class="wea-comp">
                <img src="../images/components/snow.png" class="icon-det">
                <span>Snow</span>${snow} cm
            </div>
            <div class="wea-comp">
                <img src="../images/components/snowdep.png" class="icon-det">
                <span>Snow Depth</span>${snowdepth} cm
            </div>
            <div class="wea-comp">
                <img src="../images/components/feel-${Math.floor(feelslike/10)+1}.png" class="icon-det">
                <span>Feelslike</span>${feelslike}&deg;C
            </div>
            <div class="wea-comp">
                <img src="../images/components/windgust.png" class="icon-det">
                <span>Wind Gust</span>${windgust} km/h
            </div>
            <div class="wea-comp">
                <img src="../images/components/pressure.png" class="icon-det">
                <span>Pressure</span>${pressure} hPa
            </div>
            <div class="wea-comp">
                <img src="../images/components/visibility.png" class="icon-det">
                <span>Visibility</span>${visibility} km
            </div>
            <div class="wea-comp">
                <img src="../images/components/uv-${descUV(uvindex)}.png" class="icon-det">
                <span>UV Index</span>${uvindex} (${descUV(uvindex).replace('-', ' ')})
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
                    <img src="../images/weather_icon/${text}.png" class="icon">
                    <div>${temp}&deg;C</div>
                </div>
                <div>
                    <a class="details" href="#root_${code}">See weather details</a>
                </div>
            </div>
            `)
            layer.openPopup();
        }
    })

    //setting up accordion
    const acd = document.getElementById(`acd-${code}`);
    acd.onclick = function(){
        acd.classList.toggle('active');
        const panel = acd.nextElementSibling;
        if(panel.style.maxHeight){
            panel.style.maxHeight = null;
        }else{
            panel.style.maxHeight = panel.scrollHeight + 'px';
        }
    }
}

// function to show the final result
var waypoints;
var lat2 = ori.split(',')[0];
var lon2 = ori.split(',')[1];

function show_results(s, pass_rk){
    waypoints = s.length;
    for(let i=0; i<waypoints; i++){
        let total_duration = s[i].weight*1000;
        let partial_duration = total_duration/s[i].intersections.length;

        for(let j=0; j<s[i].intersections.length; j++){
            let code = `${i}/${j}`
            let x = s[i].intersections[j].location[1];
            let y = s[i].intersections[j].location[0];
            let dist = Math.sqrt((x-lat2)**2 + (y-lon2)**2, 2)
            dep_unix += (partial_duration + 5*1000); // 5s per intersections
            
            if(dist >= 0.02 || i === 0 || i === waypoints-1){ // 1km --> 0.009
                lat2 = x;
                lon2 = y;

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
                
                document.getElementById(`time_${code}`).textContent = 
                    new Date(dep_unix).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                        hour12: false
                    })

                get_name(`${lat2},${lon2}`, i, dep_unix, code, pass_rk); //13 dig num
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

    const ref = database.ref(`k`);
    ref.once('value', function(snapshot) {
        let key = snapshot.val();
        get_route(key)
    });
}