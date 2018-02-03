'use strict';

const scuttlebot = require('scuttlebot')
const client = require('ssb-client')
const {withException} = require('./util')

const output = x => x
// const output = x => console.log(x)

const MESSAGE_DEF_KEY = 'playbook$message'
const TEST_DEF_KEY = 'playbook$test'

const Playbook = function (scriptBuilder, cleanup) {
  if (typeof(scriptBuilder) !== 'function') {
    throw "Function signature must be: (sbot) => (actors) => [script]"
    return
  }
  // create a temporary server instance just for this play-through
  const sbot = scuttlebot({ temp: true })

  // stuff to implement message refs
  const messageRefs = {}
  const setLabel = (label, val) => {
    if (label) {
      if (messageRefs[label]) {
        die(`There is already a message labeled ${label} in this playbook`)
      } else {
        messageRefs[label] = val
      }
    }
  }

  // for errors
  const die = msg => {
    sbot.close()
    throw msg
  }

  const script = scriptBuilder(sbot, messageRefs)
  if (typeof(script) !== 'function') {
    die("Function signature must be: (sbot) => (actors) => [script]")
  }

  // create as many feeds ("users") as there are arguments to `script`
  const feeds = new Array(script.length).fill().map(() => sbot.createFeed())
  const playbook = script(...feeds)

  if (!Array.isArray(playbook)) {
    die(`Playbook must be an array, but it is of type ${ typeof playbook }`)
  }

  output("•§•      Playbook starting with these actors      •§•")
  feeds.forEach(f => output(f.id))

  const runTestStep = (step, next) => {
    if (step.length === 0) {
        // if the function doesn't accept a parameter,
        // assume it's synchronous and move on
        step()
        next()
      } else {
        // if the function expects a parameter,
        // assume it's async and let it call done itself
        step(next)
      }
  }

  const runMessageStep = (step, next) => {
    if (step.length < 1 || step.length > 3) {
      die("A message must have two or three items in the following order:\n"
          + "(actor, data) or (actor, label, data)\n"
          + "Or it must be an object with keys {actor, data, label}")
    }
    let from, data, label
    if (step.length === 1) {
      from = step[0].from
      data = step[0].data
      label = step[0].label || null
    } else {
      const hasLabel = step.length === 3
      from = step[0]
      label = hasLabel ? step[1] : null
      data = hasLabel ? step[2] : step[1]
    }
    if (typeof data === 'function') {
      data = data(messageRefs)
    }
    from.add(data, withException(msg => {
      setLabel(label, msg)
      next()
    }))
  }

  const unpackStep = (step, next) => {
    if (step[MESSAGE_DEF_KEY]) {
      step = step[MESSAGE_DEF_KEY]
      runMessageStep(step, next)
    } else if (step[TEST_DEF_KEY]) {
      step = step[TEST_DEF_KEY]
      runTestStep(step, next)
    }
  }

  const runStep = (playNum) => {
    if (playNum >= playbook.length) {
      cleanup && cleanup()
      sbot.close()
      return
    }

    const next = () => runStep(playNum + 1)

    const step = unpackStep(playbook[playNum], next)
  }

  // run the first step to kick things off
  runStep(0)
}

Playbook.use = function (...args) {
  scuttlebot.use(...args)
  return Playbook
}

Playbook.step = {
  message: function (...args) {
    return {
      [MESSAGE_DEF_KEY]: args
    }
  },
  test: function (f) {
    return {
      [TEST_DEF_KEY]: f
    }
  }
}
module.exports = Playbook
