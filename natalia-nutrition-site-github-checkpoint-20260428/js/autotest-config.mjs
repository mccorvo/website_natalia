/**
 * @typedef {'pl' | 'en'} Locale
 * @typedef {'restriction' | 'loss_of_control' | 'compensation' | 'body_image' | 'rigidity' | 'safety' | 'functioning'} Domain
 * @typedef {'scale' | 'yes_no' | 'multi_select'} QuestionKind
 * @typedef {'few_signals' | 'some_signals' | 'many_signals' | 'urgent'} ResultLevel
 *
 * @typedef {Object} SelfCheckQuestion
 * @property {string} id
 * @property {Domain} domain
 * @property {QuestionKind} kind
 * @property {Record<Locale, string>} text
 * @property {Record<Locale, string>=} intro
 * @property {Array<{ value: number | boolean | string, label: Record<Locale, string>, helper?: Record<Locale, string> }>} options
 * @property {number=} weight
 * @property {boolean=} safetyFlag
 * @property {{ questionId: string, equals?: number | boolean | string, notEquals?: number | boolean | string }=} showIf
 */

export const locales = ['pl', 'en'];

export const scaleOptions = [
  {
    value: 0,
    label: { pl: 'Nigdy / wcale', en: 'Never / Not at all' }
  },
  {
    value: 1,
    label: { pl: 'Rzadko', en: 'Rarely' }
  },
  {
    value: 2,
    label: { pl: 'Czasami', en: 'Sometimes' }
  },
  {
    value: 3,
    label: { pl: 'Często', en: 'Often' }
  },
  {
    value: 4,
    label: { pl: 'Bardzo często / prawie zawsze', en: 'Very often / Almost always' }
  }
];

export const yesNoOptions = [
  {
    value: false,
    label: { pl: 'Nie', en: 'No' }
  },
  {
    value: true,
    label: { pl: 'Tak', en: 'Yes' }
  }
];

/** @type {Record<Domain, Record<Locale, string>>} */
export const domainLabels = {
  restriction: {
    pl: 'Ograniczanie jedzenia',
    en: 'Restriction'
  },
  loss_of_control: {
    pl: 'Utrata kontroli przy jedzeniu',
    en: 'Loss of control'
  },
  compensation: {
    pl: 'Zachowania kompensacyjne',
    en: 'Compensatory behaviours'
  },
  body_image: {
    pl: 'Obraz ciała',
    en: 'Body image'
  },
  rigidity: {
    pl: 'Sztywność zasad żywieniowych',
    en: 'Rigid food rules'
  },
  safety: {
    pl: 'Sygnały bezpieczeństwa',
    en: 'Safety signals'
  },
  functioning: {
    pl: 'Codzienne funkcjonowanie',
    en: 'Daily functioning'
  }
};

