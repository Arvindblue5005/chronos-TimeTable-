# Chronos Timetable - Docker & Jenkins Deployment Guide

This repository includes a multi-stage Docker setup and a declarative Jenkins CI/CD pipeline.

---

## 1. Quick Start with Docker

### A. Build and Run using Docker CLI
```bash
# Build the production image
docker build -t chronos-timetable:latest .

# Run the container (listening on port 3000)
docker run -d \
  -p 3000:3000 \
  -v chronos_vaults:/app/.sync_vaults \
  --name chronos-timetable \
  chronos-timetable:latest
```

### B. Run using Docker Compose
```bash
# Launch the application in the background
docker compose up -d

# Check running status and health check
docker compose ps

# View real-time container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

### C. Verify Health Endpoint
```bash
curl http://localhost:3000/api/health
# Response: {"status":"healthy","timestamp":"...","uptime":12.4}
```

---

## 2. CI/CD with Jenkins

The included `Jenkinsfile` provides an end-to-end declarative pipeline with the following stages:

1. **Environment Check**: Confirms Docker, Node, and environment tools.
2. **Install & Lint**: Validates TypeScript types and syntax (`npm run lint`).
3. **Build Application**: Compiles the optimized production Vite bundle (`npm run build`).
4. **Build Docker Image**: Constructs the multi-stage image tagged with `${BUILD_NUMBER}` and `latest`.
5. **Smoke Test & Health Check**: Spins up a temporary test container and validates the `/api/health` endpoint.
6. **Deploy**: Deploys the service using Docker Compose.

### Running Jenkins Locally (Turnkey Setup)
To run a local Jenkins controller pre-configured with Docker support:

```bash
# Start Jenkins controller
docker compose -f docker-compose.jenkins.yml up -d

# Get the initial admin password
docker exec chronos-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

1. Navigate to `http://localhost:8080` in your browser.
2. Enter the initial admin password from the command above.
3. Install suggested plugins and create a **Pipeline** job pointing to this repository's `Jenkinsfile`.
4. Trigger **Build Now** to execute the pipeline.
