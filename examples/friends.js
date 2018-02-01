const util = require('util')
const tape = require('tape')
const ssbClient = require('ssb-client')

const Playbook = require('..')
                 .use(require('scuttlebot/plugins/replicate'))
                 .use(require('ssb-friends'))


const followMessage = (target, following) => ({
  type: 'contact',
  contact: target.id,
  following: following,
})

tape('verify the follow graph', t => {

  Playbook(sbot => (alice, bob) => {
    const hops = util.promisify(sbot.friends.hops)
    return [
      {
        from: alice,
        data: followMessage(bob, true),
      },
      done => {
        hops(alice.id).then(aliceFollows => {
          t.deepEqual(aliceFollows, {
            [alice.id]: 0,
            [bob.id]: 1
          }, "alice follows bob")
          done()
        })
      },
      {
        from: bob,
        data: followMessage(alice, true),
      },
      done => {
        Promise.all([
          hops(alice.id),
          hops(bob.id)
        ]).then(([aliceFollows, bobFollows]) => {
          t.deepEqual(aliceFollows, {
            [alice.id]: 0,
            [bob.id]: 1,
          }, "alice still follows bob")
          t.deepEqual(bobFollows, {
            [bob.id]: 0,
            [alice.id]: 1,
          }, "bob follows alice")
          done()
        })
      },
      {
        from: alice,
        data: followMessage(bob, false),
      },
      done => {
        Promise.all([
          hops(alice.id),
          hops(bob.id)
        ]).then(([aliceFollows, bobFollows]) => {
          t.deepEqual(aliceFollows, {
            [alice.id]: 0,
            [bob.id]: 1,
          }, "alice still follows bob! (interesting...)")
          t.deepEqual(bobFollows, {
            [bob.id]: 0,
            [alice.id]: 1,
          }, "bob still follows alice")
          done()
        })
      }
    ]
  }, t.end)
})

tape('verify multiple hops in a closed loop', t => {
  Playbook(sbot => (amanda, brent, charlie) => [
    {
      from: amanda,
      data: followMessage(brent, true),
    },
    {
      from: brent,
      data: followMessage(charlie, true),
    },
    {
      from: charlie,
      data: followMessage(amanda, true),
    },
    done => {
      const hops = util.promisify(sbot.friends.hops)
      Promise.all([
        hops(amanda.id),
        hops(brent.id),
        hops(charlie.id),
      ]).then(([a, b, c]) => {
        t.deepEqual(a, {
          [amanda.id]: 0, [brent.id]: 1, [charlie.id]: 2
        }, "amanda's hop graph")
        t.deepEqual(b, {
          [brent.id]: 0, [charlie.id]: 1, [amanda.id]: 2
        }, "brent's hop graph")
        t.deepEqual(c, {
          [charlie.id]: 0, [amanda.id]: 1, [brent.id]: 2
        }, "charlie's hop graph")
        done()
      })
    }
  ], t.end)
})
