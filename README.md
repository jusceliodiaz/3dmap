# Showroom Digital — sobrevoo cinematográfico de loteamento

Experiência web imersiva no estilo "digital showroom": o visitante sobrevoa o
empreendimento em 3D enquanto rola a página, abre o masterplan interativo,
escolhe um lote (a câmera voa até ele), percorre amenidades e vizinhança e
simula a trajetória do sol sobre o terreno em qualquer hora de qualquer mês.

Tudo é **gerado por código** — não há vídeo, sequência de frames nem imagem
pesada. O projeto roda offline, dá deploy na Vercel em um clique e serve como
base para plugar os dados e os assets reais de cada empreendimento.

---

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Deploy na Vercel: `vercel` (ou importe o repositório no painel). Não há
variáveis de ambiente obrigatórias.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
three.js (WebGL puro, sem react-three-fiber).

---

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Nome, cidade, cores, latitude, CTA, WhatsApp | `src/content/site.ts` → `brand` |
| Textos de todas as seções (pt/en) | `src/content/site.ts` → `dict` |
| Amenidades (título, texto, ícone, metragem) | `src/content/site.ts` → `amenities` |
| Pontos da vizinhança e distâncias | `src/content/site.ts` → `neighborhood` |
| Geometria do loteamento: lago, quadras, lotes, vias | `src/content/masterplan.ts` |
| Relevo, altura das colinas, escavação do lago | `src/lib/terrain.ts` |
| Rota da câmera do sobrevoo | `src/components/FlyoverScene.tsx` → `CAM_PLAN` / `LOOK_PLAN` |
| Cálculo solar (azimute/altura) | `src/lib/solar.ts` |

### Uma fonte única de verdade

`src/content/masterplan.ts` gera os lotes uma vez e alimenta **os dois** modos de
visualização: o mapa 2D em SVG e a cena 3D. Cada lote sai com polígono, centro,
área, testada, orientação em relação ao norte verdadeiro e status
(`available` / `reserved` / `sold`).

Para usar o **loteamento real**, substitua a função `buildLots()` por um import
do seu CAD/GIS, mantendo o mesmo formato de saída:

```ts
export type Lot = {
  id: string; block: string; number: number; ring: number;
  polygon: [number, number][];   // metros, no plano do masterplan (+Y = norte do plano)
  center: [number, number];
  area: number; front: number;
  octant: number; bearing: number;
  lakeView: boolean;
  status: "available" | "reserved" | "sold";
};
```

Um GeoJSON exportado do QGIS/AutoCAD vira isso com um script de conversão de
poucas linhas (reprojetar para metros, centrar na origem, calcular área por
shoelace). O restante do projeto — mapa, filtros, ficha do lote, sobrevoo,
sombras — passa a refletir o loteamento real sem outra alteração.

### Trocando o cenário procedural por assets reais

O terreno, o lago, as árvores e os edifícios são gerados em `FlyoverScene.tsx`.
Três caminhos, do mais barato ao mais caro:

1. **Manter procedural** e apenas ajustar `heightAt()` com curvas de nível reais.
2. **Trocar por um modelo**: carregue um `.glb` com `GLTFLoader` no lugar do
   `terrain`/`trees` — a rota de câmera e o HUD continuam funcionando.
3. **Sequência aérea de frames** (como o vídeo de drone dos showrooms
   tradicionais): troque o `<canvas>` por um `<canvas>` 2D que desenha o frame
   `Math.round(progress * (N-1))` — o mesmo `progress` do store já controla tudo.

### Estudo solar

`src/lib/solar.ts` calcula declinação, ângulo horário, altura e azimute a partir
da latitude em `brand.site.latitude` (negativa no hemisfério sul). O resultado
move a luz direcional da cena — as sombras do 3D são as sombras reais daquele
mês e hora. `brand.site.northOffsetDeg` gira o norte verdadeiro em relação ao
eixo Y do masterplan; ajuste para casar com a implantação real.

---

## Arquitetura

```
src/
  app/            layout + página (composição das seções)
  components/
    FlyoverScene.tsx   cena three.js: terreno, lago, vias, lotes, árvores, sol
    Hud.tsx            barra superior, navegação, bússola, progresso
    Compass.tsx        rosa dos ventos que segue a câmera
    Preloader.tsx      abertura com barra de carregamento
    ScrollDriver.tsx   scroll → progresso do sobrevoo + seção ativa
    sections/          View, Lotes, Amenidades, Vizinhança, Solar, Contato
  content/       site.ts (conteúdo) · masterplan.ts (geometria)
  lib/           store.ts (estado global) · solar.ts · terrain.ts · i18n.tsx
```

**Estado global sem biblioteca:** `src/lib/store.ts` é um store de ~40 linhas com
`useSyncExternalStore`. A cena 3D lê o estado dentro do loop de animação
(`getState()`, sem re-render) e a UI assina com `useShowroom(seletor)`. É o que
permite mexer no slider de hora e ver a sombra virar em tempo real sem custo de
renderização React.

---

## Detalhes que valem manter

- **Preloader honesto**: a construção da cena é adiada ~320 ms para o preloader
  pintar e animar; `ready` só vira `true` depois do primeiro frame renderado.
- **Câmera**: `CatmullRomCurve3` para posição e alvo, com amortecimento por
  `lerp` e parallax de mouse. Selecionar um lote assume o controle da câmera;
  sair da seção Lotes devolve o controle ao roteiro.
- **Performance**: os 164 lotes viram 3 meshes (um por status) via
  `mergeGeometries`, as árvores são um `InstancedMesh`, e o `PMREMGenerator`
  reaproveita o próprio céu como mapa de ambiente do lago.
- **Idioma**: `pt` / `en` em `dict`, trocado sem recarregar a página.
- **Fontes**: pilhas do sistema, para o build rodar sem internet. Para usar
  Google Fonts, descomente o bloco `next/font` em `src/app/layout.tsx` e aponte
  as variáveis `--font-display` / `--font-sans` / `--font-mono` no
  `globals.css`.

## Pendências para virar produção

- [ ] Formulário de contato: hoje só muda o texto do botão. Ligue a um endpoint
      (`app/api/lead/route.ts`), CRM ou serviço de e-mail.
- [ ] Trocar os dados de exemplo em `site.ts` e `masterplan.ts` pelos reais.
- [ ] Imagem de Open Graph (`app/opengraph-image.tsx`) para links no WhatsApp.
- [ ] Analytics e um fallback estático (imagem do masterplan) para dispositivos
      sem WebGL.
