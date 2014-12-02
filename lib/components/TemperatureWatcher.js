var Autowire = require('wantsit').Autowire,
  EventEmitter = require('events').EventEmitter,
  util = require('util')

var TemperatureWatcher = function() {
  EventEmitter.call(this)

  this._logger = Autowire
  this._temperatureWatcherClient = Autowire
}
util.inherits(TemperatureWatcher, EventEmitter)

TemperatureWatcher.prototype.afterPropertiesSet = function() {
  this._logger.info('TemperatureWatcher', 'Will check temperature every', process.env.BARBARA_NOTIFICATION_INTERVAL/1000, 'seconds')

  setTimeout(this.checkTemperature.bind(this), process.env.BARBARA_NOTIFICATION_INTERVAL)
}

TemperatureWatcher.prototype.checkTemperature = function() {
  this._temperatureWatcherClient.get('/temperature', function(error, request, response, object) {
    if(error) {
      this._logger.error('TemperatureWatcher Could not get temperature')
      this._logger.error(error)

      return
    }

    if(!object) {
      this._logger.info('TemperatureWatcher Looks like the temperature sensor wasn\'t ready yet')

      return
    }

    this._logger.info('TemperatureWatcher Read %d°C', object)

    // what's the temperature, eh?
    if(object > process.env.BARBARA_MAX_TEMPERATURE) {
      this._logger.warn('TemperatureWatcher', 'Too hot!')
      this.emit('tooHot')
    } else if(object < process.env.BARBARA_MIN_TEMPERATURE) {
      this._logger.warn('TemperatureWatcher', 'Too cold!')
      this.emit('tooCold')
    }

    setTimeout(this.checkTemperature.bind(this), process.env.BARBARA_NOTIFICATION_INTERVAL)
  }.bind(this))
}

module.exports = TemperatureWatcher