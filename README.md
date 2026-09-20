# Armenia Data Map

**A regional perspective on Armenia.** Explore population and school counts on an interactive map, compare regions in a bar chart, and check the temperature in Yerevan.

Plain web technologies. No build step. No package installation.

## Explore

- **Two datasets** — switch between population and schools across Armenia's 10 provinces and Yerevan.
- **Interactive map** — pan, zoom, and hover over regions to see their values.
- **Regional comparisons** — switch to a bar chart for the selected dataset.
- **City markers** — reveal city locations and click markers for their names.
- **Yerevan weather** — request the current temperature and a descriptive label.
- **Responsive interface** — flexible controls, mobile layouts, and visible keyboard focus.

## Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Structure | HTML5 | Page layout and accessible control labels |
| Styling | CSS3 | Responsive layout, custom properties, and interaction states |
| Logic | Vanilla JavaScript | Dataset switching, Fetch API, and view controls |
| Mapping | Leaflet 1.9.4 | GeoJSON regions, markers, and map interactions |
| Basemap | OpenStreetMap tiles | Geographic context |
| Charts | Chart.js | Regional bar charts |
| Weather | Open-Meteo | Current weather in Yerevan |
| Local data | JSON and GeoJSON | Regional values and boundaries |

Leaflet and Chart.js load from CDNs. Chart.js currently uses an unpinned CDN URL. There is no frontend framework, backend, or bundler.

## Run locally

Serve the project through HTTP so the browser can fetch the local data files. For example, with Python 3 installed, run this from the project directory:

```sh
python -m http.server 8000
```

Open **http://localhost:8000**. On Windows, `py -m http.server 8000` also works when the Python launcher is installed. Any static HTTP server can serve this project.

Internet access is needed for CDN libraries, map tiles, and live weather. No API key is configured in the application.

## Project structure

```text
armenia-data-map/
├── index.html                   # Page layout and CDN dependencies
├── style.css                    # Responsive interface and map control styles
├── script.js                    # Map, dataset, chart, and weather logic
├── data/
│   ├── armenia-simple.geojson    # Regional boundaries
│   ├── population.json          # Population by region
│   └── schools.json             # School counts by region
└── LICENSE                      # MIT license
```

## Working with the data

Each dataset is a JSON object mapping a region name to a numeric value. Map features are matched using their `NAME_1` property. The `nameMap` object in `script.js` translates `Yerevan` to `Erevan` and `Vayots Dzor` to `VayotsDzor` to match the dataset keys.

To update values, edit the corresponding JSON file and reload the page. Color thresholds are defined in `getPopulationColor` and `getSchoolColor` in `script.js`.

The bundled datasets do not include source citations or reference dates. Treat them as demonstration data until their provenance has been verified. City markers are hard-coded in `script.js`; hiding them currently reloads the page and resets the view.

## Deployment

Publish the project directory to a static host, preserving the `data/` directory and relative file paths. No build command or server-side configuration is required.

## License

[MIT](LICENSE) · Copyright (c) 2026 alexgev2012.
