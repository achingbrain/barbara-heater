var HeaterNotifier = require('../../lib/components/HeaterNotifier'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('HeaterNotifier', function() {
  var notifier

  beforeEach(function() {
    notifier = new HeaterNotifier();
    notifier._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    notifier._notifierClient = {
      post: sinon.stub()
    }
  })

  it('should notify of heater on event', function() {
    notifier._path = 'path'

    notifier._notify('on')

    expect(notifier._notifierClient.post.calledWith(notifier._path, {
      event: 'on'
    }, sinon.match.func)).to.be.true
  })

  it('should notify of heater on event', function() {
    notifier._path = 'path'

    notifier._notify('off')

    expect(notifier._notifierClient.post.calledWith(notifier._path, {
      event: 'off'
    }, sinon.match.func)).to.be.true
  })

  it('should not notify of duplicate heater event', function() {
    notifier._path = 'path'

    notifier._notify('off')
    notifier._notify('off')

    expect(notifier._notifierClient.post.callCount).to.equal(1)
  })
})
