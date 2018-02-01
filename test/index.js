const pull = require('pull-stream')
const tape = require('tape')

const Playbook = require('..')
const {withException} = require('../util')


tape('can use object or array to send messages', t => {
  t.plan(4)
  Playbook(sbot => guy => [
    {
      from: guy,
      data: {
        type: 'test',
        msg: 'hallo',
      }
    },
    [guy, {
      type: 'test',
      msg: 'hallo',
    }],
    done => pull(
      sbot.createLogStream(),
      pull.collect(withException(log => {
        const content = {
          type: 'test',
          msg: 'hallo',
        }
        t.deepEqual(log[0].value.content, content, 'object content ok')
        t.equal(log[0].value.author, guy.id, 'object author ok')
        t.deepEqual(log[1].value.content, content, 'array content ok')
        t.equal(log[1].value.author, guy.id, 'array author ok')
        done()
      }))
    )
  ], t.end)
})

tape('can omit param for syncronous tests', t => {
  Playbook(sbot => guy => [
    () => t.ok(true, 'this ran'),
    done => (t.ok(true, 'and so did this'), done()),
    () => t.ok(true, 'as well as this'),
  ], t.end)
})

tape('get sensible exceptions for bad init function', t => {
  t.throws(
    () => Playbook(sbot => guy => {}),
    /array/,
    "bad final type"
  )
  t.throws(
    () => Playbook(uhoh => 0),
    /signature/,
    "missing sbot parameter"
  )
  t.throws(
    () => Playbook([]),
    /signature/,
    "missing every parameter"
  )
  t.end()
})
