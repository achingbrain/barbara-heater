var HeaterNotifier = require(__dirname + "/../../components/HeaterNotifier"),
	sinon = require("sinon"),
	should = require("should");

module.exports["HeaterNotifier"] = {
	setUp: function(done) {
		this.notifier = new HeaterNotifier();
		this.notifier._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this.notifier._config = {
			get: sinon.stub()
		};
		this.notifier._seaport = {
			query: sinon.stub()
		};
		this.notifier._restify = {
			createJsonClient: sinon.stub()
		};

		done();
	},

	"Should notify of heater on event": function( test ) {
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var stattoName = "statto";
		var stattoVersion = "1.0.0";
		var restClient = {
			post: sinon.stub().callsArg(2)
		}

		this.notifier._config.get.withArgs("statto:name").returns(stattoName);
		this.notifier._config.get.withArgs("statto:version").returns(stattoVersion);
		this.notifier._config.get.withArgs("brew:id").returns(brewId);
		this.notifier._seaport.query.withArgs(stattoName + "@" + stattoVersion).returns([service]);
		this.notifier._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.notifier._notify("on");

		// restify should have been called
		restClient.post.getCall(0).calledWith("/brews/" + brewId + "/heaterEvents", sinon.match.obj, sinon.match.func);
		restClient.post.getCall(0).args[1].event.should.equal("on");

		test.done();
	},

	"Should notify of heater off event": function( test ) {
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var stattoName = "statto";
		var stattoVersion = "1.0.0";
		var restClient = {
			post: sinon.stub().callsArg(2)
		}

		this.notifier._config.get.withArgs("statto:name").returns(stattoName);
		this.notifier._config.get.withArgs("statto:version").returns(stattoVersion);
		this.notifier._config.get.withArgs("brew:id").returns(brewId);
		this.notifier._seaport.query.withArgs(stattoName + "@" + stattoVersion).returns([service]);
		this.notifier._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.notifier._notify("off");

		// restify should have been called
		restClient.post.getCall(0).calledWith("/brews/" + brewId + "/heaterEvents", sinon.match.obj, sinon.match.func);
		restClient.post.getCall(0).args[1].event.should.equal("off");

		test.done();
	},

	"Should only notify of heater event once": function( test ) {
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var stattoName = "statto";
		var stattoVersion = "1.0.0";
		var restClient = {
			post: sinon.stub().callsArg(2)
		}

		this.notifier._config.get.withArgs("statto:name").returns(stattoName);
		this.notifier._config.get.withArgs("statto:version").returns(stattoVersion);
		this.notifier._config.get.withArgs("brew:id").returns(brewId);
		this.notifier._seaport.query.withArgs(stattoName + "@" + stattoVersion).returns([service]);
		this.notifier._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.notifier._notify("off");

		// restify should have been called
		restClient.post.getCall(0).calledWith("/brews/" + brewId + "/heaterEvents", sinon.match.obj, sinon.match.func);
		restClient.post.getCall(0).args[1].event.should.equal("off");

		// call it again
		this.notifier._notify("off");

		// should only have been called once
		sinon.assert.calledOnce(this.notifier._restify.createJsonClient);
		sinon.assert.calledOnce(restClient.post);

		test.done();
	}
};
