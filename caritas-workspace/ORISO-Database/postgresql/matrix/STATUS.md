# Matrix PostgreSQL Status

## Current Status
⚠️ **PostgreSQL pod not found in Kubernetes cluster**

## Service Information
- **Service Name:** `matrix-postgres-service`
- **ClusterIP:** `10.43.243.112:5432`
- **Namespace:** `caritas`
- **Selector:** `app: matrix-postgres`

## Matrix Synapse Configuration
Matrix Synapse is configured to connect to PostgreSQL at:
- **Host:** `10.43.243.112` (via service)
- **Port:** `5432`
- **Database:** `synapse` (default)

## Possible Scenarios
1. **External PostgreSQL:** Database might be running outside the Kubernetes cluster
2. **Not Deployed:** PostgreSQL might not be deployed yet (service exists but no pod)
3. **Managed Service:** Could be a managed database service (e.g., AWS RDS, Azure Database)

## Export Instructions
If PostgreSQL becomes accessible, export schema with:

```bash
# If PostgreSQL pod exists:
kubectl exec -n caritas <postgres-pod> -- pg_dump -U synapse_user -d synapse --schema-only > postgresql/matrix/schema.sql

# If external PostgreSQL:
pg_dump -h 10.43.243.112 -U synapse_user -d synapse --schema-only > postgresql/matrix/schema.sql
```

## Notes
- Matrix Synapse manages its own database schema
- Schema is created automatically on first startup
- No manual schema management required for Matrix



