var five = require("johnny-five"),
	LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	bonvoyage = require("bonvoyage"),
	restify = require("restify"),
	Columbo = require("columbo"),
	Hapi = require("hapi"),
	HeaterNotifier = require("./lib/HeaterNotifier"),
	HeaterController = require("./lib/HeaterController"),
	TemperatureWatcher = require("./lib/TemperatureWatcher");

// set up arguments
config.argv().env().file("config.json");

var container = new Container();
container.register("config", config);

// our components
container.createAndRegister("heaterNotifier", HeaterNotifier);
container.createAndRegister("heaterController", HeaterController);
container.createAndRegister("temperatureWatcher", TemperatureWatcher);

// set up events for relay controller to turn the heater on and off
container.find("temperatureWatcher").on("onTooHot", container.find("heaterController").tooHot.bind(container.find("heaterController")));
container.find("temperatureWatcher").on("onTooCold", container.find("heaterController").tooCold.bind(container.find("heaterController")));

// set up events for notifier to record heater activity
container.find("heaterController").on("heaterOn", container.find("heaterNotifier").heaterOn.bind(container.find("heaterNotifier")));
container.find("heaterController").on("heaterOff", container.find("heaterNotifier").heaterOff.bind(container.find("heaterNotifier")));

// create a REST api
container.createAndRegister("columbo", Columbo, {
	resourceDirectory: config.get("rest:resources"),
	resourceCreator: function(resource, name) {
		return container.createAndRegister(name + "Resource", resource);
	}
});

// inject a dummy seaport - we'll overwrite this when the real one becomes available
container.register("seaport", {
	query: function() {
		return [];
	}
});

var bonvoyageClient = container.createAndRegister("seaportClient", bonvoyage.Client, {
	serviceType: config.get("registry:name")
});
bonvoyageClient.register({
	role: config.get("rest:name"),
	version: config.get("rest:version"),
	createService: function(port) {
		var columbo = container.find("columbo");
		var server = Hapi.createServer("0.0.0.0", port, {
			cors: true
		});
		server.addRoutes(columbo.discover());
		server.start();

		LOG.info("RESTServer", "Running at", "http://localhost:" + port);
	}
});
bonvoyageClient.find(function(error, seaport) {
	if(error) {
		LOG.error("Error finding seaport", error);

		return;
	}

	LOG.info("Found seaport server");
});
bonvoyageClient.on("seaportUp", function(seaport) {
	container.register("seaport", seaport);
});
