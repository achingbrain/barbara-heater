var Autowire = require('wantsit').Autowire

Heater = function() {
  this._heaterController = Autowire
  this._logger = Autowire
}

Heater.prototype.retrieveOne = function(request) {
  this._logger.info('Incoming request. Heater state', this._heaterController.state)

  request.reply(this._heaterController.state)
}

module.exports = Heater
