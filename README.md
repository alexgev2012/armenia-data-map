# Armenia Data Map

**A regional perspective on Armenia.** Explore population and school counts on an interactive map, compare regions in a bar chart, and check the temperature in Yerevan.

Plain web technologies. No build step. No package installation.

## Explore

- **Three metrics** — explore population, school counts, and schools per 10,000 residents across Armenia's 10 provinces and Yerevan.
- **Interactive map** — pan, zoom, and hover over regions to see their values.
- **Region details** — click a region to see all three metrics together, or open it from the values table.
- **Regional comparisons** — sort horizontal bar charts by highest value, lowest value, or region name; inspect the same values in a table.
- **Location search** — find any region or one of 12 included cities, then zoom to it. Suggestions distinguish cities from regions with the same name.
- **City markers** — toggle markers without resetting the map or selected dataset.
- **Shareable views** — copy a link preserving the metric, map center and zoom, chart view and sorting, selected region, and city visibility.
- **Map legend** — see the exact color thresholds for the selected metric, including missing data.
- **Yerevan weather** — request the current temperature with its source and observation time.
- **Loading and recovery** — get feedback for failed data, weather, chart-library, and tile requests; retry dataset loading without refreshing.
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
│   ├── schools.json             # School counts by region
│   └── metadata.json            # Source and year labels
├── tests/app.test.cjs           # Node interaction tests
└── LICENSE                      # MIT license
```

## Working with the data

Each dataset is a JSON object mapping a region name to a nonnegative numeric value (or `null` for unavailable data). Map features are matched using their `NAME_1` property. The `keyFor` function in `script.js` translates `Yerevan` to `Erevan` and `Vayots Dzor` to `VayotsDzor`; display labels reverse those aliases.

To update values, edit the corresponding JSON file and reload the page. Color thresholds and labels are defined in `modes` in `script.js`. Thresholds are inclusive at the upper bound, with a separate gray color for missing values.

School rates are calculated as `schools / population * 10000` and displayed with up to two decimal places. A missing or zero population produces "No data"; zero schools is a valid zero. This ratio does not measure school capacity or quality.

The bundled population and school datasets do not include source citations or reference dates. `data/metadata.json` records those fields as unknown, and the interface labels the values as demonstration data. Add a verified source and year there when available. Boundary provenance is also undocumented in the original project.

City coordinates were corrected and duplicate markers removed using [GeoNames Armenia records](https://www.geonames.org/advanced-search.html?country=AM) and the [Gavar record](https://www.geonames.org/616599/gavar.html), accessed September 20, 2026. Coordinates are rounded to five decimal places; GeoNames data is available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This attribution applies to city coordinates, not the bundled regional statistics.

## Sharing a view

The address updates as you explore. Use **Copy view link**, or copy the browser address directly. If clipboard access is unavailable, the app provides a selected text field for manual copying. Recipients must be able to reach the host in the link; deploy the app before sharing beyond your local machine.

## Verification

With Node.js installed, run:

```sh
node --check script.js
node --test tests/app.test.cjs
```

The interaction tests use mocked browser, Leaflet, and Chart.js APIs to cover calculations, chart sorting, search, shared state, missing values, and failed-request recovery. They do not exercise live external services or browser rendering.

## Deployment

Publish the project directory to a static host, preserving the `data/` directory and relative file paths. No build command or server-side configuration is required.

## License

[MIT](LICENSE) · Copyright (c) 2026 alexgev2012.
