'use strict';

module.exports = createSaga;

function createSaga(generator, effects) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            let it = generator(...args);

            const tick = (nextValue) => {
                let value, done;
                try {
                    let res = it.next(nextValue);
                    value = res.value;
                    done = res.done;
                } catch (err) {
                    reject(err);
                    return;
                }

                if (done) {
                    resolve(value);
                    return;
                }

                if (typeof value !== 'object' || value === null) {
                    it.throw(new Error('Invalid effect'));
                    tick();
                    return;
                }

                let {effect} = value;

                if (effects.hasOwnProperty(effect)) {
                    let result;
                    try {
                        result = effects[effect](value);
                    }
                    catch (err) {
                        it.throw(err);
                        tick();
                        return;
                    }

                    if (result && typeof result.then === 'function') {
                        result.then(tick, (err) => {
                            it.throw(err);
                            tick();
                        });
                    }
                    else {
                        tick(result);
                    }
                }
                else {
                    it.throw('Unknown effect type "' + effect + '".');
                    tick();
                    return;
                }
            };

            tick();
        });
    };
}
