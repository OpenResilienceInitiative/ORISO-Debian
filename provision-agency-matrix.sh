#!/bin/bash

# Helper script to provision Matrix account for an agency
# Usage: ./provision-agency-matrix.sh AGENCY_ID

if [ -z "$1" ]; then
    echo "Usage: $0 AGENCY_ID"
    echo "Example: $0 119"
    exit 1
fi

AGENCY_ID=$1

echo "Provisioning Matrix account for Agency ID $AGENCY_ID..."

kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -n caritas -- \
    curl -X POST "http://agencyservice:8084/internal/agencies/$AGENCY_ID/matrix-service-account" \
    -H "Content-Type: application/json" -v

echo ""
echo "Verifying Matrix credentials in database..."
kubectl exec -n caritas mariadb-0 -- mysql -uagencyservice -pagencyservice agencyservice \
    -e "SELECT id, name, matrix_user_id FROM agency WHERE id=$AGENCY_ID;"

