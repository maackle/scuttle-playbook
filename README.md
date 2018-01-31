# ssb-playbooks

> ALICE: Knock knock.
>
> BOB: Who's there?
>
> ALICE: Scuttlebutt.
>
> BOB: Scuttlewhat??


Playbooks help you write tests for complex Secure Scuttlebutt apps. If you have app that builds up a complex state (such as a [flumeview](https://github.com/flumedb/flumedb)) from a series of messages that have been published by a number of parties, Playbooks can help with that.

A Playbook is a light structure that lets you define a "script" with one or more "actors". Each line of the script has three parts:

* `from`: the actor (using `sbot.createFeed()`)
* `data`: the content of the message to send
* `test`: an optional function to run some tests after the message has been published

## Usage

Coming up is a simple example for how you might test the recognition of friendship based on mutual following. It has two actors, `alice` and `bob`, and the script has three lines:

* `alice` follows `bob`, and we check that this has been recorded
* `bob` follows `alice`, and we check that they are now friends
* `alice` unfollows `bob`, and we check that they are no longer friends

It looks like this:

```js
const Playbook = require('ssb-playbooks')
                 .use(whatever)
                 .use(you)
                 .use(want)

// define the script
const script = (alice, bob) => [
  {
    from: alice,
    data: {
      type: 'contact',
      contact: bob.id,
      following: true
    }
    test: (sbot, done) => {
      // test that alice follows bob (we'll go into testing later)
      done()
    }
  },
  {
    from: bob,
    data: {
      type: 'contact',
      contact: alice.id,
      following: true
    }
    test: (sbot, done) => {
      // test that bob and alice are now friends
      done()
    }
  },
  {
    from: alice,
    data: {
      type: 'contact',
      contact: bob.id,
      following: false
    }
    test: (sbot, done) => {
      // test that alice and bob are *no longer* friends
      done()
    }
  },
]

const finale = () => console.log('all done')

// run it
Playbook(script, finale)

```

## Examples using testing frameworks

TODO

## Under the hood

Each time you run a script with `Playbook()`, a `scuttlebot` instance is created and destroyed. The instance is created with the `{temp: true}` option, which means your data will not be affected, and test data won't linger after a test is run.

Anything you pass to `Playbook.use()` is passed directly on to `scuttlebot`, so the instance that gets created will contain whatever plugins you `use`d.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-playbooks
```
