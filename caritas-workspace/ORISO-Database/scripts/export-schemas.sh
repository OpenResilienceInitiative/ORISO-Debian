#!/bin/bash

# Script to export current database schemas from running Kubernetes cluster
# This exports the latest schemas from production databases
# Usage: ./scripts/export-schemas.sh

set -e

NAMESPACE="caritas"
EXPORT_DIR="exported"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Exporting database schemas from running cluster..."
echo "Namespace: $NAMESPACE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create export directories
mkdir -p mariadb/${EXPORT_DIR} mongodb/${EXPORT_DIR} postgresql/${EXPORT_DIR}

# Get pod names
MARIADB_POD=$(kubectl get pods -n $NAMESPACE -l app=mariadb -o jsonpath="{.items[0].metadata.name}")
MONGODB_POD=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath="{.items[0].metadata.name}")
POSTGRES_POD=$(kubectl get pods -n $NAMESPACE -l app=matrix-postgres -o jsonpath="{.items[0].metadata.name}")

if [ -z "$MARIADB_POD" ] || [ -z "$MONGODB_POD" ] || [ -z "$POSTGRES_POD" ]; then
    echo "❌ Error: Could not find database pods. Make sure they are running."
    exit 1
fi

echo "Found pods:"
echo "  - MariaDB: $MARIADB_POD"
echo "  - MongoDB: $MONGODB_POD"
echo "  - PostgreSQL: $POSTGRES_POD"
echo ""

# Export MariaDB schemas
echo "📊 Exporting MariaDB schemas..."
for db in agencyservice userservice tenantservice consultingtypeservice videoservice uploadservice caritas; do
    echo "  Exporting $db..."
    kubectl exec -n $NAMESPACE $MARIADB_POD -- \
        mysqldump -uroot -proot \
        --no-data \
        --skip-triggers \
        --skip-routines \
        --skip-events \
        --single-transaction \
        --routines=false \
        --events=false \
        $db 2>/dev/null > mariadb/${EXPORT_DIR}/${db}_schema_${TIMESTAMP}.sql
    
    if [ $? -eq 0 ]; then
        echo "    ✅ $db exported ($(wc -l < mariadb/${EXPORT_DIR}/${db}_schema_${TIMESTAMP}.sql) lines)"
        # Copy to main schema file
        cp mariadb/${EXPORT_DIR}/${db}_schema_${TIMESTAMP}.sql mariadb/${db}/schema.sql
    else
        echo "    ❌ Failed to export $db"
    fi
done

# Export MongoDB schema
echo ""
echo "📊 Exporting MongoDB schema..."
kubectl exec -n $NAMESPACE $MONGODB_POD -- \
    mongodump --db=consulting_types --archive 2>/dev/null | \
    kubectl exec -i -n $NAMESPACE $MONGODB_POD -- cat > mongodb/${EXPORT_DIR}/consulting_types_${TIMESTAMP}.archive 2>&1

if [ $? -eq 0 ]; then
    echo "  ✅ MongoDB export created"
    # Get collection names
    kubectl exec -n $NAMESPACE $MONGODB_POD -- \
        mongosh consulting_types --quiet --eval "db.getCollectionNames().forEach(c => print(c))" 2>/dev/null > mongodb/consulting_types/collections.txt
    echo "  ✅ Collections: $(cat mongodb/consulting_types/collections.txt | tr '\n' ' ')"
else
    echo "  ❌ Failed to export MongoDB"
fi

# Export PostgreSQL schema
echo ""
echo "📊 Exporting PostgreSQL schema..."
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
    pg_dump -U synapse -d synapse \
    --schema-only \
    --no-owner \
    --no-acl 2>/dev/null > postgresql/${EXPORT_DIR}/matrix_schema_${TIMESTAMP}.sql

if [ $? -eq 0 ]; then
    echo "  ✅ PostgreSQL schema exported ($(wc -l < postgresql/${EXPORT_DIR}/matrix_schema_${TIMESTAMP}.sql) lines)"
    # Copy to main schema file
    cp postgresql/${EXPORT_DIR}/matrix_schema_${TIMESTAMP}.sql postgresql/matrix/schema.sql
else
    echo "  ❌ Failed to export PostgreSQL"
fi

echo ""
echo "✅ Schema export completed!"
echo ""
echo "Exported files:"
echo "  - MariaDB: mariadb/${EXPORT_DIR}/*_schema_${TIMESTAMP}.sql"
echo "  - MongoDB: mongodb/${EXPORT_DIR}/consulting_types_${TIMESTAMP}.archive"
echo "  - PostgreSQL: postgresql/${EXPORT_DIR}/matrix_schema_${TIMESTAMP}.sql"
echo ""
echo "Main schema files updated:"
echo "  - mariadb/*/schema.sql"
echo "  - postgresql/matrix/schema.sql"

