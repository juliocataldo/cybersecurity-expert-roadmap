# Como atualizar os números da ANPD no Radar Brasil

Os painéis da ANPD (comunicações de incidente de segurança) só existem como **Power BI**, sem CSV nem API.
Por isso os valores ficam num arquivo versionado, `tools/data/anpd.json`, e **não se atualizam sozinhos**.
O resto do Radar Brasil (alegações de ransomware) atualiza todo dia pelo GitHub Action.

Sugestão de cadência: uma vez por mês, ou quando quiser ver os números novos.

## O que é cada campo

| Campo | O que é |
|---|---|
| `atualizado` | Data da transcrição (`AAAA-MM-DD`). Aparece na página. |
| `total` / `ransomware` | Total de comunicações de todos os anos somados e quantas são de ransomware. |
| `anos[]` | `{ ano, incidentes, ransomware }` por ano. |
| `tipos[]` | `{ nome, n }`: tipos de incidente mais comunicados (soma dos anos). |
| `estados[]` | `{ uf, nome, total, ransomware }` por estado. Estado ausente = 0. |
| `foraDasUF[]` | Linhas sem UF, como "Estrangeira" e "Não informado". |

## Passo a passo

1. Abra a página oficial: <https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca> e entre nos painéis por ano (2021 a hoje).
2. Em cada painel, anote o **total de CIS** (cartão "Total de CIS") e a data de "Última Atualização".
3. Para os números por estado e por tipo, passe o mouse no visual e use **Mais opções (…) → Mostrar como uma tabela**.
   Assim os valores aparecem em texto e dá para copiar. Filtre por tipo de incidente "Ransomware" (os dois tipos de ransomware somados)
   para obter a coluna `ransomware`.
4. Some os anos para obter `total`, `ransomware`, `tipos` e `estados` (o arquivo guarda o acumulado de todos os anos), e atualize `anos[]`.
5. Edite `tools/data/anpd.json` e mude `atualizado` para a data de hoje.
6. Confira se os números fecham:

   ```bash
   node tools/anpd.mjs
   ```

   O script confere que a soma dos estados, a soma dos anos e o total batem (inclusive ransomware). Se não bater, diz onde.
7. Gere a página e rode os testes:

   ```bash
   node tools/build-radar-brasil.mjs
   node tests/validar-radar-brasil.mjs
   ```

8. Faça commit de `tools/data/anpd.json` e `radar.html`.

## Cuidados

- **ANPD não se soma às alegações.** São coisas diferentes (comunicação oficial de uma organização contra alegação de um criminoso).
- Transcreva só números agregados. Nunca copie nome de organização.
- Origem dos valores atuais: a primeira versão foi semeada a partir do levantamento do projeto
  [Panthera Census](https://github.com/marianabsctba/Panthera_Census) (`curadoria/anpd.json`, posição de 31/10/2026)
  e conferida contra o total de 2026 do painel oficial. Na primeira atualização, vale refazer a leitura direto dos painéis.
- Se a ANPD mudar o layout dos painéis, ajuste o passo 3 e registre aqui.
