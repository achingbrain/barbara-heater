var TemperatureWatcher = require(__dirname + "/../../components/TemperatureWatcher"),
	sinon = require("sinon"),
	should = require("should");

module.exports["TemperatureWatcher"] = {
	setUp: function(done) {
		this.watcher = new TemperatureWatcher();
		this.watcher._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this.watcher._config = {
			get: sinon.stub()
		};
		this.watcher._seaport = {
			query: sinon.stub()
		};
		this.watcher._restify = {
			createJsonClient: sinon.stub()
		};

		done();
	},

	"Should emit tooHot event when temperature is too hot": function( test ) {
		var temperature = 50;
		var maxTemperature = 10;
		var minTemperature = 10;
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var temperatureName = "temperature";
		var temperatureVersion = "1.0.0";
		var configResponseObject = {
			brew: {
				id: brewId
			}
		};
		var temperatureResponseObject = {
			celsius: temperature
		};
		var restClient = {
			get: sinon.stub(),
			post: sinon.stub().callsArg(2)
		}
		restClient.get.withArgs("/config", sinon.match.func).callsArgWith(1, null, null, null, configResponseObject);
		restClient.get.withArgs("/temperature", sinon.match.func).callsArgWith(1, null, null, null, temperatureResponseObject);

		this.watcher._config.get.withArgs("temperature:name").returns(temperatureName);
		this.watcher._config.get.withArgs("temperature:version").returns(temperatureVersion);
		this.watcher._config.get.withArgs("brew:id").returns(brewId);
		this.watcher._config.get.withArgs("maxTemperature").returns(maxTemperature);
		this.watcher._config.get.withArgs("minTemperature").returns(minTemperature);

		this.watcher._seaport.query.withArgs(temperatureName + "@" + temperatureVersion).returns([service]);
		this.watcher._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.watcher.on("tooHot", function() {
			test.done();
		});

		// should trigger tooHot event
		this.watcher.checkTemperature();
	},

	"Should emit tooCold event when temperature is too cold": function( test ) {
		var temperature = 2;
		var maxTemperature = 10;
		var minTemperature = 10;
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var temperatureName = "temperature";
		var temperatureVersion = "1.0.0";
		var configResponseObject = {
			brew: {
				id: brewId
			}
		};
		var temperatureResponseObject = {
			celsius: temperature
		};
		var restClient = {
			get: sinon.stub(),
			post: sinon.stub().callsArg(2)
		}
		restClient.get.withArgs("/config", sinon.match.func).callsArgWith(1, null, null, null, configResponseObject);
		restClient.get.withArgs("/temperature", sinon.match.func).callsArgWith(1, null, null, null, temperatureResponseObject);

		this.watcher._config.get.withArgs("temperature:name").returns(temperatureName);
		this.watcher._config.get.withArgs("temperature:version").returns(temperatureVersion);
		this.watcher._config.get.withArgs("brew:id").returns(brewId);
		this.watcher._config.get.withArgs("maxTemperature").returns(maxTemperature);
		this.watcher._config.get.withArgs("minTemperature").returns(minTemperature);

		this.watcher._seaport.query.withArgs(temperatureName + "@" + temperatureVersion).returns([service]);
		this.watcher._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.watcher.on("tooCold", function() {
			test.done();
		});

		// should trigger tooHot event
		this.watcher.checkTemperature();
	}
};
