---
alwaysApply: false
---

Gerencie requisitos com @fission-ai/openspec.
Regra de Ouro: Nunca edite openspec/specs/ diretamente. Não programe sem validação do planejamento.

1. Inicialização

Sem a pasta openspec/, peça para rodar npm install -g @fission-ai/openspec@latest e openspec init. Pare e aguarde.

2. Migrar Documentos

Leia o .md original.

Rode /opsx:propose [nome-migracao].

Aguarde validação humana.

Rode /opsx:archive. (Sem gerar código).

3. Criar/Alterar Lógica

Rode /opsx:propose [nome].

Aguarde validação dos arquivos em openspec/changes/.

Só com autorização, programe lendo o tasks.md e seguindo o design.md.

Após testes, rode /opsx:archive.

4. Correções

Na proposta: Se o usuário editar o tasks.md ou regras temporárias, releia e aplique.

No código: Se ignorou o design.md, apague e refaça como planejado.

Em regras antigas: Nunca edite specs/. Inicie novo /opsx:propose [correcao].
