terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Artifact Registry for our Docker images
resource "google_artifact_registry_repository" "skeet_repo" {
  location      = var.region
  repository_id = "skeet-repo"
  description   = "Docker repository for Skeet services"
  format        = "DOCKER"
}

# 2. Firewall rule to allow our service port
resource "google_compute_firewall" "allow_skeet" {
  name    = "allow-skeet-service"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["5445"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["skeet-service"]
}

# 3. Compute Engine Instance running COS with our container
resource "google_compute_instance" "skeet_be" {
  name         = "skeet-be-instance"
  machine_type = "e2-medium"
  zone         = "${var.region}-a"
  tags         = ["skeet-service"]

  boot_disk {
    initialize_params {
      image = "cos-cloud/cos-stable"
    }
  }

  network_interface {
    network = "default"
    access_config {
      # Include this block to give the VM an external IP
    }
  }

  metadata = {
    # This magic metadata tells COS how to run the container
    gce-container-declaration = yamlencode({
      spec = {
        containers = [{
          name  = "skeet-be"
          image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.skeet_repo.repository_id}/skeet-be:latest"
          env = [
            { name = "DATABASE_URL", value = var.database_url },
            { name = "GEMINI_API_KEY", value = var.gemini_api_key },
            { name = "PORT", value = "5445" },
            { name = "NODE_ENV", value = "production" }
          ]
          ports = [{ containerPort = 5445 }]
        }]
        restartPolicy = "Always"
      }
    })
  }

  service_account {
    # Minimal scope to pull images from Artifact Registry
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
