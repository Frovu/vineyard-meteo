const express = require('express');
const router = express.Router();
const db = require('./database');

router.post('/data', async (req, res) => {
	res.sendStatus(504);
});

module.exports = router;
