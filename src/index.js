module.exports = createSagas;

/**
 * Generator constructor
 */
const GeneratorFunction = (function*(){}).constructor;

/**
 * Create promised function from generator with effects yielding.
 *
 * @param {function*} generator Generator function which yielding effects.
 * @param {object|Map<string,function>} effects_ Dictionary of effects handlers.
 * @return {function<Promise>} Asynchronous generator wrapper into Promise.
 */
function createSaga(generator, effects_) {
    let effects;

    if (effects_ instanceof Map) {
        effects = new Map(effects_.entries());
    }
    else {
        effects = new Map(entries(effects_));
    }

    return (...args) => {
        return runSaga(generator, effects, ...args);
    };
}


/**
 * Create saga from object.
 *
 * @param {object<string,generator>} sagas Object with name as key and saga as value.
 * @param {object<string,function>, Map<string,function>}  effects Object with effects where key is effect name and value is effect function.
 * @returns{object<string,function>} Return object of sagas.
 */
function createSagas(sagas, effects) {
    if (typeof sagas === 'function') {
        return createSaga(sagas, effects);
    }

    return Object.getOwnPropertyNames(sagas)
    .reduce((result, name) => {
        const saga = sagas[name];

        if (typeof saga === 'object') {
            result[name] = createSagas(saga, effects);
        }
        else {
            result[name] = createSaga(function (...args) {
                return sagas[name](...args);
            }, effects);
        }

        return result;
    }, {});
}

/**
 * Run saga generator with arguments for specific set of effects.
 *
 * @param {GeneratorFunction} generator Saga generator.
 * @param {Object} effects Collection of saga effect handlers.
 * @param {...*} [...args] List of arguments which should be passed into generator
 * @returns {Promise<*,Error>} Return promise resolved with generator result.
 */
function runSaga(generator, effects, ...args) {
    let it;
    try {
        it = generator(...args);
    }
    catch (err) {
        return Promise.reject(err);
    }

    return runIterator(it, effects);
}

/**
 * runIterator iterates over generator iterator of saga generator using
 * specified set of effect handlers.
 *
 * @param {Iterator} it Saga generator's iterator.
 * @param {Object} effects Collection of saga effects handlers.
 * @return {Promise<*,Error>} Return promise resolved with iterator result.
 */
function runIterator(it, effects) {
    return new Promise((resolve, reject) => {
        if (! isIterable(it)) {
            throw new Error('Not an Iterator');
        }

        if (it.done) {
            resolve(it.value);
            return;
        }

        function onError(err) {
            reject(err);
            tick();
        }

        function handleEffect(type, payload) {
            if (! effects.has(type)) {
                onError(new Error('Unknown effect type "' + type + '".'));
                return;
            }

            let result;
            try {
                result = effects.get(type)(payload || {});
            }
            catch (err) {
                onError(err);
                return;
            }

            if (isThenable(result)) {
                result.then(tick, onError);
            }
            else {
                tick(result);
            }
        }

        function tick(result) {
            let value, done;
            try {
                const res = it.next(result);
                value = res.value;
                done = res.done;
            }
            catch (err) {
                reject(err);
                return;
            }

            if (done) {
                resolve(value);
                return;
            }

            if (isIterable(value)) {
                runIterator(value, effects)
                .then(tick, onError);
                return;
            }

            if (! isObject(value)) {
                onError(new Error('Invalid effect'));
                return;
            }

            handleEffect(value.type, value.payload);
        };

        tick();
    });
}

// Helper methods

function isObject(value) {
    if (! value) {
        return;
    }

    return typeof value === 'object';
}

function isThenable(value) {
    if (! isObject(value)) {
        return false;
    }

    return (typeof value.then === 'function');
}

function isIterable(value) {
    if  (! isObject(value)) {
        return false;
    }

    return (typeof value.next === 'function');
}

function entries(value) {
    return Object.getOwnPropertyNames(value)
    .reduce(function(result, prop) {
        return result.concat([
            [prop, value[prop]],
        ]);
    }, []);
}
