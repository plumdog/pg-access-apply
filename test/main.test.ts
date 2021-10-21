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

const dbConnection = (config?: ClientConfig) => async (actions: (client: Client) => Promise<void>) => {
    const client = getClient(config ?? {});
    await client.connect();
    try {
        await actions(client);
    } finally {
        await client.end();
    }
};

describe('database', () => {
    test('create database', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('create database with transaction', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('handle existing database', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('change connection limit', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('change connection limit with transaction', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });
});

describe('role', () => {
    test('create role', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('create role with transaction', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('change connection limit', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });

    test('change connection limit with transaction', async () => {
        await dbConnection()(async (client: Client) => {
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
        });
    });
});

describe('combined', () => {
    test('create new role, new role can connect ', async () => {
        const roleName = `testrole_${randString(12)}`;

        await dbConnection()(async (client: Client) => {
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
        });

        await dbConnection({
            user: roleName,
            password: 'mypass',
        })(async (client: Client) => {
            const result = await client.query('SELECT 1+1 as two');
            expect(result.rows[0].two).toEqual(2);
        });
    });

    test('create new database and new role with all privileges in that database, new role can create a table ', async () => {
        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        await dbConnection()(async (client: Client) => {
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
        });

        await dbConnection({
            database: databaseName,
        })(async (client: Client) => {
            const applier = pg_applier({
                query: client.query.bind(client),
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
        });

        await dbConnection({
            user: roleName,
            password: 'mypass',
        })(async (client: Client) => {
            await client.query('CREATE TABLE notes (title varchar(40) NOT NULL)');
            await client.query(`INSERT INTO notes VALUES ('testtitle')`);
            const result = await client.query('SELECT * FROM notes');
            expect(result.rows.length).toEqual(1);
            expect(result.rows[0].title).toEqual('testtitle');
        });
    });

    test('create new database and new role with all privileges in that database, new role can create a table, then revoke table write access, then cannot delete from the table', async () => {
        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        await dbConnection()(async (client: Client) => {
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
        });

        await dbConnection({
            database: databaseName,
        })(async (client: Client) => {
            const applier = pg_applier({
                query: client.query.bind(client),
            });

            await applier.grantOnDatabase({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    databases: [databaseName],
                },
            });

            await client.query('CREATE TABLE notes (title varchar(40) NOT NULL)');

            await applier.grantOnTable({
                roles: [roleName],
                properties: {
                    allPrivileges: true,
                    allTables: true,
                    schemas: ['PUBLIC'],
                },
            });
        });

        // Create a table using the new user
        await dbConnection({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        })(async (client: Client) => {
            await client.query(`INSERT INTO notes VALUES ('testtitle')`);
        });

        // Update permissions to allow only SELECT
        await dbConnection({
            database: databaseName,
        })(async (client: Client) => {
            const applier = pg_applier({
                query: client.query.bind(client),
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
        });

        await dbConnection({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        })(async (client: Client) => {
            const result = await client.query('SELECT * FROM notes');
            expect(result.rows.length).toEqual(1);
            expect(result.rows[0].title).toEqual('testtitle');

            await expect(client.query('DELETE FROM notes')).rejects.toThrow('permission denied for table notes');
        });
    });

    test('create new database and new role with connect privileges in that database, then remove connect privileges', async () => {
        const databaseName = `testdb_${randString(12)}`;
        const roleName = `testrole_${randString(12)}`;

        await dbConnection()(async (client: Client) => {
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
        });

        // Verify that we have connect access
        await dbConnection({
            user: roleName,
            password: 'mypass',
            database: databaseName,
        })(async (client: Client) => {
            await client.query('SELECT 1+1');
        });

        // Update permissions to allow remove CONNECT on the DB
        await dbConnection({
            database: databaseName,
        })(async (client: Client) => {
            const applier = pg_applier({
                query: client.query.bind(client),
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
        });

        await expect(
            getClient({
                user: roleName,
                password: 'mypass',
                database: databaseName,
            }).connect(),
        ).rejects.toThrow(`permission denied for database "${databaseName}"`);
    });
});
