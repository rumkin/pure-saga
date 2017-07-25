# Pure Saga

Pure saga is a functional implementation of generator based asyncronous flow
manager based on effects yielding.

## Installation

Via npm:
```shell
npm i pure-saga
```

Or via unpkg.com:

```html
<script src="https://unpkg.com/pure-saga@3.0.0/dist/pure-saga.min.js"></script>
```

## Example

Define effects:
```javascript
const dataStore = new Map();

const effects = {
    call({fn, args}) {
        return fn(...args);
    },
    put({key, value}) {
        dataStore.set(key, value);
    },
    get({key}) {
        return dataStore.get(key);
    }
};

// Define effect factory
const effectHandlers = {
    call(fn, ...args) {
        return {
            type: 'call',
            payload: {
                fn,
                args,
            },
        };
    },
    put(key, value) {
        return {
            type: 'put',
            payload: {
                key,
                value,
            },
        }
    },
    get(key) {
        return {
            type: 'get',
            payload: {
                key,
            },
        }
    },
};
```

Define generator:
```javascript
function * loadUserSaga(userId) {
    // Retrieve user calling api.loadUser method
    const user = yield effect.call(api.loadUser, userId);

    // Put data to store
    yield effect.put('user', user);

    return user;
}
```

Create saga method:
```javascript
const loadUser = createSaga(loadUserSaga, effectHandlers);
```

Usage:
```javascript
loadUser(1)
.then((user) => {
    // Do something with user...
})
.catch((error) => console.error(error));
```

## Explanation

Let us have such async function:

```javascript
function loadUser(userId) {
    return api.loadUser(userId)
    .then((user) => {
        dataStore.set(userId, user);

        return user;
    });
}
```

Which is equivalent to previously described `loadUserSaga`. In this function we
could not check if dataStore.set was called with correct param userId. But using
saga it could be checked with checking effect value:

```javascript
{
    type: 'put',
    payload: {
        key: 'user',
        value: {},
    },
}
```

Test example.

```javascript
function * getUserSaga() {
    const user = yield effect.get('user');

    return user;
}

describe('getUserSaga', () => {
    it('Should yield `get` effect', () => {
        const it = getUserSaga();

        const effect = it.next().value;

        // Check effect to be an instanceof get effect.
        should(effect).be.deepEqual({
            type: 'get',
            payload: {
                key: 'user',
            },
        });

        const user = {name: 'user'};
        const result = it.next(user).value;

        should(result).be.deepEqual(user);
    });
});
```

# License

MIT.
