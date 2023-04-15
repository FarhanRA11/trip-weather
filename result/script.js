import { getRoute } from './route.js';

const urlSegment = window.location.search;
const parameters = urlSegment.substring(1).split('&');
const ori = `${decodeURIComponent(parameters[0].slice(3))},${decodeURIComponent(parameters[1].slice(3))}`; //lat,lon
const dest = `${decodeURIComponent(parameters[2].slice(3))},${decodeURIComponent(parameters[3].slice(3))}`; //lat,lon
const dep = decodeURIComponent(parameters[4].slice(2)); //YYYY-MM-DDThh:mm
var dep_unix = +new Date(dep); //13 dig number
const min = new Date(Date.now()).getMinutes();

let via;
if(parameters.length === 6){
    via = decodeURIComponent(parameters[5].slice(2)); //lat,lon;lat,lon
}else{
    via = null;
}

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
        getRoute(key, min, ori, dest, via, dep_unix)
    });
}