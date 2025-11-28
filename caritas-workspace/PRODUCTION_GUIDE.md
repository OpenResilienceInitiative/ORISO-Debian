# ORISO Platform - Production Deployment Guide

## 🎯 Overview

This guide provides complete instructions for deploying the ORISO platform on a new Kubernetes cluster following best practices. All services have been refactored to use **ConfigMaps and Secrets** instead of hardcoded values, and **Kubernetes DNS names** instead of IP addresses.

---

## ✅ Pre-Deployment Checklist

- [ ] Kubernetes cluster (k3s/k8s) installed and running
- [ ] `kubectl` configured and able to access cluster
- [ ] All service images built and available
- [ ] Database schemas ready (ORISO-Database repository)
- [ ] Domain names configured (if using HTTPS)

---

## 📋 Architecture Principles

### 1. **No Hardcoded IPs**
- ✅ All services use **Kubernetes DNS names** (e.g., `mariadb.caritas.svc.cluster.local:3306`)
- ✅ DNS names ensure services can find resources even when pods are rescheduled
- ❌ **NEVER** use hardcoded IPs like `10.43.123.72:3306`

### 2. **ConfigMaps and Secrets**
- ✅ All configuration comes from **ConfigMaps** (non-sensitive) and **Secrets** (sensitive)
- ✅ No hardcoded values in application.properties files
- ✅ Configuration can be updated without rebuilding images

### 3. **Configuration Validation**
- ✅ All services validate required configuration on startup
- ✅ Services will **fail fast** with clear error messages if configs are missing
- ✅ Error messages guide you to fix missing ConfigMaps/Secrets

---

## 🚀 Deployment Steps

### Step 1: Create Namespace

```bash
kubectl create namespace caritas
```

### Step 2: Deploy Infrastructure (Databases)

```bash
cd caritas-workspace/ORISO-Kubernetes
kubectl apply -f deployments/01-infrastructure.yaml
kubectl apply -f deployments/02-redis-stack.yaml
```

Wait for databases to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=mariadb -n caritas --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongodb -n caritas --timeout=300s
```

### Step 3: Setup Database Schemas

```bash
cd caritas-workspace/ORISO-Database
./scripts/setup/00-master-setup.sh
```

This creates all databases, users, and applies schemas.

### Step 4: Create ConfigMaps and Secrets

**Apply all ConfigMaps:**
```bash
kubectl apply -f configmaps/services/userservice-config.yaml
kubectl apply -f configmaps/services/tenantservice-config.yaml
kubectl apply -f configmaps/services/agencyservice-config.yaml
kubectl apply -f configmaps/services/consultingtypeservice-config.yaml
```

**Apply all Secrets:**
```bash
kubectl apply -f secrets/services/userservice-secrets.yaml
kubectl apply -f secrets/services/tenantservice-secrets.yaml
kubectl apply -f secrets/services/agencyservice-secrets.yaml
kubectl apply -f secrets/services/consultingtypeservice-secrets.yaml
```

**Verify:**
```bash
kubectl get configmap -n caritas | grep -E "userservice|tenantservice|agencyservice|consultingtypeservice"
kubectl get secret -n caritas | grep -E "userservice|tenantservice|agencyservice|consultingtypeservice"
```

### Step 5: Update Deployment Files

**IMPORTANT:** You must update the deployment files to reference ConfigMaps and Secrets.

See `deployments/EXAMPLE-userservice-deployment-with-configmap.yaml` for the pattern.

**For each service deployment, replace hardcoded `env:` values with:**

```yaml
env:
  # Load all from ConfigMap
  - name: SPRING_DATASOURCE_URL
    valueFrom:
      configMapKeyRef:
        name: userservice-config
        key: SPRING_DATASOURCE_URL
  # Load all from Secret
  - name: SPRING_DATASOURCE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: userservice-secrets
        key: SPRING_DATASOURCE_PASSWORD
```

**Or use `envFrom` to load everything at once:**
```yaml
envFrom:
- configMapRef:
    name: userservice-config
- secretRef:
    name: userservice-secrets
