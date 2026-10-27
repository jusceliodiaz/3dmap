/* =============================================================================
   FONTE ÚNICA DE CONTEÚDO DO SHOWROOM
   Troque os dados abaixo pelos do seu empreendimento real.
   Nada mais no projeto precisa ser editado para mudar textos, números ou marca.
   ============================================================================= */

export type Lang = "pt" | "en";

export const brand = {
  /** Nome curto usado no HUD */
  short: "Reserva Mirante",
  /** Nome completo usado no <title> e no hero */
  full: "Reserva Mirante",
  /** Assinatura do estúdio (canto inferior do HUD) */
  studio: "Factory Studio",
  /** Cores da experiência */
  colors: {
    bg: "#0b0c15",
    ink: "#eef1f7",
    accent: "#c8a253", // dourado — destaques, lotes disponíveis
    accent2: "#4ec9d6", // ciano — água, dados, hover
    muted: "#7c839a",
  },
  /** Coordenadas do terreno — usadas no estudo solar e no mapa de vizinhança */
  site: {
    latitude: -23.42, // negativo = hemisfério sul
    longitude: -46.75,
    city: "Itupeva",
    state: "SP",
    /** Rotação do norte verdadeiro em relação ao eixo Y do masterplan (graus) */
    northOffsetDeg: 18,
  },
  cta: {
    label: { pt: "Quero conhecer", en: "Book a visit" },
    href: "#contato",
    whatsapp: "https://wa.me/5511999999999",
  },
};

/* ------------------------------- Números-chave ---------------------------- */
export const stats = [
  { value: "142", label: { pt: "lotes", en: "lots" } },
  { value: "486 m²", label: { pt: "lote médio", en: "average lot" } },
  { value: "38%", label: { pt: "área verde", en: "green area" } },
  { value: "1,2 km", label: { pt: "de orla", en: "of shoreline" } },
];

/* -------------------------------- Amenidades ------------------------------ */
export const amenities = [
  {
    id: "deck",
    icon: "water",
    title: { pt: "Deck do Lago", en: "Lake Deck" },
    text: {
      pt: "Plataforma suspensa sobre a lâmina d'água, com fire pit e ancoradouro para caiaques.",
      en: "A suspended platform over the water with a fire pit and kayak mooring.",
    },
    meta: { pt: "1.400 m²", en: "1,400 m²" },
  },
  {
    id: "clube",
    icon: "house",
    title: { pt: "Clube de Campo", en: "Country Club" },
    text: {
      pt: "Salão de festas, academia panorâmica, coworking e piscina aquecida com raia de 25 m.",
      en: "Event hall, panoramic gym, coworking and a heated 25 m lap pool.",
    },
    meta: { pt: "2.100 m²", en: "2,100 m²" },
  },
  {
    id: "trilha",
    icon: "trail",
    title: { pt: "Trilha Perimetral", en: "Perimeter Trail" },
    text: {
      pt: "3,4 km de caminho arborizado contornando todo o loteamento, com estações de descanso.",
      en: "3.4 km of tree-lined path circling the development, with rest stations.",
    },
    meta: { pt: "3,4 km", en: "3.4 km" },
  },
  {
    id: "quadras",
    icon: "sport",
    title: { pt: "Praça Esportiva", en: "Sports Plaza" },
    text: {
      pt: "Quadra de beach tennis, poliesportiva coberta e pista de corrida iluminada.",
      en: "Beach tennis court, covered multi-sport court and a lit running track.",
    },
    meta: { pt: "4 quadras", en: "4 courts" },
  },
  {
    id: "pet",
    icon: "pet",
    title: { pt: "Bosque Pet", en: "Pet Grove" },
    text: {
      pt: "Área cercada com agility, bebedouros e sombra nativa preservada.",
      en: "Fenced area with agility course, water points and preserved native shade.",
    },
    meta: { pt: "900 m²", en: "900 m²" },
  },
  {
    id: "mirante",
    icon: "view",
    title: { pt: "Mirante", en: "Lookout" },
    text: {
      pt: "Ponto mais alto do terreno, 42 m acima da lâmina d'água, aberto ao pôr do sol.",
      en: "The highest point on site, 42 m above the water, open to the sunset.",
    },
    meta: { pt: "+42 m", en: "+42 m" },
  },
];

