import base64
import json
import os

import functions_framework
from google.cloud import billing_v1


@functions_framework.cloud_event
def disable_billing(cloud_event):
    """Desabilita o billing do projeto de app quando a notificação do budget
    indica gasto acima do orçamento.

    O Budget publica no tópico várias vezes por dia, com o gasto acumulado do
    mês, mesmo abaixo do limite — por isso a mensagem é inspecionada e só
    costAmount > budgetAmount desliga o billing (padrão oficial do Google:
    https://cloud.google.com/billing/docs/how-to/disable-billing-with-notifications).
    Mensagem que não é uma notificação de budget é registrada e ignorada.
    """
    try:
        dados = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
        notificacao = json.loads(dados)
        custo = float(notificacao["costAmount"])
        orcamento = float(notificacao["budgetAmount"])
    except (KeyError, TypeError, ValueError) as erro:
        print(f"Mensagem ignorada (não é notificação de budget): {erro!r}")
        return

    if custo <= orcamento:
        print(f"Gasto {custo} dentro do orçamento {orcamento}; nada a fazer.")
        return

    project_id = os.environ["APP_PROJECT_ID"]
    project_name = f"projects/{project_id}"

    client = billing_v1.CloudBillingClient()
    billing_info = client.get_project_billing_info(name=project_name)

    if not billing_info.billing_enabled:
        print(f"Billing já estava desabilitado em {project_id}; nada a fazer.")
        return

    client.update_project_billing_info(
        name=project_name,
        project_billing_info=billing_v1.ProjectBillingInfo(billing_account_name=""),
    )
    print(f"Gasto {custo} acima do orçamento {orcamento}: billing desabilitado em {project_id}.")
