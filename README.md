# pg-access-apply

Idempotent postgres database and role management

Loosely, this manages resources that are configured and then handed
over to an application to use. Eg: you create a database and a role,
then pass this configuration over to an application which creates and
manages tables etc within that database. The goal of this library is
to manage things like databases and roles.

# Supported Postgres resources

- Database
- Role (aka User, aka Group)
- Tablespace (TODO)
- Schema (TODO)
- Role privileges (TODO)
