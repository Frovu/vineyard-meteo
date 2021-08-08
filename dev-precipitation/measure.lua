-- local ds18b20 = require("ds18b20")
-- local DS18B20_PIN = 5
-- ds18b20.init(DS18B20_PIN)

local LED_PIN = 4
gpio.mode(LED_PIN, gpio.OUTPUT)
gpio.write(LED_PIN, gpio.HIGH)

local id, sda, scl = 0, 1, 2
i2c.setup(id, sda, scl, i2c.SLOW)
bh1750 = require("bh1750")

local function send(light)
	local body = sjson.encode({
		dev = settings.dev,
		l = light,
		-- TODO
	})
	print("Heap = "..node.heap())
	print("Sending data: "..body)
	http.post(settings.uri, "Content-Type: application/json\r\n", body, function(code, data)
		if (code ~= 200) then
			print("Failed: "..code)
		else
			print("Success.")
		end
	end)
end

local function measure_and_send()
	gpio.write(LED_PIN, gpio.LOW)
	bh1750.read()
	l = bh1750.getlux()
	gpio.write(LED_PIN, gpio.HIGH)
end

return {
	measure_and_send = measure_and_send
}
