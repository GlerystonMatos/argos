# Banco do Firestore usado pelo argos-back (argos-back/Argos.Armazenamento)
# no lugar da pasta dados/ efêmera do Cloud Run. Precisa ser o "(default)":
# a cota gratuita do Firestore vale para um único banco por projeto.
# "deletion_policy = ABANDON" faz um "terraform destroy" só esquecer o banco,
# sem apagar os dados.
resource "google_firestore_database" "default" {
  project     = var.app_project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  deletion_policy = "ABANDON"

  depends_on = [google_project_service.app]
}