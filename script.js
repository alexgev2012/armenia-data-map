(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chartAnimation = () => motionPreference.matches ? false : { duration: 450, easing: 'easeOutQuart' };
  const modes = {
    population: { label: 'Population', breaks: [100000, 150000, 200000, 300000, 800000], colors: ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#31a354', '#006d2c'] },
    schools: { label: 'Schools', breaks: [100, 150, 200, 250, 300], colors: ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f'] },
    schoolRate: { label: 'Schools per 10,000 residents', breaks: [4, 6, 8, 10, 12], colors: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'] }
  };
  const keyFor = (name) => ({ Yerevan: 'Erevan', 'Vayots Dzor': 'VayotsDzor' }[name] || name);
  const displayName = (name) => ({ Erevan: 'Yerevan', VayotsDzor: 'Vayots Dzor' }[name] || name);
  const params = new URLSearchParams(location.hash.slice(1));
  let mode = Object.hasOwn(modes, params.get('dataset')) ? params.get('dataset') : 'population';
  let view = params.get('view') === 'chart' ? 'chart' : 'map';
  let sort = ['asc', 'desc', 'name'].includes(params.get('sort')) ? params.get('sort') : 'desc';
  let selected = params.get('region') || '';
  let citiesVisible = params.get('cities') === '1';
  let data, metadata, geoLayer, chart, ready = false;
  const regionLayers = new Map();
  // City coordinates: GeoNames (see README for attribution).
  const cities = [
    { name: 'Yerevan', region: 'Erevan', coords: [40.17765, 44.51260] },
    { name: 'Vanadzor', region: 'Lori', coords: [40.80740, 44.49704] },
    { name: 'Gyumri', region: 'Shirak', coords: [40.79305, 43.84635] },
    { name: 'Ashtarak', region: 'Aragatsotn', coords: [40.29760, 44.36152] },
    { name: 'Armavir', region: 'Armavir', coords: [40.15553, 44.03880] },
    { name: 'Artashat', region: 'Ararat', coords: [39.95484, 44.54874] },
    { name: 'Gavar', region: 'Gegharkunik', coords: [40.35398, 45.12386] },
    { name: 'Kapan', region: 'Syunik', coords: [39.20762, 46.40678] },
    { name: 'Hrazdan', region: 'Kotayk', coords: [40.51690, 44.75591] },
    { name: 'Abovyan', region: 'Kotayk', coords: [40.27170, 44.63342] },
    { name: 'Yeghegnadzor', region: 'VayotsDzor', coords: [39.76440, 45.33268] },
    { name: 'Ijevan', region: 'Tavush', coords: [40.88037, 45.14776] }
  ];
  const numberParam = (key, fallback, min, max) => {
    const raw = params.get(key);
    const value = raw === null || raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  };
  const controls = [...document.querySelectorAll('.data_t'), $('charts'), $('dot'), $('location-search'), $('search-form').querySelector('button')];
  controls.forEach((button) => { button.disabled = true; });
  if (!window.L) {
    $('app-status').textContent = 'The map library could not load. Check your connection and reload this page.';
    return;
  }
  const map = L.map('map', { minZoom: 3, maxZoom: 18, zoomAnimation: !motionPreference.matches, fadeAnimation: !motionPreference.matches, markerZoomAnimation: !motionPreference.matches }).setView([
    numberParam('lat', 40.2, -85, 85), numberParam('lng', 44.5, -180, 180)
  ], numberParam('zoom', 7, 3, 18));
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19
  }).addTo(map);
  tiles.on('tileerror', () => { $('tile-status').textContent = 'Some background tiles could not load. Regional data is still available; pan or zoom to retry tiles.'; });
  tiles.on('loading', () => { $('tile-status').textContent = ''; });
  const cityLayer = L.layerGroup();
  cities.forEach((city) => {
    city.marker = L.marker(city.coords).bindPopup(city.name, { autoPan: false }).addTo(cityLayer);
    city.marker.on('click', () => selectRegion(city.region));
  });

  motionPreference.addEventListener('change', () => {
    map.stop();
    map.options.zoomAnimation = !motionPreference.matches;
    map.options.fadeAnimation = !motionPreference.matches;
    map.options.markerZoomAnimation = !motionPreference.matches;
    if (chart) {
      chart.stop();
      chart.options.animation = chartAnimation();
      chart.update('none');
    }
  });

  async function fetchJSON(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  function valueFor(key, dataset = mode) {
    const population = data.population[key];
    const schools = data.schools[key];
    if (dataset === 'schoolRate') return Number.isFinite(population) && population > 0 && Number.isFinite(schools) ? schools / population * 10000 : null;
    const value = data[dataset][key];
    return Number.isFinite(value) ? value : null;
  }
  function format(value, dataset = mode) {
    return value === null ? 'No data' : value.toLocaleString('en-US', { maximumFractionDigits: dataset === 'schoolRate' ? 2 : 0 });
  }
  function colorFor(value) {
    if (value === null) return '#cbd5dc';
    const { breaks, colors } = modes[mode];
    const index = breaks.findIndex((limit) => value <= limit);
    return colors[index === -1 ? colors.length - 1 : index];
  }
  function regionStyle(feature) {
    const key = keyFor(feature.properties.NAME_1);
    return { fillColor: colorFor(valueFor(key)), fillOpacity: 0.78, weight: selected === key ? 3 : 1, color: selected === key ? '#172c38' : '#64776f' };
  }
  function saveView() {
    if (!ready) return;
    const center = map.getCenter();
    const state = new URLSearchParams({ dataset: mode, view, sort, lat: center.lat.toFixed(5), lng: center.lng.toFixed(5), zoom: String(map.getZoom()), cities: citiesVisible ? '1' : '0' });
    if (selected) state.set('region', selected);
    history.replaceState(null, '', `${location.pathname}${location.search}#${state}`);
    $('share-link').hidden = true;
  }
  map.on('moveend', saveView);

  function renderDetails() {
    $('region-details').hidden = !selected;
    if (!selected) return;
    $('region-title').textContent = displayName(selected);
    $('region-values').replaceChildren();
    for (const dataset of Object.keys(modes)) {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = modes[dataset].label;
      value.textContent = format(valueFor(selected, dataset), dataset);
      group.append(term, value);
      $('region-values').append(group);
    }
  }
  function selectRegion(key, focus = true) {
    selected = key;
    renderDetails();
    geoLayer.setStyle(regionStyle);
    if (focus) {
      $('region-title').focus({ preventScroll: true });
      $('region-details').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'nearest' });
    }
    saveView();
  }
  function renderLegend() {
    const { label, breaks, colors } = modes[mode];
    $('legend').replaceChildren();
    const title = document.createElement('strong');
    title.textContent = label;
    $('legend').append(title);
    [...colors, '#cbd5dc'].forEach((color, index) => {
      const item = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.style.backgroundColor = color;
      swatch.setAttribute('aria-hidden', 'true');
      const range = index === colors.length ? 'No data' : index === 0 ? `0 - ${format(breaks[0])}` : index === breaks.length ? `> ${format(breaks[index - 1])}` : `> ${format(breaks[index - 1])} - ${format(breaks[index])}`;
      item.append(swatch, document.createTextNode(range));
      $('legend').append(item);
    });
  }
  function rows() {
    return [...regionLayers.keys()].map((key) => ({ key, name: displayName(key), value: valueFor(key) })).sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'en');
      if (a.value === null) return b.value === null ? a.name.localeCompare(b.name) : 1;
      if (b.value === null) return -1;
      return (sort === 'asc' ? a.value - b.value : b.value - a.value) || a.name.localeCompare(b.name, 'en');
    });
  }
  function renderComparison() {
    const values = rows();
    $('table-caption').textContent = modes[mode].label;
    $('table-body').replaceChildren();
    values.forEach((row) => {
      const tr = document.createElement('tr');
      const name = document.createElement('th');
      name.scope = 'row';
      const button = document.createElement('button');
      button.textContent = row.name;
      button.addEventListener('click', () => selectRegion(row.key));
      name.append(button);
      const value = document.createElement('td');
      value.textContent = format(row.value);
      tr.append(name, value);
      $('table-body').append(tr);
    });
    if (view !== 'chart') {
      if (chart) chart.stop();
      return;
    }
    if (!window.Chart) {
      $('app-status').textContent = 'The chart library could not load. Use the regional values table below, or reload to retry.';
      return;
    }
    $('app-status').textContent = '';
    $('myChart').setAttribute('aria-label', `${modes[mode].label} by region. Values are available in the table below.`);
    const onChartClick = (_event, items) => { if (items.length) selectRegion(values[items[0].index].key); };
    if (chart) {
      chart.data.labels = values.map((row) => row.name);
      Object.assign(chart.data.datasets[0], { label: modes[mode].label, data: values.map((row) => row.value), backgroundColor: modes[mode].colors[4] });
      chart.options.onClick = onChartClick;
      chart.options.animation = chartAnimation();
      chart.resize();
      chart.update(motionPreference.matches ? 'none' : undefined);
      return;
    }
    chart = new Chart($('myChart'), {
      type: 'bar',
      data: { labels: values.map((row) => row.name), datasets: [{ label: modes[mode].label, data: values.map((row) => row.value), backgroundColor: modes[mode].colors[4], borderRadius: 4 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: chartAnimation(), scales: { x: { beginAtZero: true } }, plugins: { tooltip: { callbacks: { label: (context) => `${modes[mode].label}: ${format(context.raw)}` } } }, onClick: onChartClick }
    });
  }
  function renderSource() {
    const names = mode === 'schoolRate' ? ['population', 'schools'] : [mode];
    const labels = names.map((name) => `${modes[name].label}: source ${metadata[name]?.source || 'Not provided'}; year ${metadata[name]?.year || 'Not provided'}.`);
    $('data-source').textContent = `${labels.join(' ')} Demonstration data; provenance has not been verified.${mode === 'schoolRate' ? ' Rate = schools / population × 10,000. This is a count ratio, not a measure of school quality or capacity.' : ''}`;
  }
  function render() {
    document.querySelectorAll('.data_t').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.type === mode)));
    $('map').hidden = view !== 'map';
    $('chart').hidden = view !== 'chart';
    $('legend').hidden = view !== 'map';
    $('sort-control').hidden = view !== 'chart';
    $('chart-sort').value = sort;
    $('charts').textContent = view === 'chart' ? 'Show map' : 'Show charts';
    $('charts').setAttribute('aria-pressed', String(view === 'chart'));
    $('dot').textContent = citiesVisible ? 'Hide cities' : 'Show cities';
    $('dot').setAttribute('aria-pressed', String(citiesVisible));
    if (citiesVisible) cityLayer.addTo(map); else map.removeLayer(cityLayer);
    geoLayer.setStyle(regionStyle);
    regionLayers.forEach((layer, key) => layer.setTooltipContent(`${displayName(key)}: ${format(valueFor(key))}`));
    renderLegend();
    renderDetails();
    renderComparison();
    renderSource();
    if (view === 'map') map.invalidateSize();
    saveView();
  }
  async function loadData() {
    $('app-status').textContent = 'Loading regional data...';
    $('retry').hidden = true;
    try {
      const [geodata, population, schools, meta] = await Promise.all([
        fetchJSON('data/armenia-simple.geojson'), fetchJSON('data/population.json'), fetchJSON('data/schools.json'), fetchJSON('data/metadata.json')
      ]);
      for (const dataset of [population, schools]) {
        if (!dataset || Array.isArray(dataset) || typeof dataset !== 'object' || Object.values(dataset).some((value) => value !== null && (!Number.isFinite(value) || value < 0))) throw new Error('Invalid dataset');
      }
      if (!Array.isArray(geodata.features) || !geodata.features.length) throw new Error('Invalid boundaries');
      data = { population, schools };
      metadata = meta || {};
      geoLayer = L.geoJSON(geodata, {
        style: regionStyle,
        onEachFeature(feature, layer) {
          const key = keyFor(feature.properties.NAME_1);
          regionLayers.set(key, layer);
          layer.bindTooltip(displayName(key));
          layer.on({ click: () => selectRegion(key), mouseover: () => layer.setStyle({ fillOpacity: 0.95 }), mouseout: () => geoLayer.resetStyle(layer) });
        }
      }).addTo(map);
      if (!regionLayers.has(selected)) selected = '';
      $('locations').replaceChildren();
      const options = [...regionLayers.keys()].map((key) => `${displayName(key)} (region)`).concat(cities.map((city) => `${city.name} (city)`));
      options.sort().forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        $('locations').append(option);
      });
      ready = true;
      controls.forEach((button) => { button.disabled = false; });
      $('app-status').textContent = '';
      render();
    } catch (error) {
      $('app-status').textContent = 'Regional data could not load. Check your connection and serve this folder over HTTP, then retry.';
      $('retry').hidden = false;
    }
  }
  document.querySelectorAll('.data_t').forEach((button) => button.addEventListener('click', () => { mode = button.dataset.type; render(); }));
  $('charts').addEventListener('click', () => { view = view === 'map' ? 'chart' : 'map'; render(); });
  $('chart-sort').addEventListener('change', (event) => { sort = event.target.value; renderComparison(); saveView(); });
  $('dot').addEventListener('click', () => { citiesVisible = !citiesVisible; render(); });
  $('close-details').addEventListener('click', () => { selected = ''; render(); $('location-search').focus(); });
  $('retry').addEventListener('click', loadData);
  $('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = $('location-search').value.trim().toLowerCase();
    const city = cities.find((item) => query === `${item.name.toLowerCase()} (city)` || query === item.name.toLowerCase());
    const key = [...regionLayers.keys()].find((item) => [item.toLowerCase(), displayName(item).toLowerCase(), `${displayName(item).toLowerCase()} (region)`].includes(query));
    if (!city && !key) { $('action-status').textContent = 'No match. Choose a region or city from the search suggestions.'; return; }
    view = 'map';
    if (city) citiesVisible = true;
    render();
    map.stop();
    if (city) {
      if (motionPreference.matches) map.setView(city.coords, 11, { animate: false });
      else map.flyTo(city.coords, 11, { duration: 0.85 });
      city.marker.openPopup();
      selectRegion(city.region);
    } else {
      const boundsOptions = { padding: [24, 24], maxZoom: 11, duration: 0.85, animate: !motionPreference.matches };
      if (motionPreference.matches) map.fitBounds(regionLayers.get(key).getBounds(), boundsOptions);
      else map.flyToBounds(regionLayers.get(key).getBounds(), boundsOptions);
      selectRegion(key);
    }
    $('action-status').textContent = `Showing ${city ? city.name : displayName(key)}.`;
  });
  $('share').addEventListener('click', async () => {
    saveView();
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      $('action-status').textContent = 'View link copied.';
    } catch {
      $('share-link').value = url;
      $('share-link').hidden = false;
      $('share-link').focus();
      $('share-link').select();
      $('action-status').textContent = 'Copy the selected view link below.';
    }
  });
  $('weather').addEventListener('click', async () => {
    $('weather').disabled = true;
    $('weather-status').textContent = 'Loading Yerevan temperature...';
    try {
      const weather = await fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=40.1792&longitude=44.4991&current=temperature_2m&temperature_unit=celsius');
      const temperature = weather.current?.temperature_2m;
      if (!Number.isFinite(temperature)) throw new Error('Missing temperature');
      $('weather-status').textContent = `Yerevan: ${temperature} °C. Source: Open-Meteo; observation ${weather.current.time || 'time unavailable'} (GMT).`;
    } catch {
      $('weather-status').textContent = 'Weather could not load. Select the temperature button to retry.';
    } finally { $('weather').disabled = false; }
  });
  loadData();
})();
