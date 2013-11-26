var Autowire = require("wantsit").Autowire,
	EventEmitter = require("events").EventEmitter,
	util = require("util");

var HEATER_ON_REQUEST = 0x05;
var HEATER_ON_EVENT = 0x06;
var HEATER_OFF_REQUEST = 0x07;
var HEATER_OFF_EVENT = 0x08;

var HeaterController = function() {
	EventEmitter.call(this);

	this._config = Autowire;
	this._relay = Autowire;
	this._logger = Autowire;

	this._relayState = false;
};
util.inherits(HeaterController, EventEmitter);

HeaterController.prototype.containerAware = function(container) {
	// set up events for relay controller to turn the heater on and off
	container.find("temperatureWatcher").on("tooHot", this.tooHot.bind(this));
	container.find("temperatureWatcher").on("tooCold", this.tooCold.bind(this));
};

HeaterController.prototype.afterPropertiesSet = function() {
	this._relay.on("open", function () {
		this._logger.info("HeaterController", this._config.get("arduino:port"), "initialised");

		this._relay.on("data", function(data) {
			//LOG.info("HeaterController", "Got data", Array.prototype.slice.call(data, 0, data.length));

			if(data[0] == HEATER_ON_EVENT) {
				this._logger.info("Got heater on event");
				this._relayState = true;
				this.emit("heaterOn");
			} else if(data[0] == HEATER_OFF_EVENT) {
				this._logger.info("Got heater off event");
				this._relayState = false;
				this.emit("heaterOff");
			}
		}.bind(this));
	}.bind(this));
}

HeaterController.prototype.tooHot = function() {
	if(!this._relay.fd) {
		this._logger.warn("HeaterController", "Cannot turn the heater off, board not connected!");

		return;
	}

	if(!this._relayState) {
		this._logger.info("HeaterController", "Heater is already off");

		return;
	}

	this._logger.info("HeaterController", "Turning off heater");
	this._relay.write([HEATER_OFF_REQUEST]);
};

HeaterController.prototype.tooCold = function() {
	if(!this._relay.fd) {
		this._logger.warn("HeaterController", "Cannot turn the heater on, board not connected!");

		return;
	}

	if(this._relayState) {
		this._logger.info("HeaterController", "Heater is already on");

		return;
	}

	this._logger.info("HeaterController", "Turning on heater");
	this._relay.write([HEATER_ON_REQUEST]);
};

module.exports = HeaterController;
