let plot;

const COLORS = {
	air_temperature: '#00ffff',
	air_humidity: '#ff44ff',
	air_pressure: '#33ff66',
	lightness: '#ffffff',
	precipitation_mm: '#4444ff'
};

function updatePlot(data, fields) {
	if (!plot) {
		const canvas = document.getElementById('plot');
		plot = new Chart(canvas, { // eslint-disable-line
			type: 'line',
			data: { },
			options: {
				legend: {
					display: true,
					position: 'top'
				},
				scales: {
					xAxes: [{
						display: true,
						type: 'time',
						distribution: 'series'
					}]
				}
			}
		});
	}
	const getHidden = (set) => set && (set._meta[0].hidden !== null ? set._meta[0].hidden : set.hidden);
	plot.data.datasets = fields.map((f, i) => {
		console.log(f, getHidden(plot.data.datasets[i]), plot.data.datasets[i]);
		return {
			label: f,
			data: data[f],
			borderColor: COLORS[f],
			fill: false,
			yAxisID: `${f}-y-axis`,
			hidden: plot.data.datasets[i] ? getHidden(plot.data.datasets[i]) : f.startsWith('air'),
		};
	});
	plot.options.scales.yAxes = fields.map(f => {return {
		id: `${f}-y-axis`,
		type: 'linear',
		display: false
	};});
	plot.update({
		duration: 800
	});
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
	const plotData = {}; const idx = {};
	for (const f of data.fields) {
		plotData[f] = [];
		idx[f] = data.fields.indexOf(f);
	}
	for (const r of data.rows) {
		for (const f of data.fields) {
			plotData[f].push({t: r[0], y: r[idx[f]]});
		}
	}
	updatePlot(plotData, data.fields);
}

update();
