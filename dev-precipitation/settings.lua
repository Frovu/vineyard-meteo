sta_config = wifi.sta.getconfig(true);
wifi.sta.autoconnect(1)
print(string.format("\nCurrent wifi config, mode: %d\n\tssid:\"%s\"\tpassword:\"%s\"\n\tbssid:\"%s\"\tbssid_set:%s", wifi.getmode(nil), tostring(sta_config.ssid), tostring(sta_config.pwd), sta_config.bssid, (sta_config.bssid_set and "true" or "false")))

local CONFIG = "config.json"
if file.open(CONFIG, "r") then
	settings = sjson.decode(file.read(4096))
else
	print("PANIC! No config.json found!")
	settings = {}
end

local conf_server
-- if STA requires manual configuration
if #tostring(sta_config.ssid) == 0 then
	sta_config = {}
else
	tmr.create():alarm(300000, tmr.ALARM_SINGLE, function() stop_server() end)
end

function stop_server()
	if conf_server then
		conf_server.stop()
		conf_server = nil
		package.loaded["config_server"] = nil
		server_loader = nil
	end
end

local alarm = tmr.create()
local function server_loader()
	print("trying to load config server, heap="..node.heap())
	if pcall(function() conf_server = require("config_server") end) then
		print("success loading server")
		alarm:unregister()
		conf_server.start(function (ssid, pwd, config)
			stop_server()
			print("\nUpdating sta settings to:\n\tssid="..ssid.." pwd="..pwd)
			print("New config: "..sjson.encode(config))
			sta_config.ssid = ssid
			sta_config.pwd = pwd
			wifi.sta.config(sta_config)
			if file.open(CONFIG, "w") then
				file.write(sjson.encode(config))
				file.close()
			end
			if settings.data_rate ~= config.data_rate then
				node.restart() -- a bit crunchy solution to changing timer frequency but who cares
			else
				settings = config
			end
		end)
	else
		print("failed to load server")
		alarm:start()
	end
end
alarm:register(1000, tmr.ALARM_SEMI, server_loader)
alarm:start()

local WARN_PIN = 6
gpio.mode(WARN_PIN, gpio.OUTPUT)
gpio.write(WARN_PIN, gpio.HIGH)

wifi.eventmon.register(wifi.eventmon.STA_DISCONNECTED, function(T)
	print("\nSTA - DISCONNECTED".."\nSSID: "..T.SSID.."\nBSSID: "..T.BSSID.."\nreason: "..T.reason)
	gpio.write(WARN_PIN, gpio.HIGH) -- disconnected from internet :(
end)
wifi.eventmon.register(wifi.eventmon.STA_CONNECTED, function(T)
	print("\nSTA - CONNECTED".."\nSSID: "..T.SSID.."\nBSSID: "..T.BSSID.."\nChannel: "..T.channel)
end)
wifi.eventmon.register(wifi.eventmon.STA_GOT_IP, function(T)
	print("\nSTA - GOT IP".."\nStation IP: "..T.IP.."\nSubnet mask: "..T.netmask.."\nGateway IP: "..T.gateway)
	gpio.write(WARN_PIN, gpio.LOW) -- connected to internet now
end)
