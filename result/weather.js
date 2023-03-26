function descUV(index){
    if (index < 2.5) {
        return 'Low';
    } else if (index >= 2.5 && index < 5.5) {
        return 'Moderate';
    } else if (index >= 5.5 && index < 7.5) {
        return 'High';
    } else if (index >= 7.5 && index < 10) {
        return 'Very-High';
    } else {
        return 'Extreme';
    }
}

export async function WeatherForecast(rk, min, ad, unix, code){
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ad}/${Math.round(unix/Math.pow(10,3))}?unitGroup=metric&key=${rk.wr[min%3]}&include=current&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,precipprob,pressure,snow,snowdepth,temp,uvindex,visibility,winddir,windgust,windspeed`;

    return fetch(url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                throw new Error("There's Problem");
            }
            return response.json();
        })
        .then(data => {
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

            const time = new Date(unix).toLocaleString(
                'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    hour12: false
                }
            );
            
            const result = [weather, time, text, temp] 
            return result;
        })
        .catch(err => {
            console.error(err);
        })
}