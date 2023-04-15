import { getAddress } from './address.js';

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

function calc(pass_rk, pass_min, steps, ori, dep_unix){
    const waypoints = steps.length;
    let lat = ori.split(',')[0];
    let lon = ori.split(',')[1];

    for(let i=0; i<waypoints; i++){
        const total_duration = steps[i].weight * 1000;
        const partial_duration = total_duration/steps[i].intersections.length;

        for(let j=0; j<steps[i].intersections.length; j++){
            const code = `${i}/${j}`;
            const x = steps[i].intersections[j].location[1];
            const y = steps[i].intersections[j].location[0];
            const dist = Math.sqrt((x-lat)**2 + (y-lon)**2, 2);
            dep_unix += (partial_duration + 5*1000); // 5s per intersections

            if(dist >= 0.02 || i === 0 || i === waypoints-1){ // 1km --> 0.009
                lat = x;
                lon = y;

                if(i === 0){
                    L.marker([lat,lon], {
                        id: `mark_${code}`,
                        icon: redIcon
                    }).addTo(map);
                }else if(i === waypoints-1){
                    L.marker([lat,lon], {
                        id: `mark_${code}`,
                        icon: blueIcon
                    }).addTo(map);
                    map.setView([lat, lon], 10)
                }else{
                    L.marker([lat,lon], {
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

                getAddress(pass_rk, pass_min, `${lat},${lon}`, dep_unix, i, code, waypoints) //13 dig num
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

export async function getRoute(rk, min, ori, dest, via, dep_unix){
    rk.re[min%1];
    
    var waypoints = [];
    waypoints.push(ori.split(',').reverse().toString());
    if(via !== null){
        via.split(';').map(str => {
            waypoints.push(str.split(',').reverse().join(','));
        })
    }
    waypoints.push(dest.split(',').reverse().toString());
    
    var allSteps = [];
    for(let i=0; i<waypoints.length-1; i++){
        let url = `https://router.project-osrm.org/route/v1/driving/${waypoints[i]};${waypoints[i+1]}?overview=full&steps=true&annotations=true&alternatives=true`;
        fetch(url, {method: 'GET'})
            .then(response => {
                if(!response.ok){
                    throw new Error('try reload the page.');
                }
                return response.json();
            })
            .then(route => {
                if(route.code === 'NoRoute'){
                    alert("Sorry, Can't find the route. Go back and try different point");
                    window.location('../');
                }
                
                let steps = route.routes[0].legs.flatMap(leg => leg.steps);
                allSteps.push(...steps);

                if(i === waypoints.length-2 ){
                    // push starting and destination point
                    allSteps.unshift({
                        weight: 0,
                        intersections: [{
                            location: [ori.split(',')[1], ori.split(',')[0]]
                        }]
                    }); 
                    allSteps.push({
                        weight: 0,
                        intersections: [{
                            location: [dest.split(',')[1], dest.split(',')[0]]
                        }]
                    });

                    calc(rk, min, allSteps, ori, dep_unix);
                }
            })
            .catch(err => {
                console.error("Problem found, ", err);
            });
    }
}