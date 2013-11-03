var five = require("johnny-five"),
	Autowire = require("wantsit").Autowire;

var HeaterController = function() {
	this._config = Autowire;
};

HeaterController.prototype.onSeaportFound = function(seaport) {
	seaport.get("brewbot-heater-rest@1.0.0", function(services) {
		// we've found all of the available temperature sensors, loop
		// through them until we find the one that's looking at our brew

		services.forEach(function(service) {
			var client = restify.createJsonClient({
				url: "http://" + service.host + ":" + service.port
			});
			client.get("/config/", function(error, request, response, object) {
				if(error) {
					LOG.error("Could not get brew", config.get("stirrer:brew"), error);

					return;
				}

				if(object.brew.id == config.get("brew:id")) {

				}

				LOG.info("Stirring", object.name);
			});
		}.bind(this));
	});
}

HeaterController.prototype.onTemperatureSensorFound = function(service) {
	var board = new five.Board({port: this._config.get("arduino.port")});
	board.on("ready", function() {
		LOG.info("Board powered up");
		this._board = board;
	}.bind(this));
}

module.exports = HeaterController;