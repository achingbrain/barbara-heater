var SerialPort = require("serialport").SerialPort,
	Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	EventEmitter = require("events").EventEmitter,
	util = require("util")

var HEATER_OFF = 0x10;
var HEATER_ON = 0x05;

var HeaterController = function() {
	EventEmitter.call(this);

	this._config = Autowire;
	this._seaport = Autowire;
	this._relayState = false;
	this._serialPort;
};
util.inherits(HeaterController, EventEmitter);

HeaterController.prototype.containerAware = function(container) {
	// set up events for relay controller to turn the heater on and off
	container.find("temperatureWatcher").on("onTooHot", this.tooHot.bind(this));
	container.find("temperatureWatcher").on("onTooCold", this.tooCold.bind(this));
};

HeaterController.prototype.afterPropertiesSet = function() {
	LOG.info("HeaterController", "Connecting to board", this._config.get("arduino:port"));
	var serialPort = new SerialPort(this._config.get("arduino:port"), {
		baudrate: 9600
	});
	serialPort.on("open", function () {
		LOG.info("HeaterController", this._config.get("arduino:port"), "initialised");

		serialPort.on("data", function(data) {
			LOG.info("HeaterController", "Got data", Array.prototype.slice.call(data, 0, data.length));
		});

		this._serialPort = serialPort;
	}.bind(this));
}

HeaterController.prototype.tooHot = function() {
	if(!this._serialPort) {
		LOG.warn("HeaterController", "Cannot turn the heater off, board not connected!");

		return;
	}

	if(!this._relayState) {
		LOG.info("HeaterController", "Heater is already off");

		return;
	}

	this._relayState = false;

	LOG.info("HeaterController", "Turning off heater");
	this._serialPort.write([HEATER_OFF]);
	this.emit("heaterOff");
};

HeaterController.prototype.tooCold = function() {
	if(!this._serialPort) {
		LOG.warn("HeaterController", "Cannot turn the heater on, board not connected!");

		return;
	}

	if(this._relayState) {
		LOG.info("HeaterController", "Heater is already on");

		return;
	}

	this._relayState = true;

	LOG.info("HeaterController", "Turning on heater");
	this._serialPort.write([HEATER_ON]);
	this.emit("heaterOn");
};

module.exports = HeaterController;