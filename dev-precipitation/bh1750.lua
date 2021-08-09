local DEV_ADDR = 0x23
local READ_CMD = 0x10
local i2c = i2c
local id = 0
local M = {}

function M.measure()
	i2c.start(id)
	i2c.address(id, DEV_ADDR, i2c.TRANSMITTER)
	i2c.write(id, READ_CMD)
	i2c.stop(id)
end

function M.read()
	i2c.start(id)
	i2c.address(id, DEV_ADDR, i2c.RECEIVER)
	local data = i2c.read(id, 2)
	i2c.stop(id)
	local lraw = data:byte(1) * 0x100 + data:byte(2)
	return (lraw / 1.2)
end

return M
