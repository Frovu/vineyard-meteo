```sql
CREATE TABLE data (
	id SERIAL PRIMARY KEY,
	at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	dev integer NOT NULL,
	air_temperature real,
	air_humidity real,
	air_pressure real,
	lightness real,
	precipitation_mm real,
	soil_moisture real,
	soil_temperature real,
	soil_temperature_2 real,
	rssi real,
	voltage real
);

CREATE TABLE devices (
	id SERIAL PRIMARY KEY,
	key TEXT NOT NULL,
	description TEXT
);
```
