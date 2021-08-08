dofile("settings.lua")

local measure = require("measure")

print("\nInit timer rate = "..settings.data_rate.." s")
tmr.create():alarm(tonumber(settings.data_rate) * 1000, tmr.ALARM_AUTO, function()
	measure.measure_and_send()
end)