/** @type {SelfCheckQuestion[]} */
export const selfCheckQuestions = [
  {
    id: 'restrictionAmount',
    domain: 'restriction',
    kind: 'scale',
    text: {
      pl: 'Jak często celowo jesz znacznie mniej, niż wydaje się potrzebować Twoje ciało?',
      en: 'How often do you intentionally eat much less than your body seems to need?'
    },
    intro: {
      pl: 'Pomyśl o ostatnich 3 miesiącach.',
      en: 'Think about the last 3 months.'
    },
    options: scaleOptions
  },
  {
    id: 'skippingWhenHungry',
    domain: 'restriction',
    kind: 'scale',
    text: {
      pl: 'Jak często pomijasz posiłki mimo głodu z powodu lęku, zasad lub poczucia kontroli?',
      en: 'How often do you skip meals despite hunger because of fear, rules or a sense of control?'
    },
    options: scaleOptions
  },
  {
    id: 'allowedFoodsShrink',
    domain: 'rigidity',
    kind: 'scale',
    text: {
      pl: 'Jak często lista produktów, które uznajesz za „bezpieczne” albo dozwolone, staje się coraz krótsza?',
      en: 'How often does the list of foods you consider safe or allowed become smaller?'
    },
    options: scaleOptions
  },
  {
    id: 'ruleAnxiety',
    domain: 'rigidity',
    kind: 'scale',
    text: {
      pl: 'Jak często odczuwasz silne napięcie, gdy posiłek nie pasuje do Twoich zasad?',
      en: 'How often do you feel strong distress when a meal does not fit your rules?'
    },
    options: scaleOptions
  },
  {
    id: 'lossOfControl',
    domain: 'loss_of_control',
    kind: 'yes_no',
    text: {
      pl: 'Czy zdarzały się momenty, kiedy jedzenie było trudne do zatrzymania lub pokierowania?',
      en: 'Have there been moments when eating felt hard to stop or steer?'
    },
    intro: {
      pl: 'To pytanie decyduje, czy pokażemy kilka pytań doprecyzowujących.',
      en: 'This question decides whether a few follow-up questions are shown.'
    },
    options: yesNoOptions
  },
  {
    id: 'lossControlFrequency',
    domain: 'loss_of_control',
    kind: 'scale',
    text: {
      pl: 'Jak często takie momenty powtarzały się w ostatnich 3 miesiącach?',
      en: 'How often have those moments happened in the last 3 months?'
    },
    options: scaleOptions,
    showIf: { questionId: 'lossOfControl', equals: true }
  },
  {
    id: 'eatingPastComfort',
    domain: 'loss_of_control',
    kind: 'scale',
    text: {
      pl: 'Jak często jesz dalej mimo dyskomfortu fizycznego lub poczucia, że chcesz już przestać?',
      en: 'How often do you continue eating despite physical discomfort or feeling that you want to stop?'
    },
    options: scaleOptions,
    showIf: { questionId: 'lossOfControl', equals: true }
  },
  {
    id: 'secrecyOrShame',
    domain: 'loss_of_control',
    kind: 'scale',
    text: {
      pl: 'Jak często po takich momentach pojawia się wstyd, ukrywanie jedzenia lub silne poczucie winy?',
      en: 'How often do those moments lead to shame, hiding food or strong guilt?'
    },
    options: scaleOptions,
    showIf: { questionId: 'lossOfControl', equals: true }
  },
  {
    id: 'makeUpExercise',
    domain: 'compensation',
    kind: 'scale',
    text: {
      pl: 'Jak często próbujesz „odrobić” jedzenie ćwiczeniami, postem lub bardzo restrykcyjnym dniem?',
      en: 'How often do you try to make up for eating with exercise, fasting or a very restrictive day?'
    },
    options: scaleOptions
  },
  {
    id: 'purgingUrges',
    domain: 'compensation',
    kind: 'scale',
    text: {
      pl: 'Jak często pojawia się impuls, aby pozbyć się jedzenia lub szybko zmniejszyć jego wpływ na ciało?',
      en: 'How often do you feel an urge to get rid of food or quickly reduce its effect on your body?'
    },
    options: scaleOptions
  },
  {
    id: 'bodyWorth',
    domain: 'body_image',
    kind: 'scale',
    text: {
      pl: 'Jak często Twoja samoocena mocno zależy od wagi, kształtu ciała lub wyglądu brzucha?',
      en: 'How often does your self-worth strongly depend on weight, body shape or stomach appearance?'
    },
    options: scaleOptions
  },
  {
    id: 'bodyCheckingAvoidance',
    domain: 'body_image',
    kind: 'scale',
    text: {
      pl: 'Jak często sprawdzanie ciała albo unikanie luster, zdjęć, ubrań lub spotkań zajmuje dużo energii?',
      en: 'How often does body checking or avoiding mirrors, photos, clothes or social situations take a lot of energy?'
    },
    options: scaleOptions
  },
  {
    id: 'foodThoughts',
    domain: 'functioning',
    kind: 'scale',
    text: {
      pl: 'Jak często myśli o jedzeniu, wadze, zasadach lub ciele utrudniają skupienie się na życiu codziennym?',
      en: 'How often do thoughts about food, weight, rules or body shape make daily life harder to focus on?'
    },
    options: scaleOptions
  },
  {
    id: 'socialImpact',
    domain: 'functioning',
    kind: 'scale',
    text: {
      pl: 'Jak często jedzenie lub obraz ciała utrudniają relacje, pracę, naukę, podróże albo jedzenie z innymi?',
      en: 'How often do food or body image make relationships, work, study, travel or eating with others harder?'
    },
    options: scaleOptions
  },
  {
    id: 'suicidalThoughts',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy masz myśli samobójcze, myśli o samouszkodzeniu albo obawę, że możesz zrobić sobie krzywdę?',
      en: 'Are you having suicidal thoughts, thoughts of self-harm or a concern that you might hurt yourself?'
    },
    intro: {
      pl: 'Pytania bezpieczeństwa pomagają wskazać, czy potrzebne jest pilne wsparcie.',
      en: 'Safety questions help indicate whether urgent support may be needed.'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'fainting',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy występują omdlenia albo bardzo silne zawroty głowy?',
      en: 'Are you experiencing fainting or very severe dizziness?'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'chestPain',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy występuje ból w klatce piersiowej, kołatanie serca albo trudność z oddychaniem?',
      en: 'Are you experiencing chest pain, heart palpitations or difficulty breathing?'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'frequentVomiting',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy występują częste wymioty, niezależnie od przyczyny?',
      en: 'Are you vomiting frequently, whatever the cause?'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'bleeding',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy występuje krwawienie, wymioty z krwią, czarne stolce albo inny niepokojący objaw wymagający pilnej oceny?',
      en: 'Are you experiencing bleeding, vomiting blood, black stools or another worrying symptom needing urgent assessment?'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'rapidHealthDeterioration',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy Twój stan zdrowia szybko się pogarsza, pojawia się silne osłabienie albo nie jesteś w stanie normalnie funkcjonować?',
      en: 'Is your health deteriorating quickly, are you very weak or are you unable to function normally?'
    },
    options: yesNoOptions,
    safetyFlag: true
  },
  {
    id: 'immediateDanger',
    domain: 'safety',
    kind: 'yes_no',
    text: {
      pl: 'Czy jesteś teraz w bezpośrednim niebezpieczeństwie?',
      en: 'Are you in immediate danger right now?'
    },
    options: yesNoOptions,
    safetyFlag: true
  }
];

