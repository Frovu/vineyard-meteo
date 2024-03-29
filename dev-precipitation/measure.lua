-- local ds18b20 = require("ds18b20")
-- local DS18B20_PIN = 5
-- ds18b20.init(DS18B20_PIN)

local TRIG_PIN = 5

local LED_PIN = 4
gpio.mode(LED_PIN, gpio.OUTPUT)
gpio.write(LED_PIN, gpio.HIGH)

local id, sda, scl = 0, 1, 2
print("i2c setup "..i2c.setup(id, sda, scl, i2c.SLOW))
bh1750 = require("bh1750")

local temp_oss = 4 -- x8 ! for some reason it refuses to work with smaller oversampling
local press_oss = 4 -- x8
local humi_oss = 2 -- x2
local sensor_mode = 0 -- sleep
local IIR_filter = 4 -- x16
local bme280 = require("bme280").setup(0, 1, temp_oss, press_oss, humi_oss, sensor_mode, IIR_filter)
print("bme: addr, isbme = ", bme280 and bme280.addr, bme280 and bme280._isbme)

local P_MM_PER_TRIG = 0.345
local trig_counter = 0 -- precipitation
local last = 0 -- software edge smoothing
gpio.mode(TRIG_PIN, gpio.INT, gpio.PULLUP)
gpio.trig(TRIG_PIN, "both", function(lvl, when)
	if when - last > 100000 then
		trig_counter=trig_counter+1
		last = when
		end
end)

local function send(data)
	data["dev"]= settings.dev
	local body = sjson.encode(data)
	print("Heap = "..node.heap())
	print("->"..body)
	http.post(settings.uri, "Content-Type: application/json\r\n", body, function(code, data)
		if (code ~= 200) then
			print("Failed: "..code)
		else
			print("Success.")
		end
	end)
end

local function measure_and_send()
	local data = {
		pp = string.format("%.3f", trig_counter * P_MM_PER_TRIG)
	}
	trig_counter = 0
	gpio.write(LED_PIN, gpio.LOW)
	bh1750.measure()
	if bme280 then
		bme280:startreadout(function(T, P, H)
			if not T or not P or not H then
				print("bme280 returned", T, P, H)
			end
			data["l"] = string.format("%.2f", bh1750.read())
			data["t"] = string.format("%.2f", T)
			data["p"] = string.format("%.2f", P)
			data["h"] = string.format("%.2f", H)
			send(data)
		end, 200)
	else
		tmr.create():alarm(200, tmr.ALARM_SINGLE, function()
			data["l"] = string.format("%.2f", bh1750.read())
			send(data)
		end)
	end
	gpio.write(LED_PIN, gpio.HIGH)
end

return {
	measure_and_send = measure_and_send
}
