var TemperatureWatcher = require('../../lib/components/TemperatureWatcher'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('TemperatureWatcher', function() {
  var watcher

  beforeEach(function() {
    watcher = new TemperatureWatcher()
    watcher._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    watcher._temperatureWatcherClient = {
      get: sinon.stub()
    }
  })

  it('should emit tooHot event when temperature is too hot', function(done) {
    process.env.BARBARA_MAX_TEMPERATURE = 1

    watcher.on('tooHot', done)

    watcher._temperatureWatcherClient.get.withArgs('/temperature', sinon.match.func).callsArgWith(1, undefined, {}, {}, 5)

    watcher.checkTemperature()
  })

  it('should emit tooCold event when temperature is too cold', function(done) {
    process.env.BARBARA_MAX_TEMPERATURE = 50
    process.env.BARBARA_MIN_TEMPERATURE = 10

    watcher.on('tooCold', done)

    watcher._temperatureWatcherClient.get.withArgs('/temperature', sinon.match.func).callsArgWith(1, undefined, {}, {}, 5)

    watcher.checkTemperature()
  })
})