```

### Step 6: Deploy Keycloak

```bash
kubectl apply -f deployments/03-keycloak.yaml
./scripts/configure-keycloak-http.sh  # CRITICAL!
```

### Step 7: Deploy Backend Services

**Update `deployments/04-backend-services.yaml`** to use ConfigMaps/Secrets, then:

```bash
kubectl apply -f deployments/04-backend-services.yaml
```

**Verify services start correctly:**
```bash
kubectl get pods -n caritas | grep -E "userservice|tenantservice|agencyservice|consultingtypeservice"
kubectl logs -n caritas deployment/userservice --tail=50
```

**If a service fails, check logs for configuration errors:**
```bash
kubectl logs -n caritas deployment/userservice | grep -i "config.*missing"
```

The error will tell you exactly which ConfigMap/Secret key is missing.

### Step 8: Deploy Frontend

```bash
kubectl apply -f deployments/05-frontend.yaml
```

### Step 9: Deploy Matrix

```bash
kubectl apply -f deployments/06-matrix.yaml
```

### Step 10: Deploy Nginx Proxy

```bash
kubectl apply -f configmaps/nginx-config.yaml
kubectl apply -f deployments/08-nginx-proxy.yaml
```

### Step 11: Apply Services

```bash
kubectl apply -f services/all-services.yaml
```

---

## 🔧 Configuration Management

### Updating Configuration

**To update a ConfigMap:**
```bash
# Edit the ConfigMap file
vim configmaps/services/userservice-config.yaml

# Apply changes
kubectl apply -f configmaps/services/userservice-config.yaml

# Restart the service to pick up changes
kubectl rollout restart deployment/userservice -n caritas
```

**To update a Secret:**
```bash
# Edit the Secret file
vim secrets/services/userservice-secrets.yaml

# Apply changes
kubectl apply -f secrets/services/userservice-secrets.yaml

# Restart the service
kubectl rollout restart deployment/userservice -n caritas
```

### Viewing Current Configuration

```bash
# View ConfigMap
kubectl get configmap userservice-config -n caritas -o yaml

# View Secret (values are base64 encoded)
kubectl get secret userservice-secrets -n caritas -o yaml
```

### Adding New Configuration

1. Add the key-value to the appropriate ConfigMap or Secret file
2. Apply the updated file: `kubectl apply -f configmaps/services/userservice-config.yaml`
3. Update the deployment to reference the new key (if not using `envFrom`)
4. Restart the service: `kubectl rollout restart deployment/userservice -n caritas`

---

## 🐛 Troubleshooting

### Service Fails to Start with "config 'X' is missing"

**Error:**
```
CRITICAL: Missing required configuration values. Please provide the following via ConfigMap/Secrets:
  - config 'spring.datasource.url (SPRING_DATASOURCE_URL)' is missing
```

**Solution:**
1. Check if ConfigMap exists: `kubectl get configmap userservice-config -n caritas`
2. Check if the key exists: `kubectl get configmap userservice-config -n caritas -o yaml | grep SPRING_DATASOURCE_URL`
3. If missing, add it to the ConfigMap file and reapply
4. Verify deployment references the ConfigMap correctly

### Service Cannot Connect to Database

**Check:**
1. Database pod is running: `kubectl get pods -n caritas | grep mariadb`
2. Database service exists: `kubectl get svc -n caritas | grep mariadb`
3. DNS name is correct: Should be `mariadb.caritas.svc.cluster.local:3306` (NOT an IP)
4. ConfigMap has correct DNS name: `kubectl get configmap userservice-config -n caritas -o yaml`

### Service Cannot Connect to Keycloak

**Check:**
1. Keycloak pod is running: `kubectl get pods -n caritas | grep keycloak`
2. Keycloak service exists: `kubectl get svc -n caritas | grep keycloak`
3. DNS name in ConfigMap: Should be `keycloak.caritas.svc.cluster.local:8080`

---

## 📝 DNS Name Reference

All services should use these DNS names:

| Service | DNS Name | Port |
|---------|----------|------|
| MariaDB | `mariadb.caritas.svc.cluster.local` | 3306 |
| MongoDB | `mongodb.caritas.svc.cluster.local` | 27017 |
| Keycloak | `keycloak.caritas.svc.cluster.local` | 8080 |
| RabbitMQ | `rabbitmq.caritas.svc.cluster.local` | 5672 |
| Matrix Synapse | `matrix-synapse.caritas.svc.cluster.local` | 8008 |
| UserService | `userservice.caritas.svc.cluster.local` | 8082 |
| TenantService | `tenantservice.caritas.svc.cluster.local` | 8081 |
| AgencyService | `agencyservice.caritas.svc.cluster.local` | 8084 |
| ConsultingTypeService | `consultingtypeservice.caritas.svc.cluster.local` | 8083 |

**Format:** `jdbc:mariadb://mariadb.caritas.svc.cluster.local:3306/databasename`

