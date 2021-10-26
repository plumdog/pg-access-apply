# pg-access-apply

Idempotent postgres database and role management

[Docs](https://www.plumdog.co.uk/pg-access-apply/)

[![npm version](https://badge.fury.io/js/pg-access-apply.svg)](https://badge.fury.io/js/pg-access-apply)

Loosely, this manages resources that are configured and then handed
over to an application to use. Eg: you create a database and a role,
then pass this configuration over to an application which creates and
manages tables etc within that database. The goal of this library is
to manage things like databases and roles.

# Supported Postgres resources

- Database
- Role (aka User, aka Group)
- Tablespace (TODO: https://github.com/plumdog/pg-access-apply/issues/11)
- Schema (TODO: https://github.com/plumdog/pg-access-apply/issues/12)
- Role privileges on:
    - Tables
    - Table columns (TODO: https://github.com/plumdog/pg-access-apply/issues/13)
    - Sequences (TODO: https://github.com/plumdog/pg-access-apply/issues/14)
    - Foreign data wrappers (TODO: https://github.com/plumdog/pg-access-apply/issues/15)
    - Foreign servers (TODO: https://github.com/plumdog/pg-access-apply/issues/16)
    - Functions (TODO: https://github.com/plumdog/pg-access-apply/issues/17)
    - Languages (TODO: https://github.com/plumdog/pg-access-apply/issues/18)
    - Large objects (TODO: https://github.com/plumdog/pg-access-apply/issues/19)
    - Schemas (TODO: https://github.com/plumdog/pg-access-apply/issues/20)
    - Tablespaces (TODO: https://github.com/plumdog/pg-access-apply/issues/21)
    - Other roles (TODO: https://github.com/plumdog/pg-access-apply/issues/22)
