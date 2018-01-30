'use strict';

const scuttlebot = require('scuttlebot')

const withException = fn => (err, data) => {
  if (err) { throw new Error(err) }
  else { fn(data) }
}

const Playbook = function (scriptBuilder, cleanup) {

  // create a temporary server instance just for this play-through
  const sbot = scuttlebot({ temp: true })
  // create as many feeds ("users") as there are arguments to `scriptBuilder`
  const feeds = new Array(scriptBuilder.length).fill().map(() => sbot.createFeed())
  const playbook = scriptBuilder(...feeds)

  const runPlay = (playNum) => {
    if (playNum >= playbook.length) {
      sbot.close()
      cleanup()
      return
    }

    const {from, data, test} = playbook[playNum]
    const next = () => runPlay(playNum + 1)

    from.add(data, withException(() => {
      if (test.length < 2) {
        // if the function doesn't accept a second parameter,
        // assume it's synchronous and move on
        test(sbot)
        next()
      } else {
        // if the function expects a second parameter,
        // assume it's async and let it call done itself
        test(sbot, next)
      }
    }))
  }

  // run the first message to kick things off
  runPlay(0)
}

Playbook.use = function (...args) {
  scuttlebot.use(...args)
  return Playbook
}

module.exports = Playbook
