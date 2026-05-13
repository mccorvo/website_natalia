(() => {
  const root = document.querySelector('[data-children-compass]');
  if (!root) return;

  const state = {
    step: 0,
    answers: {},
    activeLearn: 'ed',
    activeScenario: 'refusal',
    activeResourceFilter: 'all',
    mealPlan: new Set(['rhythm', 'neutral']),
    doctorItems: new Set()
  };

  const els = {
    question: root.querySelector('[data-compass-question]'),
    stepCount: root.querySelector('[data-compass-step-count]'),
    progress: root.querySelector('[data-compass-progress]'),
    progressBar: root.querySelector('[data-compass-progress-bar]'),
    progressText: root.querySelector('[data-compass-progress-text]'),
    error: root.querySelector('[data-compass-error]'),
    live: root.querySelector('[data-compass-live]'),
    liveRoutes: root.querySelector('[data-compass-live-routes]'),
    answerSummary: root.querySelector('[data-compass-answer-summary]'),
    back: root.querySelector('[data-compass-back]'),
    next: root.querySelector('[data-compass-next]'),
    reset: root.querySelector('[data-compass-reset]'),
    results: document.querySelector('[data-compass-results]'),
    learningTabs: document.querySelector('[data-learning-tabs]'),
    learningPanel: document.querySelector('[data-learning-panel]'),
    scenarioButtons: document.querySelector('[data-scenario-buttons]'),
    scenarioOutput: document.querySelector('[data-scenario-output]'),
    mealChecks: document.querySelector('[data-meal-checks]'),
    mealPlanText: document.querySelector('[data-meal-plan]'),
    doctorChecks: document.querySelector('[data-doctor-checks]'),
    doctorNote: document.querySelector('[data-doctor-note]'),
    resourceFilters: document.querySelector('[data-resource-filters]'),
    resourceGrid: document.querySelector('[data-resource-grid]'),
    toast: document.querySelector('[data-children-toast]')
  };

  const copy = {
    pl: {
      step: 'Krok',
      of: 'z',
      next: 'Dalej',
      finish: 'Pokaż wynik',
      back: 'Wstecz',
      reset: 'Reset',
      single: 'Wybierz jedną odpowiedź',
      multi: 'Możesz wybrać kilka odpowiedzi',
      optional: 'Opcjonalne',
      required: 'Wybierz odpowiedź, zanim przejdziesz dalej.',
      noAnswers: 'Zacznij od pierwszego pytania. Mapa zaktualizuje się po każdej odpowiedzi.',
      suggested: 'Sugerowany kierunek',
      summary: 'Podsumowanie obserwacji rodzica',
      notDiagnosis: 'To nie jest diagnoza ani formalny wynik kliniczny.',
      organize: 'Ta strona pomaga uporządkować obserwacje.',
      speakDoctor: 'Jeśli się martwisz, porozmawiaj z GP, lekarzem lub pediatrą.',
      urgentHelp: 'Przy pilnych objawach skontaktuj się z lokalnymi służbami ratunkowymi albo pilną opieką medyczną.',
      nextSteps: 'Sugerowane kolejne kroki',
      copySummary: 'Kopiuj podsumowanie',
      printSummary: 'Drukuj podsumowanie',
      copied: 'Skopiowano.',
      nothingToCopy: 'Najpierw wybierz kilka odpowiedzi.',
      copyFailed: 'Nie udało się skopiować automatycznie. Zaznacz tekst i skopiuj ręcznie.',
      avoid: 'Unikaj',
      tryThis: 'Spróbuj',
      why: 'Dlaczego to pomaga',
      chooseMeal: 'Wybierz elementy po lewej stronie, aby wygenerować plan.',
      chooseDoctor: 'Zaznacz obserwacje po lewej stronie albo przejdź przez Parent Compass, aby wygenerować notatkę.',
      observationIntro: 'Obserwacje z Parent Compass:',
      additionalIntro: 'Dodatkowe obserwacje do omówienia:',
      questionsIntro: 'Pytania do specjalisty:',
      doctorQuestions: 'Czy potrzebna jest ocena pediatryczna? Czy potrzebne są parametry życiowe, badania krwi lub EKG? Czy wskazane jest skierowanie do CAMHS / zespołu zaburzeń odżywiania? Czy warto ocenić ARFID? Czy potrzebna jest ocena karmienia, gryzienia lub połykania? Czy odpowiednie będzie wsparcie dietetyczne?',
      all: 'Wszystkie',
      urgent: 'Pilne',
      ireland: 'Irlandia',
      poland: 'Polska',
      arfid: 'ARFID',
      parents: 'Rodzice',
      clinical: 'Kliniczne',
      open: 'Otwórz źródło',
      progressLabel: 'Postęp Parent Compass',
      tabsLabel: 'Tematy edukacyjne'
    },
    en: {
      step: 'Step',
      of: 'of',
      next: 'Next',
      finish: 'Show result',
      back: 'Back',
      reset: 'Reset',
      single: 'Choose one answer',
      multi: 'You can choose several answers',
      optional: 'Optional',
      required: 'Choose an answer before continuing.',
      noAnswers: 'Start with the first question. The map updates after every answer.',
      suggested: 'Suggested direction',
      summary: 'Parent observation summary',
      notDiagnosis: 'This is not a diagnosis or a formal clinical result.',
      organize: 'This page helps you organise observations.',
      speakDoctor: 'If you are worried, speak with a GP, doctor or paediatrician.',
      urgentHelp: 'With urgent symptoms, contact local emergency services or urgent medical care.',
      nextSteps: 'Suggested next steps',
      copySummary: 'Copy summary',
      printSummary: 'Print summary',
      copied: 'Copied.',
      nothingToCopy: 'Choose a few answers first.',
      copyFailed: 'Automatic copy did not work. Select the text and copy it manually.',
      avoid: 'Avoid',
      tryThis: 'Try',
      why: 'Why this helps',
      chooseMeal: 'Choose elements on the left to generate a plan.',
      chooseDoctor: 'Tick observations on the left or complete Parent Compass to generate a note.',
      observationIntro: 'Parent Compass observations:',
      additionalIntro: 'Additional observations to discuss:',
      questionsIntro: 'Questions for the specialist:',
      doctorQuestions: 'Is paediatric assessment needed? Are vitals, blood tests or ECG needed? Is referral to CAMHS / an eating-disorder team needed? Is ARFID assessment relevant? Is feeding, chewing or swallowing assessment relevant? Is dietetic support appropriate?',
      all: 'All',
      urgent: 'Urgent',
      ireland: 'Ireland',
      poland: 'Poland',
      arfid: 'ARFID',
      parents: 'Parents',
      clinical: 'Clinical',
      open: 'Open source',
      progressLabel: 'Parent Compass progress',
      tabsLabel: 'Learning topics'
    }
  };

  const questions = [
    {
      id: 'safety',
      type: 'single',
      required: true,
      title: { pl: 'Czy widzisz dziś sygnały wymagające pilnej reakcji?', en: 'Do you see any signs that need urgent action today?' },
      help: { pl: 'Jeśli masz wątpliwość, wybierz odpowiedź „nie wiem”.', en: 'If you are unsure, choose “not sure”.' },
      options: [
        { value: 'urgent', flags: ['urgent'], label: { pl: 'Tak: omdlenia, ból w klatce piersiowej, silne osłabienie, szybkie pogorszenie, odwodnienie, częste wymioty, myśli samobójcze lub bezpośrednie zagrożenie.', en: 'Yes: fainting, chest pain, severe weakness, rapid deterioration, dehydration, frequent vomiting, suicidal thoughts or immediate danger.' }, hint: { pl: 'Najpierw pilny kontakt medyczny lub służby ratunkowe.', en: 'Prioritise urgent medical contact or emergency services.' } },
        { value: 'unsure', flags: ['watch', 'medical'], label: { pl: 'Nie wiem: coś mocno mnie niepokoi, ale nie umiem ocenić pilności.', en: 'Not sure: something worries me, but I cannot judge urgency.' }, hint: { pl: 'Warto skontaktować się z lekarzem i opisać objawy konkretnie.', en: 'It is worth contacting a doctor and describing symptoms concretely.' } },
        { value: 'not_now', flags: [], label: { pl: 'Nie widzę dziś objawów nagłych.', en: 'I do not see emergency symptoms today.' }, hint: { pl: 'Możemy przejść do uporządkowania obserwacji.', en: 'We can move on to organising observations.' } }
      ]
    },
    {
      id: 'age',
      type: 'single',
      required: true,
      title: { pl: 'Ile lat ma dziecko?', en: 'How old is your child?' },
      help: { pl: 'Wiek pomaga dobrać pytania o rozwój, szkołę, obraz ciała i umiejętności jedzenia.', en: 'Age helps match questions about development, school, body image and eating skills.' },
      options: [
        { value: 'under6', flags: ['feeding'], label: { pl: '0-5 lat', en: '0-5 years' }, hint: { pl: 'U młodszych dzieci ważne są też gryzienie, połykanie i rozwój.', en: 'With younger children, chewing, swallowing and development matter too.' } },
        { value: 'six12', flags: [], label: { pl: '6-12 lat', en: '6-12 years' }, hint: { pl: 'Warto obserwować szkołę, posiłki rodzinne i zmianę zachowań.', en: 'Observe school, family meals and behaviour changes.' } },
        { value: 'teen', flags: ['ed'], label: { pl: '13-17 lat', en: '13-17 years' }, hint: { pl: 'W tym wieku częściej pojawia się wpływ obrazu ciała, presji i zasad jedzenia.', en: 'At this age, body image, pressure and food rules may become more influential.' } }
      ]
    },
    {
      id: 'mainConcern',
      type: 'single',
      required: true,
      title: { pl: 'Co najbardziej opisuje obecną trudność?', en: 'What best describes the current difficulty?' },
      help: { pl: 'Wybierz dominujący wzorzec. Jeśli jest kilka, wybierz „mieszane”.', en: 'Choose the dominant pattern. If there are several, choose “mixed”.' },
      options: [
        { value: 'restriction', flags: ['ed'], label: { pl: 'Dziecko je coraz mniej, unika posiłków lub ogranicza porcje.', en: 'Your child eats less and less, avoids meals or restricts portions.' }, hint: { pl: 'Może wymagać oceny pod kątem restrykcji i stanu zdrowia.', en: 'May need assessment for restriction and physical health.' } },
        { value: 'body', flags: ['ed'], label: { pl: 'Dużo mówi o wadze, sylwetce lub „zdrowym” jedzeniu.', en: 'They talk a lot about weight, shape or “healthy” eating.' }, hint: { pl: 'To może być sygnał napięcia wokół ciała i kontroli.', en: 'This may signal body/control-related stress.' } },
        { value: 'purge', flags: ['ed', 'urgent'], label: { pl: 'Po jedzeniu idzie do łazienki, wymiotuje, używa środków przeczyszczających lub nadmiernie ćwiczy.', en: 'After eating they go to the bathroom, vomit, use laxatives or over-exercise.' }, hint: { pl: 'To wymaga rozmowy z lekarzem; częste wymioty mogą być pilne.', en: 'This needs medical discussion; frequent vomiting can be urgent.' } },
        { value: 'binge', flags: ['ed'], label: { pl: 'Zdarzają się epizody utraty kontroli przy jedzeniu lub jedzenie w ukryciu.', en: 'There are episodes of loss of control with food or eating in secret.' }, hint: { pl: 'Ważne jest zmniejszenie wstydu i ocena emocjonalna.', en: 'Reducing shame and assessing emotional patterns matters.' } },
        { value: 'sensory', flags: ['arfid', 'feeding'], label: { pl: 'Bardzo ograniczony repertuar produktów albo silna reakcja na smak, zapach, kolor lub teksturę.', en: 'Very narrow food range or strong reaction to taste, smell, colour or texture.' }, hint: { pl: 'Może pasować do ARFID, wybiórczości lub trudności sensorycznych.', en: 'May fit ARFID, selective eating or sensory difficulties.' } },
        { value: 'fear', flags: ['arfid', 'feeding'], label: { pl: 'Dziecko boi się zadławienia, wymiotów, bólu brzucha lub konsekwencji jedzenia.', en: 'Your child fears choking, vomiting, stomach pain or consequences of eating.' }, hint: { pl: 'Warto sprawdzić lęk, doświadczenia po jedzeniu i zdrowie przewodu pokarmowego.', en: 'Consider anxiety, food-related experiences and gut health.' } },
        { value: 'pain', flags: ['medical', 'feeding'], label: { pl: 'Jedzenie wiąże się z bólem, refluksem, kaszlem, krztuszeniem, gryzieniem lub połykaniem.', en: 'Eating involves pain, reflux, coughing, choking, chewing or swallowing issues.' }, hint: { pl: 'To wymaga medycznej lub feeding-skill oceny, nie tylko porad żywieniowych.', en: 'This needs medical or feeding-skill assessment, not only nutrition advice.' } },
        { value: 'mixed', flags: ['ed', 'arfid', 'feeding'], label: { pl: 'Mieszane / nie jestem pewna lub pewien.', en: 'Mixed / I am not sure.' }, hint: { pl: 'Kolejne pytania zawężą ścieżkę.', en: 'The next questions will narrow the route.' } }
      ]
    },
    {
      id: 'bodyImage',
      type: 'multi',
      required: false,
      condition: (answers) => ['restriction', 'body', 'purge', 'binge', 'mixed'].includes(answers.mainConcern),
      title: { pl: 'Czy pojawiają się sygnały związane z ciałem, kontrolą lub kompensacją?', en: 'Are there signs related to body image, control or compensation?' },
      help: { pl: 'Zaznacz tylko to, co realnie zauważasz.', en: 'Tick only what you actually notice.' },
      options: [
        { value: 'weightTalk', flags: ['ed'], label: { pl: 'Częste sprawdzanie ciała, ważenie, lustro lub porównywanie się.', en: 'Frequent body checking, weighing, mirror checking or comparison.' }, hint: { pl: 'Sygnał napięcia wokół obrazu ciała.', en: 'A sign of body-image stress.' } },
        { value: 'foodRules', flags: ['ed'], label: { pl: 'Sztywne zasady, „zakazane” produkty lub pomijanie grup żywności.', en: 'Rigid rules, “forbidden” foods or skipping food groups.' }, hint: { pl: 'Sztywność może utrzymywać lęk i restrykcję.', en: 'Rigidity can maintain fear and restriction.' } },
        { value: 'bathroom', flags: ['ed', 'urgent'], label: { pl: 'Częste wyjścia do łazienki po posiłkach.', en: 'Frequent bathroom trips after meals.' }, hint: { pl: 'Warto omówić z lekarzem, szczególnie przy wymiotach.', en: 'Discuss with a doctor, especially if vomiting is possible.' } },
        { value: 'exercise', flags: ['ed'], label: { pl: 'Ćwiczenia mimo zmęczenia, choroby lub prośby o przerwę.', en: 'Exercise despite fatigue, illness or being asked to pause.' }, hint: { pl: 'Może być zachowaniem kompensacyjnym.', en: 'May be compensatory behaviour.' } },
        { value: 'none', flags: [], label: { pl: 'Nie widzę takich sygnałów.', en: 'I do not see these signs.' }, hint: { pl: 'To też ważna informacja.', en: 'That is also useful information.' } }
      ]
    },
    {
      id: 'arfidDrivers',
      type: 'multi',
      required: false,
      condition: (answers) => ['sensory', 'fear', 'pain', 'mixed'].includes(answers.mainConcern),
      title: { pl: 'Co najbardziej uruchamia trudność przy jedzeniu?', en: 'What seems to trigger the eating difficulty most?' },
      help: { pl: 'ARFID i trudności karmienia mogą mieć mechanizmy sensoryczne, lękowe, apetytowe lub medyczne.', en: 'ARFID and feeding difficulties can have sensory, fear-based, appetite-related or medical drivers.' },
      options: [
        { value: 'texture', flags: ['arfid', 'feeding'], label: { pl: 'Tekstura, zapach, kolor lub mieszane konsystencje.', en: 'Texture, smell, colour or mixed consistencies.' }, hint: { pl: 'Częsty obszar sensoryczny.', en: 'A common sensory area.' } },
        { value: 'choking', flags: ['arfid', 'feeding', 'medical'], label: { pl: 'Lęk przed zadławieniem, wymiotami lub bólem.', en: 'Fear of choking, vomiting or pain.' }, hint: { pl: 'Może wymagać oceny lęku i objawów medycznych.', en: 'May need anxiety and medical symptom assessment.' } },
        { value: 'lowAppetite', flags: ['arfid'], label: { pl: 'Mały apetyt, brak zainteresowania jedzeniem lub „zapominanie” o jedzeniu.', en: 'Low appetite, little interest in food or “forgetting” to eat.' }, hint: { pl: 'Ważne są rytm, rozwój i energia.', en: 'Rhythm, development and energy matter.' } },
        { value: 'safeFoods', flags: ['arfid'], label: { pl: 'Bardzo krótka lista „bezpiecznych” produktów.', en: 'A very short list of “safe” foods.' }, hint: { pl: 'Sprawdź wpływ na szkołę, rodzinę i odżywienie.', en: 'Check impact on school, family and nutrition.' } },
        { value: 'none', flags: [], label: { pl: 'Nie wiem / trudno powiedzieć.', en: 'I do not know / hard to say.' }, hint: { pl: 'Warto obserwować sytuacje i reakcje, nie tylko produkty.', en: 'Observe situations and reactions, not just foods.' } }
      ]
    },
    {
      id: 'medicalSigns',
      type: 'multi',
      required: false,
      condition: (answers) => answers.age === 'under6' || ['pain', 'fear', 'sensory', 'mixed'].includes(answers.mainConcern) || hasAny(answers.arfidDrivers, ['choking', 'texture']),
      title: { pl: 'Czy widzisz sygnały, że jedzenie może być fizycznie trudne?', en: 'Do you see signs that eating may be physically difficult?' },
      help: { pl: 'Te odpowiedzi pomagają zdecydować, czy potrzebna jest ocena pediatryczna, logopedyczna, gastrologiczna lub feeding team.', en: 'These answers help decide whether paediatric, speech/feeding, GI or feeding-team assessment may be needed.' },
      options: [
        { value: 'coughing', flags: ['feeding', 'medical'], label: { pl: 'Kaszel, krztuszenie, mokry głos lub duszenie się przy jedzeniu/piciu.', en: 'Coughing, choking, wet voice or struggling with food/drink.' }, hint: { pl: 'Warto skonsultować bezpieczeństwo połykania.', en: 'Consider swallowing safety assessment.' } },
        { value: 'chewing', flags: ['feeding'], label: { pl: 'Trudność z gryzieniem, żuciem lub przechodzeniem na nowe konsystencje.', en: 'Difficulty biting, chewing or moving to new textures.' }, hint: { pl: 'Może dotyczyć umiejętności karmienia.', en: 'May involve feeding skills.' } },
        { value: 'painReflux', flags: ['medical', 'feeding'], label: { pl: 'Ból, refluks, zaparcia, nudności lub ból brzucha po jedzeniu.', en: 'Pain, reflux, constipation, nausea or stomach pain after eating.' }, hint: { pl: 'Objawy medyczne mogą podtrzymywać unikanie.', en: 'Medical symptoms can maintain avoidance.' } },
        { value: 'growth', flags: ['medical', 'feeding', 'arfid'], label: { pl: 'Niepokój o wzrost, energię, sen, koncentrację lub niedobory.', en: 'Concern about growth, energy, sleep, concentration or deficiencies.' }, hint: { pl: 'Zbierz dane rozwoju i porozmawiaj z lekarzem.', en: 'Gather development information and speak with a doctor.' } },
        { value: 'none', flags: [], label: { pl: 'Nie widzę tych sygnałów.', en: 'I do not see these signs.' }, hint: { pl: 'Możemy skupić się na zachowaniu, emocjach i strukturze.', en: 'We can focus on behaviour, emotions and structure.' } }
      ]
    },
    {
      id: 'impact',
      type: 'multi',
      required: true,
      title: { pl: 'Jaki jest wpływ na codzienne życie?', en: 'What is the impact on daily life?' },
      help: { pl: 'Wpływ na funkcjonowanie często mówi więcej niż sama liczba produktów czy porcji.', en: 'Functional impact often says more than the number of foods or portions.' },
      options: [
        { value: 'school', flags: ['parent'], label: { pl: 'Szkoła, lunch, wyjścia lub urodziny stały się trudne.', en: 'School, lunch, outings or birthdays have become difficult.' }, hint: { pl: 'Warto uwzględnić plan dla szkoły.', en: 'Consider a school plan.' } },
        { value: 'familyStress', flags: ['parent'], label: { pl: 'Posiłki kończą się konfliktem, płaczem lub negocjacjami.', en: 'Meals end in conflict, crying or negotiation.' }, hint: { pl: 'Rodzice potrzebują struktury, nie większej presji.', en: 'Parents need structure, not more pressure.' } },
        { value: 'avoidanceSocial', flags: ['arfid', 'ed'], label: { pl: 'Dziecko unika jedzenia z innymi lub ukrywa zachowania.', en: 'Your child avoids eating with others or hides behaviours.' }, hint: { pl: 'To może wskazywać na wstyd, lęk lub utratę elastyczności.', en: 'This may signal shame, anxiety or loss of flexibility.' } },
        { value: 'physical', flags: ['medical', 'urgent'], label: { pl: 'Zmęczenie, zawroty głowy, marznięcie, szybka zmiana masy ciała lub pogorszenie kondycji.', en: 'Fatigue, dizziness, feeling cold, rapid weight change or worsening physical condition.' }, hint: { pl: 'Wymaga rozmowy medycznej.', en: 'Needs medical discussion.' } },
        { value: 'mild', flags: [], label: { pl: 'Na razie wpływ jest łagodny, ale chcę zareagować wcześnie.', en: 'Impact is mild for now, but I want to respond early.' }, hint: { pl: 'Wczesna reakcja może ograniczyć eskalację.', en: 'Early response may reduce escalation.' } }
      ]
    },
    {
      id: 'duration',
      type: 'single',
      required: true,
      title: { pl: 'Jak długo trwa problem?', en: 'How long has this been going on?' },
      help: { pl: 'Czas trwania pomaga odróżnić chwilową reakcję od utrwalającego się wzorca.', en: 'Duration helps separate a temporary reaction from a persistent pattern.' },
      options: [
        { value: 'days', flags: ['watch'], label: { pl: 'Kilka dni lub nagła zmiana.', en: 'A few days or sudden change.' }, hint: { pl: 'Nagła zmiana z objawami fizycznymi wymaga ostrożności.', en: 'Sudden change with physical symptoms requires caution.' } },
        { value: 'weeks', flags: ['parent'], label: { pl: 'Kilka tygodni.', en: 'Several weeks.' }, hint: { pl: 'Dobry moment na zebranie obserwacji i konsultację.', en: 'A good time to gather observations and consult.' } },
        { value: 'months', flags: ['ed', 'arfid', 'feeding'], label: { pl: 'Ponad 3 miesiące.', en: 'More than 3 months.' }, hint: { pl: 'Utrwalony wzorzec warto omówić ze specjalistą.', en: 'A persistent pattern is worth discussing with a specialist.' } },
        { value: 'years', flags: ['arfid', 'feeding'], label: { pl: 'Od lat lub od wczesnego dzieciństwa.', en: 'For years or since early childhood.' }, hint: { pl: 'Może wymagać pracy krok po kroku i oceny rozwoju/umiejętności.', en: 'May need stepwise work and developmental/skill assessment.' } }
      ]
    },
    {
      id: 'location',
      type: 'single',
      required: true,
      title: { pl: 'Gdzie najprawdopodobniej będziesz szukać wsparcia?', en: 'Where are you most likely to seek support?' },
      help: { pl: 'Dopasujemy zasoby do kraju i ścieżki pomocy.', en: 'We will match resources to country and support pathway.' },
      options: [
        { value: 'ireland', flags: ['ie'], label: { pl: 'Irlandia', en: 'Ireland' }, hint: { pl: 'GP, HSE, Bodywhys, CAMHS / eating disorder team.', en: 'GP, HSE, Bodywhys, CAMHS / eating-disorder team.' } },
        { value: 'poland', flags: ['pl'], label: { pl: 'Polska', en: 'Poland' }, hint: { pl: 'Lekarz rodzinny/pediatra, psychiatra dziecięcy, psychoterapeuta, dietetyk.', en: 'Family doctor/paediatrician, child psychiatrist, psychotherapist, dietitian.' } },
        { value: 'online', flags: ['online'], label: { pl: 'Online / nie jestem pewna lub pewien.', en: 'Online / I am not sure.' }, hint: { pl: 'Pokażemy zasoby edukacyjne i ogólne kroki.', en: 'We will show educational resources and general next steps.' } }
      ]
    },
    {
      id: 'need',
      type: 'multi',
      required: true,
      title: { pl: 'Czego potrzebujesz dzisiaj najbardziej?', en: 'What do you need most today?' },
      help: { pl: 'To pytanie dopasuje sekcje na stronie.', en: 'This question matches the page sections to you.' },
      options: [
        { value: 'understand', flags: ['learn'], label: { pl: 'Zrozumieć, co może się dziać.', en: 'Understand what may be happening.' }, hint: { pl: 'Przejdź do edukacji interaktywnej.', en: 'Go to interactive education.' } },
        { value: 'doctor', flags: ['doctor'], label: { pl: 'Przygotować rozmowę z lekarzem.', en: 'Prepare for a doctor conversation.' }, hint: { pl: 'Wygeneruj notatkę i pytania.', en: 'Generate a note and questions.' } },
        { value: 'meals', flags: ['meals'], label: { pl: 'Mniej konfliktu przy posiłkach.', en: 'Less conflict at meals.' }, hint: { pl: 'Zbuduj plan zachowań rodzica.', en: 'Build a parent behaviour plan.' } },
        { value: 'resources', flags: ['resources'], label: { pl: 'Znaleźć sprawdzone zasoby.', en: 'Find reliable resources.' }, hint: { pl: 'Przejdź do filtrowanych linków.', en: 'Go to filtered links.' } }
      ]
    }
  ];

  const profileContent = {
    urgent: {
      label: { pl: 'Najpierw bezpieczeństwo', en: 'Safety first' },
      title: { pl: 'Najważniejszy krok to pilna ocena bezpieczeństwa.', en: 'The key step is urgent safety assessment.' },
      text: { pl: 'Odpowiedzi zawierają sygnały, które mogą wymagać szybkiego kontaktu z lekarzem, GP, pediatrą, szpitalem lub służbami ratunkowymi. Strona edukacyjna nie powinna opóźniać pomocy.', en: 'Your answers include signs that may need quick contact with a doctor, GP, paediatrician, hospital or emergency services. This educational page should not delay help.' }
    },
    ed: {
      label: { pl: 'Możliwy obszar: zaburzenia odżywiania', en: 'Possible area: eating disorder' },
      title: { pl: 'Warto porozmawiać z lekarzem o ocenie pod kątem zaburzeń odżywiania.', en: 'It is worth speaking with a doctor about eating-disorder assessment.' },
      text: { pl: 'Pojawiają się sygnały restrykcji, kontroli, kompensacji, obrazu ciała, utraty kontroli lub wpływu na zdrowie i funkcjonowanie. Nie trzeba czekać, aż problem będzie „wystarczająco poważny”.', en: 'There are signs of restriction, control, compensation, body image distress, loss of control or health/functioning impact. You do not need to wait until the problem is “serious enough”.' }
    },
    arfid: {
      label: { pl: 'Możliwy obszar: ARFID / nasilona wybiórczość', en: 'Possible area: ARFID / severe selective eating' },
      title: { pl: 'Problem może dotyczyć lęku, sensoryki, apetytu lub „bezpiecznych” produktów.', en: 'The issue may involve fear, sensory distress, appetite or “safe” foods.' },
      text: { pl: 'Odpowiedzi pasują bardziej do unikania lub ograniczania jedzenia bez typowego skupienia na wadze czy sylwetce. Warto sprawdzić wpływ na wzrost, niedobory, szkołę i życie rodzinne.', en: 'Your answers fit avoidance or restriction not necessarily driven by weight or shape concerns. Check impact on growth, deficiencies, school and family life.' }
    },
    feeding: {
      label: { pl: 'Możliwy obszar: trudności karmienia / objawy medyczne', en: 'Possible area: feeding difficulty / medical symptoms' },
      title: { pl: 'Warto sprawdzić, czy jedzenie jest fizycznie trudne lub bolesne.', en: 'It is worth checking whether eating is physically difficult or painful.' },
      text: { pl: 'Pojawiają się sygnały związane z gryzieniem, połykaniem, bólem, refluksem, konsystencją, wzrostem albo młodszym wiekiem. Sama presja przy stole może nie rozwiązać problemu.', en: 'There are signs related to chewing, swallowing, pain, reflux, textures, growth or younger age. Pressure at the table alone will not solve this.' }
    },
    parent: {
      label: { pl: 'Kierunek: uporządkowanie obserwacji', en: 'Direction: organise observations' },
      title: { pl: 'Zacznij od spokojnej struktury i zebrania faktów.', en: 'Start with calm structure and fact-gathering.' },
      text: { pl: 'Na ten moment odpowiedzi nie wskazują jednej dominującej ścieżki. Dobrze jest obserwować wzorce, zmniejszyć presję przy posiłkach i przygotować rozmowę ze specjalistą, jeśli problem się utrzymuje.', en: 'At this point your answers do not point to one dominant route. Observe patterns, reduce mealtime pressure and prepare a specialist conversation if the problem persists.' }
    }
  };

  const learningPanels = {
    ed: {
      icon: 'ED',
      tab: { pl: 'Zaburzenia odżywiania', en: 'Eating disorders' },
      title: { pl: 'Zaburzenia odżywiania', en: 'Eating disorders' },
      summary: { pl: 'Często dotyczą nie tylko jedzenia, ale też lęku, kontroli, obrazu ciała, wstydu, kompensacji lub utraty kontroli.', en: 'Often involve not only food, but also anxiety, control, body image, shame, compensation or loss of control.' },
      points: [
        { pl: 'Sygnały: ograniczanie, pomijanie posiłków, sztywne reguły, wymioty, nadmierne ćwiczenia, izolacja przy jedzeniu.', en: 'Signs: restriction, skipped meals, rigid rules, vomiting, over-exercise, isolation around food.' },
        { pl: 'Obserwuj zmianę zachowania, energii, nastroju, relacji i objawów fizycznych. Nie oceniaj ryzyka wyłącznie po wyglądzie.', en: 'Observe changes in behaviour, energy, mood, relationships and physical symptoms. Do not judge risk only by appearance.' },
        { pl: 'Pierwszy krok: GP/lekarz/pediatra; przy podejrzeniu zaburzeń odżywiania potrzebna jest specjalistyczna ocena.', en: 'First step: GP/doctor/paediatrician; if an eating disorder is suspected, specialist assessment is needed.' }
      ]
    },
    arfid: {
      icon: 'AR',
      tab: { pl: 'ARFID / wybiórczość', en: 'ARFID / selective eating' },
      title: { pl: 'ARFID / nasilona wybiórczość', en: 'ARFID / severe selective eating' },
      summary: { pl: 'ARFID nie musi dotyczyć sylwetki. Problemem może być lęk, sensoryka, brak apetytu albo obawa przed konsekwencjami jedzenia.', en: 'ARFID does not have to involve body image. The driver may be fear, sensory distress, low appetite or fear of eating consequences.' },
      points: [
        { pl: 'Sygnały: bardzo krótka lista bezpiecznych produktów, panika przy nowych potrawach, unikanie jedzenia poza domem.', en: 'Signs: very short safe-food list, panic with new foods, avoidance of eating outside home.' },
        { pl: 'Obserwuj wpływ na wzrost, niedobory, energię, szkołę, rodzinę i życie społeczne.', en: 'Observe impact on growth, deficiencies, energy, school, family and social life.' },
        { pl: 'Pierwszy krok: ocena pediatryczna i psychologiczna; czasem dietetyk, terapeuta karmienia lub gastrolog.', en: 'First step: paediatric and psychological assessment; sometimes a dietitian, feeding therapist or GI specialist.' }
      ]
    },
    feeding: {
      icon: 'PF',
      tab: { pl: 'Trudności karmienia', en: 'Feeding difficulties' },
      title: { pl: 'Pediatric Feeding Disorder / trudności karmienia', en: 'Pediatric Feeding Disorder / feeding difficulties' },
      summary: { pl: 'U młodszych dzieci jedzenie może być trudne z powodów medycznych, żywieniowych, umiejętności gryzienia/połykania albo zachowań przy posiłku.', en: 'In younger children, eating may be difficult for medical, nutritional, chewing/swallowing skill or mealtime-behaviour reasons.' },
      points: [
        { pl: 'Sygnały: krztuszenie, kaszel, trudność z konsystencjami, ból, refluks, zaparcia, problemy wzrostu.', en: 'Signs: choking, coughing, texture difficulty, pain, reflux, constipation, growth concerns.' },
        { pl: 'Obserwuj, czy dziecko może nie mieć umiejętności lub doświadczać realnego dyskomfortu, a nie tylko „odmawiać”.', en: 'Observe whether the child may lack skills or feel real discomfort, rather than simply “refusing”.' },
        { pl: 'Pierwszy krok: pediatra; zależnie od objawów logopeda/feeding therapist, dietetyk, gastrolog lub zespół wielospecjalistyczny.', en: 'First step: paediatrician; depending on symptoms, speech/feeding therapist, dietitian, GI specialist or multidisciplinary team.' }
      ]
    }
  };

  const scenarios = [
    {
      id: 'refusal',
      label: { pl: 'Odmowa posiłku', en: 'Meal refusal' },
      avoid: { pl: '„Musisz to zjeść, inaczej nie odejdziesz od stołu.”', en: '“You have to eat this or you cannot leave the table.”' },
      tryThis: { pl: '„Widzę, że ten posiłek jest dziś trudny. Zostańmy przy stole spokojnie. Możesz zacząć od tego, co jest najłatwiejsze.”', en: '“I can see this meal is hard today. Let us stay calm at the table. You can start with what feels easiest.”' },
      why: { pl: 'Presja zwiększa lęk i walkę o kontrolę. Spokojna struktura zmniejsza eskalację.', en: 'Pressure increases anxiety and control battles. Calm structure reduces escalation.' }
    },
    {
      id: 'bodyTalk',
      label: { pl: '„Jestem gruba/y”', en: '“I am fat”' },
      avoid: { pl: '„Nie, jesteś chuda/y, nie przesadzaj.”', en: '“No, you are skinny, do not exaggerate.”' },
      tryThis: { pl: '„Słyszę, że bardzo źle się teraz czujesz w swoim ciele. Chcę zrozumieć, kiedy te myśli są najsilniejsze.”', en: '“I hear that you feel very bad in your body right now. I want to understand when these thoughts are strongest.”' },
      why: { pl: 'Zaprzeczanie często zamyka rozmowę. Nazwanie emocji pomaga przejść od wyglądu do doświadczenia dziecka.', en: 'Contradicting often shuts the conversation down. Naming the emotion moves from appearance to the child’s experience.' }
    },
    {
      id: 'texture',
      label: { pl: 'Panika przy teksturze', en: 'Panic with texture' },
      avoid: { pl: '„To tylko warzywo, przestań wymyślać.”', en: '“It is just a vegetable, stop making things up.”' },
      tryThis: { pl: '„Ta tekstura jest dla Ciebie za trudna. Nie musisz jej dziś jeść. Możemy ją tylko zobaczyć, powąchać albo dotknąć widelcem.”', en: '“This texture is too hard for you today. You do not have to eat it. We can just look at it, smell it or touch it with a fork.”' },
      why: { pl: 'Małe kroki zmniejszają napięcie. Celem jest bezpieczeństwo i tolerancja, nie wymuszenie kęsa.', en: 'Small steps reduce tension. The goal is safety and tolerance, not forcing a bite.' }
    },
    {
      id: 'bathroom',
      label: { pl: 'Łazienka po posiłku', en: 'Bathroom after meals' },
      avoid: { pl: '„Wiem, że wymiotujesz. Przestań natychmiast.”', en: '“I know you are vomiting. Stop right now.”' },
      tryThis: { pl: '„Martwię się, bo zauważyłam/em częste wyjścia po posiłku. Chcę porozmawiać z lekarzem, żeby sprawdzić, czy jesteś bezpieczna/y.”', en: '“I am worried because I noticed frequent bathroom trips after meals. I want us to speak with a doctor to check you are safe.”' },
      why: { pl: 'Oskarżenie może zwiększyć ukrywanie. Konkretna obserwacja i bezpieczeństwo ułatwiają rozmowę.', en: 'Accusation may increase hiding. Concrete observation and safety make conversation easier.' }
    },
    {
      id: 'schoolLunch',
      label: { pl: 'Omijanie lunchu w szkole', en: 'Skipping school lunch' },
      avoid: { pl: '„Po prostu zjedz w szkole jak wszyscy.”', en: '“Just eat at school like everyone else.”' },
      tryThis: { pl: '„Sprawdźmy, co dokładnie jest najtrudniejsze: jedzenie przy innych, hałas, brak bezpiecznego jedzenia czy lęk po posiłku.”', en: '“Let us check what exactly is hardest: eating around others, noise, no safe food or anxiety after eating.”' },
      why: { pl: 'To rozbija problem na elementy, które można rozwiązać praktycznie ze szkołą i specjalistą.', en: 'This breaks the problem into parts that can be solved practically with school and a specialist.' }
    }
  ];

  const mealOptions = [
    { id: 'rhythm', label: { pl: 'Przewidywalny rytm', en: 'Predictable rhythm' }, hint: { pl: 'Podobne pory posiłków i przekąsek, bez ciągłych negocjacji.', en: 'Similar times for meals and snacks, without constant negotiation.' }, output: { pl: 'Ustalamy przewidywalny rytm posiłków i przekąsek. Nie komentujemy kalorii ani wielkości porcji przy stole.', en: 'We set a predictable rhythm for meals and snacks. We do not comment on calories or portion size at the table.' } },
    { id: 'safeBridge', label: { pl: 'Bezpieczny produkt + mały most', en: 'Safe food + tiny bridge' }, hint: { pl: 'Obok znanego produktu pojawia się bardzo mały, neutralny krok.', en: 'A tiny neutral step appears next to a familiar food.' }, output: { pl: 'Do posiłku dodajemy jeden bezpieczny element i jeden minimalny „most”: zobaczyć, powąchać, dotknąć lub mieć na talerzu.', en: 'Each meal includes one safe element and one tiny bridge: look, smell, touch or have it on the plate.' } },
    { id: 'neutral', label: { pl: 'Neutralny język', en: 'Neutral language' }, hint: { pl: 'Mniej rozmów o wadze, wyglądzie, „dobrym” i „złym” jedzeniu.', en: 'Less talk about weight, appearance, “good” and “bad” foods.' }, output: { pl: 'Używamy neutralnego języka: jedzenie nie jest „dobre/złe”, a ciało nie jest tematem komentarzy przy posiłkach.', en: 'We use neutral language: food is not “good/bad”, and bodies are not a topic for mealtime comments.' } },
    { id: 'afterMeal', label: { pl: 'Spokojny czas po posiłku', en: 'Calm post-meal time' }, hint: { pl: 'Krótka aktywność rodzinna po jedzeniu, zwłaszcza gdy jest lęk lub kompensacja.', en: 'A short family activity after eating, especially when anxiety or compensation is present.' }, output: { pl: 'Po posiłku planujemy spokojne 20-30 minut: gra, rozmowa, serial albo spokojna aktywność bez presji na ćwiczenia.', en: 'After meals we plan calm 20-30 minutes: game, conversation, show or calm activity without exercise pressure.' } },
    { id: 'school', label: { pl: 'Plan szkolny', en: 'School lunch plan' }, hint: { pl: 'Co dziecko może zjeść, gdzie, z kim i co zrobić w trudnym momencie.', en: 'What the child can eat, where, with whom and what to do in a hard moment.' }, output: { pl: 'Tworzymy prosty plan szkolny: bezpieczna opcja lunchu, osoba kontaktowa i plan awaryjny, gdy posiłek nie wyjdzie.', en: 'We create a simple school plan: safe lunch option, contact person and backup plan if lunch does not work.' } },
    { id: 'observe', label: { pl: 'Obserwacje bez przesłuchania', en: 'Observations without interrogation' }, hint: { pl: 'Zbierasz fakty, ale nie robisz z każdego posiłku kontroli.', en: 'You gather facts without turning every meal into surveillance.' }, output: { pl: 'Zapisujemy krótkie obserwacje 2-3 razy w tygodniu: co było trudne, co pomogło, jakie objawy fizyczne się pojawiły.', en: 'We write brief observations 2-3 times a week: what was hard, what helped, what physical symptoms appeared.' } }
  ];

  const doctorOptions = [
    { id: 'rapidChange', label: { pl: 'Szybka zmiana jedzenia, masy ciała, energii lub nastroju.', en: 'Rapid change in eating, weight, energy or mood.' } },
    { id: 'restriction', label: { pl: 'Pomijanie posiłków, coraz mniejsze porcje lub sztywne zasady.', en: 'Skipping meals, smaller portions or rigid rules.' } },
    { id: 'purging', label: { pl: 'Podejrzenie wymiotów, środków przeczyszczających, kompensacji lub nadmiernych ćwiczeń.', en: 'Possible vomiting, laxatives, compensation or excessive exercise.' } },
    { id: 'physical', label: { pl: 'Zawroty głowy, omdlenia, ból w klatce, osłabienie, odwodnienie lub marznięcie.', en: 'Dizziness, fainting, chest pain, weakness, dehydration or feeling cold.' } },
    { id: 'sensory', label: { pl: 'Bardzo ograniczona lista produktów, silna reakcja na teksturę, zapach lub kolor.', en: 'Very narrow food list, strong reaction to texture, smell or colour.' } },
    { id: 'choking', label: { pl: 'Lęk przed zadławieniem, wymiotami, bólem lub jedzeniem poza domem.', en: 'Fear of choking, vomiting, pain or eating outside home.' } },
    { id: 'swallow', label: { pl: 'Kaszel, krztuszenie, trudność z gryzieniem, połykaniem lub konsystencją.', en: 'Coughing, choking, chewing, swallowing or texture difficulty.' } },
    { id: 'growth', label: { pl: 'Niepokój o wzrost, dojrzewanie, koncentrację, sen lub niedobory.', en: 'Concern about growth, puberty, concentration, sleep or deficiencies.' } },
    { id: 'family', label: { pl: 'Silny stres rodzinny przy posiłkach lub unikanie życia społecznego.', en: 'High family stress at meals or social avoidance.' } }
  ];

  const resources = [
    { title: { pl: 'HSE - zaburzenia odżywiania', en: 'HSE - eating disorders' }, text: { pl: 'Objawy, sygnały u dzieci i informacja, że pierwszym krokiem jest kontakt z GP.', en: 'Symptoms, signs in children and information that the first step is contacting a GP.' }, url: 'https://www2.hse.ie/conditions/eating-disorders/', tags: ['ie', 'clinical', 'parents'] },
    { title: { pl: 'Bodywhys - ścieżka publiczna dla dzieci i nastolatków', en: 'Bodywhys - public pathway for children and adolescents' }, text: { pl: 'Wyjaśnia drogę: GP, CAMHS / child and adolescent eating-disorder team, ocena i poziom opieki.', en: 'Explains the route: GP, CAMHS / child and adolescent eating-disorder team, assessment and level of care.' }, url: 'https://www.bodywhys.ie/treatment-pathway/public-pathway-for-children-and-adolescents/', tags: ['ie', 'clinical', 'parents'] },
    { title: { pl: 'Bodywhys - helpline', en: 'Bodywhys - helpline' }, text: { pl: 'Poufne wsparcie i informacje dla osób z zaburzeniami odżywiania oraz rodzin martwiących się o bliską osobę.', en: 'Confidential support and information for people with eating disorders and families worried about someone.' }, url: 'https://www.bodywhys.ie/recovery-support-treatment/support-services-2/helpline/', tags: ['ie', 'parents', 'urgent'] },
    { title: { pl: 'Bodywhys - ARFID', en: 'Bodywhys - ARFID' }, text: { pl: 'Opisuje restrykcyjne unikanie jedzenia, sensorykę, lęk przed wymiotami lub zadławieniem i wpływ na funkcjonowanie.', en: 'Describes restrictive food avoidance, sensory issues, fear of vomiting or choking and functional impact.' }, url: 'https://www.bodywhys.ie/understanding-eating-disorders/arfid/', tags: ['ie', 'arfid', 'parents', 'clinical'] },
    { title: { pl: 'NICE NG69', en: 'NICE NG69' }, text: { pl: 'Wytyczne dotyczące rozpoznawania, oceny, leczenia i monitorowania zaburzeń odżywiania u dzieci, młodzieży i dorosłych.', en: 'Guideline on recognition, assessment, treatment and monitoring of eating disorders in children, young people and adults.' }, url: 'https://www.nice.org.uk/guidance/ng69', tags: ['clinical'] },
    { title: { pl: 'Feeding Matters - Pediatric Feeding Disorder', en: 'Feeding Matters - Pediatric Feeding Disorder' }, text: { pl: 'Definicja PFD i cztery domeny: medyczna, żywieniowa, umiejętności karmienia i psychospołeczna.', en: 'PFD definition and four domains: medical, nutrition, feeding skill and psychosocial.' }, url: 'https://www.feedingmatters.org/what-is-pfd/', tags: ['feeding', 'parents', 'clinical'] },
    { title: { pl: 'NEDA - ARFID u dzieci i nastolatków', en: 'NEDA - ARFID in children and teens' }, text: { pl: 'Przystępne wyjaśnienie, dlaczego ARFID to więcej niż „wybredność” i jakie są typowe podtypy.', en: 'Accessible explanation of why ARFID is more than “picky eating” and common subtypes.' }, url: 'https://www.nationaleatingdisorders.org/understanding-arfid/', tags: ['arfid', 'parents'] },
    { title: { pl: 'pacjent.gov.pl - anoreksja i bulimia', en: 'pacjent.gov.pl - anorexia and bulimia' }, text: { pl: 'Polskie źródło o rozmowie z dzieckiem, leczeniu i wsparciu rodziny.', en: 'Polish source on speaking with a child, treatment and family support.' }, url: 'https://pacjent.gov.pl/zapobiegaj/anoreksja-i-bulimia', tags: ['pl', 'parents', 'clinical'] },
    { title: { pl: 'gov.pl - 116 111', en: 'gov.pl - 116 111 child helpline' }, text: { pl: 'Telefon zaufania dla dzieci i młodzieży w Polsce, czynny całą dobę przez 7 dni w tygodniu.', en: 'Child and youth helpline in Poland, available 24/7.' }, url: 'https://www.gov.pl/web/numer-alarmowy-112/telefon-zaufania-dla-dzieci-i-mlodziezy', tags: ['pl', 'urgent', 'parents'] }
  ];

  function getLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'pl';
  }

  function text(key) {
    return copy[getLang()][key] || key;
  }

  function local(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[getLang()] || value.pl || '';
  }

  function escapeHTML(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function hasAny(value, expected) {
    if (!value) return false;
    return Array.isArray(value) ? value.some((item) => expected.includes(item)) : expected.includes(value);
  }

  function getQuestion(id) {
    return questions.find((question) => question.id === id);
  }

  function getOption(questionId, value) {
    return getQuestion(questionId)?.options.find((option) => option.value === value);
  }

  function getActiveQuestions() {
    return questions.filter((question) => !question.condition || question.condition(state.answers));
  }

  function selectedValues(question) {
    const answer = state.answers[question.id];
    return question.type === 'multi' ? (Array.isArray(answer) ? answer : []) : (answer ? [answer] : []);
  }

  function answerExists(question) {
    if (!question.required) return true;
    return selectedValues(question).length > 0;
  }

  function pruneInactiveAnswers() {
    const activeIds = new Set(getActiveQuestions().map((question) => question.id));
    Object.keys(state.answers).forEach((id) => {
      if (!activeIds.has(id)) delete state.answers[id];
    });
    const activeQuestions = getActiveQuestions();
    if (state.step >= activeQuestions.length) state.step = Math.max(0, activeQuestions.length - 1);
  }

  function countAnswers() {
    return getActiveQuestions()
      .map((question) => state.answers[question.id])
      .filter((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))
      .length;
  }

  function flagsFromAnswers() {
    const flags = new Set();
    getActiveQuestions().forEach((question) => {
      selectedValues(question).forEach((value) => {
        const option = getOption(question.id, value);
        (option?.flags || []).forEach((flag) => flags.add(flag));
      });
    });
    return flags;
  }

  function deriveProfile() {
    const score = { urgent: 0, ed: 0, arfid: 0, feeding: 0, medical: 0, parent: 1 };
    flagsFromAnswers().forEach((flag) => {
      if (Object.prototype.hasOwnProperty.call(score, flag)) score[flag] += 1;
    });

    if (state.answers.safety === 'urgent') score.urgent += 5;
    if (state.answers.safety === 'unsure') {
      score.urgent += 1;
      score.medical += 1;
    }
    if (state.answers.age === 'under6') score.feeding += 1;
    if (['restriction', 'body', 'purge', 'binge'].includes(state.answers.mainConcern)) score.ed += 3;
    if (state.answers.mainConcern === 'purge') score.urgent += 1;
    if (['sensory', 'fear'].includes(state.answers.mainConcern)) score.arfid += 3;
    if (state.answers.mainConcern === 'pain') score.feeding += 3;
    if (hasAny(state.answers.bodyImage, ['bathroom'])) score.urgent += 1;
    if (hasAny(state.answers.impact, ['physical'])) {
      score.urgent += 1;
      score.medical += 2;
    }
    if (hasAny(state.answers.medicalSigns, ['coughing', 'chewing', 'painReflux'])) score.feeding += 2;
    if (hasAny(state.answers.medicalSigns, ['growth'])) score.medical += 1;
    if (hasAny(state.answers.arfidDrivers, ['texture', 'safeFoods', 'lowAppetite'])) score.arfid += 2;
    if (hasAny(state.answers.arfidDrivers, ['choking'])) {
      score.feeding += 1;
      score.medical += 1;
    }
    if (state.answers.duration === 'months' || state.answers.duration === 'years') {
      score.ed += 1;
      score.arfid += 1;
      score.feeding += 1;
    }

    let primary = 'parent';
    if (score.urgent >= 4) primary = 'urgent';
    else if (score.medical + score.feeding >= 5 && score.feeding >= score.ed) primary = 'feeding';
    else if (score.ed >= score.arfid && score.ed >= score.feeding && score.ed >= 3) primary = 'ed';
    else if (score.arfid >= 3) primary = 'arfid';
    else if (score.feeding >= 3) primary = 'feeding';

    return { primary, score };
  }

  function getRecommendedActions(profile) {
    const actions = [];
    if (profile.primary === 'urgent') {
      actions.push({ title: { pl: 'Nie czekaj na pełne wypełnienie strony', en: 'Do not wait to complete the page' }, text: { pl: 'Przy objawach nagłych skontaktuj się z lokalnymi służbami ratunkowymi lub pilną opieką medyczną.', en: 'With emergency symptoms, contact local emergency services or urgent medical care.' } });
    }
    if (profile.primary === 'ed' || profile.score.ed >= 3) {
      actions.push({ title: { pl: 'Umów GP / lekarza / pediatrę', en: 'Book GP / doctor / paediatrician' }, text: { pl: 'Opisz konkretne zachowania: restrykcje, wymioty, ćwiczenia, łazienkę po posiłku, zmiany nastroju i objawy fizyczne.', en: 'Describe concrete behaviours: restriction, vomiting, exercise, bathroom after meals, mood changes and physical symptoms.' } });
      actions.push({ title: { pl: 'Zapytaj o specjalistyczną ścieżkę', en: 'Ask about specialist pathway' }, text: { pl: 'W Irlandii punktem startowym jest GP, a dalej CAMHS / child and adolescent eating-disorder team, zależnie od ryzyka i dostępności.', en: 'In Ireland, the starting point is the GP, then CAMHS / child and adolescent eating-disorder team depending on risk and availability.' } });
    }
    if (profile.primary === 'arfid' || profile.score.arfid >= 3) {
      actions.push({ title: { pl: 'Zapisz bezpieczne produkty i sytuacje', en: 'List safe foods and situations' }, text: { pl: 'Zapisz tekstury, miejsca, lęk, objawy po jedzeniu i wpływ na szkołę, nie tylko listę produktów.', en: 'Note textures, places, fear, symptoms after eating and school impact, not just a food list.' } });
      actions.push({ title: { pl: 'Sprawdź ARFID, ale nie zakładaj diagnozy', en: 'Consider ARFID, but do not assume diagnosis' }, text: { pl: 'Omów sensorykę, lęk przed konsekwencjami jedzenia, apetyt i niedobory z pediatrą lub specjalistą.', en: 'Discuss sensory issues, fear of eating consequences, appetite and deficiencies with a paediatrician or specialist.' } });
    }
    if (profile.primary === 'feeding' || profile.score.feeding >= 3 || profile.score.medical >= 2) {
      actions.push({ title: { pl: 'Wyklucz ból i trudności połykania', en: 'Rule out pain and swallowing difficulty' }, text: { pl: 'Kaszel, krztuszenie, refluks, ból, zaparcia i problemy z konsystencją warto omówić medycznie.', en: 'Coughing, choking, reflux, pain, constipation and texture difficulty are worth medical discussion.' } });
    }
    actions.push({ title: { pl: 'Zmniejsz presję przy stole', en: 'Reduce pressure at the table' }, text: { pl: 'Komentarze o porcjach, wadze i „dobrym/złym” jedzeniu zwykle zwiększają napięcie.', en: 'Comments about portions, weight and “good/bad” foods usually increase tension.' } });
    actions.push({ title: { pl: 'Zadbaj też o wsparcie rodzica', en: 'Support the parent too' }, text: { pl: 'Rodzic nie musi mieć perfekcyjnych reakcji. Potrzebuje planu, języka i zespołu, jeśli problem jest poważny.', en: 'Parents do not need perfect reactions. They need a plan, language and a team if the problem is serious.' } });
    return actions;
  }

  function renderQuestion() {
    pruneInactiveAnswers();
    const activeQuestions = getActiveQuestions();
    const question = activeQuestions[state.step];
    const values = selectedValues(question);
    const typeText = question.type === 'multi' ? text('multi') : text('single');
    const inputType = question.type === 'multi' ? 'checkbox' : 'radio';
    const legendId = `${question.id}-legend`;

    els.question.innerHTML = `
      <div class="children-question-meta">
        <span>${escapeHTML(typeText)}</span>
        ${question.required ? '' : `<span>${escapeHTML(text('optional'))}</span>`}
      </div>
      <h3 id="${legendId}">${escapeHTML(local(question.title))}</h3>
      <p>${escapeHTML(local(question.help))}</p>
      <fieldset class="children-options" aria-labelledby="${legendId}">
        <legend class="sr-only">${escapeHTML(local(question.title))}</legend>
        ${question.options.map((option) => {
          const id = `${question.id}-${option.value}`;
          const checked = values.includes(option.value) ? ' checked' : '';
          return `
            <label class="children-option" for="${id}">
              <input id="${id}" type="${inputType}" name="${question.id}" value="${escapeHTML(option.value)}"${checked}>
              <span><strong>${escapeHTML(local(option.label))}</strong><span>${escapeHTML(local(option.hint))}</span></span>
            </label>`;
        }).join('')}
      </fieldset>
    `;

    els.question.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        if (question.type === 'multi') {
          const current = new Set(selectedValues(question));
          if (input.value === 'none' && input.checked) {
            state.answers[question.id] = ['none'];
          } else {
            current.delete('none');
            if (input.checked) current.add(input.value);
            else current.delete(input.value);
            state.answers[question.id] = Array.from(current);
          }
        } else {
          state.answers[question.id] = input.value;
        }
        els.error.textContent = '';
        renderAll(false);
      });
    });

    const progress = Math.round(((state.step + 1) / activeQuestions.length) * 100);
    els.stepCount.textContent = `${text('step')} ${state.step + 1} ${text('of')} ${activeQuestions.length}`;
    els.progress.setAttribute('aria-valuemax', String(activeQuestions.length));
    els.progress.setAttribute('aria-valuenow', String(state.step + 1));
    els.progress.setAttribute('aria-label', text('progressLabel'));
    els.progressBar.style.width = `${progress}%`;
    els.progressText.textContent = `${progress}%`;
    els.live.textContent = `${els.stepCount.textContent}: ${local(question.title)}`;
    els.back.textContent = text('back');
    els.next.textContent = state.step === activeQuestions.length - 1 ? text('finish') : text('next');
    els.reset.textContent = text('reset');
    els.back.disabled = state.step === 0;
    els.next.disabled = !answerExists(question);
  }

  function renderLiveRoutes() {
    if (countAnswers() === 0) {
      els.liveRoutes.innerHTML = `<div class="children-route"><strong>${escapeHTML(text('noAnswers'))}</strong></div>`;
      els.answerSummary.innerHTML = '';
      return;
    }

    const profile = deriveProfile();
    const keys = [profile.primary];
    if (profile.score.ed >= 3 && !keys.includes('ed')) keys.push('ed');
    if (profile.score.arfid >= 3 && !keys.includes('arfid')) keys.push('arfid');
    if ((profile.score.feeding >= 3 || profile.score.medical >= 2) && !keys.includes('feeding')) keys.push('feeding');
    if (!keys.includes('parent')) keys.push('parent');

    els.liveRoutes.innerHTML = keys.slice(0, 4).map((key) => {
      const content = profileContent[key];
      const href = key === 'urgent' ? '#resources' : key === 'parent' ? '#meal-builder' : '#learn';
      return `<a class="children-route" href="${href}"><strong>${escapeHTML(local(content.label))}</strong><span>${escapeHTML(local(content.title))}</span></a>`;
    }).join('');

    const chips = [];
    getActiveQuestions().forEach((question) => {
      selectedValues(question).forEach((value) => {
        const option = getOption(question.id, value);
        if (option) chips.push(`<span class="children-answer-chip">${escapeHTML(local(option.label))}</span>`);
      });
    });
    els.answerSummary.innerHTML = chips.slice(0, 8).join('');
  }

  function renderResults(shouldFocus = false) {
    const profile = deriveProfile();
    const content = profileContent[profile.primary];
    const actions = getRecommendedActions(profile);
    els.results.hidden = false;
    els.results.innerHTML = `
      <div class="children-results-grid">
        <div class="children-result-main">
          <span class="children-result-badge ${profile.primary === 'urgent' ? 'is-urgent' : ''}">${escapeHTML(local(content.label))}</span>
          <h3>${escapeHTML(local(content.title))}</h3>
          <p>${escapeHTML(local(content.text))}</p>
          <p><strong>${escapeHTML(text('notDiagnosis'))}</strong> ${escapeHTML(text('organize'))} ${escapeHTML(text('speakDoctor'))}</p>
          <p>${escapeHTML(text('urgentHelp'))}</p>
          <div class="children-result-actions">
            <a class="btn btn-primary" href="#doctor">${escapeHTML(local({ pl: 'Przygotuj rozmowę z lekarzem', en: 'Prepare for a doctor visit' }))}</a>
            <a class="btn btn-secondary" href="#meal-builder">${escapeHTML(local({ pl: 'Wsparcie przy posiłkach', en: 'Meal support' }))}</a>
            <a class="btn btn-secondary" href="#resources">${escapeHTML(local({ pl: 'Zasoby', en: 'Resources' }))}</a>
            <button class="btn btn-secondary" type="button" data-copy-summary>${escapeHTML(text('copySummary'))}</button>
            <button class="btn btn-secondary" type="button" data-print-summary>${escapeHTML(text('printSummary'))}</button>
            <button class="btn btn-secondary" type="button" data-result-reset>${escapeHTML(text('reset'))}</button>
          </div>
        </div>
        <div>
          <h3>${escapeHTML(text('nextSteps'))}</h3>
          <div class="children-action-list">
            ${actions.map((action) => `<article class="children-action-card"><strong>${escapeHTML(local(action.title))}</strong><p>${escapeHTML(local(action.text))}</p></article>`).join('')}
          </div>
        </div>
      </div>
    `;
    if (shouldFocus) {
      els.results.focus();
      scrollToNode(els.results);
    }
  }

  function renderLearning() {
    const tabs = Object.entries(learningPanels);
    els.learningTabs.setAttribute('aria-label', text('tabsLabel'));
    els.learningTabs.innerHTML = tabs.map(([key, panel]) => `
      <button class="children-tab" type="button" role="tab" aria-selected="${state.activeLearn === key}" data-learn="${key}">${escapeHTML(local(panel.tab))}</button>
    `).join('');
    els.learningTabs.querySelectorAll('[data-learn]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeLearn = button.dataset.learn;
        renderLearning();
      });
    });

    const panel = learningPanels[state.activeLearn];
    els.learningPanel.innerHTML = `
      <div class="children-learning-visual">
        <div>
          <span class="children-tag">${escapeHTML(local(panel.title))}</span>
          <h3>${escapeHTML(local(panel.summary))}</h3>
        </div>
        <strong aria-hidden="true">${escapeHTML(panel.icon)}</strong>
      </div>
      <div class="children-learning-copy">
        <h3>${escapeHTML(local(panel.title))}</h3>
        <ul>${panel.points.map((point) => `<li>${escapeHTML(local(point))}</li>`).join('')}</ul>
        <p class="children-disclaimer">${escapeHTML(text('notDiagnosis'))}</p>
      </div>
    `;
  }

  function renderScenarios() {
    els.scenarioButtons.innerHTML = scenarios.map((scenario) => `
      <button class="children-chip ${state.activeScenario === scenario.id ? 'is-active' : ''}" type="button" data-scenario="${escapeHTML(scenario.id)}">${escapeHTML(local(scenario.label))}</button>
    `).join('');
    els.scenarioButtons.querySelectorAll('[data-scenario]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeScenario = button.dataset.scenario;
        renderScenarios();
      });
    });
    const scenario = scenarios.find((item) => item.id === state.activeScenario) || scenarios[0];
    els.scenarioOutput.innerHTML = `
      <article class="children-scenario-box"><h3>${escapeHTML(text('avoid'))}</h3><p>${escapeHTML(local(scenario.avoid))}</p></article>
      <article class="children-scenario-box"><h3>${escapeHTML(text('tryThis'))}</h3><p>${escapeHTML(local(scenario.tryThis))}</p></article>
      <article class="children-scenario-box"><h3>${escapeHTML(text('why'))}</h3><p>${escapeHTML(local(scenario.why))}</p></article>
    `;
  }

  function renderMealBuilder() {
    els.mealChecks.innerHTML = mealOptions.map((option) => `
      <label class="children-check">
        <input type="checkbox" value="${escapeHTML(option.id)}" ${state.mealPlan.has(option.id) ? 'checked' : ''}>
        <span><strong>${escapeHTML(local(option.label))}</strong><span>${escapeHTML(local(option.hint))}</span></span>
      </label>
    `).join('');
    els.mealChecks.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) state.mealPlan.add(input.value);
        else state.mealPlan.delete(input.value);
        renderMealBuilder();
      });
    });
    const selected = mealOptions.filter((option) => state.mealPlan.has(option.id));
    els.mealPlanText.textContent = selected.length
      ? selected.map((option, index) => `${index + 1}. ${local(option.output)}`).join('\n\n')
      : text('chooseMeal');
  }

  function renderDoctorBuilder() {
    els.doctorChecks.innerHTML = doctorOptions.map((option) => `
      <label class="children-check">
        <input type="checkbox" value="${escapeHTML(option.id)}" ${state.doctorItems.has(option.id) ? 'checked' : ''}>
        <span><strong>${escapeHTML(local(option.label))}</strong></span>
      </label>
    `).join('');
    els.doctorChecks.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) state.doctorItems.add(input.value);
        else state.doctorItems.delete(input.value);
        renderDoctorBuilder();
      });
    });
    els.doctorNote.textContent = buildDoctorNote();
  }

  function buildAnswerSummaryLines() {
    const lines = [];
    getActiveQuestions().forEach((question) => {
      const values = selectedValues(question);
      if (!values.length) return;
      const labels = values
        .map((value) => local(getOption(question.id, value)?.label))
        .filter(Boolean);
      if (labels.length) lines.push(`${local(question.title)} - ${labels.join('; ')}`);
    });
    return lines;
  }

  function buildDoctorNote() {
    const selectedDoctor = doctorOptions
      .filter((option) => state.doctorItems.has(option.id))
      .map((option) => local(option.label));
    const answerLines = buildAnswerSummaryLines();
    if (!selectedDoctor.length && !answerLines.length) return text('chooseDoctor');

    const lines = [text('summary') + ':'];
    if (answerLines.length) {
      lines.push('', text('observationIntro'));
      answerLines.forEach((line) => lines.push(`- ${line}`));
    }
    if (selectedDoctor.length) {
      lines.push('', text('additionalIntro'));
      selectedDoctor.forEach((line) => lines.push(`- ${line}`));
    }
    lines.push('', text('questionsIntro'), text('doctorQuestions'), '', text('notDiagnosis'));
    return lines.join('\n');
  }

  function buildFullSummary() {
    const answerLines = buildAnswerSummaryLines();
    if (!answerLines.length) return '';
    const profile = deriveProfile();
    const content = profileContent[profile.primary];
    const actions = getRecommendedActions(profile);
    return [
      text('summary'),
      '',
      ...answerLines.map((line) => `- ${line}`),
      '',
      `${text('suggested')}: ${local(content.label)}`,
      local(content.title),
      local(content.text),
      '',
      text('nextSteps') + ':',
      ...actions.map((action) => `- ${local(action.title)} - ${local(action.text)}`),
      '',
      text('notDiagnosis'),
      text('speakDoctor'),
      text('urgentHelp')
    ].join('\n');
  }

  function renderResources() {
    const filters = [
      ['all', text('all')],
      ['urgent', text('urgent')],
      ['ie', text('ireland')],
      ['pl', text('poland')],
      ['arfid', text('arfid')],
      ['parents', text('parents')],
      ['clinical', text('clinical')]
    ];
    els.resourceFilters.innerHTML = filters.map(([key, label]) => `
      <button class="children-chip ${state.activeResourceFilter === key ? 'is-active' : ''}" type="button" data-resource-filter="${key}">${escapeHTML(label)}</button>
    `).join('');
    els.resourceFilters.querySelectorAll('[data-resource-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeResourceFilter = button.dataset.resourceFilter;
        renderResources();
      });
    });

    const visible = state.activeResourceFilter === 'all'
      ? resources
      : resources.filter((resource) => resource.tags.includes(state.activeResourceFilter));
    els.resourceGrid.innerHTML = visible.map((resource) => `
      <article class="card children-resource-card">
        <div class="children-tag-row">${resource.tags.map((tag) => `<span class="children-tag">${escapeHTML(tag)}</span>`).join('')}</div>
        <h3>${escapeHTML(local(resource.title))}</h3>
        <p>${escapeHTML(local(resource.text))}</p>
        <a href="${escapeHTML(resource.url)}" target="_blank" rel="noopener">${escapeHTML(text('open'))}</a>
      </article>
    `).join('');
  }

  function renderAll(includeStatic = true) {
    renderQuestion();
    renderLiveRoutes();
    renderLearning();
    renderScenarios();
    renderMealBuilder();
    renderDoctorBuilder();
    renderResources();
    if (!els.results.hidden) renderResults(false);
    if (includeStatic) document.documentElement.lang = getLang();
  }

  function resetCompass() {
    state.step = 0;
    state.answers = {};
    els.results.hidden = true;
    els.error.textContent = '';
    renderAll(false);
    scrollToNode(root);
  }

  function scrollToNode(node) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('is-visible'), 2200);
  }

  async function copyText(value) {
    if (!value.trim()) {
      showToast(text('nothingToCopy'));
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy(value);
      }
      showToast(text('copied'));
    } catch (error) {
      try {
        fallbackCopy(value);
        showToast(text('copied'));
      } catch (copyError) {
        showToast(text('copyFailed'));
      }
    }
  }

  function fallbackCopy(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  els.back.addEventListener('click', () => {
    state.step = Math.max(0, state.step - 1);
    renderAll(false);
    els.question.focus();
  });

  els.next.addEventListener('click', () => {
    const activeQuestions = getActiveQuestions();
    const question = activeQuestions[state.step];
    if (!answerExists(question)) {
      els.error.textContent = text('required');
      return;
    }
    if (state.step >= activeQuestions.length - 1) {
      renderResults(true);
    } else {
      state.step += 1;
      renderAll(false);
      els.question.focus();
    }
  });

  els.reset.addEventListener('click', resetCompass);

  els.results.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.matches('[data-copy-summary]')) copyText(buildFullSummary());
    if (button.matches('[data-print-summary]')) window.print();
    if (button.matches('[data-result-reset]')) resetCompass();
  });

  document.querySelector('[data-copy-meal-plan]')?.addEventListener('click', () => {
    copyText(els.mealPlanText.textContent);
  });

  document.querySelector('[data-copy-doctor-note]')?.addEventListener('click', () => {
    copyText(els.doctorNote.textContent);
  });

  document.querySelectorAll('[data-children-filter-link]').forEach((link) => {
    link.addEventListener('click', () => {
      state.activeResourceFilter = link.dataset.childrenFilterLink;
      setTimeout(renderResources, 80);
    });
  });

  const observer = new MutationObserver(() => renderAll(false));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  renderAll(true);
})();
