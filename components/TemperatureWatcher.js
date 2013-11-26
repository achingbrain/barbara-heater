var Autowire = require("wantsit").Autowire,
	EventEmitter = require("events").EventEmitter,
	util = require("util");

var TemperatureWatcher = function() {
	EventEmitter.call(this);

	this._config = Autowire;
	this._logger = Autowire;
	this._seaport = Autowire;
	this._restify = Autowire;
};
util.inherits(TemperatureWatcher, EventEmitter);

TemperatureWatcher.prototype.afterPropertiesSet = function() {
	this._logger.info("TemperatureWatcher", "Will check temperature every", this._config.get("notificationInterval")/1000, "seconds");

	setInterval(this.checkTemperature.bind(this), this._config.get("notificationInterval"));
};

TemperatureWatcher.prototype.checkTemperature = function() {
	var services = this._seaport.query(this._config.get("temperature:name") + "@" + this._config.get("temperature:version"));

	// we've found all of the available temperature sensors, loop
	// through them until we find the one that's looking at our brew
	services.forEach(function(service) {
		var url = "http://" + service.host + ":" + service.port;

		this._logger.info("TemperatureWatcher", "Asking", url, "for it's configuration");

		var client = this._restify.createJsonClient({
			url: url
		});

		this.queryTemperatureSensorConfiguration(client, url);
	}.bind(this));
}

TemperatureWatcher.prototype.queryTemperatureSensorConfiguration = function(client, url) {
	client.get("/config", function(error, request, response, object) {
		if(error) {
			this._logger.error("TemperatureWatcher", "Could not get config from", url + "/config", error);

			return;
		}

		if(object.brew.id != this._config.get("brew:id")) {
			return;
		}

		this._logger.info("TemperatureWatcher", url, "is our temperature sensor");
		this.queryTemperatureSensor(client, url);
	}.bind(this));
};

TemperatureWatcher.prototype.queryTemperatureSensor = function(client, url) {
	// we're found the temperature sensor we're after
	client.get("/temperature", function(error, request, response, object) {
		if(error) {
			this._logger.error("TemperatureWatcher", "Could not get temperature from", url + "/temperature", error);

			return;
		}

		if(!object.celsius || isNaN(object.celsius)) {
			this._logger.info("TemperatureWatcher", "Looks like the temperature sensor wasn't ready yet");

			return;
		}

		this._logger.info("TemperatureWatcher", "Read", object.celsius, "°C");

		// what's the temperature, eh?
		if(object.celsius > this._config.get("maxTemperature")) {
			this._logger.warn("TemperatureWatcher", "Too hot!");
			this.emit("tooHot", object.celsius);
		} else if(object.celsius < this._config.get("minTemperature")) {
			this._logger.warn("TemperatureWatcher", "Too cold!");
			this.emit("tooCold", object.celsius);
		}
	}.bind(this));
};

module.exports = TemperatureWatcher;