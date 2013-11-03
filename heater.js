var five = require("johnny-five"),
	LOG = require("winston"),
	config = require("config"),
	Container = require("wantsit").Container,
	bonvoyage = require("bonvoyage"),
	restify = require("restify"),
	common = require("../brewbot-common");

// set up arguments
config.argv().env().file("config.json");

var container = new Container();
container.register("config", config);

// create a REST api
container.createAndRegister("resourceDiscoverer", common.rest.ResourceDiscoverer, config.get("rest:resources"));
container.createAndRegister("restServer", common.rest.RESTServer);

var bonvoyageClient = container.createAndRegister("seaportClient", bonvoyage.Client, {
	serviceType: config.get("registry:name")
});
bonvoyageClient.register({
	role: config.get("rest:name"),
	version: config.get("rest:version"),
	createService: function(port) {
		var restServer = container.find("restServer");
		restServer.start(port);
	}
});
bonvoyageClient.find(function(seaport) {
	container.register("seaport", seaport);

	LOG.info("Found seaport");


});
