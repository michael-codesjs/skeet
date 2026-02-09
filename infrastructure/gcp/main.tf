terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

locals {
  # Hardcoded configuration
  project_id = "gen-lang-client-0763038183"
  region     = "us-central1"

  # Detect Stage from environment (defaults to dev)
  stage = "dev" # Can be set via -var="stage=prod" if needed
}

provider "google" {
  project = local.project_id
  region  = local.region
}

# --- Core Infrastructure ---

# 1. Artifact Registry for our Docker images
resource "google_artifact_registry_repository" "skeet_repo" {
  location      = local.region
  repository_id = "skeet-repo"
  description   = "Docker repository for Skeet services"
  format        = "DOCKER"
}

# --- Secret Manager (Vaults) ---

resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "gemini_key" {
  secret_id = "GEMINI_API_KEY"
  replication {
    auto {}
  }
}

# Values passed from GitHub Action secrets
resource "google_secret_manager_secret_version" "db_value" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}

resource "google_secret_manager_secret_version" "gemini_value" {
  secret      = google_secret_manager_secret.gemini_key.id
  secret_data = var.gemini_api_key
}

# --- Cloud Run Service ---

resource "google_cloud_run_v2_service" "skeet_be" {
  name     = "skeet-be-${local.stage}"
  location = local.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      max_instance_count = 1
    }

    containers {
      image = "${local.region}-docker.pkg.dev/${local.project_id}/${google_artifact_registry_repository.skeet_repo.repository_id}/skeet-be:latest"
      
      ports {
        container_port = 5445
      }

      env {
        name  = "NODE_ENV"
        value = local.stage == "prod" ? "production" : "development"
      }

      # Secrets mounted from Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

# Allow public access
resource "google_cloud_run_v2_service_iam_member" "noauth" {
  location = google_cloud_run_v2_service.skeet_be.location
  name     = google_cloud_run_v2_service.skeet_be.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Custom Domain
resource "google_cloud_run_domain_mapping" "api_custom_domain" {
  location = local.region
  name     = "api.tryskeet.com"

  metadata {
    namespace = local.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.skeet_be.name
  }
}

# --- Outputs ---

output "service_url" {
  value = google_cloud_run_v2_service.skeet_be.uri
}

output "custom_domain_url" {
  value = "https://api.tryskeet.com"
}
