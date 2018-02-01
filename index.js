'use strict';

const scuttlebot = require('scuttlebot')
const client = require('ssb-client')

const withException = fn => (err, data) => {
  if (err) { throw new Error(err) }
  else { fn(data) }
}

const output = x => console.log(x)

const Playbook = function (scriptBuilder, cleanup) {

  // create a temporary server instance just for this play-through
  const sbot = scuttlebot({ temp: true })
  const script = scriptBuilder(sbot)
  // create as many feeds ("users") as there are arguments to `script`
  const feeds = new Array(script.length).fill().map(() => sbot.createFeed())
  const playbook = script(...feeds)

  output("•§•      Playbook starting with these actors      •§•")
  feeds.forEach(f => output(f.id))

  const runPlay = (playNum) => {
    if (playNum >= playbook.length) {
      cleanup && cleanup()
      sbot.close()
      return
    }

    const play = playbook[playNum]
    const next = () => runPlay(playNum + 1)

    if (typeof(play) === 'function') {
      // run some code, probably a test
      if (play.length < 1) {
        // if the function doesn't accept a second parameter,
        // assume it's synchronous and move on
        play()
        next()
      } else {
        // if the function expects a second parameter,
        // assume it's async and let it call done itself
        play(next)
      }
    } else if (typeof(play) === 'object') {
      // publish a message
      if (Array.isArray(play)) {
        play = {
          from: play[0],
          data: play[1],
        }
      }
      play.from.add(play.data, withException(next))
    }
  }

  // run the first play to kick things off
  runPlay(0)
}

Playbook.use = function (...args) {
  scuttlebot.use(...args)
  return Playbook
}

module.exports = Playbook
