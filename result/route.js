export async function getRoute(rk, min, ori, dest){
    rk.re[min%1]
    const fix_ori = ori.split(',').reverse().toString(); //lon,lat
    const fix_dest = dest.split(',').reverse().toString() //lon,lat
    const route_url = `https://router.project-osrm.org/route/v1/driving/${fix_ori};${fix_dest}?overview=full&steps=true&annotations=true&alternatives=true`;

    return fetch(route_url, {method: 'GET'})
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

            console.log(route);
            route = route.routes[0].legs[0].steps;
            
            route.unshift({
                weight: 0,
                intersections: [
                    {
                        location: [ori.split(',')[1], ori.split(',')[0]]
                    }
                ]
            }); 
            route.push({
                weight: 0,
                intersections: [
                    {
                        location: [dest.split(',')[1], dest.split(',')[0]]
                    }
                ]
            });
            return route;
        })
        .catch(err => {
            console.error("Problem found, ", err);
        });
}