resource "google_service_account" "cloud_build_deployer" {
  project      = var.app_project_id
  account_id   = "cloud-build-deployer"
  display_name = "Cloud Build deployer (build + push + deploy Cloud Run)"

  depends_on = [google_project_service.app]
}

# As duas permissões pedidas explicitamente.
resource "google_project_iam_member" "deployer_artifact_registry_writer" {
  project = var.app_project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloud_build_deployer.email}"
}

resource "google_project_iam_member" "deployer_cloud_run_developer" {
  project = var.app_project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.cloud_build_deployer.email}"
}

# Não pedido explicitamente, mas obrigatório: qualquer trigger do Cloud
# Build com service account customizada (em vez da conta padrão do Cloud
# Build) precisa desse role, senão o build falha ao gravar logs.
resource "google_project_iam_member" "deployer_log_writer" {
  project = var.app_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_build_deployer.email}"
}

# Identidade de runtime dos 2 serviços Cloud Run (cloud-run.tf). Dedicada em
# vez da conta padrão do Compute Engine: essa só existe com a API do Compute
# habilitada (que este projeto não usa) — referenciá-la sem a API falha com
# "Service account ...-compute@developer.gserviceaccount.com does not exist".
resource "google_service_account" "runtime" {
  project      = var.app_project_id
  account_id   = "argos-runtime"
  display_name = "Runtime dos serviços Cloud Run do Argos"

  depends_on = [google_project_service.app]
}

# Também obrigatório: para o deployer conseguir fazer "gcloud run deploy" de
# um serviço que roda com a SA de runtime, ele precisa "agir como" ela.
resource "google_service_account_iam_member" "deployer_act_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cloud_build_deployer.email}"
}

# O backend grava os dados no Firestore (firestore.tf) com a SA de runtime.
resource "google_project_iam_member" "runtime_firestore_user" {
  project = var.app_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}
