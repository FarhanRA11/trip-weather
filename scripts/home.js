// function to convert unix time to formatted date YYYY-MM-DDThh:mm
function formatted_date(time){
	const year = new Date(time).getFullYear();
    const month = (new Date(time).getMonth() + 1).toString().padStart(2, '0');
    const date = new Date(time).getDate().toString().padStart(2, '0');
    const hour = new Date(time).getHours().toString().padStart(2, '0');
    const minute = new Date(time).getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${date}T${hour}:${minute}`;
}

// 3 function to get user location
var lat;
var lon;
function get_userloc(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }else{
        alert("Can't find your location. Not supported by this browser.");
    }
}

function showPosition(position){
    alert('Found your location.');
    lat = position.coords.latitude;
    lon = position.coords.longitude;
}

function showError(error){
    switch(error.code){
        case error.PERMISSION_DENIED:
            alert('Please allow GPS access for this site.');
            break;
        case error.POSITION_UNAVAILABLE:
            alert('Your location is unavailable.');
            break;
        case error.TIMEOUT:
            alert('Timed out. Proccess took too long.');
            break;
        case error.UNKNOWN_ERROR:
            alert('An unknown error occured.');
            break;
    }
}

// main function
window.onload = () => {
    // Get date 10 day ahead range for routing
    let today = formatted_date(Date.now());
    let max_date = formatted_date(Date.now() + 10 * 86400000); // unix add 10 days
    document.getElementById('time_dep').min = today;
    document.getElementById('time_dep').max = max_date;

    // passing inputted data to result.html
    document.getElementById('btn_search').onclick = () => {
        let origin = (document.getElementById('coor_ori').value).replaceAll(' ', '');
        let destination = document.getElementById('coor_dest').value.replaceAll(' ', '');
        let datetime = document.getElementById('time_dep').value;

        console.log(origin);
        console.log(destination);
        console.log(datetime);

        window.open(`./html/result.html?${origin}&${destination}&${datetime}`, '_blank');
    }
}