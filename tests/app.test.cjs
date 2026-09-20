const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

class Element {
  constructor() { this.children = []; this.events = {}; this.attrs = {}; this.style = {}; this.hidden = false; this.value = ''; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(event, handler) { this.events[event] = handler; }
  async fire(event, extra = {}) { await this.events[event]?.({ target: this, preventDefault() {}, ...extra }); await flush(); }
  focus() { this.focused = true; }
  scrollIntoView(options) { this.scrollOptions = options; }
  select() { this.selected = true; }
  querySelector() { return this.button ||= new Element(); }
}
async function boot({ hash = '', fail = '', overrides = {}, noChart = false, reducedMotion = false } = {}) {
  const nodes = {};
  const get = id => nodes[id] ||= new Element();
  const buttons = ['population', 'schools', 'schoolRate'].map(type => Object.assign(new Element(), {dataset: {type}}));
  const location = new URL(`http://localhost:8000/${hash}`);
  const layers = new Map();
  const charts = [];
  const motion = { matches: reducedMotion, addEventListener(_event, handler) { this.change = handler; } };
  const map = { center: {}, zoom: 7, events: {}, added: new Set(), resizeCount: 0, options: {},
    stop() {}, flyTo(coords, zoom) { this.flew = true; return this.setView(coords, zoom); }, flyToBounds(bounds) { this.flew = true; this.fitBounds(bounds); },
    setView(coords, zoom) { this.center = {lat: coords[0], lng: coords[1]}; this.zoom = zoom; this.events.moveend?.(); return this; },
    getCenter() { return this.center; }, getZoom() { return this.zoom; }, on(event, fn) { this.events[event] = fn; },
    removeLayer(layer) { this.added.delete(layer); }, invalidateSize() { this.resizeCount++; }, fitBounds(bounds) { this.bounds = bounds; }
  };
  const markers = [];
  const L = {
    map: () => map,
    tileLayer: () => ({addTo(){return this;},on(){return this;}}),
    layerGroup: () => ({addTo(){map.added.add(this);return this;}}),
    marker: coords => { const marker = {coords,bindPopup(){return this;},addTo(){return this;},on(){},openPopup(){this.opened=true;}}; markers.push(marker);return marker; },
    geoJSON: (geo, config) => {
      geo.features.forEach(feature => {
        const layer = {feature, events: {}, bindTooltip(){return this;},setTooltipContent(text){this.tooltip=text;},on(events){this.events=events;},setStyle(style){this.style=style;},getBounds(){return feature.properties.NAME_1;}};
        layers.set(feature.properties.NAME_1, layer);
        config.onEachFeature(feature,layer);
      });
      return { addTo(){return this;},setStyle(style){layers.forEach(layer=>layer.setStyle(style(layer.feature)));},resetStyle(layer){layer.setStyle(config.style(layer.feature));} };
    }
  };
  const context = { URLSearchParams, AbortController, setTimeout, clearTimeout, console, location,
    history: {replaceState(_a,_b,url){location.href=new URL(url,location).href;}},
    navigator: {}, document: {getElementById:get,querySelectorAll:()=>buttons,createElement:()=>new Element(),createTextNode:text=>text},
    L, window:{L, matchMedia: () => motion}, fetch: async url => {
      if (fail && url.includes(fail)) return {ok:false,status:503};
      return {ok:true,json:async()=> overrides[url] ?? JSON.parse(fs.readFileSync(path.join(root,url),'utf8'))};
    }
  };
  if (!noChart) context.Chart = context.window.Chart = function(_canvas, config) { this.config=config; this.data=config.data; this.options=config.options; this.resize=()=>{}; this.stop=()=>{}; this.update=mode=>{this.updateMode=mode;}; this.destroy=()=>{this.destroyed=true;};charts.push(this); };
  vm.runInNewContext(source, context);
  await flush();
  return {get, buttons, map, markers, layers, charts, location, context, motion, recover(){fail='';}};
}

test('loads all regions, legend, provenance, and correct rate calculations', async () => {
  const app = await boot();
  assert.equal(app.get('app-status').textContent, '');
  assert.equal(app.get('table-body').children.length, 11);
  assert.equal(app.get('legend').children.length, 8);
  assert.match(app.get('data-source').textContent, /year Not provided/);
  await app.buttons[2].fire('click');
  app.layers.get('Erevan').events.click();
  const values = app.get('region-values').children.map(group=>group.children[1].textContent);
  assert.deepEqual(values, ['1,070,000','420','3.93']);
  assert.equal(app.get('region-title').textContent,'Yerevan');
  assert.equal(app.get('region-details').hidden,false);
});

test('chart opens on first click and sorts numerically in both directions', async () => {
  const app = await boot();
  await app.get('charts').fire('click');
  assert.equal(app.get('map').hidden,true);
  assert.equal(app.charts.at(-1).config.data.labels[0],'Yerevan');
  app.get('chart-sort').value='asc';
  await app.get('chart-sort').fire('change');
  assert.equal(app.charts.at(-1).config.data.labels[0],'Vayots Dzor');
  await app.buttons[1].fire('click');
  assert.equal(app.charts.at(-1).config.data.datasets[0].label,'Schools');
  assert.equal(app.charts.length,1, 'dataset and sort changes reuse the chart');
  app.charts[0].options.onClick(null, [{index: 0}]);
  assert.equal(app.get('region-title').textContent,'Vayots Dzor', 'chart clicks use the latest ordering');
  await app.get('charts').fire('click');
  assert.equal(app.get('map').hidden,false);
  assert.ok(app.map.resizeCount>0);
});

test('motion preferences disable animation and update without recreating the chart', async () => {
  const app = await boot({reducedMotion: true});
  await app.get('charts').fire('click');
  assert.equal(app.charts[0].options.animation,false);
  await app.buttons[1].fire('click');
  assert.equal(app.charts[0].updateMode,'none');
  app.get('location-search').value='Gyumri';
  await app.get('search-form').fire('submit');
  assert.equal(app.map.flew,undefined);
  assert.equal(app.get('region-details').scrollOptions.behavior,'instant');
  app.motion.matches=false;
  app.motion.change();
  assert.equal(app.charts[0].options.animation.duration,450);
  assert.equal(app.charts.length,1);
});

test('search distinguishes regions and cities and marker toggle preserves state', async () => {
  const app = await boot();
  app.get('location-search').value='Armavir (region)';
  await app.get('search-form').fire('submit');
  assert.equal(app.map.bounds,'Armavir');
  app.get('location-search').value='Gyumri';
  await app.get('search-form').fire('submit');
  assert.equal(app.map.zoom,11);
  assert.equal(app.get('region-title').textContent,'Shirak');
  assert.ok(app.markers.some(marker=>marker.opened));
  await app.get('dot').fire('click');
  assert.equal(app.map.added.size,0);
  assert.match(app.location.hash,/region=Shirak/);
  app.get('location-search').value='Unknown';
  await app.get('search-form').fire('submit');
  assert.match(app.get('action-status').textContent,/No match/);
});

test('shared URL restores view, dataset, sorting, selected region, and position', async () => {
  const app = await boot({hash:'#dataset=schoolRate&view=chart&sort=asc&lat=40.8&lng=44.8&zoom=10&cities=1&region=Lori'});
  assert.equal(app.get('map').hidden,true);
  assert.equal(app.get('region-title').textContent,'Lori');
  assert.equal(app.buttons[2].attrs['aria-pressed'],'true');
  assert.equal(app.map.center.lat,40.8);
  assert.equal(app.map.zoom,10);
  assert.equal(app.get('chart-sort').value,'asc');
  await app.get('share').fire('click');
  assert.equal(app.get('share-link').hidden,false);
  assert.equal(app.get('share-link').value,app.location.href);
  assert.equal(app.get('share-link').selected,true);
});

test('invalid shared state falls back to safe defaults', async () => {
  const app = await boot({hash:'#dataset=__proto__&lat=bad&lng=999&zoom=-1&region=missing'});
  assert.equal(app.map.center.lat,40.2);
  assert.equal(app.map.center.lng,44.5);
  assert.equal(app.map.zoom,7);
  assert.equal(app.get('region-details').hidden,true);
  assert.equal(app.buttons[0].attrs['aria-pressed'],'true');
});

test('missing population gives no rate; zero schools remains a valid zero', async () => {
  const population = JSON.parse(fs.readFileSync(path.join(root,'data/population.json')));
  const schools = JSON.parse(fs.readFileSync(path.join(root,'data/schools.json')));
  population.Erevan = 0;
  schools.Lori = 0;
  const app = await boot({overrides:{'data/population.json':population,'data/schools.json':schools}});
  await app.buttons[2].fire('click');
  assert.match(app.layers.get('Erevan').tooltip,/No data/);
  assert.match(app.layers.get('Lori').tooltip,/: 0$/);
});

test('failed loading offers retry and recovers', async () => {
  const app = await boot({fail:'population.json'});
  assert.match(app.get('app-status').textContent,/could not load/);
  assert.equal(app.get('retry').hidden,false);
  assert.equal(app.buttons[0].disabled,true);
  app.recover();
  await app.get('retry').fire('click');
  assert.equal(app.get('app-status').textContent,'');
  assert.equal(app.buttons[0].disabled,false);
});

test('weather failure is recoverable and chart CDN failure leaves the table available', async () => {
  const app = await boot({fail:'open-meteo',noChart:true});
  await app.get('weather').fire('click');
  assert.match(app.get('weather-status').textContent,/could not load/);
  assert.equal(app.get('weather').disabled,false);
  await app.get('charts').fire('click');
  assert.match(app.get('app-status').textContent,/chart library/);
  assert.equal(app.get('table-body').children.length,11);
});
