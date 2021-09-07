import uPlot from './uPlot.iife.min.js';

let uplot;

function getSize() {
	return {
		width: window.innerWidth - 100,
		height: window.innerHeight - 300,
	};
}

const FIELDS = ['air_temperature', 'air_humidity', 'air_pressure', 'lightness', 'precipitation_mm'];
const DARK_GRAY = 'rgba(255,255,255,0.1)';
const GRAY = 'rgba(255,255,255,0.5)';

function drawPlot(data, fields) {
	uplot = new uPlot({
		...getSize(),
		series: [
			{},
			{
				label: 'Temperature',
				scale: '°C',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' °C',
				stroke: 'rgba(0,255,255,1)',
			},
			{
				label: 'Humidity',
				scale: '%',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' %',
				stroke: 'rgba(0,255,100,1)',
			},
			{
				label: 'Pressure',
				scale: 'mb',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' mb',
				stroke: 'rgba(255,0,125,1)',
				show: false
			},
			{
				label: 'Lightness',
				scale: 'lx',
				value: (u, v) => v == null ? '-' : v.toFixed(0) + ' lx',
				stroke: 'rgba(255,255,255,1)',
			},
			{
				label: 'Precipitation',
				scale: 'mm',
				value: (u, v) => v == null ? '-' : v.toFixed(1) + ' mm',
				stroke: 'rgba(100,0,255,1)',
				show: false
			},
		],
		axes: [
			{
				grid: { stroke: 'rgba(255,255,255,0.07)' }
			},
			{
				stroke: GRAY,
				scale: '°C',
				values: (u, vals) => vals.map(v => v.toFixed(0) + ' °C'),
				ticks: { stroke: DARK_GRAY, width: 1 },
				grid:  { stroke: DARK_GRAY, width: 1 }
			},
			{
				stroke: GRAY,
				side: 1,
				scale: '%',
				values: (u, vals) => vals.map(v => v.toFixed(0) + ' %'),
				ticks: { stroke: DARK_GRAY, width: 1 },
				grid:  { stroke: DARK_GRAY, width: 1 }
			},
		],
		legend: {
			stroke: 'rgba(255,255,255,0.5)'
		}
	}, data, document.body);
	window.addEventListener('resize', () => {
		uplot.setSize(getSize());
	});
}

function encodeParams(obj) {
	const keys = Object.keys(obj);
	return keys.length ? '?' + keys.map(k => `${k}=${obj[k]}`).join('&') : '';
}

function resetInputs() {
	const then = new Date(Date.now() - 3600000*24*3);
	document.getElementById('from').value = then.toISOString().replace(/T.*/, '');
	document.getElementById('to').value = '2077-1-1';
}

async function update() {
	const from = new Date(document.getElementById('from').value);
	const to   = new Date(document.getElementById('to').value);
	if (isNaN(from) || isNaN(to))
		return resetInputs();
	const params = {
		fields: FIELDS.join(','),
		from: from.getTime()/1000,
		to: to.getTime()/1000,
		resolution: 1,
	};
	console.time('query');
	const resp = await fetch(`api/data${encodeParams(params)}`, { method: 'GET' });
	console.timeEnd('query');
	if (resp.status !== 200)
		return console.log('Failed to fetch data', resp.status);
	console.time('prepare');
	const data = await resp.json();
	let plotData = data.fields.map(()=>Array(data.rows.length));
	for (let i = 0; i < data.rows.length; ++i) {
		const row = data.rows[i];
		plotData[0][i] = new Date(row[0]).getTime()/1000;
		for (let j = 1; j < row.length; ++j) {
			plotData[j][i] = row[j];
		}
	}
	console.timeEnd('prepare');
	console.time('plot');
	if (uplot) {
		uplot.setData(plotData);
	} else {
		drawPlot(plotData, data.fields);
	}
	console.timeEnd('plot');
	return true;
}

update().then(ok => {
	if (!ok) update();
});

document.getElementById('plotbtn').onclick = update;
for (const id of ['from', 'to']) {
	document.getElementById(id).onkeypress = e => {
		if (e.keyCode === 13)
			update();
	};

}