export const supportResources = [
  {
    id: 'emergency',
    region: { pl: 'Lokalnie', en: 'Local' },
    title: { pl: 'Służby ratunkowe', en: 'Emergency services' },
    description: {
      pl: 'Jeśli istnieje bezpośrednie zagrożenie, myśli samobójcze, omdlenia, ból w klatce piersiowej, częste wymioty, krwawienie lub szybkie pogorszenie zdrowia, skontaktuj się z lokalnymi służbami ratunkowymi.',
      en: 'If there is immediate danger, suicidal thoughts, fainting, chest pain, frequent vomiting, bleeding or rapid health deterioration, contact local emergency services.'
    },
    cta: { pl: 'Skontaktuj się lokalnie', en: 'Contact local services' },
    url: ''
  },
  {
    id: 'bodywhys',
    region: { pl: 'Irlandia', en: 'Ireland' },
    title: { pl: 'Bodywhys', en: 'Bodywhys' },
    description: {
      pl: 'Poufne wsparcie i informacje dla osób z trudnościami wokół jedzenia oraz bliskich, którzy się martwią.',
      en: 'Confidential support and information for people with eating difficulties and loved ones who are worried.'
    },
    cta: { pl: 'Otwórz Bodywhys', en: 'Open Bodywhys' },
    url: 'https://www.bodywhys.ie/recovery-support-treatment/support-services-2/helpline/'
  },
  {
    id: 'findahelpline',
    region: { pl: 'Polska', en: 'Poland' },
    title: { pl: 'Find a Helpline', en: 'Find a Helpline' },
    description: {
      pl: 'Katalog aktualnych kontaktów wsparcia w Polsce, w tym dla trudności wokół jedzenia i obrazu ciała.',
      en: 'A directory of support contacts in Poland, including eating and body-image difficulties.'
    },
    cta: { pl: 'Znajdź pomoc', en: 'Find support' },
    url: 'https://findahelpline.com/countries/pl/topics/eating-body-image'
  },
  {
    id: 'nfz',
    region: { pl: 'Polska', en: 'Poland' },
    title: { pl: 'Edukacja NFZ', en: 'NFZ education' },
    description: {
      pl: 'Materiał edukacyjny NFZ o zaburzeniach odżywiania i sytuacjach, w których warto szukać pomocy.',
      en: 'NFZ educational material about eating disorders and situations where seeking help may be important.'
    },
    cta: { pl: 'Czytaj NFZ', en: 'Read NFZ' },
    url: 'https://diety.nfz.gov.pl/porady/zdrowe-nawyki/zaburzenia-odzywiania-co-warto-wiedziec'
  },
  {
    id: 'neda',
    region: { pl: 'Globalnie', en: 'Global' },
    title: { pl: 'NEDA', en: 'NEDA' },
    description: {
      pl: 'Materiały edukacyjne i zasoby wsparcia dla osób zaniepokojonych relacją z jedzeniem i ciałem.',
      en: 'Educational materials and support resources for people concerned about their relationship with food and body.'
    },
    cta: { pl: 'Otwórz NEDA', en: 'Open NEDA' },
    url: 'https://www.nationaleatingdisorders.org/get-help/'
  }
];

