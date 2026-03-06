# ORISO Platform - Complete Setup Guide

**Simple deployment guide for ORISO Platform using Helm charts**

**Version**: 3.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready

---

## 📋 Overview

ORISO (Online Beratung) is a complete counseling platform deployed on Kubernetes using Helm charts. This guide provides simple steps to deploy the entire platform.

---

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** (1.24+) - k3s recommended
2. **Helm 3.x** installed
3. **kubectl** configured
4. **Nginx Ingress Controller** installed
5. **Cert-Manager** installed (for TLS)
6. **DNS records** configured (for HTTPS)

### Deploy Everything

```bash
# Navigate to Helm directory
cd caritas-workspace/ORISO-Kubernetes/helm

# Update chart dependencies
cd oriso-platform
helm dependency update
cd ..

# Deploy entire platform
helm install oriso-platform ./oriso-platform \
  --namespace caritas \
  --create-namespace \
  -f values.yaml

# Deploy Ingress resources
cd ../ingress
kubectl apply -f .
```

**That's it!** The platform will deploy automatically.

---

## 📁 Repository Structure

```
caritas-workspace/
├── ORISO-Kubernetes/          # Kubernetes deployment
│   ├── helm/                   # Helm charts
│   │   ├── charts/            # Individual service charts
│   │   ├── oriso-platform/    # Master umbrella chart
│   │   ├── values.yaml        # Global values
│   │   └── README.md          # Helm deployment guide
│   ├── ingress/               # Ingress resources
│   │   ├── *.yaml            # Ingress configurations
│   │   └── README.md          # Ingress guide
│   └── README.md              # Kubernetes overview
├── ORISO-Database/             # Database schemas and setup
├── ORISO-Keycloak/            # Keycloak realm configuration
└── ORISO-*/                   # Individual service repositories
```

---

## 📚 Documentation

- **[Kubernetes Deployment](caritas-workspace/ORISO-Kubernetes/README.md)** - Main Kubernetes guide
- **[Helm Charts](caritas-workspace/ORISO-Kubernetes/helm/README.md)** - Helm deployment with prerequisites
- **[Ingress Configuration](caritas-workspace/ORISO-Kubernetes/ingress/README.md)** - Ingress setup guide

---

## 🔧 Prerequisites Setup

### 1. Install Kubernetes (k3s)

```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -

# Setup kubeconfig
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

# Verify
kubectl get nodes
```

### 2. Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### 3. Install Nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Verify
kubectl get pods -n ingress-nginx
```

### 4. Install Cert-Manager (for TLS)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Change this!
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 5. Create Required Secrets

```bash
# Create namespace
kubectl create namespace caritas

# MariaDB secrets
kubectl create secret generic mariadb-secrets -n caritas \
  --from-literal=MYSQL_ROOT_PASSWORD=your-password \
  --from-literal=MYSQL_DATABASE=caritas

# Redis secrets
kubectl create secret generic redis-secret -n caritas \
  --from-literal=password=your-password

# RabbitMQ secrets
kubectl create secret generic rabbitmq-secrets -n caritas \
  --from-literal=RABBITMQ_DEFAULT_USER=admin \
  --from-literal=RABBITMQ_DEFAULT_PASS=admin
```

### 6. Configure DNS

Point all subdomains to your server IP:
- `api.oriso-dev.site`
- `app.oriso-dev.site`
- `admin.oriso-dev.site`
- `auth.oriso-dev.site`
- `matrix.oriso-dev.site`
- And others as needed

---

## 🚀 Deployment Steps

### Step 1: Deploy Helm Charts

```bash
cd caritas-workspace/ORISO-Kubernetes/helm

# Update dependencies
cd oriso-platform
helm dependency update
cd ..

# Deploy
helm install oriso-platform ./oriso-platform \
  --namespace caritas \
  --create-namespace \
  -f values.yaml

