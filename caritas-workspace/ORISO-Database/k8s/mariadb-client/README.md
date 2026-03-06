# ORISO MariaDB Web Client (Dev)

Self-hosted MariaDB web client for the ORISO dev cluster, exposed as `https://db.oriso-dev.site`.

Security goals:
- Do **not** expose MariaDB TCP port publicly.
- Expose only a web UI behind the Kubernetes Ingress.
- Protect the UI with **Ingress Basic Auth**.
- Connect to MariaDB using a **view-only** database user (SELECT/SHOW VIEW only).

## What gets deployed

- Namespace: `caritas`
- Deployment: `oriso-mariadb-client` (phpMyAdmin)
- Service: `oriso-mariadb-client` (ClusterIP)
- Ingress: `oriso-mariadb-client-ingress` (host `db.oriso-dev.site`)
- ConfigMap: `oriso-mariadb-client-config` (phpMyAdmin config)

## Secrets required (create in cluster, do NOT commit)

1) Basic Auth for the website:

- Secret name: `oriso-mariadb-client-basic-auth`
- Key: `auth` (htpasswd format `user:hash`)

2) MariaDB credentials used by phpMyAdmin (view-only user):

- Secret name: `oriso-mariadb-client-db-credentials`
- Keys: `PMA_USER`, `PMA_PASSWORD`, `PMA_BLOWFISH_SECRET`

## Apply

From repo root:

1) Create the 2 secrets in namespace `caritas`.
2) Apply manifests:

`kubectl apply -k caritas-workspace/ORISO-Database/k8s/mariadb-client`


