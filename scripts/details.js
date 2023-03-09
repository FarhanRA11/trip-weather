const address = decodeURIComponent(window.location.search.substring(1))

let all_cookies = document.cookie.split('; ');
for(let i=0; i<all_cookies.length; i++){
    if(all_cookies[i].startsWith(address+'=')){
        var data = JSON.parse(all_cookies[i].substring(all_cookies[i].indexOf('=')+1));
        console.log(data);
    }
}

const compass = [
    'north', 'north - north east', 'north east', 'east - north east', 'east', 'east - south east', 'south east', 'south - south east', 'south', 'south - south west', 'south west', 'west - south west', 'west', 'west - north west', 'north west', 'north - north west', 'north'
]

const cloudcover = data.cloudcover;
const dew = data.dew;
const feelslike = data.feelslike;
const humidity = data.humidity;
const icon = (data.icon).replaceAll('-', ' ');
const precip = data.precip;
const precipprob = data.precipprob;
const pressure = data.pressure;
const snow = data.snow;
const snowdepth = data.snowdepth;
const temp = data.temp;
const uvindex = data.uvindex;
const visibility = data.visibility;
const winddir = compass[Math.round(((data.winddir)%360) / 22.5)];
const windgust = data.windgust;
const windspeed = data.windspeed;

window.onload = () => {
    document.getElementById('root').textContent += address.replaceAll(',',', ');

    document.getElementById('root').innerHTML += `
        <br>situation: ${icon}
        <br>rain probability: ${precipprob}%
        <br>precipitation: ${precip}mm
        <br>cloudcover: ${cloudcover}%
        <br>humidity: ${humidity}%
        <br>snow: ${snow}cm
        <br>snow depth: ${snowdepth}cm
        <br>temperature: ${temp}degC
        <br>feelslike: ${feelslike}&degC
        <br>dewpoint: ${dew}&degC
        <br>wind speed: ${windspeed} km/h
        <br>wind gust: ${windgust} km/h
        <br>wind direction: ${winddir}
        <br>pressure: ${pressure} hPa
        <br>visibility: ${visibility}km
        <br>uvindex: ${uvindex}/10
    `;
}