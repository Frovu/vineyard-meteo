const Pool = require('pg').Pool;
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});

const devices = {};
async function fetchDevices() {
	const res = await pool.query('SELECT * from devices');
	for (const row of res.rows)
		devices[row.key] = {id: row.id, desc: row.description};
	global.log(`Devices auth keys: ${Object.keys(devices).join()}`);
}
fetchDevices();

const COLUMNS = {
	air_temperature: 't',
	air_humidity: 'h',
	air_pressure: 'p',
	lightness: 'l',
	precipitation_mm: 'pp',
	soil_moisture: 'sm',
	soil_temperature: 'st',
	soil_temperature_2: 'st2',
	rssi: 'rssi',
	voltage: 'v'
};

function authorize(body) {
	return body.dev && devices[body.dev];
}

async function insertData(body) {
	const data = { dev: devices[body.dev].id };
	for (const column in COLUMNS) {
		const value = body[column] || body[COLUMNS[column]];
		if (value)
			data[column] = value;
	}
	const q = `INSERT INTO data (${Object.keys(data)}) VALUES (${Object.keys(data).map((v, i)=>`$${i+1}`)})`;
	await pool.query(q, (Object.values(data)));
}

async function get(params) {
	const fields = typeof params.fields !== 'string' ? []
		: params.fields.split(',').reduce((a, f) => COLUMNS[f] ? a.concat([f]) : a, []);
	if (!fields.length) return null;
	const from = params.from && parseInt(params.from);
	const to = params.to && parseInt(params.to);
	if ((from && (isNaN(from) || from < 0)) || (to && (isNaN(to) || to < 0)))
		return null;
	const q = `SELECT at,${fields.join(',')} FROM data ` + ((from||to)?'WHERE ':'')
		+ (from?`at >= to_timestamp(${from}) `:'') + (to?(from?'AND ':'') + `at < to_timestamp(${to})`:'');
	const res = await pool.query({ rowMode: 'array', text: q});
	return {
		rows: res.rows,
		fields: res.fields.map(f => f.name)
	};
}

module.exports = {
	authorize,
	insertData,
	get
};
