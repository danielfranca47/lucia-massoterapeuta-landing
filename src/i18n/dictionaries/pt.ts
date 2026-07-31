type RitualStep =
  | { stage: string; title: string; paragraph: string }
  | { stage: string; title: string; items: string[] };

const pt = {
  nav: {
    services: "Serviços",
    ritual: "O Ritual",
    locations: "Locais",
    book: "Reservar",
    bookCta: "Reservar",
  },
  hero: {
    eyebrow: "MASSOTERAPIA · FARO & OLHÃO",
    titleHtml:
      "Sabedoria da Amazônia,<br><em>ao ritmo</em> do pôr do sol algarvio.",
    sub: "Lúcia traz técnicas ancestrais de terapia manual a um terraço privado em Olhão e a um gabinete reservado em Faro. Toque profundo, personalizado e sem pressa.",
    ctaAvailability: "Ver disponibilidade",
    ctaServices: "Ver serviços",
    scrollCue: "DESLIZE",
  },
  intro: {
    tag: "Ritual de encerramento: chás e bebida elegante servida em copo.",
    eyebrow: "QUEM CONDUZ O RITUAL",
    quote: "“Cada toque é pensado para o que o seu corpo precisa hoje.”",
    p1: "Lúcia é massoterapeuta, formada em terapias manuais e cuidado holístico, com uma técnica própria construída ao longo de anos de prática — muito procurada em Portugal e reconhecida internacionalmente.",
    p2: "Combina Tuiná, Shiatsu, acupressão manual, liberação miofascial e massagem desportiva com óleos exóticos da Amazônia — sempre segundo as normas da Direção-Geral da Saúde (DGS).",
    credentials: [
      { num: "DGS", label: "Normas seguidas" },
      { num: "DGERT", label: "Formação certificada" },
      { num: "2", label: "Espaços · Faro e Olhão" },
    ],
  },
  services: {
    eyebrow: "EXPERIÊNCIAS",
    title: "Escolha o seu ritual",
    sub: "Vagas limitadas para manter o nível de atenção que cada sessão merece.",
    bookLabel: "Reservar",
    cards: {
      premium: {
        price: "85 €",
        loc: "Faro",
        sub: "TERRAÇO PRIVADO · 90 MIN",
        title: "Premium Massage — Lúcia Experience",
        description:
          "Técnica própria de Lúcia: Tuiná, Shiatsu, acupressão manual, liberação miofascial e massagem desportiva, adaptadas ao seu nível de tensão. Óleos sem perfume e hipoalergénicos, sala com temperatura ajustada e ritual de chá no final.",
        note: "Vagas limitadas / dia",
      },
      sunset: {
        price: "55 €",
        loc: "Olhão · fim-de-semana",
        sub: "RITUAL DE PÔR DO SOL · 30 MIN",
        title: "Sunset Amazon Massage",
        description:
          "Massagem expressa de costas, pescoço e ombros com óleos exóticos da Amazônia (copaíba e andiroba), aromaterapia e chá tropical no final — durante a hora mágica, no terraço de Olhão.",
        note: "Apenas 2 vagas / dia",
      },
      couple: {
        price: "85 €/pessoa",
        loc: "Olhão",
        sub: "EXPERIÊNCIA A DOIS · 110 MIN",
        title: "Amazon Relax Premium — Casal",
        description:
          "45 min de massagem a dois com óleos amazônicos, 45 min de descanso em redes tradicionais da Amazônia e uma prova de vinho e queijo de 20 min no terraço privado, com Lúcia e Herick.",
        note: "Rooftop privado",
      },
    },
  },
  ritual: {
    eyebrow: "COMO FUNCIONA A SESSÃO PREMIUM",
    title: "Um ritual em três tempos",
    steps: [
      {
        stage: "01 · Chegada",
        title: "Ambiente ajustado a si",
        paragraph:
          "Temperatura da sala regulada, jazz suave e contínuo, óleos aquecidos no inverno ou sala refrescada no verão. Discrição total e comunicação apenas quando pedida.",
      },
      {
        stage: "02 · Técnica",
        title: "Trabalho personalizado",
        items: [
          "Tuiná e Shiatsu para tensão e fadiga",
          "Acupressão manual para reequilíbrio energético",
          "Liberação miofascial e massagem desportiva",
        ],
      },
      {
        stage: "03 · Encerramento",
        title: "Um fecho com cerimónia",
        paragraph:
          "Chás especiais e uma bebida elegante servida em copo. Um momento para voltar ao seu ritmo, devagar.",
      },
    ] as RitualStep[],
  },
  locations: {
    eyebrow: "ONDE ENCONTRAR LÚCIA",
    title: "Dois espaços, um mesmo cuidado",
    faro: {
      eyebrow: "GABINETE",
      title: "Faro",
      description:
        "Espaço privativo, silencioso e acolhedor, perto do Estádio de São Luís. Ideal para a Premium Massage durante todo o ano.",
      linkLabel: "Ver no Google Maps →",
    },
    olhao: {
      eyebrow: "TERRAÇO · VERÃO",
      title: "Olhão",
      description:
        "Terraço privado com vista sobre a Ria Formosa. Sunset Massage e Amazon Relax para casais, apenas aos fins-de-semana no verão.",
      linkLabel: "Reservar por mensagem →",
    },
  },
  booking: {
    eyebrow: "AGENDA",
    title: "Ver disponibilidade e reservar",
    sub: "Escolha o serviço, o dia e a hora. A confirmação final é feita por WhatsApp para acertar os últimos detalhes.",
    step1Title: "1. Escolha o ritual",
    step1Sub: "Selecione um serviço para ver os dias disponíveis.",
    summary: {
      service: "Serviço",
      location: "Local",
      date: "Data",
      time: "Hora",
      total: "Total estimado",
      empty: "—",
    },
    step2Title: "2. Escolha dia e hora",
    step2Sub: "Pontos verdes indicam vagas disponíveis.",
    slotsLabel: "Horários disponíveis",
    emptyHintServiceChosen: "Escolha um dia disponível no calendário abaixo.",
    formSubmit: "Confirmar reserva via WhatsApp",
    incompleteError: "Por favor escolha serviço, dia e hora antes de confirmar.",
    openingWhatsApp: "A abrir o WhatsApp para confirmar a sua reserva...",
    monthNames: [
      "JANEIRO",
      "FEVEREIRO",
      "MARÇO",
      "ABRIL",
      "MAIO",
      "JUNHO",
      "JULHO",
      "AGOSTO",
      "SETEMBRO",
      "OUTUBRO",
      "NOVEMBRO",
      "DEZEMBRO",
    ],
    dow: ["S", "T", "Q", "Q", "S", "S", "D"],
  },
  social: {
    eyebrow: "CLIENTES",
    quote:
      "“Senti o cuidado em cada detalhe — desde a música até ao chá no final. Uma experiência, não apenas uma massagem.”",
    quoteAttr: "— CLIENTE, EXPERIÊNCIA PREMIUM EM FARO",
    igReels: "Ver bastidores e reels",
  },
  footer: {
    brandTagline: "Massoterapia com sabedoria da Amazônia, em Faro e Olhão.",
    navHeading: "NAVEGAÇÃO",
    contactHeading: "CONTACTO",
    contactWhatsapp: "WhatsApp / Reservas",
    contactFaroLocation: "Localização Faro",
    standardsHeading: "NORMAS",
    standardsDgs: "Sessões segundo as normas da DGS.",
    standardsDgert: "Formação certificada DGERT.",
    prototypeNotice: "Página de demonstração — protótipo",
  },
};

export default pt;
export type Dictionary = typeof pt;
