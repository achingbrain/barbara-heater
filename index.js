var Container = require('wantsit').Container,
  Columbo = require('columbo'),
  Hapi = require('hapi'),
  path = require('path'),
  restify = require('restify'),
  winston = require('winston')

if(!process.env.BARBARA_BREW) {
  throw new Error('Please specify process.env.BARBARA_BREW')
}

process.env.BARBARA_PORT = process.env.BARBARA_PORT || 7582
process.env.BARBARA_TEMPERATURE_SENSOR = process.env.BARBARA_TEMPERATURE_SENSOR || 'http://localhost:7583'
process.env.BARBARA_DATABASE = process.env.BARBARA_DATABASE || 'http://silenus.local:8493'
process.env.BARBARA_NOTIFICATION_INTERVAL = process.env.BARBARA_NOTIFICATION_INTERVAL || 10000
process.env.BARBARA_MAX_TEMPERATURE = parseInt(process.env.BARBARA_MAX_TEMPERATURE || 30, 10)
process.env.BARBARA_MIN_TEMPERATURE = parseInt(process.env.BARBARA_MIN_TEMPERATURE || 20, 10)

var container = new Container()

// set up logging
container.createAndRegister('logger', winston.Logger, {
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
})

container.register('child_process', require('child_process'))
container.register('fs', require('fs'))

var check = container.createAndRegister('heaterCheck', require('./lib/components/HeaterCheck'))
check.on('ready', function() {
  container.register('notifierClient', restify.createJsonClient({
    url: process.env.BARBARA_DATABASE
  }))
  container.register('temperatureWatcherClient', restify.createJsonClient({
    url: process.env.BARBARA_TEMPERATURE_SENSOR
  }))

  container.createAndRegister('heaterNotifier', require('./lib/components/HeaterNotifier'))
  container.createAndRegister('heaterController', require('./lib/components/HeaterController'))
  container.createAndRegister('temperatureWatcher', require('./lib/components/TemperatureWatcher'))

  // create a REST api
  var columbo = container.createAndRegister('columbo', Columbo, {
    resourceDirectory: path.resolve(__dirname, 'lib/resources'),
    resourceCreator: function(resource, name) {
      return container.createAndRegister(name + 'Resource', resource)
    },
    logger: container.find('logger')
  })

  var server = Hapi.createServer('0.0.0.0', process.env.BARBARA_PORT, {
    cors: true
  })
  server.route(columbo.discover())
  server.start(function() {
    container.find('logger').info('RESTServer', 'Running at', 'http://localhost:' + process.env.BARBARA_PORT)
  })
})
