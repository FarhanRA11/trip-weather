import { getRoute } from './route.js';
import { getAddress } from './address.js';
import { WeatherForecast } from './weather.js';

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
function routing(rk, min, ori, dest){
    getRoute(rk, min, ori, dest)
        .then(route => {
            calculate(rk, route);
        })
}

// function, for each waypoint to get city/district name, 2500/day & 1/sec
var address_list = [];
function naming(rk, min, loc, pass_unix, index, code){//13 dig num
    getAddress(rk, min, loc)
        .then(address => {
            if(index === 0){
                document.getElementById('tt_ori').textContent += address.replaceAll(',',', ');
            }else if(index === waypoints-1){
                document.getElementById('tt_des').textContent += address.replaceAll(',',', ');
                document.getElementById('loader1').remove();
            }
        
            if((!address_list.includes(address) || index === waypoints-1) && address.split(',').length > 2){
                address_list.push(address);
                document.getElementById(`loc_${code}`).textContent = address.replaceAll(',',', ');
                forecast(rk, min, address, pass_unix, index, code);
            }else{
                document.getElementById(`root_${code}`).remove();
                map.eachLayer(layer => {
                    if(layer.options && layer.options.id === `mark_${code}`){
                        map.removeLayer(layer);
                    }
                });
            }
        })
}

// function, for each city/district name to get weather, 1000/day
async function forecast(rk, min, ad, unix, c, code){//13 dig num
    WeatherForecast(rk, min, ad, unix, code)
        .then(result => {
            if(result == undefined){
                document.getElementById(`root_${code}`).remove();
                map.eachLayer(layer => {
                    if(layer.options && layer.options.id === `mark_${code}`){
                        map.removeLayer(layer);
                    }
                });
            }else{
                document.getElementById(`wea_${code}`).innerHTML = result[0];

                // bindPopup per button here
                map.eachLayer(layer => {
                    if(layer.options && layer.options.id === `mark_${code}`){
                        layer.bindPopup(`
                        <div class="bindPopup">
                            <div id="bp-ad">
                                <b>${ad}</b><br>
                                <i>${result[1]}</i>
                            </div>
                            <div class="bp-icon-temp">
                                <img src="../images/weather_icon/${result[2]}.png" class="icon">
                                <div>${result[3]}&deg;C</div>
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
        })
    
    if(c === waypoints-1){
        document.getElementById('loader2').remove();
    }

    document.getElementById(`loc_${code}`).onclick = () => {
        map.eachLayer(layer => {
            if(layer.options && layer.options.id === `mark_${code}`){
                layer.openPopup();
            }
        })
    }
}

// function to show the final result
var waypoints;
var lat2 = ori.split(',')[0];
var lon2 = ori.split(',')[1];

function calculate(pass_rk, s){
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
                        <b><a id="loc_${code}" class="loc" href="#map"></a></b>
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

                naming(pass_rk, min, `${lat2},${lon2}`, dep_unix, i, code) //13 dig num
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

    const ref = database.ref(`k`);
    ref.once('value', function(snapshot) {
        const key = snapshot.val();
        routing(key, min, ori, dest)
    });
}