const pull = require('pull-stream')
const tape = require('tape')

const Playbook = require('..')
const {withException} = require('../util')

const step = Playbook.step

tape('can use object or array to send messages', t => {
  Playbook(sbot => guy => [
    step.message({
      from: guy,
      data: {
        type: 'test',
        msg: 'hallo',
      }
    }),
    step.message(guy, {
      type: 'test',
      msg: 'hallo',
    }),
    step.test(done => pull(
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
    ))
  ], t.end)
})

tape('message refs', t => {
  Playbook(sbot => (a, b, c) => [
    step.message({
      from: a,
      data: {
        type: 'test',
        msg: 'hey'
      },
      label: 'x',
    }),
    step.message(b, 'y', {
      type: 'test',
      msg: 'there'
    }),
    step.message(c, 'z', refs => ({
      type: 'test',
      msg: refs.x + ' ' + refs.y
    })),
    step.test(done => done())
  ], t.end)
})

tape('can omit param for syncronous tests', t => {
  Playbook(sbot => guy => [
    step.test(() => t.ok(true, 'this ran')),
    step.test(done => (t.ok(true, 'and so did this'), done())),
    step.test(() => t.ok(true, 'as well as this')),
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
