import type { ExerciseGuide } from "../exerciseGuides";

// The exercise guides in Brazilian Portuguese (você). Same order and parts as the English guides (lower.ts, upper.ts).
export const PT_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "O agachamento livre é o exercício clássico de força para a parte inferior do corpo. Ele trabalha pesado quadríceps, glúteos e adutores, permite usar muita carga e evoluir por anos, e ainda fortalece o tronco.",
    mistakes: [
      [
        "Joelhos caindo para dentro na subida",
        "Empurre os joelhos para fora, na direção dos pés, durante toda a rep, e tire peso da barra até conseguir.",
      ],
      [
        "Diminuir a profundidade quando o peso sobe",
        "Desça até a mesma profundidade em toda rep, pelo menos com a dobra do quadril na altura do joelho, se o seu quadril permitir.",
      ],
      [
        "Perder a contração do tronco lá embaixo",
        "Puxe bastante ar para a barriga antes de cada rep e segure até passar a parte mais difícil.",
      ],
      [
        "Calcanhares saindo do chão",
        "Mantenha o peso no meio do pé. Tênis com salto elevado ou uma base um pouco mais aberta podem ajudar.",
      ],
    ],
    sets: [
      "**Força:** 3 a 5 séries de 3 a 6, com 3 a 5 minutos de descanso.",
      "**Hipertrofia:** 3 a 4 séries de 6 a 10, com 2 a 3 minutos de descanso.",
      "**Começando agora:** 3 séries de 8 com um peso que você levantaria 10 a 12 vezes, aumentando um pouco a cada treino.",
    ],
    variations: [
      ["front-squat", "Mais ereto, mais quadríceps e menos carga na lombar."],
      ["box-squat", "Ensina a sentar para trás e atingir a mesma profundidade em toda rep."],
      ["pause-squat", "Dá força para sair do fundo, onde a maioria trava."],
      ["goblet-squat", "O melhor jeito de aprender o movimento antes de pôr carga na barra."],
    ],
    faq: [
      [
        "Até onde devo descer no agachamento?",
        "O máximo que der mantendo a posição das costas e os calcanhares no chão. Para a maioria das pessoas, é na linha do paralelo ou um pouco abaixo.",
      ],
      [
        "Barra alta ou barra baixa?",
        "A barra alta fica em cima dos ombros e deixa o tronco mais ereto; a barra baixa fica mais embaixo e permite levantar um pouco mais. As duas funcionam.",
      ],
      [
        "Preciso de cinto?",
        "Não para começar. Aprenda a travar o tronco sem ele primeiro; depois, o cinto pode ajudar nas séries pesadas. Veja [cinto de levantamento](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "No agachamento frontal, a barra fica apoiada na frente dos ombros, o que mantém o tronco ereto e joga mais trabalho para o quadríceps. Pesa menos na lombar que o agachamento livre e é ótimo para ensinar uma boa postura de agachamento.",
    mistakes: [
      [
        "Cotovelos caindo",
        "Leve os cotovelos para cima e para a frente durante toda a rep. Se a barra rolar, foram os cotovelos que caíram primeiro.",
      ],
      [
        "Segurar a barra com as mãos",
        "A barra fica apoiada nos ombros; os dedos só a mantêm no lugar. Use a pegada cruzada ou straps se os punhos forem pouco flexíveis.",
      ],
      [
        "Arredondar a parte de cima das costas",
        "Mantenha o peito alto e trave bem o tronco. Menos peso com o peito alto é melhor que mais peso dobrando para a frente.",
      ],
    ],
    sets: ["**Força:** 3 a 5 séries de 3 a 5.", "**Hipertrofia:** 3 séries de 6 a 10."],
    variations: [
      ["goblet-squat", "A mesma posição ereta com um halter, mais fácil de aprender."],
      ["back-squat", "Permite levantar mais peso no geral."],
      ["db-front-squat", "Não precisa de rack nem de flexibilidade no punho."],
    ],
    faq: [
      [
        "O agachamento frontal é melhor que o livre?",
        "Nenhum é melhor. O frontal puxa mais o quadríceps e poupa as costas; o livre permite levantar mais.",
      ],
      [
        "Por que o agachamento frontal machuca meus punhos?",
        "Punhos e dorsais pouco flexíveis. Deixe só dois ou três dedos sob a barra ou use a pegada cruzada.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "No agachamento goblet, você segura um halter ou kettlebell junto ao peito. O peso na frente facilita ficar ereto e descer fundo, então é o melhor jeito de aprender a agachar e um ótimo exercício de pernas para fazer em casa.",
    mistakes: [
      ["Deixar o peso puxar você para a frente", "Segure o peso colado ao peito, com os cotovelos fechados logo abaixo dele."],
      ["Agachar raso demais", "Sente entre os calcanhares, tentando passar os cotovelos rente aos joelhos lá embaixo."],
      ["Fazer as reps com pressa", "Desça em dois ou três segundos. Isso deixa um peso leve muito mais difícil."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 15.", "**Em casa com pesos leves:** 3 séries de 15 a 20, com a descida lenta."],
    variations: [
      ["kb-goblet-squat", "O mesmo movimento com um kettlebell segurado pelas alças."],
      ["db-goblet-squat-heels", "Calcanhares elevados para mais quadríceps e um agachamento mais fundo."],
      ["back-squat", "O próximo passo quando os halteres não forem mais suficientes."],
    ],
    faq: [
      [
        "O agachamento goblet é bom para crescer as pernas?",
        "Sim, até o halter mais pesado que você tem ficar fácil. Aí deixe as reps mais lentas, faça uma pausa embaixo ou passe para o agachamento com barra.",
      ],
      ["Halter ou kettlebell?", "Tanto faz. Segure o halter na vertical por uma das pontas, ou o kettlebell pelas alças."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "No agachamento búlgaro, o pé de trás fica apoiado num banco, então a perna da frente faz quase todo o trabalho. Ele desenvolve quadríceps e glúteos uma perna por vez com uma fração da carga do agachamento livre, o que poupa a lombar.",
    mistakes: [
      [
        "Pé da frente perto demais do banco",
        "Dê um passo longo o bastante para a canela da frente ficar mais ou menos na vertical e o joelho dobrar livremente lá embaixo.",
      ],
      [
        "Empurrar com o pé de trás",
        "O pé de trás serve só para equilíbrio. Mantenha a maior parte do peso no calcanhar e no meio do pé da frente.",
      ],
      ["Perder o equilíbrio", "Segure em algo com uma das mãos, ou use um banco mais baixo, até ficar firme."],
    ],
    sets: [
      "**Hipertrofia:** 3 séries de 8 a 12 por perna, começando pelo lado mais fraco.",
      "**Em casa:** 3 séries de 12 a 20 por perna com o peso do corpo ou halteres leves.",
    ],
    variations: [
      ["split-squat", "Os dois pés no chão: mais fácil de equilibrar."],
      ["front-foot-elevated-split-squat", "Um alongamento maior para a perna da frente."],
      ["barbell-bulgarian-split-squat", "Mais carga quando os halteres ficam difíceis de segurar."],
    ],
    faq: [
      [
        "Quadríceps ou glúteos?",
        "Os dois. Tronco mais ereto e passada mais curta puxam o quadríceps; inclinar para a frente com uma passada mais longa trabalha mais os glúteos.",
      ],
      [
        "Por que é tão difícil?",
        "Uma perna faz o trabalho de duas, e o equilíbrio pesa ainda mais. Comece leve; você vai se surpreender com a rapidez com que o peso sobe.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "O leg press trabalha quadríceps e glúteos sem carregar a coluna nem exigir equilíbrio, então você pode forçar as pernas com segurança, mesmo quando as costas ou a técnica limitariam o agachamento.",
    mistakes: [
      ["Lombar saindo do encosto", "Desça só até onde consegue manter o quadril e a lombar no banco."],
      ["Travar os joelhos com força lá em cima", "Pare um pouco antes de estender tudo e já emende a próxima rep."],
      [
        "Encurtar o movimento para pôr mais peso",
        "Um movimento completo e controlado com menos peso constrói mais músculo que meias reps com a máquina toda carregada.",
      ],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 8 a 15.", "**Para fechar o treino:** 1 a 2 séries de 15 a 25 depois do agachamento."],
    variations: [
      ["narrow-leg-press", "Pés mais baixos e juntos: mais quadríceps."],
      ["wide-leg-press", "Pés mais altos e afastados: mais glúteos e adutores."],
      ["single-leg-press", "Uma perna por vez para equilibrar as diferenças."],
    ],
    faq: [
      [
        "O leg press é tão bom quanto o agachamento?",
        "Para ganhar músculo nas pernas, chega perto. O agachamento treina também o equilíbrio e o tronco; o leg press deixa você forçar mais as pernas com menos cansaço.",
      ],
      [
        "Onde devo colocar os pés?",
        "No meio da plataforma, mais ou menos na largura dos ombros, é um bom padrão. Suba os pés para mais glúteos e desça para mais quadríceps.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "A máquina de hack squat guia você num agachamento sobre um trilho, com as costas apoiadas. É um dos melhores exercícios para quadríceps, porque dá para descer fundo e forçar sem equilibrar uma barra.",
    mistakes: [
      [
        "Pés altos demais na plataforma",
        "Coloque os pés no meio ou um pouco mais abaixo para trabalhar mais o quadríceps, com os calcanhares apoiados.",
      ],
      ["Quicar lá embaixo", "Controle a descida e faça uma pausa curta antes de subir."],
      ["Reps parciais", "Desça o máximo que o quadril permitir sem a lombar descolar do encosto."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 6 a 12.", "**Força:** 3 séries de 5 a 8, depois do agachamento principal."],
    variations: [
      ["pendulum-squat", "Uma máquina parecida, com um arco mais fundo."],
      ["leg-press", "Nenhuma carga nos ombros."],
      ["back-squat", "Peso livre, treina equilíbrio e tronco."],
    ],
    faq: [
      ["O hack squat faz mal para os joelhos?", "Não. É normal os joelhos passarem da ponta dos pés. Aumente o peso aos poucos e sem dor."],
      [
        "Hack squat ou leg press?",
        "O hack squat costuma pegar um pouco mais o quadríceps; o leg press poupa mais os ombros e as costas. Os dois são bons.",
      ],
    ],
  },
  deadlift: {
    intro:
      "O levantamento terra tira do chão uma barra carregada. Ele trabalha toda a parte de trás do corpo (glúteos, posteriores de coxa, costas e pegada) e costuma ser o exercício em que as pessoas aguentam mais peso.",
    mistakes: [
      [
        "Barra se afastando das pernas",
        "Mantenha a barra encostada nas canelas e nas coxas durante toda a subida. Comece com ela sobre o meio do pé.",
      ],
      ["Arredondar a lombar", "Trave bem o tronco antes de puxar e tire peso se as costas não segurarem a posição."],
      [
        "Arrancar a barra do chão",
        "Tire a folga primeiro: tensione o corpo até a barra encostar nas anilhas, depois empurre o chão para longe.",
      ],
      ["Jogar o corpo para trás lá em cima", "Termine em pé, ereto, com os glúteos contraídos. Não precisa inclinar para trás."],
    ],
    sets: [
      "**Força:** 2 a 4 séries de 2 a 5, com 3 a 5 minutos de descanso.",
      "**Hipertrofia:** 3 séries de 5 a 8. O terra cansa bastante, então a maioria faz uma vez por semana.",
    ],
    variations: [
      ["trap-bar-deadlift", "Mais fácil de aprender, mais ereto e mais gentil com as costas."],
      ["sumo-deadlift", "Base aberta, que combina melhor com alguns tipos de corpo."],
      ["romanian-deadlift", "Começa de cima e carrega mais os posteriores de coxa."],
      ["paused-deadlift", "Dá controle logo depois que a barra sai do chão."],
    ],
    faq: [
      [
        "Com que frequência devo fazer terra?",
        "Uma vez por semana basta para a maioria, com um exercício mais leve de dobradiça de quadril, como o terra romeno, em outro dia.",
      ],
      ["Posso soltar a barra lá em cima?", "Desça com controle. Soltar lá de cima castiga as anilhas e o piso, e pula metade da rep."],
      [
        "Devo usar straps?",
        "Nas séries mais pesadas, se a pegada cansar antes. Treine a pegada nas séries de aquecimento. Veja [força de pegada](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "O terra sumô usa uma base bem aberta, com as mãos por dentro dos joelhos. Ele encurta o caminho da barra e deixa o tronco mais ereto, jogando mais trabalho para quadril, quadríceps e adutores.",
    mistakes: [
      ["Base aberta demais", "Abra só até onde as canelas fiquem mais ou menos na vertical e os joelhos sigam a direção dos pés."],
      ["Quadril subindo primeiro", "Empurre os joelhos para fora e afaste o chão, para o quadril e o peito subirem juntos."],
      ["Começar com os braços frouxos", "Tire a folga da barra antes que ela saia do chão."],
    ],
    sets: ["**Força:** 3 a 5 séries de 2 a 5.", "**Hipertrofia:** 3 séries de 5 a 8."],
    variations: [
      ["deadlift", "A base convencional, mais posteriores de coxa e costas."],
      ["kb-sumo-deadlift", "Um jeito leve de aprender a base."],
      ["trap-bar-deadlift", "Ereto como o sumô, mais simples de montar."],
    ],
    faq: [
      [
        "O sumô é roubar?",
        "Não. É um estilo reconhecido no powerlifting. Escolha a base que combina com seu corpo e deixa você levantar bem.",
      ],
      [
        "Sumô ou convencional?",
        "Teste os dois por algumas semanas. Quem tem pernas mais longas e braços mais curtos costuma preferir o sumô.",
      ],
    ],
  },
  "romanian-deadlift": {
    intro:
      "O levantamento terra romeno começa em pé e desce a barra levando o quadril para trás, com as pernas quase estendidas. É um dos melhores exercícios para posteriores de coxa e glúteos, porque os carrega num alongamento longo.",
    mistakes: [
      ["Dobrar demais os joelhos", "Mantenha uma leve flexão que não muda. Se os joelhos dobram mais na descida, vira agachamento."],
      ["Descer demais", "Desça só enquanto o quadril continua indo para trás e as costas ficam retas, geralmente até o meio da canela."],
      ["Barra longe das pernas", "Deslize a barra pelas coxas. Quanto mais perto ela fica, menos pesa na lombar."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 6 a 12, com a descida lenta.", "**Depois do terra:** 2 a 3 séries de 8 a 10, mais leve."],
    variations: [
      ["db-rdl", "Com halteres, ótimo em casa."],
      ["single-leg-rdl", "Uma perna: equilíbrio e menos peso necessário."],
      ["stiff-leg-deadlift", "Começa do chão a cada rep."],
    ],
    faq: [
      [
        "Terra romeno ou terra convencional?",
        "O romeno começa de cima e carrega mais os posteriores de coxa; o convencional começa do chão e permite levantar mais.",
      ],
      [
        "Onde devo sentir?",
        "Na parte de trás das coxas e nos glúteos. Se sentir mais na lombar, diminua o peso e leve o quadril mais para trás.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "No terra com barra hexagonal, você fica dentro de uma barra em forma de hexágono, com as pegadas ao lado do corpo. Dá para ficar mais ereto, o que tira estresse da lombar e faz dele o terra mais fácil de aprender e de carregar pesado.",
    mistakes: [
      [
        "Transformar em agachamento",
        "Continua sendo uma dobradiça de quadril. Leve o quadril para trás para alcançar as pegadas, depois empurre o chão para longe.",
      ],
      ["Fora do centro da barra", "Posicione-se de modo que as pegadas fiquem alinhadas com o meio do pé."],
      ["Perder a tensão lá embaixo", "Reposicione entre as reps ou encoste de leve e suba; não quique as anilhas."],
    ],
    sets: ["**Força:** 3 a 5 séries de 3 a 5.", "**Hipertrofia ou esporte:** 3 séries de 5 a 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Pegadas altas: amplitude menor para iniciantes ou pessoas altas."],
      ["deadlift", "A barra reta, mais costas e posteriores de coxa."],
      ["trap-bar-rdl", "Uma versão focada nos posteriores de coxa."],
    ],
    faq: [
      [
        "O terra com barra hexagonal é mais fácil?",
        "A maioria acha mais fácil de aprender e consegue levantar um pouco mais nele, porque o tronco fica mais ereto.",
      ],
      [
        "Trabalha os mesmos músculos?",
        "Quase os mesmos. Usa um pouco mais de quadríceps e um pouco menos de lombar que o terra com barra reta.",
      ],
    ],
  },
  "hip-thrust": {
    intro:
      "Na elevação pélvica, você apoia a parte de cima das costas num banco e sobe uma barra carregada com o quadril. Ela coloca mais carga nos glúteos com o quadril totalmente estendido do que quase qualquer outro exercício.",
    mistakes: [
      ["Arquear a lombar lá em cima", "Abaixe o queixo e mantenha as costelas para baixo; termine contraindo os glúteos, não arqueando."],
      [
        "Pés no lugar errado",
        "Lá em cima, as canelas devem ficar mais ou menos na vertical. Perto demais, o quadríceps assume; longe demais, os posteriores de coxa.",
      ],
      ["Passar rápido pelo topo", "Segure um segundo lá em cima em cada rep."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 8 a 12.", "**Força:** 3 séries de 5 a 8 com uma pausa lá em cima."],
    variations: [
      ["glute-bridge", "Do chão: mais fácil de montar, amplitude menor."],
      ["db-hip-thrust", "Um halter sobre o quadril, bom em casa."],
      ["single-leg-hip-thrust", "Uma perna por vez, sem precisar de carga."],
    ],
    faq: [
      ["Preciso de uma proteção?", "Um protetor de barra ou um colchonete dobrado deixa as séries pesadas muito mais confortáveis."],
      [
        "Elevação pélvica ou agachamento para glúteos?",
        "Os dois. O agachamento trabalha os glúteos num alongamento profundo; a elevação pélvica pega mais forte lá em cima. Veja [treino de glúteos](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "Na ponte de glúteo, você levanta o quadril do chão com as costas apoiadas no solo. É um exercício simples de glúteo que dá para fazer em qualquer lugar, e um bom jeito de aprender a usar os glúteos antes da elevação pélvica.",
    mistakes: [
      ["Empurrar com a ponta dos pés", "Empurre pelos calcanhares para manter o trabalho nos glúteos."],
      ["Arquear as costas para subir mais", "Pare quando quadril e coxas formarem uma linha reta. Contraia os glúteos ali."],
      ["Fazer as reps correndo", "Faça uma pausa de um a dois segundos lá em cima."],
    ],
    sets: [
      "**Em casa:** 3 séries de 15 a 25, com uma pausa lá em cima.",
      "**Com carga:** 3 séries de 10 a 15 com um halter ou uma barra sobre o quadril.",
    ],
    variations: [
      ["single-leg-glute-bridge", "O dobro de trabalho para cada lado."],
      ["hip-thrust", "Costas num banco para mais amplitude e cargas maiores."],
      ["marching-glute-bridge", "Acrescenta estabilidade de core e de quadril."],
    ],
    faq: [
      [
        "Ponte de glúteo ou elevação pélvica?",
        "A ponte é mais fácil e não precisa de nada; a elevação pélvica tem mais amplitude e aguenta mais peso.",
      ],
      ["Por que sinto nos posteriores de coxa?", "Traga os pés um pouco mais perto do quadril e empurre pelos calcanhares."],
    ],
  },
  "walking-lunge": {
    intro:
      "No avanço caminhando, você dá um passo à frente num afundo, de novo e de novo. Ele trabalha quadríceps e glúteos uma perna por vez, desafia o equilíbrio e acelera o coração.",
    mistakes: [
      ["Passos curtos demais", "Dê um passo longo o bastante para os dois joelhos dobrarem a uns 90 graus lá embaixo."],
      ["Joelho da frente caindo para dentro", "Mantenha o joelho da frente alinhado com os dedos do pé."],
      ["Bater o joelho de trás no chão", "Desça com controle até o joelho de trás quase tocar o chão."],
    ],
    sets: [
      "**Hipertrofia:** 3 séries de 10 a 12 passos por perna.",
      "**Condicionamento:** 2 a 3 séries de 20 a 30 passos no total, com descansos curtos.",
    ],
    variations: [
      ["reverse-lunge", "Passo para trás: mais fácil para os joelhos e o equilíbrio."],
      ["barbell-walking-lunge", "Mais carga quando os halteres ficam pesados de segurar."],
      ["bulgarian-split-squat", "Fica parado no lugar e isola mais cada perna."],
    ],
    faq: [
      [
        "Avanço caminhando ou afundo reverso?",
        "O afundo reverso é mais fácil de controlar e poupa os joelhos; o avanço caminhando acrescenta equilíbrio e condicionamento.",
      ],
      ["De quanto espaço eu preciso?", "Uns 10 metros por série. Se não tiver espaço, dê meia-volta ou troque pelo afundo reverso."],
    ],
  },
  "reverse-lunge": {
    intro:
      "No afundo reverso, você dá um passo para trás num afundo. Dar o passo para trás mantém o peso sobre o pé da frente, o que facilita o equilíbrio e poupa mais os joelhos que o afundo para a frente.",
    mistakes: [
      [
        "Passo estreito demais",
        "Dê o passo para trás como se estivesse em trilhos de trem, não numa corda bamba, para manter o equilíbrio.",
      ],
      ["Empurrar com o pé de trás", "Suba empurrando pelo calcanhar da frente; a perna de trás só ajuda no equilíbrio."],
      ["Inclinar muito para a frente", "Fique bem ereto, com uma leve inclinação para a frente para mais glúteos."],
    ],
    sets: ["**Peso do corpo:** 3 séries de 12 a 20 por perna.", "**Com carga:** 3 séries de 8 a 12 por perna com halteres."],
    variations: [
      ["db-reverse-lunge", "Halteres para mais carga."],
      ["deficit-reverse-lunge", "Pé da frente num degrau para mais amplitude."],
      ["walking-lunge", "Acrescenta equilíbrio e condicionamento."],
    ],
    faq: [
      [
        "O afundo reverso é bom para quem tem dor no joelho?",
        "Costuma ser o afundo mais confortável para joelhos sensíveis. Fique numa amplitude sem dor.",
      ],
      ["Alternar as pernas ou fazer um lado de cada vez?", "Tanto faz. Um lado de cada vez é mais difícil e mantém as reps iguais."],
    ],
  },
  "leg-extension": {
    intro:
      "A cadeira extensora estende o joelho contra uma resistência. Ela isola o quadríceps, inclusive a parte que o agachamento pouco treina, e é fácil de levar perto da falha com segurança.",
    mistakes: [
      ["Joelho desalinhado com o eixo", "Ajuste o banco para a articulação do joelho ficar alinhada com o eixo da máquina."],
      ["Subir o peso no embalo", "Suba com controle e faça uma pausa curta lá em cima."],
      ["Tirar o quadril do banco", "Segure nas pegadas e mantenha o quadril embaixo."],
    ],
    sets: [
      "**Hipertrofia:** 2 a 3 séries de 10 a 15, depois do agachamento ou do leg press.",
      "**Para fechar o treino:** 1 série de 15 a 20 perto da falha.",
    ],
    variations: [
      ["single-leg-extension", "Uma perna por vez para equilibrar as diferenças."],
      ["sissy-squat", "Isolamento de quadríceps com o peso do corpo."],
      ["leg-press", "Um exercício composto para quadríceps."],
    ],
    faq: [
      [
        "A cadeira extensora faz mal para os joelhos?",
        "Não com um peso sensato. Ela é muito usada na reabilitação do joelho. Pare se sentir dor na articulação.",
      ],
      [
        "Preciso da extensora se já faço agachamento?",
        "Não é obrigatório, mas ela soma trabalho de quadríceps sem cansar muito e treina o reto femoral, que o agachamento pouco alonga.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "Na mesa flexora, você dobra os joelhos contra um rolo deitado de bruços. Ela isola os posteriores de coxa, que exercícios de dobradiça como o terra trabalham principalmente pelo quadril.",
    mistakes: [
      ["Quadril saindo do banco", "Pressione o quadril contra o banco e mantenha-o ali."],
      ["Usar embalo", "Flexione de forma suave e desça devagar, em dois ou três segundos."],
      ["Amplitude curta", "Desça até as pernas ficarem quase estendidas antes da próxima rep."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 15."],
    variations: [
      ["seated-leg-curl", "Quadril flexionado, então os posteriores trabalham a partir de um alongamento maior."],
      ["nordic-curl", "Com o peso do corpo e muito difícil; ótimo para velocistas."],
      ["slider-leg-curl", "Em casa, com uma toalha ou discos deslizantes."],
    ],
    faq: [
      [
        "Mesa flexora ou cadeira flexora?",
        "A cadeira alonga mais os posteriores de coxa e pode construir um pouco mais de músculo. Use a que sua academia tiver.",
      ],
      [
        "Preciso de flexora se já faço terra?",
        "A flexora treina o lado dos posteriores que dobra o joelho, o que o terra não faz. Um exercício de flexão de joelho por semana ajuda.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "Na cadeira flexora, você dobra os joelhos contra um rolo sentado. Sentado, os posteriores de coxa ficam num alongamento longo, o que a torna um dos melhores exercícios de posterior para ganhar músculo.",
    mistakes: [
      ["Apoio da coxa frouxo", "Trave bem o apoio da coxa para as pernas não subirem."],
      ["Inclinar para trás para roubar", "Sente ereto ou incline um pouco para a frente para manter o alongamento."],
      ["Descer com pressa", "Controle a descida por dois ou três segundos."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 15."],
    variations: [
      ["lying-leg-curl", "Quadril estendido, se a cadeira estiver ocupada."],
      ["single-leg-curl", "Uma perna por vez."],
      ["romanian-deadlift", "Treina os posteriores pelo quadril em vez do joelho."],
    ],
    faq: [
      [
        "A cadeira flexora é melhor que a mesa?",
        "Ela trabalha os posteriores a partir de um alongamento maior, o que pode construir um pouco mais de músculo. As duas são boas.",
      ],
      [
        "Quanto peso devo usar na flexora?",
        "O bastante para as últimas reps de cada série serem difíceis, mas ainda controlando a descida.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "Na panturrilha em pé, você sobe na ponta dos pés contra uma resistência, com os joelhos estendidos. É o melhor exercício para o músculo maior da panturrilha, o gastrocnêmio.",
    mistakes: [
      ["Quicar lá embaixo", "Faça uma pausa de um segundo no alongamento, embaixo, em toda rep."],
      ["Meias reps", "Vá de um alongamento profundo até o mais alto que conseguir na ponta dos pés."],
      ["Dobrar os joelhos", "Mantenha os joelhos estendidos, sem travar, para a panturrilha fazer a força."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 8 a 15, devagar, duas ou três vezes por semana."],
    variations: [
      ["seated-calf-raise", "Joelhos dobrados, para o sóleo, que fica por baixo."],
      ["single-leg-calf-raise", "Em casa num degrau, uma perna por vez."],
      ["calf-press", "Na máquina de leg press."],
    ],
    faq: [
      [
        "Por que minha panturrilha não cresce?",
        "A maioria das pessoas faz reps curtas e quicando. Use toda a amplitude com uma pausa no alongamento e treine com mais frequência. Veja [treino de panturrilha](/blog/calf-workout/).",
      ],
      ["Panturrilha em pé ou sentado?", "Os dois. Em pé trabalha mais o gastrocnêmio; sentado trabalha o sóleo."],
    ],
  },
  plank: {
    intro:
      "Na prancha, você mantém o corpo em linha reta apoiado nos antebraços e na ponta dos pés. Ela treina o abdômen e o tronco a resistir à flexão, o que ajuda a travar o tronco sob uma barra pesada.",
    mistakes: [
      ["Quadril caindo", "Contraia os glúteos e puxe as costelas na direção do quadril."],
      ["Quadril alto demais", "Abaixe até o corpo formar uma linha reta da cabeça aos calcanhares."],
      ["Segurar por minutos", "Quando conseguir segurar 60 segundos, deixe mais difícil em vez de mais longo."],
    ],
    sets: ["**Core:** 2 a 3 sustentações de 20 a 60 segundos, duas ou três vezes por semana."],
    variations: [
      ["side-plank", "Treina os oblíquos e as laterais do quadril."],
      ["long-lever-plank", "Cotovelos mais à frente: bem mais difícil."],
      ["ab-wheel", "Uma versão em movimento quando a prancha ficar fácil."],
    ],
    faq: [
      ["Quanto tempo devo segurar a prancha?", "20 a 60 segundos com a forma perfeita. Depois disso, uma versão mais difícil rende mais."],
      [
        "A prancha queima gordura da barriga?",
        "Nenhum exercício queima gordura de um lugar só. Veja [como perder gordura da barriga](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "Na elevação de pernas na barra, você fica pendurado numa barra e levanta as pernas. É um dos exercícios de abdômen mais difíceis, treinando o abdômen inferior e os flexores do quadril, além da pegada.",
    mistakes: [
      ["Balançar", "Comece pendurado e parado e desça devagar. Faça uma pausa embaixo se começar a balançar."],
      ["Só levantar as pernas", "Enrole a pelve para cima no final para o abdômen trabalhar, não só os flexores do quadril."],
      ["Pegada cansando primeiro", "Use alças para abdominal ou treine a pegada separadamente."],
    ],
    sets: ["**Core:** 3 séries de 6 a 15."],
    variations: [
      ["hanging-knee-raise", "Joelhos dobrados: o primeiro passo, mais fácil."],
      ["parallel-bar-knee-raise", "Nas paralelas, sem precisar de pegada."],
      ["lying-leg-raise", "No chão, mais fácil ainda."],
    ],
    faq: [
      ["Como paro de balançar?", "Desça devagar, faça uma pausa embaixo e mantenha os ombros ativos."],
      ["Difícil demais?", "Comece elevando os joelhos pendurado e passe para as pernas estendidas quando conseguir fazer 3 séries de 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "Com a roda abdominal, você rola para a frente e volta. É um dos exercícios de abdômen mais exigentes, que treina o abdômen a impedir que as costas arqueiem enquanto os braços vão acima da cabeça.",
    mistakes: [
      ["Lombar caindo", "Role só até onde consegue impedir as costas de arquear. Encaixe a pelve e contraia os glúteos."],
      ["Quadril puxando a volta", "Volte puxando com o abdômen e os braços juntos, não empinando o quadril."],
      ["Ir longe demais cedo demais", "Role primeiro até uma parede ou uma distância curta, e vá mais longe a cada semana."],
    ],
    sets: ["**Core:** 3 séries de 5 a 12 de joelhos, depois em pé quando estiver forte."],
    variations: [
      ["plank", "A versão estática para chegar lá."],
      ["plank-reach", "Um jeito mais suave de treinar a mesma habilidade."],
      ["dead-bug", "Deitado de costas, para aprender a manter a lombar no chão."],
    ],
    faq: [
      [
        "A roda abdominal faz mal para as costas?",
        "Não, se você ficar na amplitude em que as costas não arqueiam. Encurte o movimento se sentir na lombar.",
      ],
      ["De joelhos ou em pé?", "De joelhos, para a maioria. Rolar em pé é uma meta avançada."],
    ],
  },
  "kb-swing": {
    intro:
      "No kettlebell swing, você joga o quadril para a frente com força para balançar um kettlebell até a altura do peito. Ele treina glúteos e posteriores de coxa de forma explosiva e ainda serve de condicionamento.",
    mistakes: [
      ["Agachar no swing", "É uma dobradiça de quadril: leve o quadril para trás, dobrando só um pouco os joelhos."],
      ["Levantar com os braços", "É o quadril que manda o kettlebell para cima; os braços só seguram."],
      ["Inclinar para trás lá em cima", "Termine em pé, ereto, com glúteos e abdômen contraídos, como numa prancha."],
    ],
    sets: [
      "**Potência:** 5 a 10 séries de 10, descansando o quanto precisar.",
      "**Condicionamento:** 10 a 20 swings a cada minuto durante 10 minutos.",
    ],
    variations: [
      ["kb-single-swing", "Com uma mão: acrescenta uma rotação que o tronco precisa segurar."],
      ["db-swing", "Com um halter, se você não tiver kettlebell."],
      ["kb-deadlift", "Aprenda a dobradiça de quadril antes do swing."],
    ],
    faq: [
      [
        "Qual peso de kettlebell devo usar?",
        "Pesado o bastante para o swing sair explosivo, não lento. Muitas mulheres começam com 12 kg e muitos homens com 16 a 20 kg.",
      ],
      ["Até que altura devo balançar?", "Mais ou menos até a altura do peito. Mais alto não acrescenta muito."],
    ],
  },
  "farmers-carry": {
    intro:
      "Na caminhada do fazendeiro, você pega dois pesos pesados e anda. Ela treina pegada, trapézio, core e postura de uma vez só, e ajuda direto no dia a dia.",
    mistakes: [
      ["Inclinar ou torcer o corpo", "Ande ereto, ombros para trás e para baixo, com passos curtos e rápidos."],
      ["Pesos leves demais", "Deve ser difícil completar a distância. A ideia é que a pegada seja o limite."],
      ["Pegar os pesos com as costas arredondadas", "Levante os pesos como num terra e coloque-os no chão do mesmo jeito."],
    ],
    sets: ["**Força:** 3 a 5 percursos de 20 a 40 metros, com 1 a 2 minutos de descanso."],
    variations: [
      ["db-suitcase-carry", "Só de um lado: treina os oblíquos."],
      ["trap-bar-carry", "Cargas maiores numa barra só."],
      ["kb-rack-carry", "Kettlebells na altura dos ombros, para a parte de cima das costas."],
    ],
    faq: [
      ["Quanto peso usar na caminhada do fazendeiro?", "Comece com cerca de um quarto do seu peso corporal em cada mão e vá aumentando."],
      ["Quanto devo andar?", "20 a 40 metros por percurso, ou 30 a 60 segundos."],
    ],
  },
  "good-morning": {
    intro:
      "No good morning, você apoia uma barra nas costas e inclina o tronco para a frente a partir do quadril. Ele fortalece posteriores de coxa, glúteos e lombar, e ensina uma dobradiça de quadril forte.",
    mistakes: [
      ["Pegar pesado demais", "Comece leve. Esse exercício castiga a lombar se a forma quebrar."],
      ["Arredondar as costas", "Mantenha as costas retas e o peito aberto; desça só até onde conseguir manter isso."],
      ["Dobrar demais os joelhos", "Mantenha os joelhos levemente dobrados e leve o quadril reto para trás."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 12, leve."],
    variations: [
      ["romanian-deadlift", "A mesma dobradiça com o peso nas mãos."],
      ["band-good-morning", "Leve e bom para aprender."],
      ["seated-good-morning", "Sentado: principalmente a lombar."],
    ],
    faq: [
      ["O good morning é perigoso?", "Não com pesos sensatos e boa forma. Comece leve e aumente o peso devagar."],
      ["Até onde devo descer?", "Até o tronco ficar mais ou menos paralelo ao chão, ou menos se as costas começarem a arredondar."],
    ],
  },
  "step-up": {
    intro:
      "Na subida no banco, você sobe num caixote ou banco com uma perna. Ela desenvolve quadríceps e glúteos um lado por vez e ajuda direto em escadas, trilhas e esportes.",
    mistakes: [
      ["Empurrar com o pé de trás", "Deixe o pé de trás leve; a perna da frente é que levanta você."],
      ["Caixote alto demais", "Comece com um caixote na altura do joelho ou um pouco mais baixo."],
      ["Descer caindo", "Desça devagar. A descida também treina a perna."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 12 por perna.", "**Peso do corpo:** 3 séries de 15 a 20 por perna."],
    variations: [
      ["db-step-up", "Halteres para mais carga."],
      ["db-lateral-step-up", "Subida de lado, para os glúteos."],
      ["box-step-down", "Descidas lentas do caixote para controlar o joelho."],
    ],
    faq: [
      [
        "Qual deve ser a altura do caixote?",
        "Na altura do joelho ou mais baixo. Caixotes mais altos trabalham mais os glúteos, mas são mais difíceis de controlar.",
      ],
      [
        "Subida no banco ou afundo?",
        "Os dois trabalham os mesmos músculos. A subida no banco é mais fácil de equilibrar; o afundo tem mais amplitude.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "O supino reto é o principal exercício de força para a parte superior do corpo. Ele trabalha peitoral, a frente dos ombros e tríceps, aguenta muita carga e é um dos exercícios em que é mais fácil acompanhar o progresso.",
    mistakes: [
      [
        "Ombros soltos e relaxados",
        "Puxe as escápulas para trás e para baixo antes de tirar a barra do suporte e mantenha-as presas a série toda.",
      ],
      ["Cotovelos totalmente abertos", "Feche os cotovelos entre uns 45 e 70 graus do corpo. Fica mais forte e poupa os ombros."],
      ["Quicar a barra no peito", "Encoste de leve na parte de baixo do peito e empurre. Uma pausa curta ensina controle."],
      ["Pés soltos", "Firme os pés e empurre o chão para manter o corpo travado."],
    ],
    sets: [
      "**Força:** 3 a 5 séries de 3 a 6, com 3 a 5 minutos de descanso.",
      "**Hipertrofia:** 3 a 4 séries de 6 a 10, com 2 a 3 minutos de descanso.",
      "**Começando agora:** 3 séries de 8, aumentando um pouco o peso a cada treino.",
    ],
    variations: [
      ["db-bench-press", "Mais amplitude, e cada lado trabalha sozinho."],
      ["incline-bench-press", "Mais peitoral superior e frente do ombro."],
      ["close-grip-bench", "Joga o trabalho para o tríceps."],
      ["spoto-press", "Pausa logo acima do peito para ganhar controle."],
    ],
    faq: [
      [
        "Preciso de alguém para me ajudar?",
        "Nas séries pesadas, tenha alguém para ajudar ou use um rack com travas de segurança logo abaixo da altura do peito.",
      ],
      [
        "Qual deve ser a largura da pegada?",
        "A maioria empurra melhor com os antebraços na vertical lá embaixo, em geral um pouco mais aberta que a largura dos ombros.",
      ],
      ["Devo arquear as costas?", "Um arco pequeno, que vem de puxar as escápulas para trás, é normal. Mantenha os glúteos no banco."],
    ],
  },
  "incline-bench-press": {
    intro:
      "O supino inclinado empurra uma barra num banco inclinado a uns 30 graus. Ele joga mais trabalho para o peitoral superior e a frente dos ombros que o supino reto.",
    mistakes: [
      ["Banco inclinado demais", "Uns 30 graus bastam. Mais que isso, vira desenvolvimento de ombros."],
      ["Barra descendo baixo demais", "Desça a barra até a parte de cima do peito, logo abaixo das clavículas."],
      ["Ombros indo para a frente", "Mantenha as escápulas para trás e para baixo, como no supino reto."],
    ],
    sets: ["**Força:** 3 a 4 séries de 4 a 6.", "**Hipertrofia:** 3 séries de 6 a 12."],
    variations: [
      ["db-incline-press", "Halteres: mais amplitude e menos estresse nos ombros."],
      ["smith-incline-press", "Um trajeto fixo para forçar com segurança."],
      ["bench-press", "Reto: mais peso no geral."],
    ],
    faq: [
      ["Qual o ângulo do supino inclinado?", "Uns 30 graus. Muitos bancos reguláveis têm uma posição perto disso."],
      [
        "Preciso fazer reto e inclinado?",
        "Não necessariamente, mas fazer os dois treina o peitoral em dois ângulos. Muitos planos usam um como exercício principal e o outro como segundo supino.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "No supino com halteres, você empurra dois halteres deitado num banco reto. Cada braço trabalha sozinho e os halteres descem mais que a barra, então é ótimo para o tamanho do peitoral e para equilibrar os lados.",
    mistakes: [
      ["Entrar mal na posição", "Sente com os halteres sobre as coxas, depois deite e suba os halteres com um impulso dos joelhos."],
      ["Halteres abrindo demais", "Desça-os até as laterais do peito, com os cotovelos a uns 45 graus."],
      ["Bater os halteres lá em cima", "Empurre para cima e um pouco para dentro, parando logo antes de os halteres se tocarem."],
    ],
    sets: [
      "**Hipertrofia:** 3 a 4 séries de 6 a 12.",
      "**Em casa:** 3 séries de 10 a 20 com a descida lenta, se seus halteres forem leves.",
    ],
    variations: [
      ["db-incline-press", "Foco no peitoral superior."],
      ["db-floor-press", "Não precisa de banco; amplitude menor."],
      ["db-neutral-press", "Palmas voltadas uma para a outra: mais fácil para os ombros."],
    ],
    faq: [
      [
        "Supino com halteres ou com barra?",
        "A barra permite levantar mais; os halteres dão mais amplitude e equilibram os lados. Os dois desenvolvem o peitoral.",
      ],
      [
        "Como coloco os halteres no chão com segurança?",
        "Traga-os até o peito e depois desça-os até as coxas enquanto se senta. Não solte para os lados.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "No supino inclinado com halteres, você empurra dois halteres num banco inclinado. É um dos melhores exercícios para o peitoral superior e poupa mais os ombros que o supino inclinado com barra.",
    mistakes: [
      ["Inclinação alta demais", "Use uns 30 graus para o peitoral continuar no comando."],
      ["Encurtar a amplitude", "Deixe os halteres descerem até a altura do peito para um alongamento completo, com controle."],
      ["Arquear e sair do banco", "Mantenha o quadril embaixo e a parte de cima das costas pressionada no encosto."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 12."],
    variations: [
      ["db-low-incline-press", "Um ângulo mais baixo, entre o reto e o inclinado."],
      ["incline-bench-press", "A versão com barra, para cargas maiores."],
      ["incline-machine-press", "Uma máquina para forçar sem precisar equilibrar."],
    ],
    faq: [
      ["O supino inclinado desenvolve o peitoral superior?", "Sim. A inclinação joga mais trabalho para as fibras superiores do peitoral."],
      ["Quanto peso em relação ao supino reto?", "Em geral 10 a 20% menos que no seu supino reto com halteres."],
    ],
  },
  "push-up": {
    intro:
      "Na flexão de braço, você empurra o corpo para cima a partir do chão. Ela treina peitoral, ombros e tríceps em qualquer lugar e, com versões mais difíceis, pode levar você longe.",
    mistakes: [
      ["Quadril caindo", "Contraia os glúteos e trave o abdômen, para o corpo ficar numa linha só."],
      ["Cotovelos muito abertos", "Mantenha os cotovelos a uns 45 graus do corpo."],
      ["Meias reps", "Desça até o peito ficar a um punho do chão, depois empurre até estender os braços."],
    ],
    sets: [
      "**Hipertrofia:** 3 séries, parando uma ou duas reps antes da falha.",
      "**Fácil demais?** Eleve os pés, desça mais devagar ou coloque uma mochila nas costas.",
    ],
    variations: [
      ["incline-push-up", "Mãos num banco: mais fácil, o primeiro passo."],
      ["decline-push-up", "Pés elevados: mais difícil, mais peitoral superior."],
      ["archer-push-up", "Joga o trabalho para um braço só."],
      ["deficit-push-up", "Mãos apoiadas em blocos para um alongamento maior."],
    ],
    faq: [
      [
        "Quantas flexões devo fazer?",
        "O máximo de reps bem-feitas que conseguir, menos uma ou duas, em 3 séries. Passe para versões mais difíceis quando chegar a umas 20.",
      ],
      [
        "Flexão de braço constrói músculo?",
        "Sim, desde que as séries sejam difíceis. Use versões mais difíceis conforme ficar mais forte. Veja [progressões de calistenia](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "No mergulho nas paralelas, você desce e empurra o corpo entre duas barras paralelas. É um dos melhores exercícios com o peso do corpo para peitoral e tríceps.",
    mistakes: [
      ["Descer demais", "Desça até os braços ficarem mais ou menos paralelos ao chão, ou menos se os ombros reclamarem."],
      ["Encolher os ombros", "Mantenha os ombros para baixo, longe das orelhas."],
      ["Balançar", "Cruze os tornozelos e mantenha o corpo parado."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 6 a 12.", "**Fácil demais?** Acrescente peso com um cinto ou um halter entre os pés."],
    variations: [
      ["negative-dip", "Só a descida lenta, o primeiro passo."],
      ["band-assisted-dip", "Um elástico tira parte do seu peso."],
      ["ring-dip", "Bem mais difícil: as argolas se mexem."],
    ],
    faq: [
      ["Peitoral ou tríceps?", "Incline o corpo para a frente para mais peitoral; fique ereto para mais tríceps."],
      [
        "O mergulho faz mal para os ombros?",
        "Para a maioria das pessoas, não, se você controlar a profundidade. Pare antes da amplitude que dói.",
      ],
    ],
  },
  "cable-fly": {
    intro:
      "No crucifixo no cabo, você junta as mãos num arco, como num abraço, contra dois cabos. Ele isola o peitoral e mantém a tensão nele durante toda a rep, principalmente no alongamento.",
    mistakes: [
      ["Transformar em supino", "Mantenha os cotovelos levemente dobrados, sem mudar o ângulo. Mexa só os ombros."],
      ["Pesado demais", "Escolha um peso que você controle durante todo o alongamento."],
      ["Ombros indo para a frente", "Mantenha o peito alto e as escápulas para trás."],
    ],
    sets: ["**Hipertrofia:** 2 a 3 séries de 10 a 15, depois dos supinos."],
    variations: [
      ["low-cable-fly", "De baixo para cima: peitoral superior."],
      ["pec-deck", "Uma máquina com trajeto fixo."],
      ["db-fly", "Com halteres, sem precisar de cabo."],
    ],
    faq: [
      [
        "Crucifixo no cabo alto ou baixo?",
        "De cima para baixo trabalha mais o peitoral inferior; de baixo para cima, mais o peitoral superior. Os dois são bons.",
      ],
      [
        "Crucifixo no cabo ou com halteres?",
        "Os cabos mantêm a tensão no fim da rep; com halteres, o peso pesa mais no alongamento. Qualquer um funciona.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "No desenvolvimento militar, você empurra uma barra dos ombros até acima da cabeça, em pé. Ele desenvolve ombros e tríceps, e o corpo todo precisa travar para segurar o peso.",
    mistakes: [
      ["Inclinar muito para trás", "Contraia os glúteos e trave o tronco, para o corpo ficar alinhado."],
      ["Barra contornando o rosto", "Recue o queixo, empurre reto para cima e passe a cabeça para a frente quando a barra passar."],
      ["Cotovelos abertos no início", "Comece com os cotovelos um pouco à frente da barra."],
    ],
    sets: ["**Força:** 3 a 5 séries de 3 a 6.", "**Hipertrofia:** 3 séries de 6 a 10."],
    variations: [
      ["db-shoulder-press", "Sentado, com halteres: poupa mais a lombar."],
      ["push-press", "Um pouco de impulso das pernas para mover pesos maiores."],
      ["landmine-press", "Um desenvolvimento inclinado para ombros sensíveis."],
    ],
    faq: [
      [
        "Por que meu desenvolvimento estagna tanto?",
        "É um exercício menor, então os saltos de peso são relativamente grandes. Use anilhas pequenas ou aumente as reps antes do peso. Veja [progressão linear ou dupla](/blog/linear-vs-double-progression/).",
      ],
      ["Em pé ou sentado?", "Em pé treina também o tronco; sentado deixa os ombros empurrarem mais. Os dois funcionam."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "No desenvolvimento com halteres, você empurra dois halteres acima da cabeça, em geral sentado com apoio nas costas. Ele desenvolve a frente e a lateral dos ombros com menos esforço na lombar que o desenvolvimento com barra em pé.",
    mistakes: [
      ["Banco totalmente na vertical", "Deixe o banco um pouco antes da vertical para as costas ficarem apoiadas."],
      ["Descer pouco", "Traga os halteres até mais ou menos a altura das orelhas ou do queixo."],
      ["Bater os halteres um no outro", "Empurre para cima e um pouco para dentro, parando antes de se tocarem."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 6 a 12."],
    variations: [
      ["db-arnold-press", "Girando as palmas, para mais frente do ombro."],
      ["machine-shoulder-press", "Um trajeto fixo para forçar com segurança."],
      ["overhead-press", "Com barra, em pé."],
    ],
    faq: [
      ["Sentado ou em pé?", "Sentado deixa você empurrar mais; em pé treina equilíbrio e tronco."],
      [
        "Palmas para a frente ou para dentro?",
        "Palmas um pouco para dentro poupam os ombros de muita gente. Use o que for mais confortável.",
      ],
    ],
  },
  "lateral-raise": {
    intro:
      "Na elevação lateral, você levanta dois halteres para os lados. Ela isola a parte lateral dos ombros, que dá largura a eles e que os desenvolvimentos pouco treinam.",
    mistakes: [
      ["Subir o peso no embalo", "Use um peso que você consiga levantar sem inclinar nem encolher os ombros."],
      ["Encolher os ombros", "Pense em empurrar os halteres para fora, para longe de você, e não para cima."],
      ["Pegar pesado demais", "Pesos leves com 12 a 20 reps bem-feitas rendem mais que reps pesadas no embalo."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 12 a 20, duas ou três vezes por semana."],
    variations: [
      ["cable-lateral-raise", "Tensão constante, um braço por vez."],
      ["lean-away-lateral-raise", "Segurando num poste, para mais amplitude."],
      ["machine-lateral-raise", "Trajeto fixo, fácil de levar até a falha."],
    ],
    faq: [
      ["Quanto peso usar na elevação lateral?", "Pouco. A maioria usa halteres de 4 a 10 kg para fazer reps bem-feitas."],
      ["Até que altura devo subir?", "Mais ou menos até a altura dos ombros. Mais alto, o trapézio entra."],
    ],
  },
  "face-pull": {
    intro:
      "No face pull, você puxa uma corda presa num cabo alto em direção ao rosto, afastando as mãos. Ele treina a parte de trás dos ombros e a parte de cima das costas, o que equilibra os empurrões e ajuda na postura.",
    mistakes: [
      ["Puxar com a lombar", "Fique ereto e trave o tronco; incline para trás só um pouco."],
      ["Mãos baixas demais", "Puxe até a testa ou os olhos, terminando com as mãos ao lado das orelhas."],
      ["Pesado demais", "Use um peso que permita uma pausa no fim de cada rep."],
    ],
    sets: ["**Hipertrofia e saúde dos ombros:** 2 a 3 séries de 12 a 20."],
    variations: [
      ["band-face-pull", "Com elástico, em casa."],
      ["rear-delt-fly", "Com halteres, tronco inclinado."],
      ["reverse-pec-deck", "Uma máquina com trajeto fixo."],
    ],
    faq: [
      [
        "O face pull é bom para os ombros?",
        "Ele treina a parte de trás dos ombros e a parte de cima das costas, o que equilibra os empurrões. Muita gente faz em todo treino de membros superiores.",
      ],
      ["Corda ou barra?", "A corda deixa as mãos se afastarem no final, o que trabalha mais a parte de trás dos ombros."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "No crucifixo inverso, você inclina o tronco para a frente e levanta dois halteres para os lados. Ele isola a parte de trás dos ombros, que a maioria dos empurrões e até das remadas pouco treina.",
    mistakes: [
      ["Transformar em remada", "Mantenha os cotovelos levemente dobrados, sem mudar o ângulo, e mexa os ombros."],
      ["Apertar as escápulas", "Deixe os ombros fazerem o trabalho; as escápulas ficam quase paradas."],
      ["Pesado demais", "Pesos bem leves, com controle, funcionam melhor."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 12 a 20."],
    variations: [
      ["reverse-pec-deck", "Uma máquina, mais fácil de manter a forma estrita."],
      ["cable-rear-delt-fly", "Cabos para tensão constante."],
      ["face-pull", "Uma puxada que também treina a parte de cima das costas."],
    ],
    faq: [
      [
        "Sentado ou em pé?",
        "Sentado com o peito sobre os joelhos, ou de bruços num banco inclinado, fica mais fácil manter a forma estrita.",
      ],
      [
        "Por que treinar o deltoide posterior?",
        "Ele completa o formato dos ombros e equilibra todos os empurrões que a maioria dos programas tem.",
      ],
    ],
  },
  "pull-up": {
    intro:
      "Na barra fixa, você fica pendurado com as palmas para a frente e puxa até o queixo passar da barra. É o exercício clássico de costas com o peso do corpo, que treina dorsais, a parte de cima das costas e bíceps.",
    mistakes: [
      ["Kipping ou balanço", "Comece cada rep pendurado e parado."],
      ["Meias reps", "Vá dos braços estendidos até o queixo passar da barra."],
      ["Encolher os ombros lá em cima", "Leve os ombros para baixo e para trás enquanto puxa."],
    ],
    sets: [
      "**Hipertrofia:** 3 a 4 séries, parando uma ou duas reps antes da falha.",
      "**Fácil demais?** Acrescente peso com um cinto ou um halter entre os pés.",
    ],
    variations: [
      ["negative-pull-up", "Suba com um pulo e desça devagar, o primeiro passo."],
      ["band-assisted-pull-up", "Um elástico tira parte do seu peso."],
      ["chin-up", "Palmas para você: um pouco mais fácil, mais bíceps."],
      ["neutral-grip-pull-up", "Palmas voltadas uma para a outra, poupa os cotovelos."],
    ],
    faq: [
      [
        "Como faço minha primeira barra fixa?",
        "Negativas lentas, reps com elástico e puxada frontal, três vezes por semana. A maioria consegue a primeira em alguns meses.",
      ],
      [
        "Barra fixa ou puxada frontal?",
        "As duas treinam as dorsais. A barra fixa também trabalha o tronco; na puxada você escolhe qualquer peso.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "Na barra fixa supinada, você fica pendurado com as palmas viradas para você e puxa até o queixo passar da barra. Ela treina as dorsais e trabalha mais o bíceps que a barra fixa pronada, e a maioria consegue algumas reps a mais.",
    mistakes: [
      ["Não estender os braços", "Estenda os braços embaixo em cada rep."],
      ["Esticar o queixo", "Leve o peito em direção à barra em vez de esticar o pescoço."],
      ["Balançar", "Mantenha as pernas paradas e o tronco firme."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries, parando uma ou duas reps antes da falha."],
    variations: [
      ["pull-up", "Palmas para a frente: mais parte de cima das costas."],
      ["reverse-grip-pulldown", "A mesma pegada numa máquina."],
      ["negative-pull-up", "Descida lenta para chegar lá."],
    ],
    faq: [
      [
        "Supinada ou pronada?",
        "A supinada usa mais o bíceps e é um pouco mais fácil; a pronada usa mais a parte de cima das costas. As duas desenvolvem as dorsais.",
      ],
      ["Qual deve ser a largura da pegada?", "Mais ou menos a largura dos ombros."],
    ],
  },
  "lat-pulldown": {
    intro:
      "Na puxada frontal, você puxa uma barra presa num cabo alto até a parte de cima do peito. Ela treina as dorsais como a barra fixa, mas deixa você escolher o peso, então qualquer pessoa consegue fazer.",
    mistakes: [
      ["Inclinar muito para trás", "Incline só um pouco e mantenha o peito alto."],
      ["Puxar com os braços", "Pense em levar os cotovelos para baixo, junto ao corpo."],
      ["Puxar atrás da nuca", "Puxe até a parte de cima do peito."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 8 a 12."],
    variations: [
      ["close-grip-pulldown", "Pegada fechada, mais amplitude."],
      ["one-arm-cable-pulldown", "Um lado por vez."],
      ["pull-up", "Com o peso do próprio corpo."],
    ],
    faq: [
      [
        "Pegada aberta ou fechada?",
        "As duas trabalham as dorsais. Uma pegada média, um pouco mais aberta que os ombros, serve para a maioria.",
      ],
      [
        "A puxada frontal ajuda a fazer barra fixa?",
        "Sim, principalmente com negativas lentas. Veja [treino de costas](/blog/back-workout/).",
      ],
    ],
  },
  "barbell-row": {
    intro:
      "Na remada curvada, você inclina o tronco para a frente e puxa uma barra até a barriga. Ela desenvolve toda a parte de cima das costas, as dorsais e a parte de trás dos ombros, e permite usar cargas pesadas.",
    mistakes: [
      ["Levantar o tronco ao remar", "Mantenha o tronco num ângulo fixo, uns 30 a 45 graus em relação ao chão."],
      ["Dar tranco no peso", "Puxe de forma suave e desça com controle."],
      ["Arredondar a lombar", "Trave o tronco e mantenha as costas retas. Tire peso da barra se arredondar."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 6 a 12.", "**Força:** 3 séries de 5 a 8."],
    variations: [
      ["pendlay-row", "Saindo do chão a cada rep, costas retas."],
      ["chest-supported-row", "Nenhum esforço na lombar."],
      ["db-row", "Um braço por vez, com apoio."],
    ],
    faq: [
      [
        "Pegada pronada ou supinada?",
        "A pronada trabalha mais a parte de cima das costas; a supinada, mais dorsais e bíceps. As duas estão ótimas.",
      ],
      ["Por que a remada machuca minha lombar?", "Seu tronco está sem apoio. Use menos peso ou troque por uma remada com apoio no peito."],
    ],
  },
  "db-row": {
    intro:
      "Na remada unilateral com halter (serrote), você apoia uma mão e um joelho num banco e puxa um halter até o quadril. Ela treina dorsais e a parte de cima das costas um lado por vez, com as costas apoiadas.",
    mistakes: [
      ["Girar o corpo para levantar", "Mantenha ombros e quadril paralelos ao chão."],
      ["Puxar até o peito", "Puxe em direção ao quadril para trabalhar as dorsais."],
      ["Amplitude curta", "Deixe o halter descer até o fim para alongar em cada rep."],
    ],
    sets: ["**Hipertrofia:** 3 séries de 8 a 12 por braço."],
    variations: [
      ["db-chest-supported-row", "Os dois braços, com o peito num banco inclinado."],
      ["kb-row", "Com um kettlebell."],
      ["seal-row", "Deitado num banco alto: bem estrita."],
    ],
    faq: [
      ["Preciso de banco?", "Com banco é mais fácil. Sem ele, apoie a mão numa cadeira firme ou no joelho."],
      ["Quanto peso usar na remada com halter?", "O bastante para as últimas reps serem difíceis sem girar o corpo."],
    ],
  },
  "seated-cable-row": {
    intro:
      "Na remada sentada, você puxa uma pegada presa num cabo baixo em direção à barriga, sentado. Ela treina a parte de cima das costas e as dorsais com tensão constante e sem carga na lombar.",
    mistakes: [
      ["Balançar para a frente e para trás", "Mantenha o tronco parado, inclinando só um pouco para trás no final."],
      ["Encolher os ombros", "Leve as escápulas para trás e para baixo, não para cima."],
      ["Voltar com pressa", "Deixe os braços estenderem com controle e sinta o alongamento."],
    ],
    sets: ["**Hipertrofia:** 3 a 4 séries de 8 a 15."],
    variations: [
      ["cable-row-wide", "Barra aberta: mais parte de cima das costas."],
      ["single-arm-cable-row", "Um lado por vez."],
      ["machine-row", "Uma máquina com apoio no peito."],
    ],
    faq: [
      [
        "Qual pegada é melhor?",
        "O triângulo fechado trabalha mais as dorsais; a barra aberta, mais a parte de cima das costas. Use as duas ao longo do tempo.",
      ],
      ["Devo inclinar para a frente?", "Um pouco no início, para alongar, depois sente ereto enquanto puxa."],
    ],
  },
  "barbell-curl": {
    intro:
      "Na rosca direta, você flexiona os braços levando a barra das coxas até os ombros. É o exercício clássico de bíceps e o tipo de rosca que permite usar mais peso.",
    mistakes: [
      ["Balançar com as costas", "Fique ereto com os cotovelos ao lado do corpo. Tire peso da barra se precisar balançar."],
      ["Cotovelos indo para a frente", "Mantenha-os perto do corpo durante toda a rep."],
      ["Deixar a barra cair", "Desça com controle por dois ou três segundos."],
    ],
    sets: ["**Hipertrofia:** 2 a 4 séries de 8 a 12."],
    variations: [
      ["ez-curl", "Uma barra angulada, mais confortável para os punhos."],
      ["db-curl", "Cada braço trabalha sozinho."],
      ["drag-curl", "Puxa a barra rente ao corpo para mais pico de bíceps."],
    ],
    faq: [
      ["Barra reta ou barra W?", "A barra W é mais confortável para os punhos. A barra reta trabalha um pouco mais o bíceps."],
      [
        "Quantas roscas devo fazer?",
        "Umas 6 a 12 séries difíceis de bíceps por semana, contando barra fixa supinada e remadas. Veja [treino de braço](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "Na rosca com halteres, você flexiona os braços com um halter em cada mão. Cada braço trabalha sozinho e dá para girar as palmas para cima enquanto sobe, o que trabalha o bíceps por completo.",
    mistakes: [
      ["Balançar", "Mantenha os cotovelos ao lado do corpo e o corpo parado."],
      ["Girar tarde demais", "Comece com as palmas para dentro e gire-as para cima enquanto sobe."],
      ["Amplitude curta", "Estenda totalmente os braços lá embaixo."],
    ],
    sets: ["**Hipertrofia:** 2 a 4 séries de 8 a 15."],
    variations: [
      ["incline-db-curl", "Num banco inclinado, para um alongamento longo."],
      ["hammer-curl", "Palmas para dentro: mais antebraço e braquial."],
      ["db-preacher-curl", "Braço apoiado no banco para reps estritas."],
    ],
    faq: [
      ["Alternada ou com os dois braços juntos?", "Tanto faz. Alternada deixa você focar em cada braço; os dois juntos economiza tempo."],
      ["Em pé ou sentado?", "Sentado fica mais difícil balançar."],
    ],
  },
  "hammer-curl": {
    intro:
      "Na rosca martelo, você flexiona os braços com halteres e as palmas voltadas uma para a outra. Ela trabalha o braquial e os músculos do antebraço mais que a rosca comum, o que dá espessura ao braço.",
    mistakes: [
      ["Subir o peso no embalo", "Fique ereto e mantenha os cotovelos parados."],
      ["Girar as palmas", "Mantenha as palmas voltadas uma para a outra durante toda a rep."],
      ["Fazer com pressa", "Desça com controle."],
    ],
    sets: ["**Hipertrofia:** 2 a 3 séries de 8 a 15."],
    variations: [
      ["rope-hammer-curl", "No cabo, com corda."],
      ["incline-hammer-curl", "Num banco inclinado, para alongar."],
      ["reverse-curl", "Palmas para baixo, para os antebraços."],
    ],
    faq: [
      ["Rosca martelo ou rosca comum?", "Faça as duas: a comum para o bíceps, a martelo para o braquial e os antebraços."],
      ["Cruzando o corpo ou reta?", "As duas funcionam. Cruzando o corpo é uma variação comum que algumas pessoas acham mais confortável."],
    ],
  },
  "cable-pushdown": {
    intro:
      "No tríceps na polia, você empurra uma barra ou corda para baixo a partir de um cabo alto. Ele isola o tríceps e é fácil de aprender, poupa os cotovelos e é fácil de progredir.",
    mistakes: [
      ["Cotovelos se mexendo", "Prenda os cotovelos ao lado do corpo; só os antebraços se movem."],
      ["Debruçar sobre o peso", "Fique ereto com uma leve inclinação para a frente, sem curvar o corpo."],
      ["Amplitude curta", "Estenda totalmente lá embaixo e deixe os antebraços subirem além do paralelo."],
    ],
    sets: ["**Hipertrofia:** 2 a 4 séries de 10 a 15."],
    variations: [
      ["rope-pushdown", "A corda deixa as mãos se afastarem lá embaixo."],
      ["cable-overhead-extension", "Acima da cabeça: a cabeça longa do tríceps."],
      ["reverse-grip-pushdown", "Palmas para cima, uma sensação diferente."],
    ],
    faq: [
      ["Corda ou barra?", "A barra permite levantar mais; a corda deixa as mãos se afastarem. Use qualquer uma."],
      [
        "Preciso fazer tríceps acima da cabeça também?",
        "Acrescentar uma extensão acima da cabeça treina a cabeça longa do tríceps alongada, o que pode construir mais músculo.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "No tríceps testa, você desce uma barra W em direção à testa deitado num banco e depois estende os braços. Ele treina as três cabeças do tríceps com um bom alongamento.",
    mistakes: [
      ["Cotovelos abrindo", "Mantenha os cotovelos apontados para o teto, mais ou menos na largura dos ombros."],
      ["Descer até a testa", "Desça em direção ao topo da cabeça ou um pouco atrás dela, para mais alongamento e menos risco."],
      ["Pesado demais", "Escolha um peso que você controle até embaixo."],
    ],
    sets: ["**Hipertrofia:** 2 a 3 séries de 8 a 12."],
    variations: [
      ["db-skull-crusher", "Com halteres, mais confortável para os punhos."],
      ["incline-skull-crusher", "Num banco inclinado, para um alongamento maior."],
      ["jm-press", "Um meio-termo entre o tríceps testa e o supino fechado."],
    ],
    faq: [
      [
        "O tríceps testa faz mal para os cotovelos?",
        "Pode incomodar alguns cotovelos. Diminua o peso, experimente halteres ou troque por exercícios no cabo se doer.",
      ],
      ["Barra W ou barra reta?", "A barra W é mais confortável para os punhos."],
    ],
  },
  "close-grip-bench": {
    intro:
      "O supino fechado é um supino com as mãos mais ou menos na largura dos ombros. Ele joga mais trabalho para o tríceps e ainda deixa você levantar pesado.",
    mistakes: [
      ["Pegada fechada demais", "Mais ou menos na largura dos ombros. Mãos encostadas machucam os punhos."],
      ["Cotovelos abrindo", "Mantenha-os fechados, perto do corpo."],
      ["Encostar alto demais", "Desça até a parte de baixo do peito."],
    ],
    sets: ["**Força:** 3 a 4 séries de 5 a 8.", "**Hipertrofia:** 3 séries de 8 a 12."],
    variations: [
      ["bench-press", "Pegada mais aberta, mais peitoral."],
      ["db-close-press", "Halteres pressionados um contra o outro."],
      ["diamond-push-up", "A versão com o peso do corpo."],
    ],
    faq: [
      ["É exercício de peitoral ou de tríceps?", "Os dois, com mais tríceps que o supino comum."],
      ["Quanto menos que o meu supino?", "Em geral, uns 10 a 15% menos."],
    ],
  },
  "preacher-curl": {
    intro:
      "Na rosca Scott, você apoia a parte de cima dos braços num banco inclinado e flexiona uma barra W. O apoio impede o balanço e carrega bem o bíceps lá embaixo, no alongamento.",
    mistakes: [
      ["Não chegar ao alongamento completo", "Desça até os braços ficarem quase estendidos, com controle."],
      ["Tirar os cotovelos do apoio", "Mantenha a parte de cima dos braços apoiada no banco."],
      ["Despencar lá embaixo", "Desça mais devagar no final da descida, onde está o alongamento."],
    ],
    sets: ["**Hipertrofia:** 2 a 3 séries de 8 a 12."],
    variations: [
      ["db-preacher-curl", "Um braço por vez, com halter."],
      ["machine-preacher-curl", "Trajeto fixo, fácil de forçar."],
      ["cable-preacher-curl", "Tensão também lá em cima."],
    ],
    faq: [
      ["A rosca Scott é melhor que a rosca em pé?", "Ela é mais estrita e carrega mais a posição alongada. As duas desenvolvem o bíceps."],
      ["Por que dói lá embaixo?", "Use menos peso e vá mais devagar. Pare antes de estender tudo se os cotovelos reclamarem."],
    ],
  },
};
