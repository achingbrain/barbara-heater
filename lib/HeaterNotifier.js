var Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	restify = require("restify");

var HeaterNotifier = function() {
	this._config = Autowire;
	this._seaport = Autowire;
	this._lastEvent = null;
};

HeaterNotifier.prototype.containerAware = function(container) {
	// set up events for notifier to record heater activity
	container.find("heaterController").on("heaterOn", this.heaterOn.bind(this));
	container.find("heaterController").on("heaterOff", this.heaterOff.bind(this));
};

HeaterNotifier.prototype.heaterOn = function() {
	this._notify("on");
};

HeaterNotifier.prototype.heaterOff = function() {
	this._notify("off");
};

HeaterNotifier.prototype._notify = function(event) {
	if(this._lastEvent == event) {
		LOG.info("HeaterNotifier", "Skipping notification as the heater is still", event);

		return;
	}

	this._lastEvent = event;
	var services = this._seaport.query(this._config.get("statto:name") + "@" + this._config.get("statto:version"));

	if(services.length == 0) {
		LOG.info("HeaterNotifier", "Cannot notify statto of heater activity - statto not found in seaport");

		return;
	}

	// post the event
	var url = "http://" + services[0].host + ":" + services[0].port;
	var path = "/brews/" + this._config.get("brew:id") + "/heaterEvents";

	LOG.info("HeaterNotifier", "Posting", event, "to", url + path);

	var client = restify.createJsonClient({
		url: url
	});
	client.post(path, {
		event: event
	}, function(error) {
		if(error) {
			LOG.error("HeaterNotifier", "Could not report heater event to", url, error);

			return;
		}

		LOG.info("HeaterNotifier", "Reported heater event", event, "OK");
	});
};

module.exports = HeaterNotifier;