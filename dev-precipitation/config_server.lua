local M = {}
local server

wifi.ap.config({ssid = "vineyard"})
print("\nCurrent SoftAP configuration:")
for k,v in pairs(wifi.ap.getconfig(true)) do
	print("  "..k.." :",v)
end
print("  IP:", wifi.ap.getip())

function M.start(cb)
	if wifi.getmode() ~= wifi.STATIONAP then
		wifi.setmode(wifi.STATIONAP)
		print("Switching to STATIONAP mode")
	end
	if not server then
		print("\nStarting config server..")
		server = net.createServer(net.TCP, 5)
		server:listen(80, function(conn)
			conn:on("receive", function(sck, data) M.receiver(sck, data, cb) end)
		end)
		local port, ip = server:getaddr()
		print("Listening to "..ip..":"..port)
	else
		print("Config server already running.")
	end
end

function M.stop()
	if server then
		print("Closing config sever")
		server:close()
		server = nil
	end
	wifi.setmode(wifi.STATION)
end

local required_config = {"uri", "dev", "data_rate"}

function M.receiver(sck, data, callback)
	if string.find(data, "^POST") then
		local body = data:match("\n[^\n]*$")
		local ssid = body:match("ssid=([^\&]+)")
		local pwd = body:match("pwd=([^\&]+)")
		local new_config = {}
		for k,v in pairs(required_config) do
			local m = body:match(v.."=([^\&]+)")
			if m then
				new_config[v] = m:gsub("%%3A", ":"):gsub("%%2F", "/")
			else
				sck:send("bad request");
				return
			end
		end
		if ssid and pwd then
			sck:send("<!DOCTYPE html>\n<h1>Settings updated</h1>");
			sck:on("sent", function(conn)
				conn:close()
				tmr.create():alarm(300, tmr.ALARM_SINGLE, function()
					callback(ssid, pwd, new_config)
				end)
			end)
		else
			sck:send("bad request");
		end
	else
		print("http get/?")
		local index = "can't read html"
		if file.open("index.html", "r") then
			index = file.read(4096)
			file.close()
		end
		for k,v in pairs(settings) do index = index:gsub("$"..k, v) end
		sck:send(index:gsub("$ssid", sta_config.ssid or "null"):gsub("$pwd", sta_config.pwd or "null"))
		sck:on("sent", function(conn) conn:close() end)
	end
end

return M
