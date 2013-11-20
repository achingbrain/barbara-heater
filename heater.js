var five = require("johnny-five"),
	LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	bonvoyage = require("bonvoyage"),
	restify = require("restify"),
	Columbo = require("columbo"),
	Hapi = require("hapi"),
	path = require("path");

// set up arguments
config.argv().env().file(path.resolve(__dirname, "config.json"));

var container = new Container();
container.register("config", config);

// our components
container.createAndRegister("heaterNotifier", require(path.resolve(__dirname, "./lib/HeaterNotifier")));
container.createAndRegister("heaterController", require(path.resolve(__dirname, "./lib/HeaterController")));
container.createAndRegister("temperatureWatcher", require(path.resolve(__dirname, "./lib/TemperatureWatcher")));

// create a REST api
container.createAndRegister("columbo", Columbo, {
	resourceDirectory: path.resolve(__dirname, config.get("rest:resources")),
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
bonvoyageClient.on("seaportUp", function(seaport) {
	container.register("seaport", seaport);
});
