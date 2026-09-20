let currentData = {}
let currentMode = "population"
let geojsonLayer;

const nameMap = {
    Yerevan: 'Erevan',
    "Vayots Dzor": "VayotsDzor"
};

const map = L.map(`map`).setView([40.2, 44.5], 7)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "AlexGev", }).addTo(map);

const info = L.control()

info.onAdd = function () {
    this.div = L.DomUtil.create('div', 'info')
    this.update()
    return this.div
}

info.update = function (props) {
    if (!props) {
        this.div.innerHTML = "Hover over a region"
        return
    }

    const geoName = props.NAME_1
    const dataKey = nameMap[geoName] || geoName;
    const value = currentData[dataKey]
    let label;

    if (currentMode === 'tumo') {

        if (value == 1) {
            label = "has tumo"
        }
        else {
            label = "Has no tumo"
        }
    }
    else {
        if (!value) {
            label = 'No data'
        }
        else {
            label = value
        }
    }
    this.div.innerHTML = `<b>${geoName}</b><br>${label}`
}

info.addTo(map)

let getPopulationColor = (v) => {
    return v > 800000
        ? "rgb(71, 0, 0)"
        : v > 300000
            ? "rgb(136, 0, 0)"
            : v > 200000
                ? "rgb(187, 5, 5)"
                : v > 150000
                    ? "rgb(224, 4, 4)"
                    : v > 100000
                        ? 'rgb(235, 73, 73)'
                        : 'rgb(250, 151, 151)'
}

let getSchoolColor = (v) => {
    return v > 300
        ? "rgb(24, 4, 95)"
        : v > 250
            ? "rgb(61, 29, 177)"
            : v > 200
                ? "rgb(63, 36, 216)"
                : v > 150
                    ? "rgb(128, 89, 235)"
                    : v > 100
                        ? 'rgb(144, 146, 233)'
                        : 'rgb(232, 218, 246)'
}


const style = (feature) => {
    const geoName = feature.properties.NAME_1
    const key = nameMap[geoName] || geoName
    const value = currentData[key] || 0;

    let fillColor;

    if (currentMode == 'population') {
        fillColor = getPopulationColor(value)
    }
    else if (currentMode == 'schools') {
        fillColor = getSchoolColor(value)
    }

    let obj = {
        fillColor,
        weight: 2,
        color: '#070000',
        fillOpacity: 0.7
    }
    return obj
}

const highlight = (e) => {
    e.target.setStyle({
        weight: 2,
        fillOpacity: 0.35
    })
    info.update(e.target.feature.properties)
}

const reset = (e) => {
    geojsonLayer.resetStyle(e.target)
    info.update()
}

const onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: highlight,
        mouseout: reset
    })
}

fetch('data/armenia-simple.geojson')
    .then((response) => response.json())
    .then((geodata) => {
        geojsonLayer = L.geoJson(geodata, {
            style,
            onEachFeature,
        }).addTo(map)
        loadData('population')
    })

function loadData(type) {
    currentMode = type
    document.querySelectorAll('.data_t').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.type === type))
    })

    fetch(`data/${type}.json`)
        .then((r) => r.json())
        .then((data) => {
            currentData = data
            geojsonLayer.setStyle(style)
            info.update()
            if (!document.getElementById('chart').hidden) loadchart()
        })
}


let btnArray = [...document.getElementsByClassName('data_t')];

btnArray.forEach((btn) => {
    btn.addEventListener('click', () => {
        loadData(btn.dataset.type)
    })
})

const weather = document.getElementById('weather')

const tempe = L.control({ position: 'topleft' })

weather.addEventListener('click', getWeather)

function getWeather() {
    const lat = 40.1792;
    const lon = 44.4991;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m`)
        .then((response) => response.json())
        .then((data) => {

            tempe.onAdd = function () {
                this.div = L.DomUtil.create('div', 'tempe')
                let status;
                if(data.current.temperature_2m >= 35) {
                    status = 'Extreme'
                }
                else if(data.current.temperature_2m >= 30) {
                    status = 'Hot'
                }
                else if(data.current.temperature_2m >= 20) {
                    status = 'Warm'
                }
                else if(data.current.temperature_2m >= 10) {
                    status = 'Pleasant'
                }
                else if(data.current.temperature_2m >= 0) {
                    status = 'Cold'
                }
                else {
                    status = 'Freezing'
                }
                this.div.innerHTML = `${data.current.temperature_2m}: ${status}`
                return this.div

            }
            tempe.addTo(map)

        })
}

let dot = document.getElementById('dot')
dot.addEventListener('click', showdots)
let is_hidden = true

function showdots() {
    if (is_hidden == true) {
        L.marker([40.1776, 44.5036]).addTo(map)
            .bindPopup("Yerevan")

        L.marker([40.8136, 44.4883]).addTo(map)
            .bindPopup("Vanadzor")

        L.marker([40.7942, 43.8453]).addTo(map)
            .bindPopup("Gyumri")

        L.marker([40.7420, 43.8614]).addTo(map)
            .bindPopup("Aragatsotn - Ashtarak")

        L.marker([40.5940, 44.3548]).addTo(map)
            .bindPopup("Armavir - Armavir")

        L.marker([39.8723, 44.5769]).addTo(map)
            .bindPopup("Ararat - Artashat")

        L.marker([40.3560, 45.1338]).addTo(map)
            .bindPopup("Gegharkunik - Gavar")

        L.marker([39.5120, 46.3417]).addTo(map)
            .bindPopup("Syunik - Kapan")

        L.marker([40.5187, 44.6746]).addTo(map)
            .bindPopup("Kotayk - Hrazdan")

        L.marker([40.1822, 44.7246]).addTo(map)
            .bindPopup("Kotayk - Abovyan")

        L.marker([39.9461, 44.5331]).addTo(map)
            .bindPopup("Vayots Dzor - Yeghegnadzor")

        L.marker([40.4975, 43.7568]).addTo(map)
            .bindPopup("Shirak - Gyumri")

        L.marker([40.7480, 44.8636]).addTo(map)
            .bindPopup("Tavush - Ijevan")

        L.marker([40.8775, 45.1495]).addTo(map)
            .bindPopup("Lori - Vanadzor")

        dot.innerText = 'Hide Cities'
        is_hidden = false
    }
    else {
        location.reload()
        dot.innerText = 'Show Cities'
        is_hidden = true
    }
}

let charts = document.getElementById('charts')
let response_keys;
let response_values
let chartInstance = null;

charts.addEventListener('click', () => {
    let mapElement = document.getElementById('map')
    let chart = document.getElementById('chart')
    if (chart.hidden) {
        mapElement.hidden = true
        chart.hidden = false
        charts.innerText = 'Show map'
        charts.setAttribute('aria-pressed', 'true')
        loadchart()
    }
    else {
        mapElement.hidden = false
        chart.hidden = true
        charts.innerText = 'Show charts'
        charts.setAttribute('aria-pressed', 'false')
        map.invalidateSize()
    }
})

function loadchart() {
    const ctx = document.getElementById('myChart');

    if(chartInstance) {
        chartInstance.destroy()
        chartInstance = null;
    }

    fetch(`data/${currentMode}.json`)
        .then((data) => data.json())
        .then((response) => {
            response_keys = Object.keys(response)
            response_values = Object.values(response)
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: response_keys,
                    datasets: [{
                        label: currentMode,
                        data: response_values,
                        backgroundColor: currentMode === 'population' ? '#176b60' : '#7960b2',
                        borderRadius: 5,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        )
}

