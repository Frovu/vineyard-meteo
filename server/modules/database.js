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

module.exports = {
	authorize,
	insertData
};
