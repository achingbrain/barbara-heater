var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  Autowire = require('wantsit').Autowire

var HeaterCheck = function() {
  EventEmitter.call(this)

  this._logger = Autowire
  this._child_process = Autowire
  this._fs = Autowire

  this._pin = process.env.BARBARA_GPIO_PIN || 30
}
util.inherits(HeaterCheck, EventEmitter)

HeaterCheck.prototype.afterPropertiesSet = function() {
  this._checkPin(function(error, exists) {
    if(error) throw error

    if(!exists) {
      this._enablePin(function(error) {
        if(error) throw error

        this._setPinDirection(function(error) {
          if(error) throw error

          this.emit('ready')
        }.bind(this))
      }.bind(this))
    } else {
      this._setPinDirection(function(error) {
        if(error) throw error

        this.emit('ready')
      }.bind(this))
    }
  }.bind(this))
}

HeaterCheck.prototype._checkPin = function(callback) {
  this._fs.exists('/sys/class/gpio/gpio' + this._pin, function(exists) {
    callback(undefined, exists)
  })
}

HeaterCheck.prototype._enablePin = function(callback) {
  this._child_process.execFile('echo', [this._pin, '>', '/sys/class/gpio/export'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not turn pin on', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not turn pin on - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    callback()
  }.bind(this))
}

HeaterCheck.prototype._setPinDirection = function(callback) {
  this._child_process.execFile('echo', ['out', '>', '/sys/class/gpio/gpio' + this._pin + '/direction'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not set pin direction', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not set pin direction - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    callback()
  }.bind(this))
}

module.exports = HeaterCheck