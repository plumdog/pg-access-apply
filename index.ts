// Maybe split to have {Role,Database}Properties and
// {Role,Database}Options. The former for actual things that get set
// in PG, the latter for things about how this client handles changes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResultRow = Record<string, any>;

type QueryResultRows = Array<QueryResultRow>;

interface QueryResult {
    rows: QueryResultRows;
}

export interface Config {
    query: (text: string, values?: Array<string>) => Promise<QueryResult>;
}

interface DatabaseOptions {
    owner?: string;
    template?: string;
    encoding?: string;
    lcCollate?: string;
    lcCtype?: string;
    tablespace?: string;
    connectionLimit?: number;
}

export interface Database extends DatabaseOptions {
    name: string;
}

interface RoleOptions {
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

export interface Role extends RoleOptions {
    name: string;
}

export interface PgApplier {
    database(database: Database): Promise<void>;
    role(role: Role): Promise<void>;
}

export const pg_applier = (config: Config): PgApplier => ({
    database: async (database: Database): Promise<void> => {
        const result = await config.query(
            `SELECT *, pg_encoding_to_char(encoding) as encoding_name, rolname as owner_role_name, spcname as tablespace_name FROM pg_database JOIN pg_authid ON pg_database.datdba = pg_authid.oid JOIN pg_tablespace ON pg_database.dattablespace = pg_tablespace.oid WHERE datname = '${database.name}'`,
        );
        if (result.rows.length) {
            // Database already exists

            const currentDbConfig = result.rows[0];

            const modifyChanges: DatabaseOptions = {};

            if (database.owner && currentDbConfig.owner_role_name !== database.owner) {
                modifyChanges.owner = database.owner;
            }

            if (database.encoding && currentDbConfig.encoding_name !== database.encoding) {
                modifyChanges.encoding = database.encoding;
            }

            if (database.lcCollate && currentDbConfig.datcollate !== database.lcCollate) {
                modifyChanges.lcCollate = database.lcCollate;
            }

            if (database.lcCtype && currentDbConfig.datctype !== database.lcCtype) {
                modifyChanges.lcCtype = database.lcCtype;
            }

            if (database.tablespace && currentDbConfig.tablespace_name !== database.tablespace) {
                modifyChanges.tablespace = database.tablespace;
            }

            if (database.connectionLimit && currentDbConfig.datconnlimit !== database.connectionLimit) {
                modifyChanges.connectionLimit = database.connectionLimit;
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

            // Apply changes
            if (modifyChanges.owner) {
                await config.query(`ALTER DATABASE ${database.name} OWNER TO ${database.owner}`);
            }

            if (modifyChanges.tablespace) {
                await config.query(`ALTER DATABASE ${database.name} TABLESPACE ${database.tablespace}`);
            }

            if (modifyChanges.connectionLimit) {
                await config.query(`ALTER DATABASE ${database.name} CONNECTION LIMIT ${database.connectionLimit}`);
            }

            return;
        }

        const createConfig: Array<string> = [];

        if (database.owner) {
            createConfig.push(`OWNER = ${database.owner}`);
        }
        if (database.template) {
            createConfig.push(`TEMPLATE = ${database.template}`);
        }
        if (database.encoding) {
            createConfig.push(`ENCODING = ${database.encoding}`);
        }
        if (database.lcCollate) {
            createConfig.push(`LC_COLLATE = ${database.lcCollate}`);
        }
        if (database.lcCtype) {
            createConfig.push(`LC_CTYPE = ${database.lcCtype}`);
        }
        if (database.tablespace) {
            createConfig.push(`TABLESPACE = ${database.tablespace}`);
        }
        if (database.connectionLimit) {
            createConfig.push(`CONNECTION LIMIT = ${database.connectionLimit}`);
        }

        const configQueryFragment = createConfig.join(' ');
        const query = `CREATE DATABASE ${database.name} ${configQueryFragment}`.trim();

        await config.query(query);
    },

    async role(role: Role): Promise<void> {
        const result = await config.query(`SELECT * FROM pg_roles WHERE rolname = '${role.name}'`);
        if (result.rows.length) {
            // Already exists
            const currentRoleConfig = result.rows[0];
            const modifyChanges: RoleOptions = {};

            if (typeof role.isSuperuser !== 'undefined' && currentRoleConfig.rolsuper !== role.isSuperuser) {
                modifyChanges.isSuperuser = role.isSuperuser;
            }
            if (typeof role.canCreateDb !== 'undefined' && currentRoleConfig.rolcreatedb !== role.canCreateDb) {
                modifyChanges.canCreateDb = role.canCreateDb;
            }
            if (typeof role.canCreateRole !== 'undefined' && currentRoleConfig.rolcreatedb !== role.canCreateRole) {
                modifyChanges.canCreateRole = role.canCreateRole;
            }
            if (typeof role.inherit !== 'undefined' && currentRoleConfig.rolinherit !== role.inherit) {
                modifyChanges.inherit = role.inherit;
            }
            if (typeof role.login !== 'undefined' && currentRoleConfig.rolcanlogin !== role.login) {
                modifyChanges.login = role.login;
            }
            if (typeof role.connectionLimit !== 'undefined' && currentRoleConfig.rolconnlimit !== role.connectionLimit) {
                modifyChanges.connectionLimit = role.connectionLimit;
            }
            // TODO join with pg_auth to check the password and whether it is encrypted
            if (typeof role.password !== 'undefined') {
                modifyChanges.password = role.password;
                if (typeof role.passwordEncrypted !== 'undefined') {
                    modifyChanges.passwordEncrypted = role.passwordEncrypted;
                }
            }
            if (typeof role.passwordValidUntil !== 'undefined' && currentRoleConfig.rolvaliduntil !== role.passwordValidUntil) {
                modifyChanges.passwordValidUntil = role.passwordValidUntil;
            }
            // TODO: check pg_auth_members for inRoles, roles and adminRoles config

            if (typeof modifyChanges.isSuperuser !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} ${modifyChanges.isSuperuser ? '' : 'NO'}SUPERUSER`);
            }
            if (typeof modifyChanges.canCreateDb !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} ${modifyChanges.canCreateDb ? '' : 'NO'}CREATEDB`);
            }
            if (typeof modifyChanges.canCreateRole !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} ${modifyChanges.canCreateRole ? '' : 'NO'}CREATEROLE`);
            }
            if (typeof modifyChanges.inherit !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} ${modifyChanges.inherit ? '' : 'NO'}INHERIT`);
            }
            if (typeof modifyChanges.login !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} ${modifyChanges.login ? '' : 'NO'}LOGIN`);
            }
            if (typeof modifyChanges.connectionLimit !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} CONNECTION LIMIT ${role.connectionLimit}`);
            }
            if (typeof modifyChanges.password !== 'undefined') {
                const encryptedQueryFragment = typeof modifyChanges.passwordEncrypted === 'undefined' ? '' : `${modifyChanges.passwordEncrypted ? '' : 'UN'}ENCRYPTED `;
                await config.query(`ALTER ROLE ${role.name} ${encryptedQueryFragment}PASSWORD ${modifyChanges.password}`);
            }
            if (typeof modifyChanges.passwordValidUntil !== 'undefined') {
                await config.query(`ALTER ROLE ${role.name} VALID UNTIL '${modifyChanges.passwordValidUntil.toISOString()}'`);
            }

            return;
        }

        const configFragments: Array<string> = [];

        if (typeof role.isSuperuser !== 'undefined') {
            configFragments.push(`${role.isSuperuser ? '' : 'NO'}SUPERUSER`);
        }
        if (typeof role.canCreateDb !== 'undefined') {
            configFragments.push(`${role.canCreateDb ? '' : 'NO'}CREATEDB`);
        }
        if (typeof role.canCreateRole !== 'undefined') {
            configFragments.push(`${role.canCreateRole ? '' : 'NO'}CREATEROLE`);
        }
        if (typeof role.inherit !== 'undefined') {
            configFragments.push(`${role.inherit ? '' : 'NO'}INHERIT`);
        }
        if (typeof role.login !== 'undefined') {
            configFragments.push(`${role.login ? '' : 'NO'}LOGIN`);
        }
        if (typeof role.connectionLimit !== 'undefined') {
            configFragments.push(`CONNECTION LIMIT ${role.connectionLimit}`);
        }
        if (typeof role.password !== 'undefined') {
            if (typeof role.passwordEncrypted !== 'undefined') {
                configFragments.push(`${role.passwordEncrypted ? '' : 'UN'}ENCRYPTED`);
            }
            configFragments.push(`PASSWORD '${role.password}'`);
        }
        if (typeof role.passwordValidUntil !== 'undefined') {
            configFragments.push(`VALID UNTIL '${role.passwordValidUntil.toISOString()}'`);
        }
        if (typeof role.inRoles !== 'undefined' && role.inRoles.length > 0) {
            configFragments.push(`IN ROLE ${role.inRoles.join(', ')}`);
        }
        if (typeof role.roles !== 'undefined' && role.roles.length > 0) {
            configFragments.push(`ROLE ${role.roles.join(', ')}`);
        }
        if (typeof role.adminRoles !== 'undefined' && role.adminRoles.length > 0) {
            configFragments.push(`ADMIN ${role.adminRoles.join(', ')}`);
        }

        const query = `CREATE ROLE ${role.name} ${configFragments.join(' ')}`.trim();

        await config.query(query);
    },
});
