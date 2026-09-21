<div align="center">

# 🇦🇲 Armenia Data Map

### A regional perspective on Armenia, powered by Leaflet, Chart.js and Open-Meteo

Explore population and school counts on an interactive map, compare regions in a bar chart, and check the current temperature in Yerevan — no build step, no backend, no package installation.

---

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</div>

---

# 📖 Overview

Armenia Data Map is a lightweight, framework-free web app for looking at Armenia one region at a time. It renders the 10 provinces and Yerevan as an interactive choropleth, lets you flip between population, school counts, and schools per 10,000 residents, and backs every number up with a sortable bar chart and a plain data table.

There's no server and no build step — just static HTML, CSS, and JavaScript, plus a handful of CDN libraries and local JSON/GeoJSON files.

---

# ✨ Features

## 🗺️ Interactive Map

- Pan, zoom, and hover over any region to see its value
- Choropleth coloring with an explicit legend, including a dedicated color for missing data
- Click a region to open full details, or jump to it from search or the values table

## 📊 Three Metrics

- Population
- School counts
- Schools per 10,000 residents (`schools / population * 10000`, capped at two decimal places)

## 📈 Regional Comparisons

- Horizontal bar chart for the active metric
- Sort by highest value, lowest value, or region name
- The same values are always available in a plain `<table>` for quick scanning

## 🔍 Location Search

- Find any region or one of 12 included cities and zoom straight to it
- Suggestions distinguish cities from regions that share a name

## 📌 City Markers

- Toggle city markers on and off without resetting the map or the selected dataset

## 🔗 Shareable Views

- **Copy view link** captures the metric, map center and zoom, chart view and sort order, selected region, and city visibility
- Falls back to a selectable text field when clipboard access isn't available

## 🌤️ Yerevan Weather

- On-demand current temperature for Yerevan, with its source and observation time

## ♻️ Loading & Recovery

- Clear feedback when dataset, weather, chart-library, or tile requests fail
- Retry dataset loading without a full page refresh

## 📱 Responsive Interface

- Flexible controls and layouts down to mobile widths
- Visible keyboard focus throughout

---

# 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3 (custom properties, responsive layout, interaction states)
- Vanilla JavaScript (Fetch API, no framework)

### Mapping

- Leaflet 1.9.4
- OpenStreetMap tiles

### Charts

- Chart.js (loaded from an unpinned CDN URL)

### Weather

- Open-Meteo (no API key required)

### Data

- Local JSON (`population.json`, `schools.json`, `metadata.json`)
- Local GeoJSON (`armenia-simple.geojson`)

---

# 📸 Screenshots

> Add screenshots here

## Map

![Map](images/map.png)

## Region Details

![Region details](images/region-details.png)

## Charts

![Charts](images/charts.png)

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/alexgev2012/armenia-data-map.git
```

## Navigate to the project

```bash
cd armenia-data-map
```

## Serve it over HTTP

The browser needs to fetch the local `data/` files, so open the page through a server rather than as a `file://` URL. For example, with Python 3 installed:

```bash
python -m http.server 8000
```

On Windows, `py -m http.server 8000` also works when the Python launcher is installed. Any static HTTP server can serve this project.

## Open

```
http://localhost:8000
```

> Internet access is needed for CDN libraries, map tiles, and live weather. No API key is configured in the application.

---

# 📂 Project Structure

```
armenia-data-map/
│
├── index.html                   # Page layout and CDN dependencies
├── style.css                    # Responsive interface and map control styles
├── script.js                    # Map, dataset, chart, and weather logic
│
├── data/
│   ├── armenia-simple.geojson    # Regional boundaries
│   ├── population.json          # Population by region
│   ├── schools.json             # School counts by region
│   └── metadata.json            # Source and year labels
│
├── tests/
│   └── app.test.cjs             # Node interaction tests
│
└── LICENSE                      # MIT license
```

---

# 🗂️ Working with the Data

Each dataset is a JSON object mapping a region name to a nonnegative numeric value (or `null` for unavailable data). Map features are matched using their `NAME_1` property. The `keyFor` function in `script.js` translates `Yerevan` to `Erevan` and `Vayots Dzor` to `VayotsDzor`; display labels reverse those aliases.

To update values, edit the corresponding JSON file and reload the page. Color thresholds and labels are defined in `modes` in `script.js`. Thresholds are inclusive at the upper bound, with a separate gray color for missing values.

A missing or zero population produces "No data" for the school rate; zero schools is a valid zero. This ratio does not measure school capacity or quality.

> **Note on data quality**
> The bundled population and school datasets do not include source citations or reference dates. `data/metadata.json` records those fields as unknown, and the interface labels the values as demonstration data. Add a verified source and year there when available. Boundary provenance is also undocumented in the original project.

City coordinates were corrected and duplicate markers removed using [GeoNames Armenia records](https://www.geonames.org/advanced-search.html?country=AM) and the [Gavar record](https://www.geonames.org/616599/gavar.html), accessed September 20, 2026. Coordinates are rounded to five decimal places; GeoNames data is available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This attribution applies to city coordinates, not the bundled regional statistics.

---

# 🧪 Verification

With Node.js installed, run:

```bash
node --check script.js
node --test tests/app.test.cjs
```

The interaction tests use mocked browser, Leaflet, and Chart.js APIs to cover calculations, chart sorting, search, shared state, missing values, and failed-request recovery. They do not exercise live external services or browser rendering.

---

# ☁️ Deployment

Publish the project directory to a static host, preserving the `data/` directory and relative file paths. No build command or server-side configuration is required.

---

# 🎯 Future Ideas

- [ ] Pin the Chart.js CDN URL to a specific version
- [ ] Verified source citations and reference years for population and school data
- [ ] Documented boundary provenance for the GeoJSON file
- [ ] Additional metrics (e.g. hospitals, income, area)
- [ ] More included cities
- [ ] Localization (Armenian / Russian)
- [ ] Offline-friendly tile caching

---

# 💡 Why I Built This

This project was built to explore data visualization and mapping with plain web technologies — no framework, no bundler, no backend — while giving Armenia's provinces a closer, comparable look through population, education, and weather data.

---

# 🤝 Contributing

Contributions, suggestions and feature requests are welcome!

Feel free to fork the repository and submit a pull request.

---

# ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

It helps a lot and motivates future improvements.

---

<div align="center">

Made with ❤️ using vanilla JavaScript

[MIT](LICENSE) · Copyright (c) 2026 alexgev2012

</div>
