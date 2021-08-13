const express = require('express');
const router = express.Router();
const db = require('./database');

router.get('/data', async (req, res) => {
	try {
		const resp = await db.get(req.query);
		if (resp)
			res.status(200).json(resp);
		else
			res.sendStatus(400);
	} catch (e) {
		global.log(`ERROR: (GET /data) ${e.stack}`);
		return res.sendStatus(500);
	}
});

router.post('/data', async (req, res) => {
	try {
		if (typeof req.body !== 'object')
			return res.sendStatus(400);
		global.log(`Got data: ${JSON.stringify(req.body)}`);
		if (!db.authorize(req.body))
			return res.sendStatus(401);
		await db.insertData(req.body);
		res.sendStatus(200);
	} catch (e) {
		global.log(`ERROR: (POST /data) ${e.stack}`);
		return res.sendStatus(500);
	}
});

module.exports = router;
