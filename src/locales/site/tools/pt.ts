import { GEN_PT } from "./gen/pt";
import type { LocalTools } from "./types";

// The calculators in Brazilian Portuguese (você). Same parts as the English pages (src/app/tools/).
export const PT_TOOLS: LocalTools = {
  frame: {
    tools: "Ferramentas",
    questions: "Perguntas",
    more: "Mais:",
    and: " e ",
    englishLinks: "Os guias e artigos indicados estão em inglês.",
  },
  "plate-calculator": {
    page: {
      title: "Calculadora de anilhas: quais anilhas colocar em cada lado da barra",
      description:
        "Digite um peso e veja exatamente quais anilhas colocar em cada lado da barra, em kg ou lb, com as anilhas que você tem. Se não der para montar, ela mostra o peso mais próximo.",
      name: "Calculadora de anilhas",
      intro:
        "Quais anilhas vão em cada lado da barra para qualquer peso. Toque em + e − para ajustar; desative as anilhas que você não tem.",
      sticky: "Anilhas desenhadas em cada série",
      mid: {
        title: "Pare de fazer conta de anilha entre as séries",
        body: "O {app} desenha as anilhas de cada série e mostra o que trocar para a próxima enquanto você descansa.",
        button: "Experimente grátis",
      },
      end: {
        title: "Cada série montada para você",
        body: "Diga ao {app} uma vez quais anilhas a sua academia tem. Todo peso que ele planeja é um que você realmente consegue montar, com as anilhas de cada lado.",
      },
      faq: [
        [
          "Como calculo as anilhas por lado?",
          "Pegue o peso que você quer, tire o da barra (20 kg ou 45 lb numa barra olímpica padrão) e divida por dois. Isso vai em cada lado. Coloque primeiro as anilhas mais pesadas.",
        ],
        [
          "E se minhas anilhas não fecham esse peso?",
          "A calculadora encontra os pesos mais próximos que você consegue montar, acima e abaixo. Fique com o mais leve: é o erro mais seguro.",
        ],
        [
          "Quanto pesa a barra?",
          "Uma barra olímpica padrão pesa 20 kg ou 45 lb. As barras femininas, 15 kg ou 35 lb. Barras W, hexagonais e o Smith variam, então confira a sua.",
        ],
        [
          "O {app} faz isso por mim?",
          "Sim. O {app} só propõe pesos que as anilhas da sua academia conseguem montar, desenha as anilhas de cada série e mostra o que trocar entre as séries enquanto você descansa.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-load-a-barbell/",
          label: "como montar uma barra",
        },
      ],
    },
    ui: {
      units: "Unidades",
      weight: "Peso na barra ({unit})",
      weightAria: "peso",
      bar: "Barra",
      plates: "Anilhas que você tem",
      loadThis: "Coloque isto",
      cantMake: "Não dá para montar {want} com essas anilhas. O mais próximo:",
      eachSide: "Em cada lado: {plates}",
      justBar: "nada, só a barra",
      closestOne: "O mais próximo que você consegue montar: {below}. Ficar abaixo é o erro mais seguro.",
      closestTwo: "O mais próximo que você consegue montar: {below} ou {above}. Ficar abaixo é o erro mais seguro.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "Calculadora de 1RM: calcule sua carga máxima com qualquer série",
      description:
        "Calcule sua repetição máxima a partir do peso, das repetições e das repetições em reserva, com uma tabela de peso por repetições e o resultado de Epley, Brzycki e mais seis fórmulas.",
      name: "Calculadora de 1RM",
      intro:
        "Seu máximo estimado com qualquer série, sem precisar testar. Toque em + e − para informar uma série; segure para ir mais rápido.",
      sticky: "Seu máximo, acompanhado em cada série",
      mid: {
        title: "Veja seu máximo subir, série a série",
        body: "O {app} atualiza sua estimativa a cada série que você registra e mostra a tendência de cada exercício.",
        button: "Comece grátis",
      },
      end: {
        title: "Fique mais forte sem chutar",
        body: "O {app} transforma seu máximo no peso certo para cada série e aumenta quando você merece.",
      },
      faq: [
        [
          "Como se estima a repetição máxima?",
          "Com o peso e as repetições que você poderia ter feito até a falha (suas repetições mais as que sobravam). Até 10 repetições até a falha, faz a média de Brzycki, Epley e uma equação de 2026 que depende do peso; acima de 10, usa Mayhew, Wathan e essa mesma equação, que se saem melhor com mais repetições.",
        ],
        [
          "Por que contar as repetições que sobravam?",
          "As fórmulas supõem que você chegou à falha. Uma série de 5 com 2 em reserva é, na verdade, um esforço de 7, então sem contar isso a estimativa sai baixa.",
        ],
        [
          "Qual é a precisão?",
          "É mais precisa com séries pesadas de 2 a 6 repetições, ainda útil até umas 10 e aproximada a partir de 15. Trate como uma faixa e observe a tendência ao longo do tempo.",
        ],
        [
          "O {app} acompanha isso por mim?",
          "Sim. Cada série que você registra atualiza a estimativa daquele exercício, dando mais peso às séries recentes e mais próximas da falha, e mostra tudo num gráfico ao longo do tempo.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-estimate-your-one-rep-max/",
          label: "como estimar sua repetição máxima",
        },
        {
          href: "/guides/reps-in-reserve/",
          label: "repetições em reserva",
        },
      ],
    },
    ui: {
      units: "Unidades",
      weight: "Peso levantado ({unit})",
      weightAria: "peso",
      reps: "Repetições",
      repsAria: "repetições",
      left: "Repetições que sobravam",
      failure: "0 (falha)",
      leftNote: "Contar as repetições que sobravam deixa a estimativa muito mais precisa.",
      rough: "Acima de 10 repetições até a falha, as estimativas ficam mais aproximadas.",
      estimate: "Repetição máxima estimada",
      tableCaption: "Peso para cada número de repetições até a falha",
      colReps: "Reps",
      colWeight: "Peso",
      colPct: "% do máximo",
      formulas: "O que cada fórmula diz",
      formulasNote: "A estimativa acima faz a média das fórmulas que servem para {n} repetições até a falha (marcadas com ✓).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Calculadora de aquecimento: séries de aproximação para qualquer peso",
      description:
        "Digite seu peso de trabalho e veja as séries de aquecimento para agachamento, supino, levantamento terra, desenvolvimento ou remada, com as anilhas de cada lado.",
      name: "Calculadora de aquecimento",
      intro:
        "As séries de aquecimento antes do seu peso de trabalho: o bastante para você estar pronto, não tantas que cansem. Escolha um exercício e digite o peso.",
      sticky: "Aquecimentos planejados para cada exercício",
      mid: {
        title: "Nunca mais calcule um aquecimento",
        body: "O {app} acrescenta as séries de aquecimento a cada treino, com as anilhas desenhadas, e pula quando o músculo já está aquecido.",
        button: "Planejar meu treino",
      },
      end: {
        title: "Chegue, aqueça, treine",
        body: "O {app} planeja os aquecimentos, as séries de trabalho e o descanso entre elas, então você só precisa levantar.",
      },
      faq: [
        [
          "Quantas séries de aquecimento devo fazer?",
          "Depois da barra vazia: uma série mais leve se o seu peso de trabalho for menor que uns 50 kg (110 lb), duas séries de aproximação a partir de 50 kg e três a partir de 100 kg (220 lb), a última com uma só repetição a cerca de 85%.",
        ],
        [
          "Quantas repetições numa série de aquecimento?",
          "Menos à medida que o peso sobe: umas 5 com metade do seu peso de trabalho, 2 ou 3 entre 70 e 80% e uma só perto de 85%. A ideia é praticar o movimento e se acostumar com a carga, não se cansar.",
        ],
        [
          "Quanto descansar entre as séries de aquecimento?",
          "Uns {rest} segundos bastam para as leves. Descanse o seu tempo normal antes da primeira série de trabalho.",
        ],
        [
          "Preciso aquecer em todo exercício?",
          "Não. O primeiro exercício pesado de um músculo precisa de aproximação. Um exercício seguinte para os mesmos músculos precisa no máximo de uma série de reconhecimento, e o trabalho acessório leve quase nunca precisa de nada.",
        ],
      ],
      more: {
        heading: "Como o aquecimento é calculado",
        paragraphs: [
          "Começa com a barra vazia, 10 repetições fáceis (a não ser que seu peso de trabalho mal passe da barra), e depois sobe em poucos passos até o seu peso de trabalho. Cada passo é um peso que as suas anilhas realmente conseguem montar, mais pesado que o anterior e mais leve que o seu peso de trabalho. Quanto mais pesado o exercício, mais passos e menos repetições em cada um, para que o aquecimento prepare você sem tirar força das séries de trabalho.",
          "É a mesma progressão que o app {app} usa. No app, ele também sabe quais músculos já foram aquecidos antes no treino, então um segundo exercício de empurrar recebe uma só série de reconhecimento em vez de uma aproximação completa.",
        ],
      },
      reading: [
        {
          href: "/blog/how-to-warm-up-for-lifting/",
          label: "como aquecer para a musculação",
        },
        {
          href: "/pt/tools/plate-calculator/",
          label: "a calculadora de anilhas",
        },
        {
          href: "/blog/dynamic-vs-static-stretching/",
          label: "alongamento dinâmico ou estático",
        },
      ],
    },
    ui: {
      units: "Unidades",
      lift: "Exercício",
      lifts: {
        "back-squat": "Agachamento",
        "bench-press": "Supino",
        deadlift: "Levantamento terra",
        "overhead-press": "Desenvolvimento",
        "barbell-row": "Remada curvada com barra",
      },
      work: "Peso de trabalho ({unit})",
      workAria: "peso de trabalho",
      setsOne: "{n} série de aquecimento, {rest} s de descanso depois",
      setsMany: "{n} séries de aquecimento, {rest} s de descanso depois de cada uma",
      none: "Não é preciso aquecer com este peso",
      working: "{weight}: suas séries de trabalho",
      eachSide: "Em cada lado: {plates}",
      empty: "Barra vazia",
    },
  },
  "tdee-calculator": {
    page: {
      title: "Calculadora de TDEE: calorias por dia para manter, secar ou ganhar massa",
      description:
        "Calcule seu gasto energético diário total com idade, sexo, altura, peso e atividade: taxa metabólica basal, IMC, calorias para secar ou ganhar músculo e uma faixa de proteína para quem treina.",
      name: "Calculadora de TDEE",
      intro:
        "Quantas calorias você queima por dia e o que comer para manter, perder ou ganhar peso. Toque em + e − para informar seus números; segure para ir mais rápido.",
      sticky: "Calorias que acompanham suas pesagens",
      mid: {
        title: "Sempre atualizado, sem esforço",
        body: "Seu TDEE muda com o seu peso e o seu treino. O {app} recalcula sozinho com as suas pesagens e os dias em que você realmente treina, e mostra como ele muda com o tempo.",
        button: "Abrir o {app}",
      },
      end: {
        title: "Seu TDEE, sempre em dia",
        body: "O {app} recalcula com as suas pesagens e os dias em que você treina, e ainda planeja seus treinos.",
      },
      faq: [
        [
          "O que é o TDEE?",
          "O gasto energético diário total: as calorias que você queima num dia, somando o metabolismo em repouso (TMB), a digestão, o movimento do dia a dia e o exercício. Comendo mais ou menos isso, seu peso se mantém.",
        ],
        [
          "Qual fórmula ela usa?",
          "Mifflin-St Jeor para o gasto em repouso, a mais precisa das equações comuns para a maioria das pessoas. Se você informar sua gordura corporal, ela passa para Katch-McArdle, que parte da massa magra e funciona melhor para quem tem músculo. Depois, a TMB é multiplicada por um fator de atividade de 1,2 (sedentário) a 1,9 (atleta).",
        ],
        [
          "Quantas calorias para perder ou ganhar peso?",
          "Umas 500 abaixo do TDEE fazem perder cerca de 0,5 kg por semana. Para ganhar músculo com pouca gordura, umas 250 acima. Pese-se algumas vezes por semana e ajuste se a tendência não bater.",
        ],
        [
          "Qual é a precisão?",
          "Toda fórmula é uma estimativa, muitas vezes com margem de 10% para a maioria das pessoas. A balança manda: se a sua tendência de duas ou três semanas não bater, suba ou desça 100 a 200 calorias.",
        ],
        [
          "O {app} mantém meu TDEE em dia?",
          "Sim. No {app}, seu TDEE é recalculado sozinho quando seu peso, sua idade ou seu treino mudam, ele lê peso, altura e gordura corporal do Health Connect ou do Apple Saúde se você permitir, define seu nível de atividade pelos dias em que você realmente treina e mostra a evolução.",
        ],
      ],
      reading: [
        {
          href: "/pt/tools/macro-calculator/",
          label: "a calculadora de macros",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "quanta proteína para ganhar músculo",
        },
        {
          href: "/blog/body-recomposition/",
          label: "a recomposição corporal",
        },
      ],
    },
    ui: {
      units: "Unidades",
      metric: "Métrico",
      imperial: "Imperial",
      sex: "Sexo",
      female: "Mulher",
      male: "Homem",
      age: "Idade",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altura (cm)",
      heightIn: "Altura (pol)",
      fat: "Gordura corporal (opcional)",
      skip: "Pular",
      add: "Adicionar",
      fatPct: "Gordura corporal (%)",
      activity: "Atividade",
    },
  },
  "macro-calculator": {
    page: {
      title: "Calculadora de macros para quem treina: proteína, gordura e carboidratos",
      description:
        "Calcule calorias e macros para perder gordura, manter ou ganhar músculo com base em idade, sexo, altura, peso e atividade, com a proteína pensada para quem faz musculação.",
      name: "Calculadora de macros",
      intro:
        "As calorias para o seu objetivo a partir do seu TDEE, divididas em proteína, gordura e carboidratos para quem faz treino de força, com o porquê de cada número.",
      sticky: "Macros que acompanham suas pesagens",
      mid: {
        title: "Macros no seu ritmo",
        body: "No {app}, suas calorias e macros acompanham suas pesagens e seus dias de treino, e o coach avisa quando falta proteína.",
        button: "Comece grátis",
      },
      end: {
        title: "Treine para o objetivo da sua dieta",
        body: "O {app} planeja cada treino conforme a sua recuperação e o seu bloco, para você não perder força no cutting e ganhar músculo no bulking.",
      },
      faq: [
        [
          "Quanta proteína eu preciso para ganhar músculo?",
          "A maioria dos estudos com quem faz treino de força aponta entre 1,6 e 2,2 g por kg de peso por dia. Esta calculadora usa 1,8 g para manter ou ganhar e 2,2 g no cutting, quando mais proteína ajuda a preservar o músculo.",
        ],
        [
          "Como a gordura e os carboidratos são definidos?",
          "A gordura fica com um quarto das calorias, mas nunca menos de 0,6 g por kg, para cuidar dos hormônios. Os carboidratos completam o resto, porque são o combustível das séries pesadas. Se você prefere mais gordura e menos carboidrato, troque um pelo outro em calorias: 1 g de gordura tem 9 calorias e 1 g de carboidrato, 4.",
        ],
        [
          "Quantas calorias para perder gordura ou ganhar músculo?",
          "Umas 500 abaixo do TDEE fazem perder cerca de 0,5 kg por semana, sem nunca ficar abaixo da taxa metabólica basal. Umas 250 acima constroem músculo com pouca gordura. Pese-se algumas vezes por semana e ajuste se a tendência não bater.",
        ],
        [
          "Preciso acertar os macros em cheio?",
          "Não. Bata sua proteína e fique perto das suas calorias na maioria dos dias; a divisão entre gordura e carboidratos importa bem menos.",
        ],
      ],
      more: {
        heading: "Como é calculado",
        paragraphs: [
          "O TDEE vem da equação de Mifflin-St Jeor vezes um fator de atividade, igual à calculadora de TDEE. Seu objetivo define as calorias: 500 a menos (nunca abaixo da taxa metabólica basal), o mesmo ou 250 a mais. Primeiro se define a proteína por quilo de peso, depois a gordura, e os carboidratos ficam com o resto.",
        ],
      },
      reading: [
        {
          href: "/pt/tools/tdee-calculator/",
          label: "a calculadora de TDEE",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "quanta proteína para ganhar músculo",
        },
        {
          href: "/blog/lean-bulk/",
          label: "o bulking limpo",
        },
      ],
    },
    ui: {
      units: "Unidades",
      metric: "Métrico",
      imperial: "Imperial",
      goal: "Objetivo",
      cut: "Perder gordura",
      maintain: "Manter",
      bulk: "Ganhar músculo",
      sex: "Sexo",
      female: "Mulher",
      male: "Homem",
      age: "Idade",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altura (cm)",
      heightIn: "Altura (polegadas)",
      activity: "Atividade",
      kcalDay: "calorias por dia",
      protein: "Proteína",
      fat: "Gordura",
      carbs: "Carboidratos",
      proteinCut: "{perKg} g por kg de peso: o topo da faixa, para preservar o músculo enquanto você perde gordura.",
      proteinMaintain: "{perKg} g por kg de peso: o meio da faixa de que quem treina precisa.",
      proteinBulk: "{perKg} g por kg de peso: o bastante para ganhar músculo, com as calorias extras em carboidratos.",
      fatWhy: "Um quarto das suas calorias, e nunca menos de 0,6 g por kg, pelos hormônios.",
      carbsWhy: "O resto das suas calorias, para dar energia às séries pesadas.",
      kcalFloor: "Sua taxa metabólica basal de {bmr}: um corte maior ficaria abaixo dela, e isso custa músculo.",
      kcalCut: "500 abaixo do seu TDEE de {tdee}: cerca de {pace} a menos por semana.",
      kcalMaintain: "Seu TDEE: o que você queima num dia normal.",
      kcalBulk: "250 acima do seu TDEE de {tdee}: cerca de {pace} a mais por semana, principalmente músculo.",
      meals: "Divida a proteína em {meals} refeições; ela é mais bem aproveitada em porções de 30 a 40 g.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Calculadora de Wilks, com pontos IPF GL e DOTS",
      description:
        "Pontue seu total de agachamento, supino e levantamento terra pelo seu peso corporal com a fórmula de Wilks, os pontos IPF GL (clássico ou equipado) e DOTS, em kg ou lb.",
      name: "Calculadora de Wilks",
      intro:
        "Seu total de powerlifting pontuado pelo seu peso de três formas, Wilks, IPF GL e DOTS, para comparar atletas de qualquer tamanho e ver quanto falta para o próximo nível.",
      sticky: "Sua pontuação de força, sempre em dia",
      mid: {
        title: "As três pontuações, a cada série que você registra",
        body: "O {app} estima seu melhor agachamento, supino e levantamento terra com o seu treino e mantém Wilks, IPF GL e DOTS em dia, junto com o levantamento que está mais para trás.",
        button: "Comece grátis",
      },
      end: {
        title: "Construa um total maior",
        body: "O {app} planeja cada treino com repetições em reserva, faz um deload quando a fadiga se acumula e aumenta cada levantamento quando você merece.",
      },
      faq: [
        [
          "O que é a pontuação Wilks?",
          "Um número que compara totais de powerlifting entre pesos corporais. Seu total é multiplicado por um coeficiente de uma fórmula publicada por Robert Wilks, então um atleta leve e um pesado podem ser classificados juntos. Foi o padrão por décadas e muita gente ainda usa.",
        ],
        [
          "O que são os pontos IPF GL?",
          "A fórmula própria da Federação Internacional de Powerlifting desde 2020, às vezes chamada de pontos Goodlift. Tem versões diferentes para clássico (sem equipamento) e equipado, e para supino isolado. Uns 100 pontos são um total de nível mundial.",
        ],
        [
          "Qual pontuação devo usar?",
          "Se você compete, a que a sua federação usa. Para acompanhar seu próprio progresso, DOTS e IPF GL são as fórmulas mais novas, ajustadas com resultados recentes de competição. Compare uma pontuação só com a mesma fórmula.",
        ],
        [
          "O que é uma boa pontuação Wilks?",
          "Em linhas gerais, uns 300 são um total intermediário sólido, 400 avançado e 450 ou mais elite nos homens; as pontuações das mulheres seguem a mesma escala. São referências aproximadas, não níveis oficiais.",
        ],
      ],
      more: {
        heading: "Como as pontuações são calculadas",
        paragraphs: [
          "Wilks divide 500 por um polinômio de quinto grau do peso corporal em quilos, com coeficientes diferentes para homens e mulheres, e multiplica seu total pelo resultado. IPF GL divide 100 por A − B·e^(−C·peso corporal), com os A, B e C que a IPF publica para cada sexo, equipamento e prova. DOTS usa um polinômio de quarto grau. As libras são convertidas antes para quilos. Os coeficientes são conferidos com um projeto aberto de resultados de powerlifting.",
        ],
      },
      reading: [
        {
          href: "/pt/tools/dots-calculator/",
          label: "a calculadora de DOTS",
        },
        {
          href: "/pt/tools/one-rep-max-calculator/",
          label: "a calculadora de 1RM",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "como aumentar seu agachamento",
        },
      ],
    },
    ui: {
      units: "Unidades",
      formula: "Fórmula",
      men: "Fórmula masculina",
      women: "Fórmula feminina",
      gear: "Equipamento",
      classic: "Clássico (sem equipamento)",
      equipped: "Equipado",
      bw: "Peso corporal ({unit})",
      squat: "Agachamento",
      bench: "Supino",
      deadlift: "Levantamento terra",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      level: "Nível DOTS: {level}.",
      next: "Some uns {weight} {unit} ao seu total para chegar a {level} (DOTS {score}).",
      elite: "É um total de elite.",
      note: "Wilks e DOTS não mudam com o equipamento. O IPF GL tem fórmulas diferentes para clássico e equipado, então escolha a da sua modalidade.",
      levels: {
        beginner: "Iniciante",
        novice: "Novato",
        intermediate: "Intermediário",
        advanced: "Avançado",
        elite: "Elite",
      },
    },
  },
  "dots-calculator": {
    page: {
      title: "Calculadora de DOTS: pontue seu total de powerlifting",
      description:
        "Calcule sua pontuação DOTS com seu agachamento, supino, levantamento terra e peso corporal, em kg ou lb, para comparar atletas de qualquer tamanho.",
      name: "Calculadora de DOTS",
      intro:
        "Seu total de agachamento, supino e levantamento terra pontuado pelo seu peso, para que um atleta leve e um pesado vejam quem é mais forte para o próprio tamanho.",
      sticky: "Seu DOTS, sempre em dia",
      mid: {
        title: "Seu DOTS, a cada série",
        body: "O {app} estima seu melhor agachamento, supino e levantamento terra com as séries que você registra e mantém seu DOTS em dia, sem dia de teste de máximo.",
        button: "Comece grátis",
      },
      end: {
        title: "Construa um total maior",
        body: "O {app} planeja seu treino em blocos com metas de repetições em reserva e deloads, e aumenta cada levantamento quando você merece.",
      },
      faq: [
        [
          "O que é a pontuação DOTS?",
          "Uma forma de comparar totais de powerlifting entre pesos corporais. Seu total é multiplicado por um coeficiente que depende do seu peso, então alguém de 60 kg e alguém de 110 kg podem ser classificados na mesma escala. Muitas federações usam.",
        ],
        [
          "O que é uma boa pontuação DOTS?",
          "Em linhas gerais: 200 é um total de novato, 300 intermediário, 400 avançado e 500 ou mais elite. São os níveis mais usados, não uma escala oficial.",
        ],
        [
          "DOTS ou Wilks?",
          "O DOTS foi publicado em 2019 como um substituto mais justo da antiga fórmula de Wilks, com um conjunto maior de resultados recentes de competição. As pontuações não são intercambiáveis, então compare DOTS com DOTS.",
        ],
        [
          "Posso usar máximos estimados em vez de um total de competição?",
          "Para acompanhar seu próprio progresso, sim. As classificações oficiais usam levantamentos feitos em competição, com as regras da federação.",
        ],
      ],
      more: {
        heading: "Como o DOTS é calculado",
        paragraphs: [
          "O DOTS divide 500 por um polinômio de quarto grau do seu peso corporal em quilos, com coeficientes diferentes para homens e mulheres, e multiplica seu total pelo resultado. O peso corporal fica limitado a 40-210 kg nos homens e 40-150 kg nas mulheres. Os coeficientes são os publicados, conferidos com um projeto aberto de resultados de powerlifting. As libras são convertidas antes para quilos.",
        ],
      },
      reading: [
        {
          href: "/pt/tools/one-rep-max-calculator/",
          label: "a calculadora de 1RM",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "como aumentar seu agachamento",
        },
        {
          href: "/blog/how-to-increase-your-deadlift/",
          label: "como aumentar seu levantamento terra",
        },
      ],
    },
    ui: {
      unitsSex: "Unidades e sexo",
      men: "Fórmula masculina",
      women: "Fórmula feminina",
      bw: "Peso corporal ({unit})",
      squat: "Agachamento",
      bench: "Supino",
      deadlift: "Levantamento terra",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      note: "Uns 200 são um total de novato, 300 intermediário, 400 avançado e 500 ou mais elite. São níveis aproximados, não uma escala oficial.",
      levels: {
        beginner: "Iniciante",
        novice: "Novato",
        intermediate: "Intermediário",
        advanced: "Avançado",
        elite: "Elite",
      },
    },
  },
  "workout-generator": GEN_PT,
};
