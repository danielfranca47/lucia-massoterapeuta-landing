import type { Dictionary } from "./pt";

const en: Dictionary = {
  nav: {
    services: "Services",
    ritual: "The Ritual",
    locations: "Locations",
    book: "Book",
    bookCta: "Book now",
  },
  hero: {
    eyebrow: "MASSAGE THERAPY · FARO & OLHÃO",
    titleHtml:
      "Amazonian wisdom,<br>set to the <em>rhythm</em> of the Algarve sunset.",
    sub: "Lúcia brings ancestral manual therapy techniques to a private terrace in Olhão and a quiet studio in Faro. Deep, personalized touch, never rushed.",
    ctaAvailability: "Check availability",
    ctaServices: "View services",
    scrollCue: "SCROLL",
  },
  intro: {
    tag: "Closing ritual: teas and an elegant drink served in a glass.",
    eyebrow: "WHO LEADS THE RITUAL",
    quote: "“Every touch is designed for what your body needs today.”",
    p1: "Lúcia is a massage therapist trained in manual therapies and holistic care, with a signature technique built over years of practice — highly requested in Portugal and recognized internationally.",
    p2: "She combines Tuiná, Shiatsu, manual acupressure, myofascial release and sports massage with exotic Amazonian oils — always following Portugal's Directorate-General of Health (DGS) standards.",
    credentials: [
      { num: "DGS", label: "Standards followed" },
      { num: "DGERT", label: "Certified training" },
      { num: "2", label: "Locations · Faro and Olhão" },
    ],
  },
  services: {
    eyebrow: "EXPERIENCES",
    title: "Choose your ritual",
    sub: "Limited slots, to preserve the quality of attention every session deserves.",
    bookLabel: "Book",
    cards: {
      premium: {
        price: "85 €",
        loc: "Faro",
        sub: "PRIVATE TERRACE · 90 MIN",
        title: "Premium Massage — Lúcia Experience",
        description:
          "Lúcia's signature technique: Tuiná, Shiatsu, manual acupressure, myofascial release and sports massage, adapted to your tension level. Unscented hypoallergenic oils, temperature-controlled room, closing tea ritual.",
        note: "Limited daily slots",
      },
      sunset: {
        price: "55 €",
        loc: "Olhão · weekends",
        sub: "SUNSET RITUAL · 30 MIN",
        title: "Sunset Amazon Massage",
        description:
          "Express back, neck and shoulder massage with exotic Amazonian oils (copaíba and andiroba), aromatherapy and tropical tea to close — during the magic hour, on the Olhão terrace.",
        note: "Only 2 slots / day",
      },
      couple: {
        price: "€85/person",
        loc: "Olhão",
        sub: "EXPERIENCE FOR TWO · 110 MIN",
        title: "Amazon Relax Premium — Couple",
        description:
          "45 min of side-by-side massage with Amazonian oils, 45 min resting in traditional Amazon hammocks, and a 20-minute wine and cheese tasting on the private rooftop, hosted by Lúcia and Herick.",
        note: "Private rooftop",
      },
    },
  },
  ritual: {
    eyebrow: "HOW THE PREMIUM SESSION UNFOLDS",
    title: "A ritual in three parts",
    steps: [
      {
        stage: "01 · Arrival",
        title: "An atmosphere set for you",
        paragraph:
          "Room temperature adjusted, continuous soft jazz, warmed oils in winter or a refreshed room in summer. Full discretion, conversation only when requested.",
      },
      {
        stage: "02 · Technique",
        title: "Personalized bodywork",
        items: [
          "Tuiná and Shiatsu for tension and fatigue",
          "Manual acupressure for energy rebalancing",
          "Myofascial release and sports massage",
        ],
      },
      {
        stage: "03 · Closing",
        title: "A closing with ceremony",
        paragraph:
          "Special teas and an elegant drink served in a glass. A moment to ease back into your own pace.",
      },
    ],
  },
  locations: {
    eyebrow: "WHERE TO FIND LÚCIA",
    title: "Two spaces, one standard of care",
    faro: {
      eyebrow: "STUDIO",
      title: "Faro",
      description:
        "A private, quiet and welcoming space near the São Luís Stadium. Ideal for the Premium Massage all year round.",
      linkLabel: "View on Google Maps →",
    },
    olhao: {
      eyebrow: "TERRACE · SUMMER",
      title: "Olhão",
      description:
        "Private rooftop terrace overlooking the Ria Formosa. Sunset Massage and Amazon Relax for couples, weekends only in summer.",
      linkLabel: "Book by message →",
    },
  },
  booking: {
    eyebrow: "SCHEDULE",
    title: "Check availability and book",
    sub: "Choose the service, day and time. Final confirmation happens over WhatsApp to sort out the last details.",
    step1Title: "1. Choose the ritual",
    step1Sub: "Select a service to see available days.",
    summary: {
      service: "Service",
      location: "Location",
      date: "Date",
      time: "Time",
      total: "Estimated total",
      empty: "—",
    },
    step2Title: "2. Choose day and time",
    step2Sub: "Green dots indicate open slots.",
    slotsLabel: "Available times",
    emptyHintServiceChosen: "Choose an available day in the calendar below.",
    loadingAvailability: "Loading real availability...",
    availabilityError:
      "We couldn't load availability right now. Please try again later or book directly via WhatsApp.",
    formSubmit: "Confirm booking via WhatsApp",
    incompleteError: "Please choose a service, day and time before confirming.",
    openingWhatsApp: "Opening WhatsApp to confirm your booking...",
    monthNames: [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ],
    dow: ["M", "T", "W", "T", "F", "S", "S"],
  },
  social: {
    eyebrow: "CLIENTS",
    quote:
      "“I felt the care in every detail — from the music to the tea at the end. An experience, not just a massage.”",
    quoteAttr: "— CLIENT, PREMIUM EXPERIENCE IN FARO",
    igReels: "See behind the scenes",
  },
  footer: {
    brandTagline: "Massage therapy with Amazonian wisdom, in Faro and Olhão.",
    navHeading: "MENU",
    contactHeading: "CONTACT",
    contactWhatsapp: "WhatsApp / Bookings",
    contactFaroLocation: "Faro location",
    standardsHeading: "STANDARDS",
    standardsDgs: "Sessions follow DGS standards.",
    standardsDgert: "DGERT-certified training.",
    prototypeNotice: "Demo page — prototype",
  },
};

export default en;
