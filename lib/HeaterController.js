var five = require("johnny-five"),
	Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	EventEmitter = require("events").EventEmitter,
	util = require("util")

var HeaterController = function() {
	EventEmitter.call(this);

	this._config = Autowire;
	this._seaport = Autowire;
	this._relayState = false;
	this._board;
};
util.inherits(HeaterController, EventEmitter);

HeaterController.prototype.afterPropertiesSet = function() {
	LOG.info("HeaterController", "Connecting to board", this._config.get("arduino:port"));
	var board = new five.Board({port: this._config.get("arduino:port")}, function (error) {
		LOG.info("Board", this._config.get("arduino:port"), "initialised");

		if(error) {
			LOG.error("HeaterController", "Error connecting to board", error);
			return;
		}

		this._board = board;
	}.bind(this));
}

HeaterController.prototype.tooHot = function() {
	if(!this._board) {
		LOG.warn("HeaterController", "Cannot turn the heater off, board not connected!");

		return;
	}

	if(!this._relayState) {
		LOG.info("HeaterController", "Heater is already off");

		return;
	}

	this._relayState = false;

	LOG.info("HeaterController", "Turning off heater");
	this._board.digitalWrite(this._config.get("arduino:pin"), this._board.LOW);
	this.emit("heaterOff");
};

HeaterController.prototype.tooCold = function() {
	if(!this._board) {
		LOG.warn("HeaterController", "Cannot turn the heater on, board not connected!");

		return;
	}

	if(this._relayState) {
		LOG.info("HeaterController", "Heater is already on");

		return;
	}

	this._relayState = true;

	LOG.info("HeaterController", "Turning on heater");
	this._board.digitalWrite(this._config.get("arduino:pin"), this._board.HIGH);
	this.emit("heaterOn");
};

module.exports = HeaterController;