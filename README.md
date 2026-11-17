# Bingo do Network

Um bingo de networking para estudantes: cada casinha é uma missão (trocar ideias sobre currículo, pedir dicas de LinkedIn, conversar com quem já estagia...) e, para cumpri-la, você **escaneia o QR Code do perfil de outra pessoa**. Linha, coluna ou diagonal completa vira **bingo**.

**Demo:** [Github pages](https://camilabernardis.github.io/network.fatec/)

<!-- Depois de publicar, tire um print do celular, salve em docs/screenshot.png e descomente a linha abaixo:
![Tela do Bingo do Network](docs/screenshot.png)
-->

## Por que fiz

Eventos de networking costumam ser aleatórios: ninguém sabe com quem falar nem sobre o quê. O bingo transforma isso num jogo com objetivos concretos e deixa um registro das pessoas com quem conversei.

## Funcionalidades

- Tabuleiro 3x3 com casa livre central e 8 missões
- **Scanner de QR Code pela câmera** (perfis do LinkedIn e WhatsApp), com opção de colar o link caso a câmera falhe
- Regra anti-repetição: a mesma pessoa não vale para duas missões
- Missão especial dos 3 contatos: exige 3 pessoas de **semestres diferentes** entre si e do meu
- Detecção de bingo (8 linhas possíveis) com destaque visual e tela de comemoração
- Aba **Meu network** com todas as pessoas escaneadas e botão para copiar a lista
- Campo de anotações em cada missão
- Progresso salvo automaticamente no aparelho
- Layout pensado primeiro para celular

## Tecnologias

- HTML, CSS e JavaScript puros, sem framework e sem build
- [jsQR](https://github.com/cozmo/jsQR) para decodificar o QR Code a partir dos frames da câmera
- `getUserMedia` para acessar a câmera e `localStorage` para persistir o estado
- Hospedagem no GitHub Pages (HTTPS, necessário para a câmera)

## Como funciona

1. A câmera abre em tela cheia e cada frame é desenhado num `<canvas>` reduzido, depois enviado ao jsQR.
2. O texto do QR é interpretado por `parseContact`, que aceita apenas links de LinkedIn (`/in/usuario`) e WhatsApp (`wa.me`), normaliza o link e gera uma chave única por pessoa.
3. A chave é comparada com todas as missões para impedir repetição.
4. Uma missão conta como cumprida quando atinge o número de pessoas exigido; o tabuleiro então recalcula as linhas completas.

## Decisões e limitações

- **Por que QR Code em vez de validar a conexão no LinkedIn?** A API do LinkedIn não permite que um site confirme se duas pessoas se conectaram. O QR do perfil, escaneado presencialmente, é a prova de que o encontro aconteceu.
- Como não há servidor, o progresso fica só no navegador de cada pessoa e não é à prova de trapaça. Para um evento entre colegas, é suficiente.
- O leitor de QR é carregado de uma CDN, então a câmera precisa de internet. O campo de colar link funciona sem ela.

## Estrutura

```
bingo-network/
├── index.html    # estrutura da página
├── style.css     # visual
├── script.js     # lógica (scanner, missões, bingo, armazenamento)
├── favicon.svg
├── LICENSE
└── README.md
```

## Rodando localmente

A câmera só funciona em contexto seguro (HTTPS ou `localhost`), então abrir o arquivo direto no navegador não basta. Use um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse http://localhost:8000.

## Publicando no GitHub Pages

1. Envie os arquivos para a raiz de um repositório público.
2. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. Aguarde 1 a 2 minutos e acesse `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Próximos passos

- Ranking entre participantes com um banco de dados (Supabase ou Firebase)
- Versão instalável (PWA) com funcionamento offline
- Exportar o network em CSV

## Licença

[MIT](LICENSE)
