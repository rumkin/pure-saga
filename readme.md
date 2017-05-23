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
    func({fn, args}) {
        return fn(...args);
    },
    store({key, value}) {
        dataStore.set(key, value);
    },
};

// Define effect factory
const effect = {
    func(fn, ...args) {
        return {
            type: 'func',
            payload: {
                fn,
                args,
            },
        };
    },
    store(key, value) {
        return {
            type: 'store',
            paylaod: {
                key,
                value,
            },
        }
    },
};
```

Define generator:
```javascript
function loadUserSaga(userId) {
    // Retrieve user with api call
    const user = yield effect.func(api.loadUser, userId);
    
    // Put data to store
    yield effect.store('user', user);
    
    return user;
}
```

Create saga method:
```javascript
const loadUser = createSaga(loadUserSaga, effects);
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
    type: 'store',
    payload: {
        key: 'user',
        value: {},
    },
}
```

# License

MIT.