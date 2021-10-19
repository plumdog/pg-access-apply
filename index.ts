// Maybe add  {Role,Database}Options for things about how this client handles changes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResultRow = Record<string, any>;

type QueryResultRows = Array<QueryResultRow>;

interface QueryResult {
    rows: QueryResultRows;
}

export interface Config {
    query: (text: string, values?: Array<string>) => Promise<QueryResult>;
    useTransactions?: boolean;
}

interface DatabaseProperties {
    owner?: string;
    template?: string;
    encoding?: string;
    lcCollate?: string;
    lcCtype?: string;
    tablespace?: string;
    connectionLimit?: number;
}

export interface Database {
    name: string;
    properties?: DatabaseProperties;
}

interface RoleProperties {
    isSuperuser?: boolean;
    canCreateDb?: boolean;
    canCreateRole?: boolean;
    inherit?: boolean;
    login?: boolean;
    connectionLimit?: number;
    password?: string;
    passwordValidUntil?: Date;
    passwordEncrypted?: boolean;
    inRoles?: Array<string>;
    roles?: Array<string>;
    adminRoles?: Array<string>;
}

export interface Role {
    name: string;
    properties?: RoleProperties;
}

interface ExecuteQueriesProps {
    config: Config;
    queries: Array<string>;
}

const executeQueries = async (props: ExecuteQueriesProps): Promise<void> => {
    const runAllQueries = async (): Promise<void> => {
        for (const query of props.queries) {
            await props.config.query(query);
        }
    };

    if (!props.config.useTransactions) {
        await runAllQueries();
        return;
    }

    await props.config.query('BEGIN');
    try {
        await runAllQueries();
    } catch (err) {
        await props.config.query('ROLLBACK');
        throw err;
    }
    await props.config.query('COMMIT');
};

export interface PgApplier {
    database(database: Database): Promise<void>;
    role(role: Role): Promise<void>;
}

