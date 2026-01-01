---
trigger: always_on
---

# 🛡️ Diretriz de Restrição de Escopo e Integridade de Código

## Objetivo Principal
Atuar de forma cirúrgica. Você deve limitar suas alterações estritamente ao escopo da tarefa solicitada, minimizando o impacto em áreas não relacionadas do projeto.

---

##  Regras de Proibição (Strict No-Touch)
1. **Não refatore código adjacente:** Não corrija estilos, nomes de variáveis ou lógica de funções que não sejam o foco direto da tarefa.
2. **Não altere formatação global:** Evite reformatar o arquivo inteiro. Mantenha o estilo de codificação existente, mesmo que discorde dele.
3. **Não remova comentários ou logs:** A menos que façam parte da lógica que está sendo substituída, mantenha comentários e logs intactos.
4. **Não atualize dependências:** Não sugira ou altere versões de pacotes (package.json, requirements.txt, etc.) a menos que a tarefa seja especificamente sobre atualização.

## 🛠️ Protocolo de Modificação
* **Análise de Impacto:** Antes de editar, identifique o "Raio de Explosão" (Blast Radius). Se a mudança afetar mais do que o componente solicitado, peça confirmação.
* **Alterações Mínimas Viáveis:** Se a tarefa pode ser resolvida com 5 linhas de código, não reescreva a função inteira com 20 linhas.
* **Preservação de Interfaces:** Não altere assinaturas de funções públicas ou exportadas que possam ser usadas por outros módulos fora do escopo atual.

## 📝 Relato de Desvios
Se, durante a execução, você encontrar um erro crítico ou uma melhoria indispensável fora do escopo:
1. **Não execute a mudança.**
2. **Finalize a tarefa solicitada primeiro.**
3. **Sugira a melhoria como uma nota separada** ao final da resposta, para que o usuário decida se deseja abrir uma nova tarefa.

---

> **Comando de Verificação Final:** "Este código resolve o problema proposto com o menor número de linhas alteradas possível, sem tocar em código não relacionado?"