---

## 🔐 Security Best Practices

1. **Secrets Management:**
   - Store all passwords, tokens, and sensitive data in Kubernetes Secrets
   - Never commit secrets to Git (use `stringData` in YAML files, or use sealed-secrets)
   - Rotate secrets regularly

2. **ConfigMaps:**
   - Store non-sensitive configuration in ConfigMaps
   - Use DNS names, not IPs
   - Version control ConfigMaps (they're safe to commit)

3. **Network Policies:**
   - Consider implementing NetworkPolicies to restrict pod-to-pod communication
   - Only allow necessary service-to-service communication

---

## 📦 Service-Specific Configuration

### UserService

**Required ConfigMap Keys:**
- `SPRING_DATASOURCE_URL`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_REALM`
- `CONSULTING_TYPE_SERVICE_API_URL`
- `TENANT_SERVICE_API_URL`
- `MATRIX_API_URL`
- `ROCKET_CHAT_BASE_URL`
- `ROCKET_CHAT_MONGO_URL`
- `SPRING_RABBITMQ_HOST`
- `SPRING_DATA_MONGODB_URI`

**Required Secret Keys:**
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MATRIX_REGISTRATION_SHARED_SECRET`
- `ROCKET_TECHNICAL_USERNAME`
- `ROCKET_TECHNICAL_PASSWORD`

### TenantService

**Required ConfigMap Keys:**
- `SPRING_DATASOURCE_URL`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_REALM`
- `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`
- `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI`
- `CONSULTING_TYPE_SERVICE_API_URL`
- `USER_SERVICE_API_URL`

**Required Secret Keys:**
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

### AgencyService

**Required ConfigMap Keys:**
- `SPRING_DATASOURCE_URL`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_REALM`
- `SPRING_DATA_MONGODB_URI`
- `MATRIX_API_URL`
- `MATRIX_SERVER_NAME`
- `CONSULTING_TYPE_SERVICE_API_URL`
- `TENANT_SERVICE_API_URL`
- `USER_ADMIN_SERVICE_API_URL`

**Required Secret Keys:**
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MATRIX_REGISTRATION_SHARED_SECRET`
- `MATRIX_ADMIN_USERNAME`
- `MATRIX_ADMIN_PASSWORD`

### ConsultingTypeService

**Required ConfigMap Keys:**
- `SPRING_DATASOURCE_URL`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_REALM`
- `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`
- `SPRING_DATA_MONGODB_URI`
- `TENANT_SERVICE_API_URL`

**Required Secret Keys:**
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

---

## ✅ Verification

After deployment, verify all services are running:

```bash
# Check all pods
kubectl get pods -n caritas

# Check service health
curl http://localhost:8081/actuator/health  # TenantService
curl http://localhost:8082/actuator/health  # UserService
curl http://localhost:8083/actuator/health  # ConsultingTypeService
curl http://localhost:8084/actuator/health  # AgencyService

# Check logs for configuration errors
kubectl logs -n caritas deployment/userservice | grep -i "config.*missing"
```

---

## 🎓 Key Takeaways

1. **Always use DNS names** - Never hardcode IPs
2. **Use ConfigMaps/Secrets** - Never hardcode values in application.properties
3. **Services validate on startup** - They will fail fast with clear error messages
4. **Update configs without rebuilding** - Change ConfigMaps/Secrets and restart pods
5. **Follow the example** - See `deployments/EXAMPLE-userservice-deployment-with-configmap.yaml`

---

## 📚 Additional Resources

- **Database Setup:** `ORISO-Database/README.md`
- **Kubernetes Config:** `ORISO-Kubernetes/README.md`
- **Service READMEs:** Each service has its own README with specific details

---

## 🆘 Support

If you encounter issues:

1. Check service logs: `kubectl logs -n caritas deployment/SERVICE_NAME`
2. Look for "config 'X' is missing" errors
3. Verify ConfigMaps/Secrets exist and have correct keys
4. Verify deployment references ConfigMaps/Secrets correctly
5. Check DNS names are correct (use `.caritas.svc.cluster.local` format)

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0  
**Status:** Production Ready ✅

