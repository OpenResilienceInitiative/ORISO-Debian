# System Users Scripts

## Overview
Scripts for creating system/admin users in Matrix and MariaDB.

## Scripts

### 1. `system-users.sh` (Legacy - Shell Script)
**Status:** ⚠️ Works but has limitations

**Issues:**
- Hardcoded passwords in plain text
- Requires bash, kubectl, Python3, bcrypt on host system
- Direct SQLite database manipulation (fragile)
- Not ideal for managed clusters
- Domain was incorrect (now fixed)

**Usage:**
```bash
chmod +x system-users.sh
./system-users.sh
```

**Fixed Issues:**
- ✅ Matrix domain corrected: `91.99.183.160` (was `91.99.219.182`)
- ✅ Uses SQLite (Matrix is using SQLite, not PostgreSQL)

---

### 2. `system-users-job.yaml` (Recommended - Kubernetes Job)
**Status:** ✅ **RECOMMENDED** - Production-ready, portable

**Advantages:**
- ✅ Works on ALL Kubernetes systems (k3s, managed clusters, etc.)
- ✅ Passwords stored in Kubernetes Secrets (secure)
- ✅ Configuration in ConfigMap (no hardcoded values)
- ✅ Uses Matrix Admin API (proper method)
- ✅ Can be run as Helm hook (automatic)
- ✅ Portable kubectl image (no host dependencies)
- ✅ Proper RBAC (ServiceAccount with minimal permissions)
- ✅ Auto-cleanup (TTL after completion)

**Usage:**

1. **Create Secrets and ConfigMap:**
```bash
kubectl apply -f system-users-job.yaml
```

2. **Run the Job:**
```bash
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: create-system-users-$(date +%s)
  namespace: caritas
spec:
  template:
    spec:
      serviceAccountName: system-users-job
      containers:
      - name: create-users
        image: bitnami/kubectl:latest
        # ... (use content from system-users-job.yaml)
EOF
```

3. **Check Job Status:**
```bash
kubectl get jobs -n caritas | grep create-system-users
kubectl logs -n caritas -l app=create-system-users
```

**As Helm Hook:**
The Job includes Helm hook annotations, so it can run automatically after Helm install/upgrade:
```yaml
annotations:
  "helm.sh/hook": post-install,post-upgrade
```

---

## Which Method to Use?

### Use Kubernetes Job (`system-users-job.yaml`) if:
- ✅ Deploying to managed Kubernetes clusters
- ✅ Want secure password management (Secrets)
- ✅ Want automatic execution (Helm hooks)
- ✅ Want portability across systems
- ✅ Production environment

### Use Shell Script (`system-users.sh`) if:
- ⚠️ Quick manual setup on dev server
- ⚠️ You have all dependencies installed
- ⚠️ You're comfortable with hardcoded passwords

---

## Users Created

### Matrix Users:
- `@caritas_admin:91.99.183.160` (admin)
- `@oriso_call_admin:91.99.183.160` (admin)
- `@group-chat-system:91.99.183.160` (admin)

### MariaDB Users (in `userservice.user` table):
- `caritas_admin` (user_id)
- `oriso_call_admin` (user_id)
- `group-chat-system` (user_id)

---

## Security Notes

⚠️ **Important:**
- Store passwords securely (use Kubernetes Secrets)
- Rotate passwords regularly
- Use RBAC to limit access
- Don't commit secrets to version control

---

## Troubleshooting

### Matrix User Creation Fails
- Check Matrix pod is running: `kubectl get pods -n caritas -l app=matrix-synapse`
- Verify registration secret matches Matrix config
- Check Matrix logs: `kubectl logs -n caritas -l app=matrix-synapse`

### MariaDB User Creation Fails
- Check MariaDB pod: `kubectl get pods -n caritas -l app=mariadb`
- Verify database exists: `kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "SHOW DATABASES;"`
- Check user table structure: `kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "DESCRIBE userservice.user;"`

---

## Future Improvements

1. **Use Matrix Admin API properly** (with MAC generation)
2. **Add idempotency checks** (don't fail if user exists)
3. **Add validation** (verify users were created)
4. **Add rollback** (remove users on failure)
5. **Use Operator pattern** (for complex user management)



