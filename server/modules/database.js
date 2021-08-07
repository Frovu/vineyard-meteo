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

async function insertData() {

}

module.exports = {
	insertData
};
