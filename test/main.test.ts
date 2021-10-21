import { Client, ClientConfig } from 'pg';
import { pg_applier } from '../';

// TODO: lots and lots more tests

const getClient = (config?: ClientConfig): Client => {
    return new Client({
        user: process.env.PG_USERNAME || '',
        host: process.env.PG_HOST || '',
        database: process.env.PG_USERNAME || '',
        password: process.env.PG_PASSWORD || '',
        port: parseInt(process.env.PG_PORT || '5432', 10),
        ...(config || {}),
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

    test('create database with transaction', async () => {
        const client = getClient();
        await client.connect();

        try {
            // This works, but only because the code knows to *not*
            // use a transaction for database creation.
            const applier = pg_applier({
                query: client.query.bind(client),
                useTransactions: true,
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
                properties: {
                    connectionLimit: 10,
                },
            });

            const db = (await client.query(`SELECT * FROM pg_database WHERE datname = '${databaseName}'`)).rows[0];
            expect(db.datconnlimit).toEqual(10);

            await applier.database({
                name: databaseName,
                properties: {
                    connectionLimit: 20,
                },
            });
            const db2 = (await client.query(`SELECT * FROM pg_database WHERE datname = '${databaseName}'`)).rows[0];
            expect(db2.datconnlimit).toEqual(20);
        } finally {
            await client.end();
        }
    });

    test('change connection limit with transaction', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
                useTransactions: true,
            });

            const databaseName = `testdb_${randString(12)}`;

            await applier.database({
                name: databaseName,
                properties: {
                    connectionLimit: 10,
                },
            });

            const db = (await client.query(`SELECT * FROM pg_database WHERE datname = '${databaseName}'`)).rows[0];
            expect(db.datconnlimit).toEqual(10);

            await applier.database({
                name: databaseName,
                properties: {
                    connectionLimit: 20,
                },
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

    test('create role with transaction', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
                useTransactions: true,
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
                properties: {
                    connectionLimit: 10,
                },
            });

            const role = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role.rolconnlimit).toEqual(10);

            await applier.role({
                name: roleName,
                properties: {
                    connectionLimit: 20,
                },
            });

            const role2 = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role2.rolconnlimit).toEqual(20);
        } finally {
            await client.end();
        }
    });

    test('change connection limit with transaction', async () => {
        const client = getClient();
        await client.connect();

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
                useTransactions: true,
            });

            const roleName = `testrole_${randString(12)}`;

            await applier.role({
                name: roleName,
                properties: {
                    connectionLimit: 10,
                },
            });

            const role = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role.rolconnlimit).toEqual(10);

            await applier.role({
                name: roleName,
                properties: {
                    connectionLimit: 20,
                },
            });

            const role2 = (await client.query(`SELECT * FROM pg_roles WHERE rolname = '${roleName}'`)).rows[0];
            expect(role2.rolconnlimit).toEqual(20);
        } finally {
            await client.end();
        }
    });
});

