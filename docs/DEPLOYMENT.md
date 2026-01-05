# Deployment Guide

Production deployment instructions for BuildingLens backend and mobile application.

## Table of Contents

- [Backend Deployment](#backend-deployment)
- [Mobile Deployment](#mobile-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling Considerations](#scaling-considerations)
- [Security Best Practices](#security-best-practices)
- [CI/CD Recommendations](#cicd-recommendations)
- [Troubleshooting](#troubleshooting)

## Backend Deployment

### AWS Deployment (ECS/Fargate)

#### Prerequisites

- AWS account with ECS, RDS, ElastiCache, and ECR access
- AWS CLI configured
- Docker installed locally

#### Step 1: Create Docker Image

```bash
cd /Users/amitgulati/Projects/JPD/buildinglens/server

# Build production image
docker build --target production -t buildinglens-backend:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker tag buildinglens-backend:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/buildinglens-backend:latest

# Push to ECR
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/buildinglens-backend:latest
```

#### Step 2: Set Up RDS PostgreSQL

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier buildinglens-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username buildinglens_user \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --publicly-accessible false \
  --db-subnet-group-name default \
  --vpc-security-group-ids sg-xxxxx

# Wait for instance to be available
aws rds describe-db-instances \
  --db-instance-identifier buildinglens-prod \
  --query 'DBInstances[0].DBInstanceStatus'
```

**Enable PostGIS**:
```bash
# Connect to RDS instance
psql -h buildinglens-prod.xxxxx.us-east-1.rds.amazonaws.com \
  -U buildinglens_user -d postgres

# Create database
CREATE DATABASE buildinglens;

# Connect to new database
\c buildinglens

# Enable PostGIS
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";

# Run migrations (see database setup section)
```

#### Step 3: Set Up ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id buildinglens-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name default

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id buildinglens-redis \
  --show-cache-node-info
```

#### Step 4: Create ECS Cluster & Task Definition

```bash
# Create cluster
aws ecs create-cluster --cluster-name buildinglens-prod

# Create task definition (see below for JSON)
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

**task-definition.json**:
```json
{
  "family": "buildinglens-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/buildinglens-backend:latest",
      "portMappings": [
        {
          "containerPort": 3100,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3100"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:buildinglens/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:buildinglens/redis-url"
        },
        {
          "name": "GOOGLE_MAPS_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:buildinglens/google-maps-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/buildinglens-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "wget --quiet --tries=1 --spider http://localhost:3100/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Step 5: Create ECS Service

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name buildinglens-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name buildinglens-tg \
  --protocol HTTP \
  --port 3100 \
  --vpc-id vpc-xxxxx

# Create service
aws ecs create-service \
  --cluster buildinglens-prod \
  --service-name backend \
  --task-definition buildinglens-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3100 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}"
```

#### Step 6: Configure Auto Scaling

```bash
# Create auto scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/buildinglens-prod/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name buildinglens-scaling \
  --service-namespace ecs \
  --resource-id service/buildinglens-prod/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json**:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 300
}
```

### Kubernetes Deployment

**docker-compose equivalent in Kubernetes**:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: buildinglens-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: buildinglens-backend
  template:
    metadata:
      labels:
        app: buildinglens-backend
    spec:
      containers:
      - name: backend
        image: buildinglens-backend:latest
        ports:
        - containerPort: 3100
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: buildinglens-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: buildinglens-backend-service
spec:
  type: LoadBalancer
  selector:
    app: buildinglens-backend
  ports:
  - port: 80
    targetPort: 3100
```

Deploy:
```bash
kubectl create secret generic buildinglens-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=redis-url=redis://...

kubectl apply -f deployment.yaml

# Scale if needed
kubectl scale deployment buildinglens-backend --replicas 5
```

## Mobile Deployment

### iOS Deployment via App Store

1. **Prerequisites**
   - Apple Developer account
   - Xcode 14+
   - iOS distribution certificate
   - Provisioning profile

2. **Build for distribution**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/mobile

   # Configure EAS (Expo Application Services)
   eas build:configure

   # Build for iOS
   eas build --platform ios --auto-submit
   ```

3. **Submit to App Store**
   ```bash
   # Submit automatically
   eas submit --platform ios

   # Or manually via App Store Connect
   ```

### Android Deployment via Google Play

1. **Prerequisites**
   - Google Play Developer account
   - Keystore file for signing
   - App signing key

2. **Build for Play Store**
   ```bash
   cd /Users/amitgulati/Projects/JPD/buildinglens/mobile

   # Build signed APK/AAB
   eas build --platform android

   # Submit
   eas submit --platform android
   ```

3. **Release Rollout**
   ```bash
   # Release in phases
   # Start with 10% of users
   # Monitor crash rates
   # Gradually increase to 100%
   ```

### Over-The-Air (OTA) Updates

Deploy code changes without app store review:

```bash
# Make code changes (no native code changes)
git add .
git commit -m "feat(mobile): update UI"

# Publish update
eas update

# Users get update on next app launch
```

**Limitations**:
- No native code changes
- No dependency updates
- No permission changes
- API changes must be backward compatible

## Environment Configuration

### Backend Environment Variables

**Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `GOOGLE_MAPS_API_KEY`: Google Maps API key
- `NOMINATIM_EMAIL`: Email for Nominatim API

**Production Defaults**:
```bash
NODE_ENV=production
PORT=3100
HOST=0.0.0.0

# Cache TTLs
REDIS_TTL_GEOCODING=2592000        # 30 days
REDIS_TTL_PLACES=604800            # 7 days
REDIS_TTL_IDENTIFY=3600            # 1 hour

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000          # 1 minute
RATE_LIMIT_MAX_REQUESTS=10          # Adjust per load

# Logging
LOG_LEVEL=info                      # Not debug in production

# Security
CORS_ORIGIN=https://yourdomain.com  # Restrict CORS in production
```

### Mobile Environment Variables

```bash
# Production API URL
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Secrets Management

**AWS Secrets Manager**:
```bash
# Store secrets
aws secretsmanager create-secret \
  --name buildinglens/database-url \
  --secret-string postgresql://...

# Reference in ECS task definition
"valueFrom": "arn:aws:secretsmanager:region:account:secret:buildinglens/database-url"
```

**Kubernetes Secrets**:
```bash
kubectl create secret generic buildinglens-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=google-maps-key=...

kubectl describe secret buildinglens-secrets
```

## Database Setup

### Initial Database Creation

1. **Connect to PostgreSQL**
   ```bash
   psql -h host -U buildinglens_user -d buildinglens
   ```

2. **Enable extensions**
   ```sql
   CREATE EXTENSION postgis;
   CREATE EXTENSION "uuid-ossp";
   ```

3. **Run migrations**
   ```sql
   -- Execute files from database/migrations/ in order
   \i /path/to/001_create_extensions.sql
   \i /path/to/002_create_buildings.sql
   ```

### Backup Strategy

**Daily automated backups**:

```bash
# AWS RDS automated backups (configured)
# - 30-day retention
# - Multi-AZ enabled

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier buildinglens-prod \
  --db-snapshot-identifier buildinglens-backup-$(date +%Y%m%d)
```

**PostgreSQL dumps**:
```bash
# Full database backup
pg_dump postgresql://user:pass@host/buildinglens > backup.sql

# Restore from backup
psql postgresql://user:pass@host/buildinglens < backup.sql
```

## Monitoring & Logging

### CloudWatch Monitoring

```bash
# View logs
aws logs tail /ecs/buildinglens-backend --follow

# Create metric alarm
aws cloudwatch put-metric-alarm \
  --alarm-name buildinglens-error-rate \
  --alarm-description "Alert if error rate exceeds 5%" \
  --metric-name ErrorCount \
  --namespace ECS \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

### Health Checks

API health endpoint:

```bash
# Should return 200 with service statuses
curl https://api.yourdomain.com/health

# Response:
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "externalAPIs": "healthy"
  }
}
```

### Metrics to Monitor

- **CPU usage**: < 70% during normal load
- **Memory usage**: < 80% of allocated
- **Database connections**: < 80% of pool size
- **Response time**: < 1000ms for most requests
- **Error rate**: < 1% of requests
- **Cache hit rate**: > 80%
- **Redis memory**: < 80% of allocated

### Application Performance Monitoring (APM)

**DataDog**:
```typescript
// src/index.ts
import tracer from 'dd-trace';
tracer.init(); // Must be before other imports

// Automatic monitoring of:
// - Express endpoints
// - Database queries
// - Redis operations
// - External API calls
```

## Scaling Considerations

### Horizontal Scaling

**Backend**:
- Stateless design allows easy horizontal scaling
- Load balancer distributes requests
- Database pooling handles connections
- Redis acts as shared cache

```bash
# ECS: Increase desired count
aws ecs update-service \
  --cluster buildinglens-prod \
  --service backend \
  --desired-count 5

# Kubernetes: Scale deployment
kubectl scale deployment buildinglens-backend --replicas 5
```

**Database**:
- Read replicas for read-heavy workloads
- Connection pooling at application level

```bash
# RDS: Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier buildinglens-prod-read \
  --source-db-instance-identifier buildinglens-prod
```

### Vertical Scaling

**Increase instance size**:

```bash
# Update ECS task definition CPU/memory
# Update Kubernetes resource requests/limits
# Restart services with new resources
```

### Caching Strategy

Reduce database load with multi-level caching:

1. **Redis cache** (1-hour results)
2. **Database cache** (7-day places data)
3. **Browser cache** (immutable API responses)

## Security Best Practices

### API Security

1. **HTTPS/TLS**
   - Use AWS Certificate Manager (free)
   - Enforce HTTPS redirect
   - HSTS headers

2. **CORS**
   ```typescript
   // Only allow specific origins
   CORS_ORIGIN=https://app.yourdomain.com
   ```

3. **Rate Limiting**
   ```bash
   RATE_LIMIT_MAX_REQUESTS=10    # Per minute per IP
   RATE_LIMIT_WINDOW_MS=60000
   ```

4. **API Authentication** (Future)
   - Implement API keys for client applications
   - Add JWT for user authentication
   - Rotate secrets regularly

### Database Security

1. **VPC Security Groups**
   - Database only accessible from app servers
   - Restrict inbound to app security group

2. **Encryption**
   - RDS: Enable encryption at rest
   - Backup: Encrypt backups

3. **Access Control**
   - Limited user: `buildinglens_user`
   - No superuser access
   - Separate read-only replicas

### Infrastructure Security

1. **Secrets Management**
   - Use AWS Secrets Manager
   - Rotate API keys monthly
   - Never commit secrets to git

2. **Logging**
   - Enable CloudTrail for API calls
   - Enable VPC Flow Logs
   - Archive logs for 90 days

3. **Network**
   - VPC with public/private subnets
   - NAT Gateway for outbound traffic
   - Web Application Firewall (WAF)

## CI/CD Recommendations

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '20'
    - run: npm install
    - run: npm run lint
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build and push Docker image
      run: |
        docker build -t buildinglens-backend .
        docker tag buildinglens-backend:latest ${{ secrets.ECR_REGISTRY }}/buildinglens-backend:latest
        docker push ${{ secrets.ECR_REGISTRY }}/buildinglens-backend:latest
    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster buildinglens-prod \
          --service backend \
          --force-new-deployment
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Lint checks passing
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker logs buildinglens-backend
aws logs tail /ecs/buildinglens-backend --follow

# Common issues:
# - Database URL invalid
# - Redis connection failed
# - API keys invalid
# - Port already in use
```

### Database Connection Issues

```bash
# Verify connection string
psql $DATABASE_URL -c "SELECT 1"

# Check security groups
aws ec2 describe-security-groups

# Verify RDS instance status
aws rds describe-db-instances --db-instance-identifier buildinglens-prod
```

### High Memory Usage

```bash
# Check Node.js heap
node --max-old-space-size=1024 dist/index.js

# Profile memory usage
clinic doctor -- npm start
```

### Slow Queries

```sql
-- Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