# Monitor deployment
kubectl get pods -n caritas -w
```

### Step 2: Deploy Ingress Resources

```bash
cd caritas-workspace/ORISO-Kubernetes/ingress
kubectl apply -f .
```

### Step 3: Initialize Databases

**Database Setup:**
- **Setup Script:** `caritas-workspace/ORISO-Database/scripts/setup/00-master-setup.sh`
- **Documentation:** `caritas-workspace/ORISO-Database/README.md`
- **Schemas:** `caritas-workspace/ORISO-Database/mariadb/*/schema.sql`

```bash
cd caritas-workspace/ORISO-Database
./scripts/setup/00-master-setup.sh
```

**Database Backups (if restoring):**
- **Backup Location:** `caritas-workspace/ORISO-Database/backups/`
- **Restore Scripts:** `caritas-workspace/ORISO-Database/scripts/restore/`
- **Documentation:** See `caritas-workspace/ORISO-Database/README.md` for backup/restore procedures

**Create Admin Users:**
- **Script:** `caritas-workspace/ORISO-Database/scripts/system-users-job.yaml`
- **Documentation:** `caritas-workspace/ORISO-Database/scripts/README.md`
- Creates system users in Matrix and MariaDB (caritas_admin, oriso_call_admin, group-chat-system)

```bash
cd caritas-workspace/ORISO-Database/scripts
kubectl apply -f system-users-job.yaml
```

### Step 4: Import Keycloak Realm

**Keycloak Configuration:**
- **Realm File:** `caritas-workspace/ORISO-Keycloak/realm.json`
- **Documentation:** `caritas-workspace/ORISO-Keycloak/README.md` (if available)

**Import Realm:**
1. Access Keycloak admin console: `https://auth.oriso-dev.site/admin/`
2. Login: `admin` / `admin` (default, change in production)
3. Select "Master" realm → "Add realm"
4. Upload: `caritas-workspace/ORISO-Keycloak/realm.json`
5. Click "Create"

**Create Keycloak Admin Users:**
After realm import, create admin users in the `online-beratung` realm:
1. Go to Keycloak admin console → `online-beratung` realm
2. Navigate to "Users" → "Add user"
3. Create users as needed (see Keycloak documentation for details)

---

## ✅ Verification

```bash
# Check all pods
kubectl get pods -n caritas

# Check services
kubectl get svc -n caritas

# Check Ingress
kubectl get ingress -n caritas

# Check TLS certificates
kubectl get certificate -n caritas

# Test endpoints
curl -I https://app.oriso-dev.site
curl -I https://api.oriso-dev.site
curl -I https://admin.oriso-dev.site
```

---

## 🌐 Access URLs

After deployment, access services at:

- **Frontend:** `https://app.oriso-dev.site`
- **Admin:** `https://admin.oriso-dev.site`
- **API:** `https://api.oriso-dev.site`
- **Auth:** `https://auth.oriso-dev.site`
- **Matrix:** `https://matrix.oriso-dev.site`

---

## 🔄 Common Operations

### Upgrade Deployment

```bash
cd caritas-workspace/ORISO-Kubernetes/helm

# Update dependencies
cd oriso-platform
helm dependency update
cd ..

# Upgrade
helm upgrade oriso-platform ./oriso-platform \
  --namespace caritas \
  -f values.yaml
```

### Restart a Service

```bash
kubectl rollout restart deployment/<service-name> -n caritas
```

### View Logs

```bash
kubectl logs deployment/<service-name> -n caritas --tail=100
kubectl logs deployment/<service-name> -n caritas -f  # Follow
```

### Uninstall

```bash
helm uninstall oriso-platform --namespace caritas
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n caritas

# Check logs
kubectl logs <pod-name> -n caritas

# Check events
kubectl describe pod <pod-name> -n caritas
```

### Service Communication Issues

Verify service URLs use correct DNS names:
```bash
kubectl exec -n caritas <pod-name> -- env | grep SERVICE
```

All services should use `oriso-platform-` prefix:
- `oriso-platform-userservice.caritas.svc.cluster.local:8082`
- `oriso-platform-agencyservice.caritas.svc.cluster.local:8084`

### Ingress Not Working

```bash
# Check Ingress Controller
kubectl get pods -n ingress-nginx

# Check Ingress resources
kubectl get ingress -n caritas

# Check Ingress Controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```


### TLS Certificate Issues

```bash
# Check cert-manager
kubectl get pods -n cert-manager

# Check certificates
kubectl get certificate -n caritas
kubectl describe certificate <cert-name> -n caritas
```

---

## 📝 Notes

- All services use `oriso-platform-` prefix for service names
- Internal service communication uses Kubernetes DNS (`.svc.cluster.local`)
- External access uses Ingress with TLS certificates
- Persistent volumes are retained on uninstall

---

## 📞 Support

For detailed information, see:
- [Kubernetes README](caritas-workspace/ORISO-Kubernetes/README.md)
- [Helm README](caritas-workspace/ORISO-Kubernetes/helm/README.md)
- [Ingress README](caritas-workspace/ORISO-Kubernetes/ingress/README.md)

---

**Last Updated**: December 2025  
**Status**: ✅ Production Ready