export const copy = {
  pl: {
    safetyEyebrow: 'Zanim zaczniesz',
    safetyTitle: 'Krótka informacja bezpieczeństwa',
    safetyBody: [
      'Ten self-check nie jest diagnozą i nie zastępuje konsultacji z lekarzem, psychologiem, psychoterapeutą, psychiatrą ani specjalistą leczenia zaburzeń odżywiania.',
      'Autotest działa lokalnie w przeglądarce. Odpowiedzi nie są wysyłane przez ten formularz.',
      'Jeśli pojawiają się myśli samobójcze, omdlenia, ból w klatce piersiowej, silne osłabienie, częste wymioty, krwawienie, szybkie pogorszenie stanu zdrowia lub bezpośrednie zagrożenie, skontaktuj się z lokalnymi służbami ratunkowymi.'
    ],
    continue: 'Rozumiem, kontynuuj',
    startOver: 'Zacznij od początku',
    progress: 'Pytanie {current} z {total}',
    back: 'Wstecz',
    next: 'Dalej',
    reset: 'Reset',
    showResult: 'Pokaż wynik',
    required: 'Wybierz odpowiedź, aby przejść dalej.',
    selected: 'Wybrano',
    resultsEyebrow: 'Wynik self-checku',
    resultsIntro: 'To nie jest diagnoza. Wynik pomaga uporządkować sygnały, które mogą być warte omówienia ze specjalistą.',
    domainsTitle: 'Obszary, które się wyróżniły',
    noDomains: 'Nie widać jednego wyraźnie wyróżnionego obszaru.',
    urgentTitle: 'Najpierw bezpieczeństwo',
    urgentBody: 'Twoje odpowiedzi zawierają sygnały, przy których warto pilnie skontaktować się z lekarzem, specjalistą zdrowia psychicznego albo lokalnymi służbami ratunkowymi, zwłaszcza jeśli zagrożenie jest bezpośrednie.',
    nextStepsTitle: 'Kolejne kroki w 24-72h',
    nextSteps: [
      'Zapisz lub skopiuj krótkie podsumowanie i pokaż je zaufanej osobie albo specjaliście.',
      'Jeśli sygnały wpływają na zdrowie, energię, relacje lub codzienne funkcjonowanie, rozważ kontakt z lekarzem lub specjalistą zdrowia psychicznego.',
      'Przy podejrzeniu zaburzeń odżywiania wsparcie żywieniowe warto łączyć z oceną medyczną i psychologiczną.'
    ],
    consultationTitle: 'Konsultacja żywieniowa',
    consultationBody: 'Natalia może pomóc uporządkować codzienne jedzenie i nawyki. Przy podejrzeniu DCA potrzebna może być także równoległa ocena medyczna lub psychologiczna.',
    book: 'Umów konsultację z Natalią',
    resources: 'Zobacz źródła wsparcia',
    copySummary: 'Kopiuj podsumowanie',
    printSummary: 'Drukuj podsumowanie',
    copying: 'Kopiuję podsumowanie...',
    copied: 'Podsumowanie skopiowane.',
    copyFailed: 'Nie udało się skopiować automatycznie. Zaznacz tekst podsumowania ręcznie.',
    supportTitle: 'Źródła wsparcia',
    external: 'Otwiera się w nowej karcie',
    levels: {
      few_signals: {
        title: 'Niewiele sygnałów w odpowiedziach',
        body: 'Odpowiedzi pokazują niewiele sygnałów w tym self-checku. Jeśli jednak temat jedzenia lub ciała nadal budzi napięcie, warto potraktować to jako informację i porozmawiać ze specjalistą.'
      },
      some_signals: {
        title: 'Kilka sygnałów wartych uwagi',
        body: 'Odpowiedzi pokazują kilka sygnałów, które mogą być warte spokojnego omówienia ze specjalistą. To dobry moment, żeby nie zostawać z tym samodzielnie.'
      },
      many_signals: {
        title: 'Wiele sygnałów wartych omówienia',
        body: 'Odpowiedzi pokazują wiele sygnałów dotyczących relacji z jedzeniem, ciałem lub kontrolą. To nie jest diagnoza, ale warto zaplanować rozmowę z lekarzem, psychologiem, psychoterapeutą, psychiatrą lub specjalistą leczenia zaburzeń odżywiania.'
      },
      urgent: {
        title: 'Widoczne są pilne sygnały bezpieczeństwa',
        body: 'Odpowiedzi wskazują na sygnały, przy których najważniejsze jest bezpieczeństwo i szybki kontakt z odpowiednim wsparciem.'
      }
    },
    summaryTitle: 'Podsumowanie self-checku relacji z jedzeniem i ciałem',
    summaryLevel: 'Ogólny wynik jakościowy',
    summaryDomains: 'Obszary do omówienia',
    summaryUrgent: 'Pilne sygnały bezpieczeństwa',
    summaryDisclaimer: 'To nie jest diagnoza. Odpowiedzi nie zostały wysłane przez formularz.'
  },
  en: {
    safetyEyebrow: 'Before you start',
    safetyTitle: 'A short safety note',
    safetyBody: [
      'This self-check is not a diagnosis and does not replace support from a doctor, psychologist, psychotherapist, psychiatrist or eating-disorder specialist.',
      'This self-check runs locally in your browser. Your answers are not submitted through this form.',
      'If you are having suicidal thoughts, fainting, chest pain, severe weakness, frequent vomiting, bleeding, rapid health deterioration or immediate danger, contact local emergency services.'
    ],
    continue: 'I understand, continue',
    startOver: 'Start again',
    progress: 'Question {current} of {total}',
    back: 'Back',
    next: 'Next',
    reset: 'Reset',
    showResult: 'Show result',
    required: 'Choose an answer before continuing.',
    selected: 'Selected',
    resultsEyebrow: 'Self-check result',
    resultsIntro: 'This is not a diagnosis. The result helps organise signals that may be worth discussing with a professional.',
    domainsTitle: 'Areas that stood out',
    noDomains: 'No single area stands out strongly.',
    urgentTitle: 'Safety comes first',
    urgentBody: 'Your answers include signals where prompt contact with a doctor, mental-health professional or local emergency services may be important, especially if danger is immediate.',
    nextStepsTitle: 'Next steps in 24-72h',
    nextSteps: [
      'Save or copy the short summary and share it with someone you trust or a professional.',
      'If the signals affect health, energy, relationships or daily functioning, consider contacting a doctor or mental-health professional.',
      'If an eating disorder is a concern, nutrition support may need to sit alongside medical and psychological assessment.'
    ],
    consultationTitle: 'Nutrition consultation',
    consultationBody: 'Natalia can help organise everyday eating and habits. If an eating disorder is a concern, parallel medical or psychological assessment may also be needed.',
    book: 'Book a consultation with Natalia',
    resources: 'View support resources',
    copySummary: 'Copy summary',
    printSummary: 'Print summary',
    copying: 'Copying summary...',
    copied: 'Summary copied.',
    copyFailed: 'Automatic copy did not work. Select the summary text manually.',
    supportTitle: 'Support resources',
    external: 'Opens in a new tab',
    levels: {
      few_signals: {
        title: 'Few signals in your answers',
        body: 'Your answers show few signals in this self-check. If food or body image still feels stressful, it may be worth treating that as useful information and speaking with a professional.'
      },
      some_signals: {
        title: 'Some signals worth noticing',
        body: 'Your answers show some signals that may be worth discussing calmly with a professional. This can be a good moment not to handle it alone.'
      },
      many_signals: {
        title: 'Many signals worth discussing',
        body: 'Your answers show many signals around food, body image or control. This is not a diagnosis, but it may be worth planning a conversation with a doctor, psychologist, psychotherapist, psychiatrist or eating-disorder specialist.'
      },
      urgent: {
        title: 'Urgent safety signals are visible',
        body: 'Your answers point to signals where safety and prompt support matter most.'
      }
    },
    summaryTitle: 'Food and body relationship self-check summary',
    summaryLevel: 'Overall qualitative result',
    summaryDomains: 'Areas to discuss',
    summaryUrgent: 'Urgent safety signals',
    summaryDisclaimer: 'This is not a diagnosis. Answers were not submitted through the form.'
  }
};

