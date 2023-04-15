import { WeatherForecast } from './weather.js';

var address_list = [];
export async function getAddress(rk, min, loc, pass_unix, index, code, waypoints){
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${loc}&key=${rk.as[min%3]}&language=en&no_annotations=1&address_only=1&limit=1&no_record=1&abbrv=1`;
    
    fetch(url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                throw new Error("There's Problem");
            }
            return response.json();
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
            
            const address = new_list.reverse().join(',');
            if(index === 0){
                document.getElementById('tt_ori').textContent += address.replaceAll(',',', ');
            }else if(index === waypoints-1){
                document.getElementById('tt_des').textContent += address.replaceAll(',',', ');
                document.getElementById('loader1').remove();
            }
        
            if((!address_list.includes(address) || index === waypoints-1) && address.split(',').length > 2){
                address_list.push(address);
                document.getElementById(`loc_${code}`).textContent = address.replaceAll(',',', ');
                WeatherForecast(rk, min, address.replaceAll(',',', '), pass_unix, index, code, loc, waypoints);
            }else{
                document.getElementById(`root_${code}`).remove();
                map.eachLayer(layer => {
                    if(layer.options && layer.options.id === `mark_${code}`){
                        map.removeLayer(layer);
                    }
                });
            }
        })
        .catch(err => {
            console.error(err);
        })
}