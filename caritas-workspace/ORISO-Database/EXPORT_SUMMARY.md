# Database Schema Export Summary

## Last Export
**Date:** $(date +%Y-%m-%d\ %H:%M:%S)
**Source:** Production Kubernetes cluster (namespace: caritas)

## Exported Schemas

### MariaDB (7 databases)
All schemas exported from running production database:

1. ✅ **agencyservice** - Agency data schema
2. ✅ **userservice** - User, consultant, session data schema
3. ✅ **tenantservice** - Multi-tenancy configuration schema
4. ✅ **consultingtypeservice** - Consulting type metadata schema
5. ✅ **videoservice** - Video call data schema
6. ✅ **uploadservice** - File upload metadata schema
7. ✅ **caritas** - General/shared data schema

**Location:** `mariadb/{database}/schema.sql`

### MongoDB
**Database:** `consulting_types`

**Collections:**
- `consulting_types` - Consulting type JSON documents
- `application_settings` - Application-wide settings

**Export:** `mongodb/exported/consulting_types_export.archive`
**Collections List:** `mongodb/consulting_types/collections.txt`

### PostgreSQL (Matrix Synapse)
**Database:** `synapse`
**Purpose:** Matrix Synapse real-time communication data

**Schema:** `postgresql/matrix/schema.sql`

## Verification

All schemas have been exported from the currently running production system and are ready for use in new deployments.

## Next Steps

1. Review exported schemas
2. Use `./scripts/setup/02-apply-mariadb-schemas.sh` to apply MariaDB schemas to new server
3. Use `./scripts/setup/03-mongodb-setup.sh` to initialize MongoDB
4. Matrix PostgreSQL schema is managed automatically by Matrix Synapse

## Export Script

To re-export schemas from production:
```bash
./scripts/export-schemas.sh
```

This will create timestamped backups in `exported/` directories and update main schema files.
