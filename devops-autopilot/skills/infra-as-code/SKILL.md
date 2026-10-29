---
name: infra-as-code
description: Infrastructure as Code (IaC) specialist using Terraform, OpenTofu, and Pulumi for modular, secure, multi-cloud provisioning (AWS, GCP, Azure).
---

# Infrastructure as Code (IaC) Skill

This skill guides Antigravity in provisioning, managing, and automating cloud infrastructure declaratively using Terraform, OpenTofu, and Pulumi while enforcing security, state isolation, and modularity.

---

## 1. When to Activate

Activate this skill whenever the user:
- Requests cloud infrastructure definitions for AWS, GCP, or Azure.
- Wants to provision VPC networks, subnets, NAT gateways, and security groups.
- Sets up managed Kubernetes clusters (AWS EKS, GCP GKE, Azure AKS) or serverless runtimes.
- Provisions managed relational databases (AWS RDS Aurora, GCP Cloud SQL) and caches.
- Asks for Terraform/OpenTofu project structuring, module creation, or remote state locking.
- Inquires about migrating from Terraform to Pulumi (TypeScript/Python) or comparing both.
- Configures automated IaC CI/CD pipelines (speculative plans on PR, safe apply on merge).

---

## 2. Terraform Fundamentals

- **Providers**: Plugins defining APIs for target platforms (e.g., `aws`, `google`, `azurerm`, `kubernetes`, `helm`).
- **Resources**: Declarative definitions of infrastructure components (e.g., `aws_vpc`, `google_container_cluster`).
- **Variables (`variables.tf`)**: Parameterize modules with type constraints, defaults, and validation rules.
- **Outputs (`outputs.tf`)**: Expose resource attributes for consumption by root modules or downstream pipelines.
- **Modules**: Encapsulated, reusable packages of Terraform configurations.
- **State (`terraform.tfstate`)**: Single source of truth mapping declared resources to real-world cloud IDs.

---

## 3. Terraform Directory & Environment Architecture

Adopt a multi-environment, modular layout separating state per environment:

```text
terraform-infra/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── kubernetes/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── database/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   ├── backend.tf       # Remote state configuration for dev
    │   ├── main.tf          # Instantiates modules with dev sizing
    │   ├── terraform.tfvars
    │   └── variables.tf
    ├── staging/
    │   ├── backend.tf
    │   ├── main.tf
    │   └── terraform.tfvars
    └── prod/
        ├── backend.tf
        ├── main.tf
        ├── terraform.tfvars
        └── outputs.tf
```

---

## 4. State Management & Distributed Locking

Never store state locally or in Git. Always configure secure remote state backends.

### AWS S3 + DynamoDB Locking Pattern
```hcl
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
  backend "s3" {
    bucket         = "mycompany-terraform-state-prod"
    key            = "core-infra/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock-table"
  }
}
```

### GCP Cloud Storage Backend
```hcl
terraform {
  backend "gcs" {
    bucket = "mycompany-tfstate-prod"
    prefix = "terraform/state/production"
  }
}
```

---

## 5. Pulumi: Modern Code-Driven IaC

### When to Choose Pulumi over Terraform
- **Real Programming Languages**: Write infrastructure in TypeScript, Python, Go, or C# with standard loops, conditionals, classes, and package managers (npm, pip).
- **Unit Testing**: Test infrastructure logic with standard frameworks like Jest, PyTest, or Go test.
- **Complex Abstractions**: Dynamic resource generation based on application manifests or API calls.
- **Unified Developer Tooling**: Full IDE auto-completion, linting, and refactoring tools.

```typescript
// Pulumi TypeScript AWS Example
import * as aws from "@pulumi/aws";

const vpc = new aws.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { Environment: "production" },
});

export const vpcId = vpc.id;
```

---

## 6. Security Standards & Credential Handling

1. **Zero Hardcoded Secrets**:
   - Never place plain-text passwords or tokens in `.tf` or `.tfvars` committed to Git.
   - Use dynamic secret generation with cloud-native secret stores (`aws_secretsmanager_secret`, `google_secret_manager_secret`).
2. **Short-Lived Authentication**:
   - Authenticate Terraform runners via OpenID Connect (OIDC) with AWS IAM Roles or GCP Workload Identity.
3. **Data Source Lookups**:
   - Fetch external credentials and existing network identifiers dynamically via `data` sources.
4. **Automated Static Scanning**:
   - Run `checkov` or `tfsec` in CI to detect unencrypted buckets, broad security groups (`0.0.0.0/0`), and missing logging.

---

## 7. CI/CD Pipeline Automation Pattern

A standard GitHub Actions workflow for Terraform:
1. **Pull Request Trigger**:
   - `terraform fmt -check`
   - `tflint`
   - `tfsec .`
   - `terraform init`
   - `terraform plan -no-color -out=tfplan`
   - Post sanitized `plan` summary as PR comment.
2. **Merge to Main Trigger**:
   - `terraform init`
   - `terraform apply -auto-approve tfplan` (or protected manual approval step).

---

## 8. GCP Production Architecture Example (Terraform)

Provisions a VPC, private GKE Autopilot cluster, and Cloud SQL PostgreSQL instance.

```hcl
# provider.tf
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.20"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Network
resource "google_compute_network" "vpc" {
  name                    = "prod-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "prod-k8s-subnet"
  ip_cidr_range = "10.10.0.0/20"
  region        = var.gcp_region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}

# GKE Autopilot Cluster
resource "google_container_cluster" "primary" {
  name     = "prod-autopilot-cluster"
  location = var.gcp_region

  enable_autopilot = true
  network          = google_compute_network.vpc.self_link
  subnetwork       = google_compute_subnetwork.subnet.self_link

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "prod-db-instance"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"
    disk_size         = 50
    disk_autoresize   = true

    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }
}
```

---

## 9. AWS Production Architecture Example (Terraform)

Provisions a modular VPC, EKS Cluster, and Aurora PostgreSQL database.

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.7"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false # High availability across AZs
  enable_vpn_gateway = false

  tags = {
    "kubernetes.io/cluster/production-eks" = "shared"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"

  cluster_name    = "production-eks"
  cluster_version = "1.29"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    app_nodes = {
      min_size     = 2
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
  }
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "prod-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"

  identifier = "production-db"

  engine               = "postgres"
  engine_version       = "16.1"
  family               = "postgres16"
  instance_class       = "db.t4g.medium"
  allocated_storage     = 50
  max_allocated_storage = 200

  db_name  = "app_production"
  username = "app_master"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  deletion_protection = true
}
```
