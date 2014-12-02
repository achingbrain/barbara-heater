var HeaterController = require('../../lib/components/HeaterController'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('HeaterController', function() {
  var controller

  beforeEach(function() {
    controller = new HeaterController();
    controller._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    controller._child_process = {
      execFile: sinon.stub()
    }
  })
  
  it('should turn heater on', function(done) {
    controller.state = false
    controller._pin = 5

    controller._child_process.execFile.withArgs('echo', ['1', '>', '/sys/class/gpio/gpio5/value']).callsArg(2)

    controller.on('heaterOn', done)

    controller.turnHeaterOn()
  })

  it('should not turn heater on twice', function() {
    controller.state = true
    controller._pin = 5

    controller.turnHeaterOn()

    expect(controller._child_process.execFile.called).to.be.false
  })

  it('should turn heater off', function(done) {
    controller.state = true
    controller._pin = 5

    controller._child_process.execFile.withArgs('echo', ['0', '>', '/sys/class/gpio/gpio5/value']).callsArgWith(2)

    controller.on('heaterOff', done)

    controller.turnHeaterOff()
  })

  it('should not turn heater off twice', function() {
    controller.state = false
    controller._pin = 5

    controller.turnHeaterOff()

    expect(controller._child_process.execFile.called).to.be.false
  })
})