/* ------------------------------- Vizinhança -------------------------------- */
/** x/y em coordenadas do masterplan (metros). Distância em minutos de carro. */
export const neighborhood = [
  { id: "rod", x: 260, y: -210, min: 4, title: { pt: "Rodovia dos Bandeirantes", en: "Bandeirantes Highway" } },
  { id: "shop", x: 300, y: 120, min: 9, title: { pt: "Shopping e comércio", en: "Mall & retail" } },
  { id: "esc", x: -290, y: 150, min: 7, title: { pt: "Escolas bilíngues", en: "Bilingual schools" } },
  { id: "hosp", x: -250, y: -190, min: 11, title: { pt: "Hospital", en: "Hospital" } },
  { id: "aero", x: 120, y: 330, min: 46, title: { pt: "Aeroporto de Viracopos", en: "Viracopos Airport" } },
  { id: "golf", x: -330, y: -40, min: 6, title: { pt: "Golfe e haras", en: "Golf & stables" } },
];

/* ------------------------------ Dicionário i18n ---------------------------- */
export const dict = {
  pt: {
    loading: "Preparando a experiência",
    loadingSeq: "Carregando sequência aérea",
    enter: "Iniciar sobrevoo",
    scrollHint: "Role para sobrevoar o loteamento",
    nav: { view: "View", lots: "Lotes", amenities: "Amenidades", neighborhood: "Vizinhança", solar: "Solar", contact: "Contato" },
    heroKicker: "Showroom digital",
    heroTitle: "Viver acima\nda linha do horizonte",
    heroText:
      "142 lotes desenhados ao redor de um lago particular, a 60 km de São Paulo. Sobrevoe, escolha a sua vista e acompanhe o sol durante o ano — tudo antes da primeira visita.",
    lotsTitle: "Masterplan",
    lotsText: "Clique em um lote para ver área, testada, orientação solar e vista.",
    filterAll: "Todos",
    available: "Disponível",
    reserved: "Reservado",
    sold: "Vendido",
    lot: "Lote",
    block: "Quadra",
    area: "Área",
    front: "Testada",
    facing: "Face",
    view: "Vista",
    sun: "Sol da tarde",
    amenTitle: "Amenidades",
    amenText: "Seis programas distribuídos pela orla e pelo bosque preservado.",
    neighTitle: "Vizinhança",
    neighText: "Isolamento sem isolamento: o essencial a menos de 10 minutos.",
    minutes: "min",
    solarTitle: "Estudo solar",
    solarText: "Veja a trajetória do sol sobre o terreno em qualquer hora de qualquer mês do ano.",
    month: "Mês",
    hour: "Hora",
    azimuth: "Azimute",
    altitude: "Altura",
    night: "Sol abaixo do horizonte",
    contactTitle: "Agende uma visita guiada",
    contactText: "Nossa equipe conduz a visita presencial ou uma sessão remota com o mesmo showroom que você acaba de explorar.",
    name: "Nome",
    email: "E-mail",
    phone: "Telefone",
    message: "Mensagem",
    send: "Enviar",
    sent: "Recebido. Entramos em contato em até um dia útil.",
    madeBy: "Experiência criada por",
  },
  en: {
    loading: "Preparing the experience",
    loadingSeq: "Loading aerial sequence",
    enter: "Start flyover",
    scrollHint: "Scroll to fly over the development",
    nav: { view: "View", lots: "Lots", amenities: "Amenities", neighborhood: "Neighborhood", solar: "Solar", contact: "Contact" },
    heroKicker: "Digital showroom",
    heroTitle: "Living above\nthe horizon line",
    heroText:
      "142 lots drawn around a private lake, 60 km from São Paulo. Fly over it, pick your view and track the sun through the year — all before the first site visit.",
    lotsTitle: "Masterplan",
    lotsText: "Click a lot to see area, frontage, solar orientation and view.",
    filterAll: "All",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    lot: "Lot",
    block: "Block",
    area: "Area",
    front: "Frontage",
    facing: "Facing",
    view: "View",
    sun: "Afternoon sun",
    amenTitle: "Amenities",
    amenText: "Six programs spread along the shoreline and the preserved grove.",
    neighTitle: "Neighborhood",
    neighText: "Seclusion without isolation: the essentials under 10 minutes away.",
    minutes: "min",
    solarTitle: "Solar study",
    solarText: "Watch the sun travel over the site at any hour of any month.",
    month: "Month",
    hour: "Hour",
    azimuth: "Azimuth",
    altitude: "Altitude",
    night: "Sun below the horizon",
    contactTitle: "Book a guided visit",
    contactText: "Our team runs the on-site visit — or a remote session using the very showroom you just explored.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    send: "Send",
    sent: "Received. We'll be in touch within one business day.",
    madeBy: "Experience by",
  },
} as const;

export type Dict = (typeof dict)["pt"];
