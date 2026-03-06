# ORISO Status Page

Beautiful, professional status page for ORISO System

## Port
- **9200** (Production)

## Access
- https://status.oriso.site

## Features
- Real-time service monitoring
- Professional GitHub-inspired design
- React + Tailwind CSS
- Response time tracking
- Incident history

## Quick Start
```bash
npm install
npm run dev
```

## Production
```bash
docker build -t oriso-status:latest .
kubectl apply -f kubernetes-deployment.yaml
```
