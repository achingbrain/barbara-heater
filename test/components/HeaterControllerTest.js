var HeaterController = require(__dirname + "/../../components/HeaterController"),
	sinon = require("sinon"),
	should = require("should");

module.exports["HeaterController"] = {
	setUp: function(done) {
		this.controller = new HeaterController();
		this.controller._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this.controller._config = {
			get: sinon.stub()
		};
		this.controller._relay = {
			on: sinon.stub(),
			write: sinon.stub()
		};

		done();
	},

	"Should turn heater on": function( test ) {
		this.controller._relay.fd = true;

		this.controller.tooCold();

		this.controller._relay.write.calledWith([0x05]);

		test.done();
	},

	"Should not turn heater on twice": function( test ) {
		this.controller._relay.fd = true;

		// set up event listeners
		this.controller.afterPropertiesSet();

		// call on open callback
		this.controller._relay.on.getCall(0).args[0].should.equal("open");
		this.controller._relay.on.getCall(0).args[1]();

		this.controller._relay.on.getCall(1).args[0].should.equal("data");
		var onDataCallback = this.controller._relay.on.getCall(1).args[1];

		this.controller.tooCold();

		// notify that we've closed the relay
		onDataCallback(new Buffer([0x06]));

		// call it again
		this.controller.tooCold();

		// should only have turned it on once
		sinon.assert.calledOnce(this.controller._relay.write);

		test.done();
	},

	"Should turn heater off": function( test ) {
		this.controller._relay.fd = true;

		this.controller._relayState = true;

		this.controller.tooHot();

		this.controller._relay.write.calledWith([0x07]);

		test.done();
	},

	"Should not turn heater off twice": function( test ) {
		this.controller._relay.fd = true;

		// set up event listeners
		this.controller.afterPropertiesSet();

		// call on open callback
		this.controller._relay.on.getCall(0).args[0].should.equal("open");
		this.controller._relay.on.getCall(0).args[1]();

		this.controller._relay.on.getCall(1).args[0].should.equal("data");
		var onDataCallback = this.controller._relay.on.getCall(1).args[1];

		this.controller._relayState = true;

		this.controller.tooHot();

		// notify that we've opened the relay
		onDataCallback(new Buffer([0x08]));

		// call it again
		this.controller.tooHot();

		// should only have turned it on once
		sinon.assert.calledOnce(this.controller._relay.write);

		test.done();
	},

	"Should not write to non-open serial port": function( test ) {
		this.controller.tooHot();

		this.controller._relayState = true;

		this.controller.tooCold();

		// should not have written to the serial port
		this.controller._relay.write.neverCalledWith();

		test.done();
	}
};
