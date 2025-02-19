const fs = require('fs');
const { promisify } = require('util');
const test = require('ava');
const validate = require('..');
const strip = require('../lib/strip');

// TODO: Use fs.promises when it no longer displays an ugly experimental warning
const readFile = promisify(fs.readFile);

const readFileOpts = { encoding: 'utf8' };

test('results have expected format', (t) => {
    const expectedResultTypes = ['pass', 'fail', 'info'];

    const results = validate('Message.');

    t.is(results.length, 7);

    for (const result of results) {
        t.is(typeof result.type, 'string');
        t.true(expectedResultTypes.includes(result.type));

        t.is(typeof result.message, 'string');
    }
});

test('strip', async (t) => {
    const unstripped = await readFile(
        'test/fixtures/should-be-stripped', { encoding: 'utf8' }
    );

    const stripped = `A commit message, this is

¯\\_(ツ)_/¯

Trailing whitespace for you?

Resolves #571`;

    t.is(strip(unstripped), stripped);
});

for (let i = 1; i <= 7; i++) {
    test(`rule ${i}`, async (t) => {
        if ([5, 7].includes(i)) {
            t.pass();
            return;
        }

        const violatesRule = await readFile(
            `test/fixtures/violates-${i}`, readFileOpts
        );

        const passesAll = fs.readFileSync('test/fixtures/passes-all', readFileOpts);

        t.is(validate(violatesRule)[i - 1].type, 'fail');
        t.is(validate(passesAll)[i - 1].type, 'pass');
    });
}

test('single line commit message', (t) => {
    const message = 'Fix absolutely nothing';
    const results = validate(message);

    for (const result of results) {
        t.not(result.type, 'fail');
    }
});

test('empty commit message', (t) => {
    const message = '';

    t.throws(() => {
        validate(message);
    });
});
