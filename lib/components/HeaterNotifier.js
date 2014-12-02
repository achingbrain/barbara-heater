var Autowire = require("wantsit").Autowire

var HeaterNotifier = function() {
  this._logger = Autowire
  this._notifierClient = Autowire

  this._lastEvent = null
  this._path = "/brews/" + process.env.BARBARA_BREW + "/heaterEvents"
}

HeaterNotifier.prototype.containerAware = function(container) {
  // set up events for notifier to record heater activity
  container.find("heaterController").on("heaterOn", this._notify.bind(this, "on"))
  container.find("heaterController").on("heaterOff", this._notify.bind(this, "off"))
}

HeaterNotifier.prototype._notify = function(event) {
  if(this._lastEvent == event) {
    this._logger.info("HeaterNotifier Skipping notification as the heater is still", event)

    return
  }

  this._lastEvent = event

  this._logger.info("HeaterNotifier Posting %s to %s", event, this._path)

  this._notifierClient.post(this._path, {
    event: event
  }, function(error) {
    if(error) {
      this._logger.error("HeaterNotifier Could not report heater event")
      this._logger.error(error)

      return
    }

    this._logger.info("HeaterNotifier Reported heater event %s OK", event)
  }.bind(this))
}

module.exports = HeaterNotifier
