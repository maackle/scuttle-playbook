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

#### Message steps

A message step can be specified as an object, like this...

```js
{
  from: actor,
  data: {
    type: 'test',
    moreStuff: 'whatever you want!'
  }
}
```

...or as an array, like this:

```js
[actor, {type: 'test', moreStuff: 'whatever you want!'}]
```

#### Test steps

A test step is just a function. To handle asynchronous tests, your function can accept `done`, which you can call when the test is over, like this:

```js
done => {
  sbot.whoami((err, me) => {
    t.ok(me)
    done()
  })
}
```

If your test is purely synchronous, you can omit the `done` parameter and the playbook will continue after your function completes:

```js
() => {
  t.equal(1 + 1, 2)
  t.equal(e**(i * pi) + 1, 0)
}
```

Let's see how you can compose these steps together to create a playbook script.

## Usage

Here's a simple example for how you might test the recognition of friendship based on mutual following. It has two actors, `alice` and `bob`, and the script has six steps:

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
  // step 1 - message
  {
    from: alice,
    data: {
      type: 'contact',
      contact: bob.id,
      following: true
    }
  },
  // step 2 - test
  done => {
    sbot.testThatAliceFollowsBob((err, data) => done())
  },
  // step 3 - message
  {
    from: bob,
    data: {
      type: 'contact',
      contact: alice.id,
      following: true
    }
  },
  // step 4 - test
  done => {
    sbot.testThatBobAndAliceAreNowFriends((err, data) => done())
  },
  // step 5 - note that here we're using the array style just for illustration,
  // but otherwise it is not so different from the previous message steps
  [alice, {
    type: 'contact',
    contact: bob.id,
    following: false
  }],
  // step 6 - test
  done => {
    sbot.testThatAliceAndBobAreNoLongerFriends((err, data) => done())
  },
]

const finale = () => console.log('all done')

// run it
Playbook(script, finale)
```

## A little explanation

Note that the script takes a function with a signature like

```js
(sbot) => (actors) => [script]
```

The Playbook creates an sbot instance for you and passes it in. After that, it will create actors for you based on how many parameters you specify in the second set of parameters. For instance, if your function looks like this:

```js
sbot => (alvin, simon, theodore, larry, curly, moe) => [...]
```

You will have six actors available in your script.

## Examples using actual testing frameworks

See [`examples/`](examples/) for examples of real tests using the [tape](https://github.com/substack/tape) test harness. Note that ssb-playbook is designed to let you use whatever test runner you want.

## Under the hood

Each time you run a script with `Playbook()`, a `scuttlebot` instance is created and destroyed. The instance is created with the `{temp: true}` option, which means your data will not be affected, and test data won't linger after a test is run.

Anything you pass to `Playbook.use()` is passed directly on to `scuttlebot`, so the instance that gets created will contain whatever plugins you `use`d.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-playbook
```
