const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

global.log = require('./modules/logging.js');

const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support url-encoded

app.use('/api',  require('./modules/api.js'));

app.use(express.static('public'));

app.listen(process.env.PORT, () => global.log(`Listening to port ${process.env.PORT}`));
