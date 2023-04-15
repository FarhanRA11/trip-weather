function titleCase(str){
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function descUV(index){
    if (index < 2.5) {
        return 'Low';
    } else if (index >= 2.5 && index < 5.5) {
        return 'Moderate';
    } else if (index >= 5.5 && index < 7.5) {
        return 'High';
    } else if (index >= 7.5 && index < 10.5) {
        return 'Very-High';
    } else {
        return 'Extreme';
    }
}

export async function WeatherForecast(rk, min, ad, unix, c, code, loc, waypoints){
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${loc}/${Math.round(unix/1000)}?unitGroup=metric&key=${rk.wr[min%3]}&include=current&iconSet=icons2&contentType=json&elements=cloudcover,dew,feelslike,humidity,icon,precip,precipprob,pressure,snow,snowdepth,temp,uvindex,visibility,winddir,windgust,windspeed`;

    fetch(url, {method: 'GET'})
        .then(response => {
            if(!response.ok){
                throw new Error(response.status);
            }
            return response.json();
        })
        .then(data => {
            // console.log(data)
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
            const uvindex = data.uvindex*11/10;
            const visibility = data.visibility;
            const winddir = data.winddir;
            const windgust = data.windgust;
            const windspeed = data.windspeed; //

            const weather = `
                <button class="accordion" id="acd-${code}">
                    <div class="wea-grid">

                        <div class="wea-comp">
                            <img src="../images/weather_icon/${text}.png" class="icon-det" loading="lazy">
                            ${titleCase(text.replaceAll('-', ' '))}
                        </div>

                        <div class="wea-comp">
                            <img src="../images/components/rainprob.png" class="icon-det" loading="lazy">
                            ${precipprob}%
                        </div>

                        <div class="wea-comp">
                            <img src="../images/components/temp-${Math.floor(temp/10)+1}.png" class="icon-det" loading="lazy">
                            ${temp}&deg;C
                        </div>

                        <div class="wea-comp">
                            <img src="../images/components/wind.png" class="icon-det" loading="lazy">
                            <div style="gap:5px; display:flex;">
                                <img src="../images/components/wind-dir.png" class="wind-dir" style="transform:rotate(${winddir}deg);" loading="lazy"> 
                                <div>${windspeed} km/h</div>
                            </div>
                        </div>

                    </div>
                </button>

                <div class="panel wea-grid">
                    <div class="wea-comp">
                        <img src="../images/components/precip.png" class="icon-det" loading="lazy">
                        <span>Precipitation</span>${precip} mm
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/cloud.png" class="icon-det" loading="lazy">
                        <span>Cloud Cover</span>${cloudcover}%
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/humidity.png" class="icon-det" loading="lazy">
                        <span>Humidity</span>${humidity}%
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/snow.png" class="icon-det" loading="lazy">
                        <span>Snow</span>${snow} cm
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/snowdep.png" class="icon-det" loading="lazy">
                        <span>Snow Depth</span>${snowdepth} cm
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/feel-${Math.floor(feelslike/10)+1}.png" class="icon-det" loading="lazy">
                        <span>Feelslike</span>${feelslike}&deg;C
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/windgust.png" class="icon-det" loading="lazy">
                        <span>Wind Gust</span>${windgust} km/h
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/pressure.png" class="icon-det" loading="lazy">
                        <span>Pressure</span>${pressure} hPa
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/visibility.png" class="icon-det" loading="lazy">
                        <span>Visibility</span>${visibility} km
                    </div>
                    <div class="wea-comp">
                        <img src="../images/components/uv-${descUV(uvindex)}.png" class="icon-det" loading="lazy">
                        <span>UV Index</span>${Math.round(uvindex)} (${descUV(uvindex).replace('-', ' ')})
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
            
            if(result == undefined){
                document.getElementById(`root_${code}`).remove();
                map.eachLayer(layer => {
                    if(layer.options && layer.options.id === `mark_${code}`){
                        map.removeLayer(layer);
                    }
                });
            }else{
                document.getElementById(`wea_${code}`).innerHTML = weather;

                // bindPopup per button here
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
        })
        .catch(err => {
            console.error(err);
            console.clear();
        })
}