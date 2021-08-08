-- operate one ds18b20 sensor on one pin
local CMD_CONVERT_T = 0x44
local CMD_READ = 0xBE
local READ_DELAY = 750 -- 750 ms as for 12-bit res per datasheet

local function init(pin)
	ow.setup(pin)
end

local function measure(pin, callback)
	ow.reset(pin)
	ow.skip(pin)
	ow.write(pin, CMD_CONVERT_T)
	tmr.create():alarm(READ_DELAY, tmr.ALARM_SINGLE, function()
		ow.reset(pin)
		ow.skip(pin)
		ow.write(pin, CMD_READ)
		local data = ow.read_bytes(pin, 9)
		if ow.crc8(string.sub(data, 1, 8)) == data:byte(9) then -- verify crc
			local	t = data:byte(2) * 0x100 + data:byte(1)
			t = ((t > 0xfff and t - 0x10000 or t) * 625) / 10000 -- if sign bits (0xfc00) are set, invert bits
			callback(t)
		else
			callback(nil)
		end
	end)
end

return {
	init = init,
	measure = measure
}
