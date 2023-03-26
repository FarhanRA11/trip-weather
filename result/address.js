export async function getAddress(rk, min, loc){
    //console.log(rk.as[min%3])
    return fetch('../data/address.json')
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
            return address;
        })
        .catch(err => {
            console.error(err);
        })
}