export const pg_applier = (config: Config): PgApplier => ({
    database: async (database: Database): Promise<void> => {
        const result = await config.query(
            `SELECT *, pg_encoding_to_char(encoding) as encoding_name, rolname as owner_role_name, spcname as tablespace_name FROM pg_database JOIN pg_authid ON pg_database.datdba = pg_authid.oid JOIN pg_tablespace ON pg_database.dattablespace = pg_tablespace.oid WHERE datname = '${database.name}'`,
        );

        const { properties = {} } = database;

        if (result.rows.length) {
            // Database already exists

            const currentDbConfig = result.rows[0];

            const modifyChanges: DatabaseProperties = {};

            if (properties.owner && currentDbConfig.owner_role_name !== properties.owner) {
                modifyChanges.owner = properties.owner;
            }

            if (properties.encoding && currentDbConfig.encoding_name !== properties.encoding) {
                modifyChanges.encoding = properties.encoding;
            }

            if (properties.lcCollate && currentDbConfig.datcollate !== properties.lcCollate) {
                modifyChanges.lcCollate = properties.lcCollate;
            }

            if (properties.lcCtype && currentDbConfig.datctype !== properties.lcCtype) {
                modifyChanges.lcCtype = properties.lcCtype;
            }

            if (properties.tablespace && currentDbConfig.tablespace_name !== properties.tablespace) {
                modifyChanges.tablespace = properties.tablespace;
            }

            if (properties.connectionLimit && currentDbConfig.datconnlimit !== properties.connectionLimit) {
                modifyChanges.connectionLimit = properties.connectionLimit;
            }

            // Check for invalid changes

            if (modifyChanges.encoding) {
                throw new Error('Cannot change the encoding of an existing database');
            }

            if (modifyChanges.lcCollate) {
                throw new Error('Cannot change the collation of an existing database');
            }

            if (modifyChanges.lcCtype) {
                throw new Error('Cannot change the ctype of an existing database');
            }

            const queries: Array<string> = [];
            // Apply changes
            if (modifyChanges.owner) {
                queries.push(`ALTER DATABASE ${database.name} OWNER TO ${properties.owner}`);
            }

            if (modifyChanges.tablespace) {
                queries.push(`ALTER DATABASE ${database.name} TABLESPACE ${properties.tablespace}`);
            }

            if (modifyChanges.connectionLimit) {
                queries.push(`ALTER DATABASE ${database.name} CONNECTION LIMIT ${properties.connectionLimit}`);
            }

            await executeQueries({
                config,
                queries,
            });

            return;
        }

        const createConfig: Array<string> = [];

        if (properties.owner) {
            createConfig.push(`OWNER = ${properties.owner}`);
        }
        if (properties.template) {
            createConfig.push(`TEMPLATE = ${properties.template}`);
        }
        if (properties.encoding) {
            createConfig.push(`ENCODING = ${properties.encoding}`);
        }
        if (properties.lcCollate) {
            createConfig.push(`LC_COLLATE = ${properties.lcCollate}`);
        }
        if (properties.lcCtype) {
            createConfig.push(`LC_CTYPE = ${properties.lcCtype}`);
        }
        if (properties.tablespace) {
            createConfig.push(`TABLESPACE = ${properties.tablespace}`);
        }
        if (properties.connectionLimit) {
            createConfig.push(`CONNECTION LIMIT = ${properties.connectionLimit}`);
        }

        const configQueryFragment = createConfig.join(' ');
        const query = `CREATE DATABASE ${database.name} ${configQueryFragment}`.trim();

        await executeQueries({
            config: {
                ...config,
                // Cannot use transaction for CREATE DATABASE. See https://www.postgresql.org/docs/14/sql-createdatabase.html
                useTransactions: false,
            },
            queries: [query],
        });
    },

    async role(role: Role): Promise<void> {
        const result = await config.query(`SELECT * FROM pg_roles WHERE rolname = '${role.name}'`);
        const { properties = {} } = role;
        if (result.rows.length) {
            // Already exists
            const currentRoleConfig = result.rows[0];
            const modifyChanges: RoleProperties = {};

            if (typeof properties.isSuperuser !== 'undefined' && currentRoleConfig.rolsuper !== properties.isSuperuser) {
                modifyChanges.isSuperuser = properties.isSuperuser;
            }
            if (typeof properties.canCreateDb !== 'undefined' && currentRoleConfig.rolcreatedb !== properties.canCreateDb) {
                modifyChanges.canCreateDb = properties.canCreateDb;
            }
            if (typeof properties.canCreateRole !== 'undefined' && currentRoleConfig.rolcreatedb !== properties.canCreateRole) {
                modifyChanges.canCreateRole = properties.canCreateRole;
            }
            if (typeof properties.inherit !== 'undefined' && currentRoleConfig.rolinherit !== properties.inherit) {
                modifyChanges.inherit = properties.inherit;
            }
            if (typeof properties.login !== 'undefined' && currentRoleConfig.rolcanlogin !== properties.login) {
                modifyChanges.login = properties.login;
            }
            if (typeof properties.connectionLimit !== 'undefined' && currentRoleConfig.rolconnlimit !== properties.connectionLimit) {
                modifyChanges.connectionLimit = properties.connectionLimit;
            }
            // TODO join with pg_auth to check the password and whether it is encrypted
            if (typeof properties.password !== 'undefined') {
                modifyChanges.password = properties.password;
                if (typeof properties.passwordEncrypted !== 'undefined') {
                    modifyChanges.passwordEncrypted = properties.passwordEncrypted;
                }
            }
            if (typeof properties.passwordValidUntil !== 'undefined' && currentRoleConfig.rolvaliduntil !== properties.passwordValidUntil) {
                modifyChanges.passwordValidUntil = properties.passwordValidUntil;
            }
            // TODO: check pg_auth_members for inRoles, roles and adminRoles config

            const queries: Array<string> = [];

            if (typeof modifyChanges.isSuperuser !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} ${modifyChanges.isSuperuser ? '' : 'NO'}SUPERUSER`);
            }
            if (typeof modifyChanges.canCreateDb !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} ${modifyChanges.canCreateDb ? '' : 'NO'}CREATEDB`);
            }
            if (typeof modifyChanges.canCreateRole !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} ${modifyChanges.canCreateRole ? '' : 'NO'}CREATEROLE`);
            }
            if (typeof modifyChanges.inherit !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} ${modifyChanges.inherit ? '' : 'NO'}INHERIT`);
            }
            if (typeof modifyChanges.login !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} ${modifyChanges.login ? '' : 'NO'}LOGIN`);
            }
            if (typeof modifyChanges.connectionLimit !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} CONNECTION LIMIT ${properties.connectionLimit}`);
            }
            if (typeof modifyChanges.password !== 'undefined') {
                const encryptedQueryFragment = typeof modifyChanges.passwordEncrypted === 'undefined' ? '' : `${modifyChanges.passwordEncrypted ? '' : 'UN'}ENCRYPTED `;
                queries.push(`ALTER ROLE ${role.name} ${encryptedQueryFragment}PASSWORD ${modifyChanges.password}`);
            }
            if (typeof modifyChanges.passwordValidUntil !== 'undefined') {
                queries.push(`ALTER ROLE ${role.name} VALID UNTIL '${modifyChanges.passwordValidUntil.toISOString()}'`);
            }
            await executeQueries({
                config,
                queries,
            });
            return;
        }

        const configFragments: Array<string> = [];

        if (typeof properties.isSuperuser !== 'undefined') {
            configFragments.push(`${properties.isSuperuser ? '' : 'NO'}SUPERUSER`);
        }
        if (typeof properties.canCreateDb !== 'undefined') {
            configFragments.push(`${properties.canCreateDb ? '' : 'NO'}CREATEDB`);
        }
        if (typeof properties.canCreateRole !== 'undefined') {
            configFragments.push(`${properties.canCreateRole ? '' : 'NO'}CREATEROLE`);
        }
        if (typeof properties.inherit !== 'undefined') {
            configFragments.push(`${properties.inherit ? '' : 'NO'}INHERIT`);
        }
        if (typeof properties.login !== 'undefined') {
            configFragments.push(`${properties.login ? '' : 'NO'}LOGIN`);
        }
        if (typeof properties.connectionLimit !== 'undefined') {
            configFragments.push(`CONNECTION LIMIT ${properties.connectionLimit}`);
        }
        if (typeof properties.password !== 'undefined') {
            if (typeof properties.passwordEncrypted !== 'undefined') {
                configFragments.push(`${properties.passwordEncrypted ? '' : 'UN'}ENCRYPTED`);
            }
            configFragments.push(`PASSWORD '${properties.password}'`);
        }
        if (typeof properties.passwordValidUntil !== 'undefined') {
            configFragments.push(`VALID UNTIL '${properties.passwordValidUntil.toISOString()}'`);
        }
        if (typeof properties.inRoles !== 'undefined' && properties.inRoles.length > 0) {
            configFragments.push(`IN ROLE ${properties.inRoles.join(', ')}`);
        }
        if (typeof properties.roles !== 'undefined' && properties.roles.length > 0) {
            configFragments.push(`ROLE ${properties.roles.join(', ')}`);
        }
        if (typeof properties.adminRoles !== 'undefined' && properties.adminRoles.length > 0) {
            configFragments.push(`ADMIN ${properties.adminRoles.join(', ')}`);
        }

        const query = `CREATE ROLE ${role.name} ${configFragments.join(' ')}`.trim();
        await executeQueries({
            config,
            queries: [query],
        });
    },
});
