var Autowire = require("wantsit").Autowire;

var HeaterNotifier = function() {
	this._logger = Autowire;
	this._config = Autowire;
	this._seaport = Autowire;
	this._restify = Autowire;

	this._lastEvent = null;
};

HeaterNotifier.prototype.containerAware = function(container) {
	// set up events for notifier to record heater activity
	container.find("heaterController").on("heaterOn", this._notify.bind(this, "on"));
	container.find("heaterController").on("heaterOff", this._notify.bind(this, "off"));
};

HeaterNotifier.prototype._notify = function(event) {
	if(this._lastEvent == event) {
		this._logger.info("HeaterNotifier", "Skipping notification as the heater is still", event);

		return;
	}

	this._lastEvent = event;
	var services = this._seaport.query(this._config.get("statto:name") + "@" + this._config.get("statto:version"));

	if(services.length == 0) {
		this._logger.info("HeaterNotifier", "Cannot notify statto of heater activity - statto not found in seaport");

		return;
	}

	// post the event
	var url = "http://" + services[0].host + ":" + services[0].port;
	var path = "/brews/" + this._config.get("brew:id") + "/heaterEvents";

	this._logger.info("HeaterNotifier", "Posting", event, "to", url + path);

	var client = this._restify.createJsonClient({
		url: url
	});
	client.post(path, {
		event: event
	}, function(error) {
		if(error) {
			this._logger.error("HeaterNotifier", "Could not report heater event to", url, error);

			return;
		}

		this._logger.info("HeaterNotifier", "Reported heater event", event, "OK");
	}.bind(this));
};

module.exports = HeaterNotifier;
