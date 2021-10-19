import { Client } from 'pg';
import { pg_applier } from '../';

// TODO: lots and lots more tests

const getClient = (): Client => {
    return new Client({
        user: process.env.PG_USERNAME || '',
        host: process.env.PG_HOST || '',
        database: process.env.PG_USERNAME || '',
        password: process.env.PG_PASSWORD || '',
        port: parseInt(process.env.PG_PORT || '5432', 10),
    });
};

const randString = (length: number): string => {
    return Math.random().toString(36).substr(2, length);
};

describe('database', () => {
    test('create database', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            const databaseName = `testdb_${randString(12)}`;

            await applier.database({
                name: databaseName,
            });

            const result = await client.query('SELECT datname from pg_database');
            const dbs = [];
            for (const row of result.rows) {
                dbs.push(row.datname);
            }

            expect(dbs).toEqual(expect.arrayContaining([databaseName]));
        } finally {
            await client.end();
        }
    });

    test('handle existing database', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            const databaseName = `testdb_${randString(12)}`;

            await applier.database({
                name: databaseName,
            });

            await applier.database({
                name: databaseName,
            });

            const result = await client.query('SELECT datname from pg_database');
            const dbs = [];
            for (const row of result.rows) {
                dbs.push(row.datname);
            }

            expect(dbs).toEqual(expect.arrayContaining([databaseName]));
        } finally {
            await client.end();
        }
    });

    test('change connection limit', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            const databaseName = `testdb_${randString(12)}`;

            await applier.database({
                name: databaseName,
                connectionLimit: 10,
            });

            const db = (await client.query(`SELECT * FROM pg_database WHERE datname = '${databaseName}'`)).rows[0];
            expect(db.datconnlimit).toEqual(10);

            await applier.database({
                name: databaseName,
                connectionLimit: 20,
            });
            const db2 = (await client.query(`SELECT * FROM pg_database WHERE datname = '${databaseName}'`)).rows[0];
            expect(db2.datconnlimit).toEqual(20);
        } finally {
            await client.end();
        }
    });
});

describe('role', () => {
    test('create role', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            const roleName = `testrole_${randString(12)}`;

            await applier.role({
                name: roleName,
            });

            const result = await client.query('SELECT rolname from pg_roles');
            const roles = [];
            for (const row of result.rows) {
                roles.push(row.rolname);
            }

            expect(roles).toEqual(expect.arrayContaining([roleName]));
        } finally {
            await client.end();
        }
    });

    test('change connection limit', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            const roleName = `testrole_${randString(12)}`;

            await applier.role({
                name: roleName,
                connectionLimit: 10,
            });

            const role = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role.rolconnlimit).toEqual(10);

            await applier.role({
                name: roleName,
                connectionLimit: 20,
            });

            const role2 = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role2.rolconnlimit).toEqual(20);
        } finally {
            await client.end();
        }
    });
});
