# MongoDB Databases

## Overview
MongoDB stores JSON document data for consulting type configurations and topics.

## Connection Details
- **ClusterIP:** `10.43.61.124:27017`
- **Pod Name:** Check with `kubectl get pods -n caritas -l app=mongodb`
- **Authentication:** None (no username/password required)

## Database: consulting_types

### Purpose
Stores consulting type configurations, topics, and topic groups as JSON documents.

### Collections

**Current Collections (as of latest export):**
- `application_settings` - Application-wide settings
- `consulting_types` - Consulting type configuration documents

#### 1. consulting_types
**Purpose:** Consulting type configuration documents

**Structure:**
```json
{
  "id": 1,
  "slug": "general",
  "description": "General Counseling",
  "titles": {
    "default": "General Counseling",
    "short": "Counseling",
    "long": "General Online Counseling"
  },
  "isVideoCallAllowed": true,
  "roles": {
    "consultant": {
      "main": ["consultant"],
      "peer": ["consultant"]
    }
  },
  "registration": {
    "mandatoryFields": {
      "age": false,
      "state": false
    }
  },
  "welcomeMessage": {
    "sendWelcomeMessage": false,
    "welcomeMessageText": null
  }
}
```

**Indexes:**
- `id` (unique)

---

**Note:** Collections are created dynamically by the application. The structure may vary based on the current running system.

## Data Source
The consulting type JSON files are loaded from the file system at:
```
/workspace/consulting-type-settings/
├── consulting-type-0.json
├── consulting-type-1.json
└── consulting-type-2.json
```

These files are validated (when validation is enabled) and loaded into MongoDB by ConsultingTypeService on startup.

## JSON Schema Validation
⚠️ **JSON Schema Validation is DISABLED**

The ConsultingTypeService has schema validation disabled to prevent startup failures. This means:
- JSON files are NOT validated against the schema
- Services will attempt to deserialize and use the JSON as-is
- Invalid JSON may cause runtime errors

## Common Operations

### Connect to MongoDB
```bash
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1)
kubectl exec -it -n caritas ${POD#pod/} -- mongosh
```

### Switch to consulting_types Database
```javascript
use consulting_types
```

### List Collections
```javascript
db.getCollectionNames()
```

### Count Documents
```javascript
db.consulting_types.countDocuments()
db.application_settings.countDocuments()
```

### Find All Consulting Types
```javascript
db.consulting_types.find().pretty()
```

### Find Consulting Type by ID
```javascript
db.consulting_types.findOne({ _id: 1 })
```

### Export Collection
```bash
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- mongodump --db=consulting_types --collection=consulting_types --out=/tmp/backup
```

### Import Collection
```bash
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- mongorestore --db=consulting_types --collection=consulting_types /tmp/backup/consulting_types/consulting_types.bson
```

### Export All Collections (Recommended)
Use the export script:
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/export-schemas.sh
```

## Backup
Use the backup script:
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/backup/backup-mongodb.sh
```

## Restore
Use the restore script:
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/restore/restore-mongodb.sh /path/to/backup
```

## Important Notes
1. MongoDB is schema-less - collections are created automatically
2. No authentication is required (running in trusted network)
3. Data is persisted using Kubernetes PersistentVolume
4. Consulting type JSON files are the source of truth, not MongoDB
5. MongoDB is primarily a cache/runtime store for consulting type data

