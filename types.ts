// Generated from types.json
export interface DatabaseProperties {
    owner?: string;
    template?: string;
    encoding?: string;
    lcCollate?: string;
    lcCtype?: string;
    tablespace?: string;
    connectionLimit?: number;
}

export interface Database {
    properties?: DatabaseProperties;
    name: string;
}

export interface RoleProperties {
    isSuperuser?: boolean;
    canCreateDb?: boolean;
    canCreateRole?: boolean;
    inherit?: boolean;
    login?: boolean;
    connectionLimit?: number;
    password?: string;
    passwordValidUntil?: Date;
    passwordEncrypted?: boolean;
    inRoles?: string[];
    roles?: string[];
    adminRoles?: string[];
}

export interface Role {
    properties?: RoleProperties;
    name: string;
}

export interface GrantOnDatabaseProperties {
    privileges?: string[];
    allPrivileges?: boolean;
    noPrivileges?: boolean;
    databases: string[];
    schemas?: string[];
}

export interface GrantOnDatabaseOptions {
    prune?: boolean;
}

export interface GrantOnDatabase {
    properties: GrantOnDatabaseProperties;
    options?: GrantOnDatabaseOptions;
    roles: string[];
}

export interface GrantOnTableProperties {
    privileges?: string[];
    allPrivileges?: boolean;
    noPrivileges?: boolean;
    tables?: string[];
    allTables?: boolean;
    schemas?: string[];
}

export interface GrantOnTableOptions {
    prune?: boolean;
    alterDefault?: boolean;
}

export interface GrantOnTable {
    properties: GrantOnTableProperties;
    options?: GrantOnTableOptions;
    roles: string[];
}

