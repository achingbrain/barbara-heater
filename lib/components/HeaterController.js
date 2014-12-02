var Autowire = require('wantsit').Autowire,
  EventEmitter = require('events').EventEmitter,
  util = require('util')

var HeaterController = function() {
  EventEmitter.call(this)

  this._logger = Autowire
  this._child_process = Autowire

  this._pin = process.env.BARBARA_GPIO_PIN || 30
  this.state = false
}
util.inherits(HeaterController, EventEmitter)

HeaterController.prototype.containerAware = function(container) {
  // set up events for relay controller to turn the heater on and off
  container.find('temperatureWatcher').on('tooHot', this.turnHeaterOff.bind(this))
  container.find('temperatureWatcher').on('tooCold', this.turnHeaterOn.bind(this))
}

HeaterController.prototype.afterPropertiesSet = function() {
  this.turnHeaterOff()
}

HeaterController.prototype.turnHeaterOff = function() {
  if(!this.state) {
    this._logger.info('HeaterController Heater is already off')

    return
  }

  this._child_process.execFile('echo', ['0', '>', '/sys/class/gpio/gpio' + this._pin + '/value'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not set pin direction', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not set pin direction - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      throw err
    }

    this.state = false
    this.emit('heaterOff')
  }.bind(this))
}

HeaterController.prototype.turnHeaterOn = function() {
  if(this.state) {
    this._logger.info('HeaterController Heater is already on')

    return
  }

  this._child_process.execFile('echo', ['1', '>', '/sys/class/gpio/gpio' + this._pin + '/value'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not set pin direction', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not set pin direction - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      throw err
    }

    this.state = false
    this.emit('heaterOn')
  }.bind(this))
}

module.exports = HeaterController
