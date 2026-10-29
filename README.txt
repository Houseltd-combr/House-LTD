HOUSE LTD — RECONSTRUÇÃO DO ZERO 🍊
====================================

ARQUIVOS
- index.html: página inicial e formulários públicos.
- Style.css: visual laranja, verde e branco.
- script.js: formulários públicos e listagem de vagas.
- firebase.js: conexão com Firebase.
- admin.html: painel administrativo.
- admin.js: solicitações, trocas e vagas.
- firestore.rules: regras para publicar no Firestore.
- Fundo.mp4: coloque seu vídeo na raiz do mesmo repositório.

ANTES DE PUBLICAR
1. No firebase.js, substitua COLE_AQUI_SUA_API_KEY_COMPLETA pela apiKey completa do projeto Firebase `house-ltd`. O valor recebido anteriormente estava parcialmente oculto, então não invente nem use o valor incompleto.
2. Firebase Console → Authentication → Sign-in method → ative Anonymous (anônimo).
3. Firebase Console → Firestore Database → Rules → cole o conteúdo de firestore.rules e clique em Publish.
4. Configure um perfil administrativo autorizado conforme a seção abaixo.
5. Hospede pelo GitHub Pages. Como os arquivos usam JavaScript modules, abra o site por um servidor/hosting (GitHub Pages), não diretamente como arquivo local.

IMPORTANTE SOBRE O CÓDIGO 006LTD
O código compartilhado está configurado em admin.js como `006LTD`, conforme escolhido.
Por estar no JavaScript entregue ao navegador, ele NÃO é secreto e não autoriza sozinho operações no banco. O painel só continua se o UID autenticado também estiver autorizado na coleção `adminProfiles`.

COMO AUTORIZAR O PRIMEIRO DISPOSITIVO ADMINISTRATIVO
1. Publique os arquivos e regras, ative autenticação anônima e abra admin.html.
2. Digite seu nome e `006LTD`.
3. O painel mostrará o UID anônimo do navegador porque ainda não existe perfil autorizado.
4. No Firestore Console, crie um documento em `adminProfiles` cujo ID seja exatamente esse UID e adicione:
   { "active": true, "name": "Nome do ADM" }
5. Atualize admin.html e entre de novo.
6. Cada ADM/dispositivo precisa de seu próprio UID autorizado. Se limpar os dados do navegador ou trocar de dispositivo, o UID anônimo pode mudar; será necessário autorizar o novo UID.

Para uma proteção melhor, migre a administração para Firebase Authentication com contas individuais ou um backend/Cloud Function que valide o código no servidor. Não reutilize `006LTD` como senha de e-mail ou de outras contas.

COLEÇÕES USADAS
- characterRequests: fichas de recepção pendentes e analisadas.
- exchangeRequests: solicitações de troca.
- vagas: personagens disponíveis/fechados.
- members: registros de membros aprovados.
- adminProfiles: perfis de administradores autorizados.
- accessLogs e adminChat: reservadas para recursos futuros.

OBSERVAÇÕES IMPORTANTES
- O vídeo precisa se chamar exatamente `Fundo.mp4` (maiúsculas e minúsculas contam em hospedagem Linux) e ficar na raiz do repositório.
- A API key do Firebase para web normalmente identifica o projeto, mas as regras do Firestore são o que protege os dados.
- As imagens são aceitas como URLs http/https. Upload de imagem ainda não está conectado; Cloudinary pode ser integrado numa etapa seguinte.
- O fluxo atual cria o pedido e permite a análise administrativa. Antes de uso amplo, teste todas as ações com dados fictícios e confira a consistência de trocas e membros.


ATUALIZAÇÃO VISUAL/FUNCIONAL: tema escuro com laranja; ficha e troca continuam abrindo em área própria por botão; campo de foto usa upload de arquivo para Cloudinary; o código administrativo ignora espaços e diferença entre maiúsculas/minúsculas (006LTD).
