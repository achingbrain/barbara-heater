var HeaterCheck = require('../../lib/components/HeaterCheck'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('HeaterCheck', function() {
  var check

  beforeEach(function() {
    check = new HeaterCheck()
    check._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    check._child_process = {
      execFile: sinon.stub()
    }
    check._fs = {
      exists: sinon.stub()
    }
  })

  it('should check pin', function(done) {
    check._pin = 5

    check._fs.exists.withArgs('/sys/class/gpio/gpio5').callsArgWith(1, true)


    check._checkPin(function(error, exists) {
      expect(error).to.not.exist

      expect(exists).to.be.true

      done()
    })
  })

  it('should enable pin', function(done) {
    check._pin = 5

    check._child_process.execFile.withArgs('echo', [5, '>', '/sys/class/gpio/export']).callsArgWith(2, undefined)

    check._enablePin(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to enable pin', function(done) {
    check._pin = 5

    check._child_process.execFile.withArgs('echo', [5, '>', '/sys/class/gpio/export']).callsArgWith(2, new Error('urk!'))

    check._enablePin(function(error) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should set pin direction', function(done) {
    check._pin = 5

    check._child_process.execFile.withArgs('echo', ['out', '>', '/sys/class/gpio/gpio5/direction']).callsArgWith(2, undefined)

    check._setPinDirection(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to set pin direction', function(done) {
    check._pin = 5

    check._child_process.execFile.withArgs('echo', ['out', '>', '/sys/class/gpio/gpio5/direction']).callsArgWith(2, new Error('urk!'))

    check._setPinDirection(function(error) {
      expect(error).to.be.ok

      done()
    })
  })
})
