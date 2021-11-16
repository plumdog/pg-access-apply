import * as pathlib from 'path';
import * as fs from 'fs';
import * as t from 'io-ts';
import * as eta from 'eta';
import { isLeft } from 'fp-ts/lib/Either';

const PgAttributes = t.record(t.string, t.string);

type PgAttributes = t.TypeOf<typeof PgAttributes>;

const PgProperties = t.type({
    required: t.boolean,
    attributes: PgAttributes,
});

type PgProperties = t.TypeOf<typeof PgProperties>;

const PgType = t.partial({
    attributes: PgAttributes,
    properties: PgProperties,
    options: PgProperties,
});

type PgType = t.TypeOf<typeof PgType>;

const PgTypes = t.record(t.string, PgType);

type PgTypes = t.TypeOf<typeof PgTypes>;

const main = async () => {
    const raw: unknown = JSON.parse(fs.readFileSync(pathlib.join(__dirname, 'types.json'), 'utf8'));
    const parse = PgTypes.decode(raw);

    if (isLeft(parse)) {
        throw new Error('Incorrect shape');
    }

    const parsed: PgTypes = parse.right;

    const template = fs.readFileSync(pathlib.join(__dirname, '_types_template.ts'), 'utf8');

    const upperCaseFirst = (str: string): string => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const typesTs = eta.render(template, {
        types: parsed,
        upperCaseFirst,
    });

    if (typeof typesTs !== 'string') {
        throw new Error('Rendering failed');
    }

    const existing = fs.readFileSync(pathlib.join(__dirname, 'types.ts'), 'utf8');

    if (process.env.ERROR_ON_CHANGES) {
        if (existing !== typesTs) {
            console.error('Changes detected, exiting')
            process.exit(1);
        }
    }

    fs.writeFileSync(pathlib.join(__dirname, 'types.ts'), typesTs, {
        encoding: 'utf8',
    });
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
