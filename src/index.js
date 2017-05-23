'use strict';

module.exports = createSaga;

/**
 * Create promised function from generator with effects yielding.
 * 
 * @param {function*} generator Generator function which yielding effects.
 * @param {Object<string,function>} effects_ Dictionary of effects handlers.
 * @return function<Promise<*,Error>> Asynchronous generator wrapper into Promise.
 */
function createSaga(generator, effects_) {
    let effects;
    
    if (effects_ instanceof Map) {
        effects = new Map(effects_.entries())
    }
    else {
        effects = new Map(Object.entries(effects_));
    }
    
    return (...args) => {
        return new Promise((resolve, reject) => {
            let it = generator(...args);
            
            const tick = (result) => {
                let value, done;
                try {
                    let res = it.next(result);
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
                
                let { type, payload } = value;
                
                if (effects.has(type)) {
                    let result;
                    try {
                        result = effects.get(type)(payload || {});
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
                    it.throw(new Error('Unknown effect type "' + type + '".'));
                    tick();
                    return;
                }
            }
            
            tick();
        });
    };
}
