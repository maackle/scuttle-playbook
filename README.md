# ssb-playbook

> ALICE: Knock knock.
>
> BOB: Who's there?
>
> ALICE: Scuttlebutt.
>
> BOB: Scuttlewhat??


Playbooks help you write tests for complex Secure Scuttlebutt apps. If you have app that builds up a complex state (such as a [flumeview](https://github.com/flumedb/flumedb)) from a series of messages that have been published by a number of parties, Playbooks can help with that.

A Playbook is a light structure that lets you define a "script" with one or more "actors" (users with their own key). Each line of the script specifies either a message to publish, or a test to run. The playbook ensures that each step only runs after the last has completed. It also handles creating and tearing down temporary scuttlebot servers as well as allocating feeds for the actors.

* `from`: the actor (using `sbot.createFeed()`)
* `data`: the content of the message to send
* `test`: an optional function to run some tests after the message has been published

## Usage

Here's a simple example for how you might test the recognition of friendship based on mutual following. It has two actors, `alice` and `bob`, and the script has three lines:

1. *publish* message: `alice` follows `bob`
2. *test*: that bob shows up in alice's follow graph
3. *publish* message: `bob` follows `alice`
4. *test*: that alice shows up in bob's follow graph and that they are friends
5. *publish* message: `alice` unfollows `bob`
6. *test*: that they are no longer friends

Skipping over the details of doing the actual testing, it might look something like this:

```js
const Playbook = require('ssb-playbook')
                 .use(whatever)
                 .use(you)
                 .use(want)

// define the script
const script = sbot => (alice, bob) => [
  // step 1
  {
    from: alice,
    data: {
      type: 'contact',
      contact: bob.id,
      following: true
    }
  },
  // step 2
  done => {
    testThatAliceFollowsBob((err, data) => done())
  },
  // step 3
  {
    from: bob,
    data: {
      type: 'contact',
      contact: alice.id,
      following: true
    }
  },
  // step 4
  done => {
    testThatBobAndAliceAreNowFriends((err, data) => done())
  },
  // step 5
  {
    from: alice,
    data: {
      type: 'contact',
      contact: bob.id,
      following: false
    }
  },
  // step 6
  done => {
    testThatAliceAndBobAreNoLongerFriends((err, data) => done())
  },
]

const finale = () => console.log('all done')

// run it
Playbook(script, finale)

```

## Examples using actual testing frameworks

See `examples/` for examples of real tests using [tape](https://github.com/substack/tape)

## Under the hood

Each time you run a script with `Playbook()`, a `scuttlebot` instance is created and destroyed. The instance is created with the `{temp: true}` option, which means your data will not be affected, and test data won't linger after a test is run.

Anything you pass to `Playbook.use()` is passed directly on to `scuttlebot`, so the instance that gets created will contain whatever plugins you `use`d.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-playbook
```