export const urgentFlagIds = [
  'suicidalThoughts',
  'fainting',
  'chestPain',
  'frequentVomiting',
  'bleeding',
  'rapidHealthDeterioration',
  'immediateDanger'
];

export function questionById(id) {
  return selfCheckQuestions.find((question) => question.id === id);
}

export function isQuestionVisible(question, answers) {
  if (!question.showIf) return true;
  const value = answers[question.showIf.questionId];
  if (Object.prototype.hasOwnProperty.call(question.showIf, 'equals') && value !== question.showIf.equals) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(question.showIf, 'notEquals') && value === question.showIf.notEquals) {
    return false;
  }
  return true;
}

export function getVisibleQuestions(answers) {
  return selfCheckQuestions.filter((question) => isQuestionVisible(question, answers));
}

export function pruneHiddenAnswers(answers) {
  const visibleIds = new Set(getVisibleQuestions(answers).map((question) => question.id));
  Object.keys(answers).forEach((id) => {
    if (!visibleIds.has(id)) delete answers[id];
  });
}

/** @returns {ResultLevel} */
export function classifySelfCheck(answers) {
  if (urgentFlagIds.some((id) => answers[id] === true)) return 'urgent';

  const numericScore = Object.values(answers)
    .filter((value) => typeof value === 'number')
    .reduce((sum, value) => sum + value, 0);

  if (numericScore >= 28) return 'many_signals';
  if (numericScore >= 14) return 'some_signals';
  return 'few_signals';
}

