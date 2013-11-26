var Autowire = require("wantsit").Autowire,
	restify = require("restify"),
	LOG = require("winston"),
	EventEmitter = require("events").EventEmitter,
	util = require("util");

var TemperatureWatcher = function() {
	EventEmitter.call(this);

	this._config = Autowire;
	this._seaport = Autowire;
};
util.inherits(TemperatureWatcher, EventEmitter);

TemperatureWatcher.prototype.afterPropertiesSet = function() {
	LOG.info("TemperatureWatcher", "Will check temperature every", this._config.get("notificationInterval")/1000, "seconds");

	setInterval(this.checkTemperature.bind(this), this._config.get("notificationInterval"));
};

TemperatureWatcher.prototype.checkTemperature = function() {
	var services = this._seaport.query(this._config.get("temperature:name") + "@" + this._config.get("temperature:version"));

	// we've found all of the available temperature sensors, loop
	// through them until we find the one that's looking at our brew
	services.forEach(function(service) {
		var url = "http://" + service.host + ":" + service.port;

		LOG.info("TemperatureWatcher", "Asking", url, "for it's configuration");

		var client = restify.createJsonClient({
			url: url
		});

		this.queryTemperatureSensorConfiguration(client, url);
	}.bind(this));
}

TemperatureWatcher.prototype.queryTemperatureSensorConfiguration = function(client, url) {
	client.get("/config", function(error, request, response, object) {
		if(error) {
			LOG.error("TemperatureWatcher", "Could not get config from", url + "/config", error);

			return;
		}

		if(object.brew.id != this._config.get("brew:id")) {
			return;
		}

		LOG.info("TemperatureWatcher", url, "is our temperature sensor");
		this.queryTemperatureSensor(client, url);
	}.bind(this));
};

TemperatureWatcher.prototype.queryTemperatureSensor = function(client, url) {
	// we're found the temperature sensor we're after
	client.get("/temperature", function(error, request, response, object) {
		if(error) {
			LOG.error("TemperatureWatcher", "Could not get temperature from", url + "/temperature", error);

			return;
		}

		if(!object.celsius || isNaN(object.celsius)) {
			LOG.info("TemperatureWatcher", "Looks like the temperature sensor wasn't ready yet");

			return;
		}

		LOG.info("TemperatureWatcher", "Read", object.celsius, "°C");

		// what's the temperature, eh?
		if(object.celsius > this._config.get("maxTemperature")) {
			LOG.warn("TemperatureWatcher", "Too hot!");
			this.emit("onTooHot", object.celsius);
		} else if(object.celsius < this._config.get("minTemperature")) {
			LOG.warn("TemperatureWatcher", "Too cold!");
			this.emit("onTooCold", object.celsius);
		}
	}.bind(this));
};

module.exports = TemperatureWatcher;