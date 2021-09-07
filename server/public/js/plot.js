import uPlot from './uPlot.iife.min.js';

const COLORS = {
	air_temperature: '#00ffff',
	air_humidity: '#ff44ff',
	air_pressure: '#33ff66',
	lightness: '#ffffff',
	precipitation_mm: '#4444ff'
};

function updatePlot(data, fields) {
	console.log(data);
	const opts = {
		title: 'Vineyard Meteo',
		width: 1280,
		height: 600,
		//	ms:     1,
		//	cursor: {
		//		x: false,
		//		y: false,
		//	},
		series: [
			{},
			{
				label: 'Lightness',
				scale: 'lx',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' lx',
				stroke: '#ffffff',
				width: 1/devicePixelRatio,
			},
			{
				label: 'Temperature',
				scale: '°C',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' °C',
				stroke: '#00ffff',
				width: 1/devicePixelRatio,
			}
		],
		axes: [
			{ grid: { stroke: 'rgba(255,255,255,0.07)' } },
			{
				stroke: 'rgba(255,255,255,0.5)',
				scale: '°C',
				values: (u, vals, space) => vals.map(v => +v.toFixed(1) + ' °C'),
				ticks: { stroke: 'rgba(255,255,255,0.07)' },
				grid: { stroke: 'rgba(255,255,255,0.07)' }
			},
			{
				stroke: 'rgba(255,255,255,0.5)',
				side: 1,
				scale: 'lx',
				values: (u, vals, space) => vals.map(v => +v.toFixed(1) + ' lx'),
				ticks: { stroke: 'rgba(255,255,255,0.1)' },
				grid: { stroke: 'rgba(255,255,255,0.1)', show: false }
			},
		],
		legend: {
			stroke: 'rgba(255,255,255,0.5)'
		}
	};

	let uplot = new uPlot(opts, data, document.body);
	return uplot;
}

function encodeParams(obj) {
	const keys = Object.keys(obj);
	return keys.length ? '?' + keys.map(k => `${k}=${obj[k]}`).join('&') : '';
}

async function update() { // eslint-disable-line
	const params = {
		fields: Object.keys(COLORS).join(','),
		from: Math.floor(Date.now()/1000 - 3600*24*7),
		resolution: 60,
	};
	const resp = await fetch(`api/data${encodeParams(params)}`, { method: 'GET' });
	if (resp.status !== 200)
		return console.log('Failed to fetch data', resp.status);
	const data = await resp.json();
	let plotData = data.fields.map(()=>Array(data.rows.length));
	// for (const f of data.fields) {
	// 	idx[f] = data.fields.indexOf(f);
	// }
	for (let i = 0; i < data.rows.length; ++i) {
		const row = data.rows[i];
		plotData[0][i] = new Date(row[0]).getTime()/1000;
		for (let j = 1; j < row.length; ++j) {
			plotData[j][i] = row[j];
		}
	}
	updatePlot(plotData, data.fields);
}

update();