export function getEmergingDomains(answers, locale = 'pl') {
  const visibleQuestions = getVisibleQuestions(answers);
  const stats = {};

  visibleQuestions.forEach((question) => {
    const value = answers[question.id];
    if (typeof value !== 'number') return;
    if (!stats[question.domain]) stats[question.domain] = { sum: 0, count: 0 };
    stats[question.domain].sum += value;
    stats[question.domain].count += 1;
  });

  return Object.entries(stats)
    .map(([domain, stat]) => ({
      domain,
      label: domainLabels[domain][locale],
      average: stat.count ? stat.sum / stat.count : 0
    }))
    .filter((item) => item.average >= 2)
    .sort((a, b) => b.average - a.average);
}

export function getAnsweredUrgentFlags(answers, locale = 'pl') {
  return urgentFlagIds
    .filter((id) => answers[id] === true)
    .map((id) => questionById(id)?.text[locale])
    .filter(Boolean);
}

export function buildSummary(answers, locale = 'pl') {
  const level = classifySelfCheck(answers);
  const t = copy[locale];
  const domains = getEmergingDomains(answers, locale).map((item) => item.label);
  const urgentFlags = getAnsweredUrgentFlags(answers, locale);
  const lines = [
    t.summaryTitle,
    `${t.summaryLevel}: ${t.levels[level].title}`,
    `${t.summaryDomains}: ${domains.length ? domains.join(', ') : t.noDomains}`
  ];

  if (urgentFlags.length) {
    lines.push(`${t.summaryUrgent}: ${urgentFlags.join('; ')}`);
  }

  lines.push(t.summaryDisclaimer);
  return lines.join('\n');
}