describe('combined', () => {
    test('create new role, new role can connect ', async () => {
        const client = getClient();
        await client.connect();

        const roleName = `testrole_${randString(12)}`;

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            await applier.role({
                name: roleName,
                properties: {
                    password: 'mypass',
                    login: true,
                },
            });
        } finally {
            await client.end();
        }

        const newClient = getClient({
            user: roleName,
            password: 'mypass',
        });
        await newClient.connect();

        try {
            const result = await newClient.query('SELECT 1+1 as two');
            expect(result.rows[0].two).toEqual(2);
        } finally {
            await newClient.end();
        }
    });

    test('create new database and new role with all privileges in that database, new role can create a table ', async () => {
        const client = getClient();
        await client.connect();

        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            await applier.database({
                name: databaseName,
            });
            await applier.role({
                name: roleName,
                properties: {
                    password: 'mypass',
                    login: true,
                },
            });
        } finally {
            await client.end();
        }

        const client2 = getClient({
            database: databaseName,
        });
        await client2.connect();
        try {
            const applier = pg_applier({
                query: client2.query.bind(client2),
            });

            await applier.grantOnDatabase({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    databases: [databaseName],
                },
            });

            await applier.grantOnTable({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    allTables: true,
                    schemas: ['PUBLIC'],
                },
            });
        } finally {
            await client2.end();
        }

        const newClient = getClient({
            user: roleName,
            password: 'mypass',
        });
        await newClient.connect();

        try {
            await newClient.query('CREATE TABLE notes (title varchar(40) NOT NULL)');
            await newClient.query(`INSERT INTO notes VALUES ('testtitle')`);
            const result = await newClient.query('SELECT * FROM notes');
            expect(result.rows.length).toEqual(1);
            expect(result.rows[0].title).toEqual('testtitle');
        } finally {
            await newClient.end();
        }
    });

    test('create new database and new role with all privileges in that database, new role can create a table, then revoke table write access, then cannot delete from the table', async () => {
        const client = getClient();
        await client.connect();

        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            await applier.database({
                name: databaseName,
            });
            await applier.role({
                name: roleName,
                properties: {
                    password: 'mypass',
                    login: true,
                },
            });
        } finally {
            await client.end();
        }

        const client2 = getClient({
            database: databaseName,
        });
        await client2.connect();
        try {
            const applier = pg_applier({
                query: client2.query.bind(client2),
            });

            await applier.grantOnDatabase({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    databases: [databaseName],
                },
            });

            await client2.query('CREATE TABLE notes (title varchar(40) NOT NULL)');

            await applier.grantOnTable({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    allTables: true,
                    schemas: ['PUBLIC'],
                },
            });
        } finally {
            await client2.end();
        }

        // Create a table using the new user
        const newClient = getClient({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        });
        await newClient.connect();

        try {
            await newClient.query(`INSERT INTO notes VALUES ('testtitle')`);
        } finally {
            await newClient.end();
        }

        // Update permissions to allow only SELECT
        const client3 = getClient({
            database: databaseName,
        });
        await client3.connect();
        try {
            const applier = pg_applier({
                query: client3.query.bind(client3),
            });

            await applier.grantOnTable({
                roles: [roleName],
                properties: {
                    privileges: ['SELECT'],
                    allTables: true,
                    schemas: ['PUBLIC'],
                },
                options: {
                    prune: true,
                },
            });
        } finally {
            await client3.end();
        }

        const newClient2 = getClient({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        });
        await newClient2.connect();

        try {
            const result = await newClient2.query('SELECT * FROM notes');
            expect(result.rows.length).toEqual(1);
            expect(result.rows[0].title).toEqual('testtitle');

            await expect(newClient2.query('DELETE FROM notes')).rejects.toThrow('permission denied for table notes');
        } finally {
            await newClient2.end();
        }
    });

    test('create new database and new role with connect privileges in that database, then remove connect privileges', async () => {
        const client = getClient();
        await client.connect();

        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        try {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            await applier.database({
                name: databaseName,
            });
            await applier.role({
                name: roleName,
                properties: {
                    password: 'mypass',
                    login: true,
                },
            });
            await applier.grantOnDatabase({
                roles: ['PUBLIC'],
                properties: {
                    noPrivileges: true,
                    databases: [databaseName],
                },
                options: {
                    prune: true,
                },
            });

            await applier.grantOnDatabase({
                roles: [roleName],
                properties: {
                    privileges: ['CONNECT'],
                    databases: [databaseName],
                },
                options: {
                    prune: true,
                },
            });
        } finally {
            await client.end();
        }

        // Verify that we have connect access
        const newClient = getClient({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        });
        await newClient.connect();

        try {
            await newClient.query('SELECT 1+1');
        } finally {
            await newClient.end();
        }

        // Update permissions to allow remove CONNECT on the DB
        const client2 = getClient({
            database: databaseName,
        });
        await client2.connect();
        try {
            const applier = pg_applier({
                query: client2.query.bind(client2),
            });

            await applier.grantOnDatabase({
                roles: [roleName],
                properties: {
                    noPrivileges: true,
                    databases: [databaseName],
                },
                options: {
                    prune: true,
                },
            });
        } finally {
            await client2.end();
        }

        const newClient2 = getClient({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        });

        try {
            await expect(newClient2.connect()).rejects.toThrow('permission denied for database');
        } finally {
            await newClient2.end();
        }
    });
});
