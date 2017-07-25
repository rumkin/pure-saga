'use strict';

const createSaga = require('..');
const should = require('should');

describe('createSaga', function() {
    it('return function from function saga', function() {
        should(createSaga(function*(){}, {})).be.a.Function();
    });

    it('return object from object of sagas', function() {
        const sagas = createSaga({*saga(){}}, {});

        should(sagas.saga).be.a.Function();
    });

    it('run effect', function() {
        const effects = {
            call({fn, args = []}) {
                return fn(...args);
            },
        };

        let saga = createSaga(function *() {
            let result = yield {type: 'call', payload: {fn() { return 1 }}};

            return result + 1;
        }, effects);

        return saga()
        .then((result) => {
            should(result).be.equal(2);
        });
    });

    it('run effect from map', function() {
        const effects = new Map();

        effects.set('call', ({fn, args = []}) => fn(...args));

        let saga = createSaga(function *() {
            let result = yield {type: 'call', payload: {fn() { return 1 }}};

            return result + 1;
        }, effects);

        return saga()
        .then((result) => {
            should(result).be.equal(2);
        });
    });

    it('pass args', function() {
        let saga = createSaga(function *(a) {
            return a + 1;
        }, {});

        return saga(1)
        .then((result) => {
            should(result).be.equal(2);
        });
    });

    it('throw error', function() {
        let saga = createSaga(function *() {
            yield false;
        }, {});

        return saga()
        .catch((err) => err)
        .then((result) => {
            should(result).be.Error();
            should(result.message).match(/Invalid effect/);
        });
    });

    it('catch error', function() {
        let saga = createSaga(function *() {
            throw new Error('thrown');
        }, {});

        return saga()
        .catch((err) => err)
        .then((result) => {
            should(result).be.Error();
            should(result.message).match(/thrown/);
        });
    });

    it('catch effect error', function() {
        const effects = {
            throwing() {
                throw new Error('thrown');
            },
        };

        let saga = createSaga(function *() {
            yield {type: 'throwing'};
        }, effects);

        return saga()
        .catch((err) => err)
        .then((result) => {
            should(result).be.Error();
            should(result.message).match(/thrown/);
        });
    });
});
