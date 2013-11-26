var LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	bonvoyage = require("bonvoyage"),
	Columbo = require("columbo"),
	Hapi = require("hapi"),
	path = require("path"),
	SerialPort = require("serialport").SerialPort;

// set up arguments
config.argv().env().file(path.resolve(__dirname, "config.json"));

var container = new Container();
container.register("config", config);

// set up logging
container.createAndRegister("logger", winston.Logger, {
	transports: [
		new (winston.transports.Console)(config.get("logging"))
	]
});

// our components
container.createAndRegister("heaterNotifier", require(path.resolve(__dirname, "./components/HeaterNotifier")));
container.createAndRegister("heaterController", require(path.resolve(__dirname, "./components/HeaterController")));
container.createAndRegister("temperatureWatcher", require(path.resolve(__dirname, "./components/TemperatureWatcher")));
container.createAndRegister("relay", SerialPort, this._config.get("arduino:port"), {
	baudrate: 9600
});

container.register("restify", require("restify"));

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
