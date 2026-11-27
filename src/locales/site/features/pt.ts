import type { FeaturesText } from "./types";

// The features page in Brazilian Portuguese (você). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.

export const pt: FeaturesText = {
  chrome: {
    title: "Recursos do {name} e com o que ele funciona",
    description:
      "Todos os recursos do {name}, quais são grátis, os mais novos e uma tabela dos relógios, apps de saúde, balanças e serviços com que ele funciona no Android, no iPhone e na web.",
    crumb: "Recursos",
    h1: "Todos os recursos do {name}",
    intro:
      "Todos os {count} recursos, quais são grátis, o que funciona com o quê e o que há de novo. Quase tudo é grátis; veja em {pricing} o que o Pro acrescenta.",
    pricing: "preços",
    onThisPage: "Nesta página",
    newestNav: "Novidades",
    worksWithNav: "Funciona com",
    newestH: "Recursos mais novos",
    newestIntro: "Adicionados recentemente, por categoria. Todas as mudanças, correções incluídas, estão em {whatsNew}.",
    whatsNew: "O que há de novo",
    midTitle: "Veja com seus próprios olhos",
    midBody: "Grátis e sem conta. Seu primeiro treino fica pronto em menos de um minuto.",
    midButton: "Comece grátis",
    worksH: "Com o que o {name} funciona",
    worksIntro:
      "Apps, relógios e dispositivos, e onde cada um funciona. “Pelo app de saúde” quer dizer que chega ao {name} pelo Health Connect no Android ou pelo Apple Saúde no iPhone. “Chrome” quer dizer o app web no Chrome, que tem Web Bluetooth.",
    tableLabel: "Tabela de compatibilidade",
    cols: {
      connection: "Conexão",
      does: "O que faz",
      android: "Android",
      iphone: "iPhone",
      web: "Web",
      plan: "Plano",
    },
    footnote:
      "“Em breve” quer dizer que já está pronto e aguardando a página na loja. “Em análise” quer dizer que estamos trabalhando nisso, mas ainda não podemos prometer, porque depende da aprovação da outra empresa. Os serviços de fitness se conectam por uma conta grátis do {name}. Os Labs são experimentos do Pro que você ativa em Ajustes › Labs. Os nomes de produtos são marcas registradas de seus donos.",
    endTitle: "Comece grátis, sem conta",
    endBody: "Seu primeiro treino fica pronto em menos de um minuto. Sem anúncios, nunca.",
  },
  tiers: {
    free: "Grátis",
    pro: "Pro",
    both: "Grátis + Pro",
    lab: "Labs (Pro)",
  },
  where: {
    all: "Android, iPhone e web",
    phones: "Apps para Android e iPhone",
  },
  support: {
    yes: "Sim",
    no: "Não",
    soon: "Em breve",
    investigating: "Em análise",
    chrome: "Chrome",
    health: "Pelo app de saúde",
  },
  groups: {
    plan: {
      title: "Um plano que se adapta",
      intro: "O treino de hoje é montado a partir da sua academia, da sua recuperação e do seu bloco de treino, e cada número diz por quê.",
    },
    workout: {
      title: "O treino",
      intro: "Um toque registra a série como planejado. Todo o resto espera o seu descanso.",
    },
    progress: {
      title: "Progresso e orientação",
      intro: "O que fazer a seguir vem primeiro. Os números aparecem quando você pode agir com base neles.",
    },
    body: {
      title: "Corpo e saúde",
      intro: "Pesagens, gordura corporal e dados de saúde chegam sozinhos quando possível e viram conselhos.",
    },
    programs: {
      title: "Programas, rotinas e exercícios",
      intro: "Siga um programa clássico, monte suas próprias rotinas ou deixe o app planejar. Tudo a partir de uma só biblioteca.",
    },
    gyms: {
      title: "Academias e equipamentos",
      intro: "Todo plano parte do equipamento que você realmente tem.",
    },
    friends: {
      title: "Amigos e compartilhamento",
      intro: "Treine com pessoas, não para uma plateia. Amigos é grátis.",
    },
    coaches: {
      title: "Para coaches",
      intro: "Ser aluno de alguém é grátis para todo mundo.",
    },
    fun: {
      title: "Recompensas",
      intro: "Um pouco de diversão que nunca atrapalha uma série.",
    },
    phone: {
      title: "No celular e no pulso",
      intro: "O Liftsmith usa o que cada celular faz de melhor.",
    },
    data: {
      title: "Seus dados",
      intro: "Funciona offline, sem precisar de conta, e seus dados continuam sendo seus.",
    },
    access: {
      title: "Aparência, uso e idiomas",
      intro: "Confortável para todo mundo que treina, com uma mão na academia ou numa tela grande em casa.",
    },
    labs: {
      title: "Labs",
      intro: "Experimentos que quem tem Pro pode ativar em Ajustes › Labs. Eles podem mudar ou sair.",
    },
  },
  features: {
    "gym-widgets": {
      name: "Widgets para o site da sua academia",
      body: "Academias oficiais colocam a grade de aulas, os equipamentos ou um selo Encontre a gente no Liftsmith no próprio site com uma linha de código. Eles se atualizam sozinhos, no idioma e na aparência escolhidos, e levam para a página da academia.",
      note: "Sem scripts, cookies ou rastreamento no site da academia.",
    },
    "gym-insights": {
      name: "Dados para donos de academia",
      body: "Donos e equipe de academias oficiais veem quantos atletas treinaram lá nas últimas quatro semanas, os horários cheios e tranquilos, os equipamentos usados e os problemas abertos, com um próximo passo.",
      note: "Só totais e porcentagens, de atletas que contam suas visitas, e só depois que cinco treinaram lá.",
    },
    adaptive: {
      name: "Treinos adaptativos diários",
      body: "Escolhe exercícios que a sua academia permite e para os quais seus músculos estão prontos, e define cada peso e cada rep a partir dos seus últimos treinos.",
      proPart: "Quem usa o plano grátis ganha um treino adaptativo por semana junto do programa grátis; o Pro planeja todos os dias.",
    },
    "auto-supersets": {
      name: "Supersets automáticos",
      body: "Ative os supersets e o plano adaptativo junta exercícios que não usam os mesmos músculos, como um supino e uma remada, com descanso menor depois de cada rodada, para caber mais no seu tempo. Agachamentos e levantamentos terra pesados ficam sozinhos, e você também pode desligar as séries de aquecimento.",
    },
    "pick-weights": {
      name: "Aprende os exercícios de que você gosta",
      body: "Os exercícios populares são escolhidos com mais frequência. Marque um exercício com estrela e ele aparece bem mais; troque um e ele aparece menos, efeito que some ao longo de alguns meses.",
    },
    splits: {
      name: "Divisões adaptativas",
      body: "Empurrar, puxar, pernas ou superior e inferior, ainda ajustados à sua recuperação a cada dia.",
    },
    readiness: {
      name: "Decisão do dia",
      body: "Forçar, como planejado ou pegar leve, com base na recuperação, nas reps perdidas e no esforço das suas últimas séries. Você sempre pode mudar.",
    },
    "health-readiness": {
      name: "Sono e VFC mudam a decisão",
      body: "Sono, variabilidade da frequência cardíaca, frequência cardíaca em repouso e frequência respiratória do app de saúde do celular puxam a decisão do dia para cima ou para baixo.",
    },
    blocks: {
      name: "Blocos de treino e deloads",
      body: "Blocos de quatro semanas com uma meta de reps em reserva que terminam numa semana mais leve, para você continuar progredindo sem se esgotar.",
    },
    why: {
      name: "Toda recomendação diz por quê",
      body: "Cada exercício, número de séries, meta de reps e peso traz um motivo curto, mostrado na tela, nunca escondido atrás de um toque.",
    },
    "short-on-time": {
      name: "Pouco tempo",
      body: "Diga ao treino que você tem menos tempo e ele corta o que menos importa.",
      proPart: "Contornar um banco ou rack que outra pessoa está usando é Pro.",
    },
    injury: {
      name: "Modo lesão",
      body: "Diga o que dói e ele deixa de fora o que pioraria, avisa sobre exercícios arriscados e acompanha uma nota de dor de 0 a 10 ao longo do tempo.",
    },
    "rehab-done": {
      name: "A reabilitação do seu fisioterapeuta, em dia",
      body: "Um programa do seu fisioterapeuta espera em Hoje para ser salvo com um toque e registra a lesão a que se refere. Segue as vezes por semana que ele pediu, aparece nos dias de descanso e pergunta sobre a dor só dessa lesão.",
      note: "Os lembretes de reabilitação e o aviso de programa novo estão no Android e no iPhone.",
    },
    "rehab-self": {
      name: "Reabilitação leve sem fisioterapeuta",
      body: "Registrou uma lesão e não tem fisioterapeuta? Lesões e uma nota do coach oferecem uma rotina curta com o peso do corpo para fazer em casa. É um ponto de partida, não um tratamento.",
    },
    "rehab-end": {
      name: "Quando o fisioterapeuta retira um programa",
      body: "Se o seu fisioterapeuta retira um programa, Hoje pergunta se você para ou continua por conta própria. Parar remove a rotina e os lembretes dela.",
    },
    cycle: {
      name: "Prontidão que considera o ciclo",
      body: "Se quiser, registre seu ciclo menstrual e a decisão do dia passa a levá-lo em conta.",
    },
    pregnancy: {
      name: "Modo gravidez e pós-parto",
      body: "Conte que você está grávida ou já teve seu bebê e cada treino se ajusta à semana: cargas mais leves, nenhuma série até a falha, nada de costas no fim da gravidez e uma volta gradual de cerca de 16 semanas depois do parto.",
    },
    "goal-planner": {
      name: "Planejador de metas",
      body: "Escolha um exercício e uma meta, e ele calcula uma data realista e o caminho até lá.",
    },
    logger: {
      name: "Registro de série com um toque",
      body: "A próxima série já vem preenchida. Botões que repetem quando você segura mudam o peso e as reps; digitar é só o plano B.",
    },
    "rest-timer": {
      name: "Timer de descanso na tela de bloqueio",
      body: "Começa sozinho após cada série e faz a contagem regressiva na tela de bloqueio com a próxima série, as anilhas, a frequência cardíaca e os botões Registrar série e +30 s, que funcionam com o app fechado. Uma vibração leve 10 segundos antes do fim dá tempo de se posicionar, no celular e no relógio.",
      note: "Android: uma notificação contínua, uma Live Update no Android 16 e a Now Bar da Samsung. iPhone: uma Live Activity na tela de bloqueio e na Dynamic Island. Web: uma notificação enquanto a página está aberta.",
    },
    plates: {
      name: "Cálculo de anilhas",
      body: "Mostra quais anilhas vão em cada lado, calculado com as anilhas que a sua academia tem, cada tamanho com sua própria cor.",
    },
    warmups: {
      name: "Séries de aquecimento",
      body: "Séries progressivas calculadas para cada exercício pesado, para você chegar pronto ao peso de trabalho.",
    },
    demos: {
      name: "Demonstrações de exercícios em 3D",
      body: "Todo exercício tem uma figura 3D mostrando o movimento com o equipamento certo, com passos de preparação e dicas.",
    },
    "form-mistakes": {
      name: "Erros comuns e como corrigir",
      body: "Todo exercício e alongamento mostra seus dois ou três erros de técnica mais comuns ao lado da figura 3D, cada um com a correção e por que importa, e o cronômetro de descanso mostra um para a próxima série. Funciona offline.",
    },
    "set-types": {
      name: "Drop sets e rest-pause",
      body: "Adicione um drop set ou uma série rest-pause entre as séries.",
    },
    "timed-sets": {
      name: "Timer de série para isometrias, carregamentos e cardio",
      body: "Exercícios com tempo, como prancha, carregamentos, suspensão na barra e cardio, ganham um timer de série, também na tela de bloqueio e nos relógios.",
    },
    "each-side": {
      name: "Cada lado e por mão",
      body: "Exercícios feitos um lado de cada vez avisam isso, e os pesos de halter aparecem por mão.",
    },
    swaps: {
      name: "Trocar exercícios",
      body: "Troque qualquer exercício por outro que trabalhe os mesmos músculos com o que a sua academia tem.",
    },
    "heart-rate": {
      name: "Frequência cardíaca ao vivo",
      body: "Conecte uma cinta cardíaca Bluetooth ou seu relógio e veja sua frequência cardíaca em cada série e descanso.",
      note: "Web: só no Chrome.",
    },
    breathing: {
      name: "Respiração quadrada no descanso",
      body: "Um guia de respiração na tela de descanso, com padrões prontos ou o seu próprio.",
    },
    "voice-coach": {
      name: "Coach por voz",
      body: "Fala durante o treino, por exemplo quando o descanso acaba, para você não precisar olhar o celular.",
      note: "O Android avisa o fim do descanso com a tela bloqueada; o iPhone e a web, enquanto o app está aberto.",
    },
    "voice-amy": {
      name: "Voz Amy",
      body: "Uma voz inglesa clara incluída na app para o coach por voz. Escolha Amy ou a síntese do telemóvel em Definições › Treino; a Amy volta à voz do telemóvel se não carregar.",
    },
    stretching: {
      name: "Alongamento",
      body: "61 alongamentos com demonstrações em 3D: um aquecimento opcional antes, uma volta à calma depois ou uma rotina de alongamento em qualquer dia. Alguns segundos para se posicionar antes de cada alongamento e de cada lado, e a tela fica ligada.",
    },
    "workout-parts": {
      name: "Treinos em partes",
      body: "Um treino pode ter aquecimento, musculação e volta à calma em sequência, com Pular entre eles. A tela de bloqueio e o relógio mostram em que parte você está, o Histórico mostra cada parte, e dias de alongamento de 10 minutos ou mais mantêm sua sequência. As rotinas podem ter seu próprio aquecimento e volta à calma, nos links compartilhados e vindas do seu coach. As Notas do coach leem cada parte: dor diminuindo ou aumentando depois da reabilitação, e uma frequência cardíaca que continua alta durante a volta à calma. A reabilitação do seu fisioterapeuta pode rodar junto da musculação no mesmo treino nos dias previstos, e o cardio pode vir depois da musculação, com o aparelho e os minutos escolhidos com toques.",
    },
    "workout-length": {
      name: "A duração do treino inclui todas as partes",
      body: "O controle de duração em Hoje define o treino inteiro. Aquecimento, cardio, reabilitação ou volta à calma tiram seus minutos da musculação, e uma barra fina embaixo do controle mostra para onde vai o tempo. A musculação fica com pelo menos 15 minutos: o cardio encolhe primeiro, com uma linha explicando por quê. Num dia de cardio e alongamento, desligue a musculação e o cardio fica com o tempo.",
    },
    "now-playing": {
      name: "Controles de música",
      body: "Toque, pause e pule músicas em Hoje e durante o treino, vendo a música e o app que a toca. Dá para desligar em Ajustes.",
      note: "iPhone: só Apple Music, porque a Apple não deixa apps controlarem outros apps de música.",
    },
    notes: {
      name: "Notas do coach",
      body: "Aponta fadiga acumulando, um exercício estagnado, um músculo com poucas séries, uma meta semanal em risco ou a gordura corporal subindo, cada um com uma coisa a fazer, muitas vezes com um só toque.",
    },
    plateau: {
      name: "Detetive de platô",
      body: "Quando um exercício estagna, ele aponta a causa provável e uma correção de três semanas com um toque, e depois diz se funcionou.",
    },
    "recovery-map": {
      name: "Mapa de recuperação",
      body: "Seus músculos se iluminam numa figura 3D conforme a recuperação. Toque num deles para ver o que isso significa para hoje.",
    },
    "advanced-stats": {
      name: "Estatísticas avançadas",
      body: "Séries semanais por músculo comparadas com a meta, linhas de tendência do 1RM e para onde vai cada exercício.",
    },
    bests: {
      name: "Recordes pessoais e histórico",
      body: "Cada recorde, 1RM estimado, pontuação de força e treino passado, sem limite de histórico.",
    },
    "calendar-history": {
      name: "Calendário de treinos",
      body: "Um calendário mensal dos treinos passados em Progresso, com o nome de cada dia.",
    },
    "edit-history": {
      name: "Edite treinos passados e repita",
      body: "Corrija uma série, adicione uma anotação, dê nome a um treino ou repita, e cada exercício tem sua própria página com o histórico. Exclua um com opção de desfazer, e todas as estatísticas são recalculadas.",
    },
    "exercise-stats": {
      name: "Estatísticas de cada exercício",
      body: "Toque em qualquer exercício da biblioteca para ver suas séries, o peso total levantado, o máximo estimado e como você se compara com praticantes treinados do seu peso, idade e sexo, segundo padrões de força publicados.",
      proPart:
        "As estatísticas avançadas do Pro trazem os gráficos, de uma semana a todo o histórico: toque em qualquer sessão para ver o número, com os recordes marcados.",
    },
    "log-past": {
      name: "Registre um treino passado",
      body: "Esqueceu o celular? Registre o treino depois e ele conta como qualquer outro.",
    },
    recap: {
      name: "Resumo mensal",
      body: "Um olhar rápido sobre o seu mês, pronto para compartilhar.",
    },
    anniversary: {
      name: "Seu aniversário de treino",
      body: "Todo ano, no dia do seu primeiro treino, Hoje coloca o primeiro dia ao lado de hoje: treinos, séries, total levantado e o exercício que mais cresceu, com um card para compartilhar. Fica por uma semana.",
    },
    body: {
      name: "Pesagens, gordura corporal e fotos",
      body: "Registre peso e gordura corporal, ou deixe que cheguem da sua balança pelo app de saúde do celular, e guarde fotos de progresso no celular.",
    },
    "photo-compare": {
      name: "Fotos de progresso que se alinham",
      body: "A câmera mostra sua última foto como um contorno suave para você se alinhar, com temporizador para dar um passo atrás. Compare duas datas quaisquer com um controle deslizante ou lado a lado, cada uma com o que você pesava naquele dia. As fotos ficam no seu celular; um arquivo de backup pode levá-las para um novo.",
    },
    measurements: {
      name: "Medidas com fita",
      body: "Nove pontos em centímetros ou polegadas. Uma cintura que aumenta ou diminui vira uma nota do coach quando não há medição de gordura corporal.",
    },
    "body-figure": {
      name: "Uma figura 3D com o seu formato",
      body: "Ative e as figuras em Saúde, no mapa de recuperação e nas demonstrações de exercícios ganham o seu porte, a partir da sua altura, peso, gordura corporal e medidas com fita.",
    },
    "health-twin": {
      name: "Gêmeo de saúde e idade fitness",
      body: "Sono, VFC, frequência cardíaca em repouso, passos, frequência respiratória e VO₂ máx num só lugar, com sua tendência e uma idade fitness a partir do seu VO₂ máx.",
      note: "Os dados de saúde vêm do Health Connect no Android e do Apple Saúde no iPhone. O app web mostra pesagens, gordura corporal, IMC e calorias.",
    },
    "fitness-tests": {
      name: "Testes de condicionamento",
      body: "Suspensão na barra, equilíbrio numa perna só e levantar da cadeira em 30 segundos, cada um com timer, uma faixa típica e o que ajuda.",
    },
    food: {
      name: "Notas do coach a partir do seu app de alimentação",
      body: "Calorias, proteínas, carboidratos e gorduras registrados num app de alimentação chegam ao Liftsmith pelo app de saúde do celular e viram notas como “proteína abaixo três dias seguidos”, avaliadas com um único conjunto de metas para o seu objetivo. Registrar só proteína já conta. O app não tem registro de alimentação.",
    },
    "measured-maintenance": {
      name: "Manutenção medida pelo que você come",
      body: "Duas semanas de alimentação e pesagens medem suas calorias diárias reais, que então alimentam Macros, TDEE e suas notas de alimentação. Um card de Alimentação em Corpo mostra sua semana em relação às metas.",
      note: "Menores de 18 recebem só conselhos de proteína: sem meta de perda de gordura e sem notas de calorias.",
    },
    "your-stats": {
      name: "Seus dados",
      body: "Um só lugar para sexo, idade e altura que todas as ferramentas usam, preenchido pelo Apple Saúde no iPhone.",
    },
    "fixed-programs": {
      name: "Programas clássicos",
      body: "5×5 clássico, 3×5 para iniciantes, 5×5 com braços, 5×5 progressivo, progressão em níveis, ondas de training max, habilidades com peso corporal e corpo inteiro com halteres. O programa grátis se adapta à sua academia.",
    },
    routines: {
      name: "Suas próprias rotinas",
      body: "Monte rotinas a partir do catálogo de exercícios, sem limite de quantidade, e compartilhe como link.",
    },
    "routine-library": {
      name: "Biblioteca de rotinas",
      body: "Busque rotinas que outras pessoas publicaram por objetivo, palavras e o que a sua academia tem, salve uma com um toque e avalie com estrelas. Publique a sua pelo editor, com ou sem seu nome, e ela ganha uma página própria no site. Só os exercícios e as séries são publicados, nunca suas cargas ou anotações.",
      note: "Publicar exige uma conta e 18 anos. Qualquer pessoa pode navegar.",
    },
    library: {
      name: "1.000 exercícios",
      body: "Musculação, peso corporal, máquinas, elásticos, kettlebells e cardio, com busca, filtros por músculo e um filtro desta academia. O cardio registra tempo e distância.",
    },
    remix: {
      name: "Links de remix",
      body: "Mande um treino para um amigo como link, para ele fazer também.",
    },
    gyms: {
      name: "Suas academias e seus equipamentos",
      body: "Configure cada academia uma vez: barras, anilhas, halteres e kettlebells como realmente são, máquinas e seus ajustes.",
    },
    "gym-location": {
      name: "Academia pela localização",
      body: "Escolhe a academia certa quando você chega.",
    },
    "gym-share": {
      name: "Compartilhe a configuração de uma academia",
      body: "Mande o equipamento da sua academia como link, para um parceiro de treino começar com o mesmo equipamento.",
    },
    "gym-finder": {
      name: "Buscador de academias e páginas de academia",
      body: "Encontre academias perto de você num mapa grande com cada academia num cartão translúcido por cima, as oficiais primeiro, cada uma com sua página: equipamentos, horários, mapa e membros. Donos podem reivindicar a academia e adicionar logo e fotos. Falta uma academia? Adicione. Os donos veem quantas pessoas adicionaram a academia e escanearam o cartaz, e o que fazer em seguida. Academias oficiais podem ter um clube com ranking semanal. Algo errado numa página? Relate, e nossa equipe corrige.",
    },
    "gym-amenities": {
      name: "Comodidades e preços nas páginas de academia",
      body: "Os donos de academia listam o que há além do equipamento (chuveiros, estacionamento, acesso 24 horas, área feminina e mais) e quanto custa uma diária, um passe semanal ou a mensalidade.",
    },
    "gym-news": {
      name: "Avisos da sua academia",
      body: "Academias oficiais publicam na própria página horários de feriado, equipamentos novos ou mudanças nas aulas, e os membros do clube da academia recebem uma notificação.",
    },
    "gym-problems": {
      name: "Avise sobre equipamento quebrado",
      body: "Avise a sua academia que uma máquina está quebrada ou faltando. Todo mundo que treina lá recebe um plano que contorna isso, e o dono vê o aviso com um botão Consertado.",
    },
    "gym-trainers": {
      name: "Personal trainers nas páginas de academia",
      body: "Coaches se listam nas academias onde atendem alunos, com uma frase sobre si e um botão para começar a treinar com eles. Numa academia oficial, o dono aprova antes.",
    },
    "gym-staff": {
      name: "Contas de equipe para academias",
      body: "O dono de uma academia oficial convida gerentes e recepcionistas com um link de uso único. Cada um usa a própria conta para manter em dia a página, os avisos e os relatos de problemas da academia.",
    },
    "gym-classes": {
      name: "Horários de aulas nas páginas das academias",
      body: "Academias oficiais publicam as aulas de cada semana, com instrutor e sala, e marcam os dias sem aula. Quem treina lá vê a semana na página da academia no app e na web, e adiciona a próxima aula à agenda com um toque.",
    },
    "gym-chains": {
      name: "Todas as unidades de uma rede",
      body: "Academias de uma rede mostram o logo dela e levam a uma página com todas as unidades, no app as mais próximas primeiro. No site, cada rede tem sua própria página.",
      note: "Reconhecemos as redes pela marca no mapa ou por um nome usado por academias em várias cidades. Academias reivindicadas mantêm o próprio logo.",
    },
    "gym-open-now": {
      name: "Aberto agora na busca de academias",
      body: "As academias perto de você mostram se estão abertas agora e quando fecham ou abrem de novo, e um toque em Aberto agora mostra só as que você pode visitar já.",
      note: "Calculado pelo horário de cada academia e pela sua própria hora, para academias perto de você.",
    },
    "gym-starter": {
      name: "Programas iniciais da academia",
      body: "Academias oficiais sugerem um programa para novos membros na sua página no app e na web, e a pessoa salva com um toque. O Liftsmith preenche os pesos de cada um.",
    },
    "buy-next": {
      name: "O que comprar a seguir",
      body: "Para academias em casa: o equipamento que liberaria o maior número de exercícios.",
    },
    feed: {
      name: "Feed de amigos",
      body: "Siga pessoas e veja os treinos delas, com curtidas, comentários, respostas e @menções, e escolha quem vê cada um dos seus.",
    },
    cheers: {
      name: "Treinando agora e incentivos",
      body: "Veja quem está treinando agora e mande um incentivo que sobe flutuando na tela de treino da pessoa.",
    },
    "check-in": {
      name: "Check-in na academia",
      body: "Um toque em Hoje avisa os amigos que você escolher que você está na academia. Eles recebem uma notificação e um aviso no app até fecharem.",
      note: "Para maiores de 18. As notificações estão no Android e no iPhone; o app web mostra o aviso quando está aberto.",
    },
    challenges: {
      name: "Desafios, clubes e rankings",
      body: "Desafie um amigo, entre num clube ou turma da academia com ranking semanal e encare o desafio do mês com todo mundo.",
    },
    "club-chat": {
      name: "Chat do clube e treinos em grupo",
      body: "Converse com seu clube entre os treinos, marque um horário e um lugar para treinar junto e veja quem vai. Quem vai recebe um lembrete uma hora antes, e ao postar seu treino depois você aparece como quem treinou, com os amigos que treinaram com você marcados.",
      note: "Para maiores de 18 anos. As notificações são no Android e no iPhone; o app web mostra as mensagens novas enquanto o chat está aberto.",
    },
    "campus-clubs": {
      name: "Pro para quem lidera um clube ativo",
      body: "Lidere um clube em que 5 ou mais membros, você incluído, terminem cada um um treino nos últimos 14 dias, e o Pro fica grátis para você enquanto isso continuar.",
      note: "Entrar no clube de outra pessoa não conta, e dois clubes não se somam.",
    },
    profiles: {
      name: "Perfis públicos",
      body: "Uma página pública opcional com seus melhores levantamentos e treinos.",
    },
    "tagline-gym": {
      name: "Frase de perfil e academia principal",
      body: "Adicione uma frase curta embaixo do seu nome e escolha sua academia principal no buscador de academias, para os amigos saberem onde você treina. Aparece para quem vê seus treinos e na sua página pública.",
      note: "A academia principal é para maiores de 18.",
    },
    safety: {
      name: "Bloquear, silenciar e denunciar",
      body: "Bloqueie ou silencie qualquer pessoa, e denuncie um post, comentário ou perfil com um toque num motivo. Nossa equipe analisa cada denúncia e pode advertir, suspender ou banir.",
    },
    "invite-friends": {
      name: "Convide amigos e ganhe Pro",
      body: "Compartilhe seu link de convite em Amigos, no fim de um treino ou em qualquer card de compartilhamento. Um amigo que entrar por ele segue você de volta, e quando ele concluir três treinos vocês dois ganham um mês de Pro. Seus convites mostra quanto falta para cada amigo.",
      note: "Até 12 meses por ano. Menores de 18 podem convidar amigos, mas a recompensa não é oferecida a eles.",
    },
    share: {
      name: "Cards e links para compartilhar",
      body: "Compartilhe um treino, um recorde novo ou um marco como imagem, ou como link público com prévia. Um recorde novo brilha em dourado e pode ser compartilhado na hora, na tela de descanso.",
    },
    "screenshot-share": {
      name: "Cards ao fazer uma captura de tela",
      body: "Faça uma captura de tela e uma folha de cards do seu treino aparece: último mês, três meses, seis meses, ano ou desde o início, como totais, para onde foram suas séries ou seus melhores levantamentos. Deslize entre eles, oculte os pesos com o olho e compartilhe com seu link de convite impresso no card. Os mesmos cards estão em Compartilhar meu treino, no Progresso. Todo link que você compartilha agora leva seu convite, num link que diz isso.",
      note: "As capturas abrem isso no Android 14 ou mais recente e no iPhone, e dá para desativar. Em outros lugares, abra pelo Progresso. Quem tem menos de 18 anos compartilha sem link de convite.",
    },
    "share-stats": {
      name: "Compartilhe qualquer recorde ou máximo",
      body: "Um pequeno botão de compartilhar fica ao lado dos seus máximos estimados, da sua série mais pesada, de cada recorde por número de repetições e dos seus recordes recentes. Um toque cria um cartão com esse número, o logotipo do Liftsmith e o site, no visual do app, pronto para postar ou salvar.",
    },
    coaching: {
      name: "Treine alunos",
      body: "Vincule alunos, veja os resultados deles e passe rotinas, no celular ou numa tela grande.",
    },
    "coach-chat": {
      name: "Chat, alertas e dados corporais",
      body: "Mande mensagem para cada aluno, receba uma notificação quando ele treinar ou sumir por uma semana, e veja as pesagens, as medidas e uma figura 3D com o formato dele quando ele quiser compartilhar.",
      note: "As notificações estão no Android e no iPhone. O app web mostra as mensagens novas quando está aberto.",
    },
    physio: {
      name: "Para fisioterapeutas e profissionais de reabilitação",
      body: "Passe programas leves de reabilitação com vezes por semana, veja com que frequência os pacientes os seguem e veja as notas de dor e as lesões que eles escolhem compartilhar, exercício por exercício, com uma notificação quando a dor fica alta.",
      note: "O Liftsmith mostra o que os alunos registram. Ele não diagnostica nem trata nada.",
    },
    "rehab-phases": {
      name: "Protocolos de reabilitação em fases, guiados pela dor",
      body: "Cada programa de reabilitação tem três fases, de acalmar a região ao uso normal. Uma regra da dor simples lê as avaliações depois de cada exercício e no dia seguinte, diz quando o aluno está pronto para a próxima fase ou deve voltar uma, e o fisioterapeuta envia com um toque.",
      note: "Os alunos seguem de graça. O Liftsmith mostra o que seus alunos registram. Ele não diagnostica nem trata nada.",
    },
    "rehab-shape": {
      name: "Modele uma rotina de reabilitação",
      body: "Fisioterapeutas definem as repetições ou os segundos de cada exercício de uma rotina de reabilitação e acrescentam uma dica curta, no editor de rotinas. Os alunos seguem como está escrito.",
      note: "Os alunos seguem de graça. O Liftsmith mostra o que seus alunos registram. Ele não diagnostica nem trata nada.",
    },
    "coach-nutrition": {
      name: "Metas de nutrição para alunos",
      body: "Defina as calorias, proteínas, carboidratos e gorduras diárias de cada aluno, com um número de calorias para dias de descanso se quiser, preenchido com os números do próprio aluno em um toque. As Notas do coach dele comparam a semana de alimentação com essas metas, e você vê como ele está comendo quando ele compartilha.",
    },
    "school-teams": {
      name: "Grátis para equipes escolares",
      body: "Treinadores de escolas de ensino médio que confirmam um e-mail da escola ganham o Pro grátis, assim como os atletas de 13 a 18 anos das suas equipes, com um ranking semanal da equipe. Gordura corporal e perfis públicos ficam desligados para menores de 18.",
    },
    "my-team": {
      name: "Meu time para atletas escolares",
      body: "Um atleta de time escolar abre o Coaching na casa do seu time: o time e o técnico, os programas atribuídos com Seguir, um chat do time com o técnico, um chat com o técnico e a semana do time. O técnico pode adicionar ao time atletas que entraram com o convite dele; cada um informa a idade e aceita antes.",
    },
    "team-session": {
      name: "Sessões do time em um tablet",
      body: "Um técnico do ensino médio conduz um treino para o time todo em um tablet: cada atleta toca no próprio nome e registra suas séries, com o peso de onde parou, e o painel mostra quem não começou. No fim, as séries de cada atleta ficam salvas na própria conta. Funciona sem sinal.",
    },
    "coach-checkins": {
      name: "Formulários de check-in e questionários",
      body: "Mande aos alunos um check-in semanal, um questionário de avaliação inicial ou seu próprio formulário, uma vez ou toda semana. Eles respondem com poucos toques, e uma nota baixa ou uma resposta atrasada vai para o topo do relatório deles.",
    },
    "coach-checkin-trends": {
      name: "Check-ins de progresso com peso, fotos e tendências",
      body: "Adicione perguntas de peso corporal e de foto a qualquer formulário e envie toda semana, a cada 2 ou a cada 4 semanas. O peso já vem da última pesagem do aluno, as fotos chegam só para você e a tendência de cada resposta aparece no relatório dele. Menores de 18 anos nunca recebem pedido de foto.",
    },
    "coach-form-videos": {
      name: "Vídeos de execução com notas no vídeo",
      body: "Seus clientes gravam uma série no app e enviam para você. Veja em câmera lenta, fixe notas nos momentos exatos e eles respondem nas mesmas notas. Só vocês dois veem; menores de 18 anos não podem enviar.",
      note: "Enviar um vídeo é grátis para clientes. Android, iPhone e web.",
    },
    "coach-roles": {
      name: "Para personal trainers e coaches",
      body: "Diga se você é personal trainer, coach esportivo ou fisio. Os alunos veem o termo certo, e só as ferramentas desse papel aparecem — as mensagens ficam para todos.",
    },
    "coach-booking": {
      name: "Agendamento de sessões",
      body: "Abra os horários em que você está livre, uma vez ou toda semana, e os alunos agendam no app, ou agende você mesmo um aluno. Sua agenda é um calendário mensal: toque num dia para ver quem está agendado e o que ainda está livre. Os dois lados recebem uma notificação, uma sessão nas próximas 24 horas aparece em Hoje, e ela entra no calendário deles com um toque.",
    },
    "coach-payments": {
      name: "Pagamentos de alunos pelo Stripe",
      body: "Conecte sua própria conta Stripe e defina o preço de cada aluno, por sessão ou mensal. Os alunos pagam na página segura do Stripe, o dinheiro vai direto para você, e uma mensalidade que falhar aparece no topo do relatório do aluno.",
    },
    "coach-pages": {
      name: "Uma página para cada lado",
      body: "Os alunos veem só o próprio coach: mandam mensagem com um toque, respondem check-ins, agendam sessões e escolhem o que compartilhar. Os coaches têm uma página para cada tarefa, com alunos, mensagens, agenda, check-ins e pagamentos como abas na web e no celular.",
      proPart: "Ser aluno é grátis; treinar alunos é Pro.",
    },
    "coach-sharing": {
      name: "Os alunos escolhem o que o coach vê",
      body: "O treino é sempre compartilhado. Frequência cardíaca, anotações de treino, prontidão e recuperação, dados corporais, dor e lesões, e ciclo menstrual são cada um uma chave que o aluno liga para cada coach, na tela de consentimento ou quando quiser depois. Fotos e academias nunca saem.",
      proPart: "Ser aluno é grátis; treinar alunos é Pro.",
    },
    "trainer-directory": {
      name: "No diretório de personal trainers",
      body: "Liste-se como personal trainer, coach ou fisioterapeuta na sua academia e você aparece na página dessa academia e no diretório de personal trainers da cidade dela no site, com sua bio e um link para novos alunos começarem a treinar com você. Só adultos são listados.",
    },
    "coach-chat-dock": {
      name: "Chat fixo, status e figurinhas",
      body: "No computador, o chat com o coach fica fixo no canto inferior direito, como um mensageiro: todo mundo com quem você pode conversar, até duas janelas de chat que se recolhem, um som e um contador na aba quando chega mensagem. Os dois lados definem um status (online, com um aluno, treinando, ausente, não perturbe, de férias ou aparecer offline), veem quando o outro está digitando e quando viu sua mensagem, e mandam emoji e figurinhas de academia, no celular também.",
      proPart: "Ser aluno é grátis; treinar alunos é Pro.",
    },
    "coach-programs": {
      name: "Programas de treinadores",
      body: "Treinadores e personal trainers transformam suas rotinas em um programa, com nível, objetivo e quantas semanas seguir, grátis ou com preço, e compartilham o link. Você salva os dias nas suas rotinas com um toque, e a sua própria progressão escolhe as cargas. Programas pagos são pagos ao treinador pela própria conta Stripe dele. Uma visão de semana coloca cada rotina nos seus dias com descansos, uma visão de mês mostra como ela corre e Organizar sozinho distribui as rotinas por você.",
      note: "Programas pagos são comprados no site; os apps de Android e iPhone mostram os programas grátis e os que você já tem.",
      proPart: "Pegar programas é grátis; criá-los faz parte do coaching, que é Pro.",
    },
    "program-phases": {
      name: "Fases do programa e repetições do treinador",
      body: "O programa de um treinador pode seguir em fases, cada uma repetindo a própria semana: Construção, uma semana de Deload com menos séries e cargas mais leves, e um Pico com menos séries para chegar descansado. Adicione um deload com um toque, veja cada fase no mês e defina as repetições de um exercício (por exemplo, de 8 a 12) ou deixe no Auto para que o histórico de cada pessoa escolha. Quem segue vê em que fase e semana está abaixo do plano de Hoje.",
      proPart: "Seguir um programa é grátis; criar um faz parte do coaching, que é Pro.",
    },
    "client-program-copy": {
      name: "Ajuste um programa para um cliente",
      body: "Mude um dia do programa de um treinador só para um cliente, por exemplo um exercício trocado por causa de uma lesão. O dia fica marcado como mudado para essa pessoa e um toque traz de volta o dia do programa. As mudanças no programa continuam chegando a todos e a cada dia que você não mudou, e o app de cada pessoa recebe sozinho.",
      proPart: "Ser cliente é grátis; treinar clientes é Pro.",
    },
    "coach-program-today": {
      name: "Do seu treinador, em Hoje",
      body: "Quem segue o programa de um treinador o vê em Hoje: de quem é, o dia de hoje, a semana e a fase, e o próximo com o seu dia. Um atleta de um time escolar também vê o mês em Meu time, com os dias feitos, perdidos e que vêm aí.",
    },
    "program-in-order": {
      name: "Programas que seguem em ordem",
      body: "Um treinador pode fazer um programa seguir em ordem: cada pessoa faz o próximo dia sempre que treina, em vez de em dias fixos da semana, e a semana fica como ritmo sugerido. Hoje mostra o que vem a seguir.",
      proPart: "Ser cliente é grátis; treinar clientes é Pro.",
    },
    "coach-calendar": {
      name: "Calendário de treinos",
      body: "Atribua treinos ou dias de descanso no calendário mensal. Os atletas veem a programação do dia em Hoje. Convide treinadores assistentes para editar um calendário e confira a atividade dos atletas.",
    },
    "coach-assign-program": {
      name: "Atribuir um programa de temporada a clientes ou a uma equipa",
      body: "Os treinadores atribuem um programa de vários dias (Upper/Lower, Push/Pull/Legs ou o seu) como plano fixo por dias da semana durante N semanas. Os atletas seguem uma vez; Hoje mostra o treino desse dia. Um calendário do programa mostra quem fez cada dia e quem ainda não — só primeiros nomes em equipas escolares, nunca pesos.",
      proPart: "Seguir um programa é grátis; atribuir faz parte do coaching, que é Pro.",
    },
    "coach-reviews": {
      name: "Notas e avaliações de alunos reais",
      body: "Os alunos dão estrelas e uma avaliação curta ao seu coach, personal trainer ou fisioterapeuta depois de quatro semanas ou duas sessões juntos. A nota aparece quando o coach tem três avaliações, ao lado de quantos alunos dele treinaram nas últimas duas semanas, no convite dele e na lista de personal trainers. Os coaches respondem uma vez a cada uma, e qualquer pessoa pode denunciar uma avaliação. Só adultos podem avaliar.",
      proPart: "Avaliar é grátis; treinar alunos é Pro.",
    },
    "program-pages": {
      name: "Programas de treinadores no site, com avaliações",
      body: "Cada programa publicado por um treinador tem sua própria página no site, com nível, objetivo, semanas e dias, e os exercícios dos gratuitos, para que as pessoas o encontrem nas buscas. Quem tem um programa há duas semanas o avalia com estrelas e uma avaliação curta; as notas aparecem a partir de três, e o treinador responde uma vez a cada uma.",
      proPart: "Avaliar um programa é grátis; criá-los faz parte do coaching, que é Pro.",
    },
    "coach-plans": {
      name: "Planos de coach que crescem com sua lista de alunos",
      body: "O Pro cobre até 3 alunos. O Coach abre espaço para 25 e o Coach Plus não tem limite fixo, com todas as ferramentas de coaching em todos os planos. Seus alunos sempre treinam grátis, e no Coach e no Coach Plus o Liftsmith não fica com nada do que eles pagam a você. No Pro, ele fica com 2%.",
    },
    awards: {
      name: "Conquistas, níveis e sequências",
      body: "Medalhas em níveis, 50 níveis com recompensas, missões semanais, congelamentos de sequência e ligas honestas.",
    },
    seasons: {
      name: "Temporadas de treino",
      body: "Temporadas de dez semanas com uma trilha de 20 níveis, que você sobe treinando rumo à sua própria meta semanal: dois dias por semana sobem tão rápido quanto cinco, e dias extras não somam. Os níveis dão medalhas, um avatar, uma cor de destaque e um tema com ícone exclusivos da temporada, seus para sempre. Desafios da temporada, um item raro por novos recordes, estrelas de prestígio, uma semana de recuperação depois de uma falha, uma final com pontos em dobro e um resumo para compartilhar. Seis temporadas estão planejadas uma após a outra até o fim de 2027 (Brasa, Tempestade, Florada, Solstício, Bordo e Obsidiana), cada uma com visual e três desafios próprios.",
      proPart: "Todos os níveis e recompensas são grátis; o Pro adiciona uma recompensa bônus em três níveis.",
      note: "Os ícones da temporada estão no Android e no iPhone; a web recebe o tema. As temporadas podem ser desligadas em Ajustes.",
    },
    locker: {
      name: "Temas, cores de destaque e ícones do app",
      body: "Ganhe temas e cores de destaque e, nos celulares, um ícone do app nas cores do seu tema.",
      note: "Os ícones do app conquistados estão só no Android e no iPhone.",
    },
    watch: {
      name: "Apps para relógio",
      body: "O treino no Wear OS e no Apple Watch: a série ou a contagem do descanso, a frequência cardíaca do relógio, Registrar série e +30 s, e uma vibração quando o descanso acaba.",
    },
    "watch-today": {
      name: "O treino de hoje no seu relógio",
      body: "Um bloco e uma complicação de mostrador no Wear OS, uma complicação no Apple Watch e um glance no Garmin mostram a indicação de hoje, quanto dura e como está sua prontidão, como “Forçar · 45 min · Prontidão 82”. No Wear OS, Começar no celular abre o treino no seu celular.",
      note: "O Apple Watch não consegue abrir o app do iPhone, então a complicação abre o app do relógio.",
    },
    "watch-adjust": {
      name: "Mude e avalie uma série no relógio",
      body: "Gire a coroa ou o aro, ou toque em − e +, para mudar o peso e as repetições pelo pulso, nos mesmos passos do celular: suas anilhas, halteres ou a pilha de pesos da máquina. Depois da última série de um exercício, o relógio pergunta como foi, e sua resposta define o próximo peso.",
      note: "Wear OS, Apple Watch e Garmin (botões UP e DOWN).",
    },
    "machine-taken": {
      name: "Aparelho ocupado",
      body: "Alguém no aparelho? Um toque no relógio ou em Mudar o plano coloca o melhor exercício da sua academia que não precisa dele, com a carga e o porquê.",
      note: "Wear OS, Apple Watch e Garmin (o botão UP), e Mudar o plano no celular e na web.",
    },
    "watch-alone": {
      name: "Treinos no relógio, sem o celular",
      body: "O plano de hoje vai junto no seu relógio. Toque em Começar no relógio, registre cada série com peso e repetições no pulso, e o treino é salvo, recordes incluídos, quando o celular estiver por perto de novo.",
      note: "Wear OS, Apple Watch e Garmin.",
    },
    widgets: {
      name: "Widgets na tela inicial",
      body: "Três widgets: Hoje (a decisão do dia, sua meta semanal, uma nota do coach e Iniciar ou Registrar série), Esta semana (dias treinados, sua sequência e o que a mantém) e Recuperação (quais músculos estão prontos para treinar e quando os outros vão estar).",
      note: "No lugar disso, o app web tem atalhos no ícone da tela inicial.",
    },
    shortcuts: {
      name: "Configurações rápidas, Siri e atalhos",
      body: "Comece um treino por um bloco das Configurações rápidas no Android ou pela Central de Controle e pela Siri no iPhone.",
    },
    calendar: {
      name: "Calendário",
      body: "Coloca seus dias de treino no seu calendário e pode encurtar um treino para caber antes da sua próxima reunião.",
      note: "No lugar disso, o app web baixa um arquivo .ics.",
    },
    reminders: {
      name: "Lembretes",
      body: "Lembretes gentis nos dias de treino, como notificações nos celulares e por e-mail.",
    },
    emails: {
      name: "E-mails que mantêm você no ritmo",
      body: "Oito dicas para começar com telas reais, um resumo semanal e um mensal, recordes pessoais novos, quais amigos treinaram, um empurrãozinho para voltar depois de uma pausa e, depois, uma dica por semana sobre um recurso que você talvez ainda não tenha descoberto. Cada tipo tem sua própria chave.",
      note: "Ativados com uma conta, desligados para menores de 18 a menos que eles liguem. Todo e-mail tem cancelamento com um clique.",
    },
    cloud: {
      name: "Conexões com serviços de fitness",
      body: "O Oura envia sono, VFC, frequência cardíaca em repouso e passos, com uma conta grátis. Estamos analisando Strava, WHOOP, Withings, Polar e Concept2.",
    },
    "health-save": {
      name: "Treinos salvos no seu app de saúde",
      body: "Cada treino concluído é salvo no Health Connect ou no Apple Saúde como treino de força, com calorias e frequência cardíaca.",
    },
    "outside-workouts": {
      name: "Treinos de outros apps contam",
      body: "Ligado, corridas, pedais, esportes e aulas que outros apps salvam no seu app de saúde contam no mapa de recuperação e no plano de amanhã. Uma partida longa ontem deixa as pernas em recuperação, e o plano leva isso em conta.",
    },
    offline: {
      name: "Funciona offline",
      body: "Tudo roda no seu aparelho e sincroniza em segundo plano, então ficar sem sinal na academia do subsolo não é problema.",
    },
    sync: {
      name: "Contas e sincronização",
      body: "Entrar com Google, Apple ou um código por e-mail é opcional e mantém celular, tablet e app web em sintonia.",
    },
    backup: {
      name: "Backup e exportação",
      body: "Salve um arquivo de backup ou exporte seus treinos como planilha quando quiser.",
    },
    import: {
      name: "Importe de outro app",
      body: "Traga seu histórico do Strong, Hevy, Fitbod, StrongLifts, JEFIT ou FitNotes com o arquivo de exportação deles, cardio incluído.",
    },
    importExtras: {
      name: "Rotinas e medidas corporais de outro app",
      body: "Uma importação transforma em rotinas os treinos que você repetiu com o mesmo nome e traz peso corporal, gordura corporal e medidas com fita do Hevy, do FitNotes ou de um app de balança.",
    },
    "strength-standards": {
      name: "Padrões de força de praticantes reais",
      body: "O site mostra quanto as pessoas realmente fazem no agachamento, supino, levantamento terra e desenvolvimento, por sexo e peso corporal, calculado todo dia a partir de quem participa. Só grupos de 30 ou mais aparecem, como percentis, nunca os números de alguém. Uma chave em Ajustes › Seus dados e privacidade decide se você participa; menores de 18 nunca participam.",
    },
    community: {
      name: "Comunidade: ideias, bugs e roteiro",
      body: "Sugira o que o Liftsmith deve fazer em seguida, vote nas ideias que você quer, relate bugs com uma captura de tela que só a equipe vê, e comente ou mencione alguém com @. Cada uma mostra em que ponto está, de em análise a lançada, e você fica sabendo quando uma ideia que votou é lançada. O roteiro e o registro de mudanças também estão no site.",
    },
    whatsNew: {
      name: "Novidades no app",
      body: "Os Ajustes mostram sua versão com um botão Novidades: o que é novo, melhor e corrigido, em palavras simples. Depois de uma atualização, Hoje avisa uma vez, e só lista o que você já pode usar.",
    },
    "icon-badge": {
      name: "Um número no ícone do app",
      body: "O ícone do app mostra quantas mensagens, curtidas, comentários e pedidos para seguir estão esperando. Dentro do app, números vermelhos em Amigos e no seu treinador mostram onde estão, e o número some quando você os vê. Um botão em Ajustes › Lembretes desliga.",
      note: "Android e iPhone. O app web mostra quando instalado pelo Chrome, Edge ou Safari.",
    },
    languages: {
      name: "Dez idiomas",
      body: "Inglês, espanhol, francês, alemão, italiano, japonês, português do Brasil, coreano, polonês e turco, seguindo o idioma do seu celular ou navegador, ou o que você escolher na tela de boas-vindas e nos ajustes.",
    },
    "settings-search": {
      name: "Buscar nas configurações",
      body: "Digite uma palavra no topo das Configurações e cada configuração que corresponde aparece com onde fica. Toque e ela abre com essa configuração à vista.",
    },
    appearance: {
      name: "Escuro, claro ou igual ao celular",
      body: "Visual escuro por padrão, um claro ou o que o seu celular estiver usando.",
    },
    a11y: {
      name: "Acessibilidade",
      body: "Texto maior até 150%, cores seguras para daltonismo, mais contraste, suporte a leitor de tela e uso completo pelo teclado, verificados segundo a WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Controles para uma mão",
      body: "Leve os botões de peso e reps para o lado de Registrar série, embaixo do seu polegar esquerdo ou direito.",
    },
    "big-numbers": {
      name: "Números grandes",
      body: "Durante uma série, o peso e as reps ficam bem maiores e Registrar série fica mais alto, e a música e o que vem a seguir esperam o descanso. Fácil de ler à distância de um braço, no meio da série.",
    },
    lean: {
      name: "Modo enxuto, sons e vibração",
      body: "Desligue animações e confete, sons ou vibração, cada um com uma chave.",
    },
    "lite-demos": {
      name: "Economia de bateria nas figuras 3D",
      body: "Desenhe as demonstrações de exercícios e o mapa de recuperação com resolução e taxa de quadros menores, para celulares mais antigos e bateria mais duradoura.",
    },
    desktop: {
      name: "Layout para computador",
      body: "No computador, o app web tem barra lateral, páginas largas, atalhos de teclado durante o treino (L registra a série) e um criador de rotinas amplo.",
      note: "App web numa janela larga com mouse; celulares e tablets mantêm o layout de celular.",
    },
    "lab-rep-count": {
      name: "Contagem de reps pela câmera",
      body: "Apoie o celular e a câmera conta suas reps, com o esqueleto desenhado sobre a imagem. Nada sai do seu celular.",
    },
    "lab-bar-speed": {
      name: "Velocidade da barra pela câmera",
      body: "Mostra a velocidade da barra e quando ela desacelerou o bastante para encerrar a série.",
    },
    "lab-form": {
      name: "Análise da execução pela câmera",
      body: "Detecta agachamentos acima da paralela, reps incompletas e inclinação para um lado, e dá uma dica entre as séries.",
    },
    "lab-speed-max": {
      name: "Máximo do dia pelo aquecimento",
      body: "Usa a velocidade da barra no aquecimento para sugerir um primeiro peso de trabalho um pouco mais pesado ou mais leve.",
    },
    "lab-bar-path": {
      name: "Replay da trajetória da barra",
      body: "Repete uma rep de agachamento, levantamento terra ou desenvolvimento com a trajetória da barra desenhada, e uma dica se ela desviou.",
    },
    "lab-motion": {
      name: "Contagem de reps pelo movimento do celular",
      body: "Conta as reps pelos sensores de movimento do próprio celular quando ele se move com você.",
      note: "Celulares e tablets com sensores de movimento.",
    },
    "lab-watch-reps": {
      name: "Contagem de reps pelo relógio",
      body: "Seu relógio Wear OS ou Apple Watch conta as reps pelo movimento do pulso.",
    },
    "lab-hands-free": {
      name: "Séries sem as mãos",
      body: "Enquanto um contador de reps está contando, a série se registra sozinha alguns segundos depois da sua última rep.",
    },
    "lab-watch-auto": {
      name: "Séries sem as mãos com o relógio",
      body: "Comece a próxima série e seu relógio encerra o descanso, conta as repetições e registra a série sozinho, com uma vibração a cada etapa.",
      note: "Wear OS e Apple Watch, com a contagem de repetições pelo relógio ligada.",
    },
    "lab-watch-speed": {
      name: "Velocidade pelo pulso",
      body: "Seu relógio mede a velocidade de cada repetição e vibra quando a série desacelerou o bastante para terminar. As velocidades do aquecimento ajustam sua primeira carga de trabalho, sem câmera.",
      note: "Wear OS e Apple Watch, com a contagem de repetições do relógio ligada.",
    },
    "lab-voice": {
      name: "Registro de série por voz",
      body: "Diga “100 por 8” ou “fácil demais” para registrar uma série. O reconhecimento é feito no aparelho; nenhum áudio sai dele.",
      note: "Web: Chrome 139 ou mais recente.",
    },
    "lab-volume": {
      name: "Botão de volume registra a série",
      body: "Aperte aumentar volume no celular ou nos fones para registrar a série.",
    },
    "lab-tempo": {
      name: "Coach de cadência",
      body: "Em exercícios com cadência e pausa, conta a descida, a pausa e a subida de cada rep com som e vibração.",
    },
    "lab-hr-rest": {
      name: "Timer de descanso pela frequência cardíaca",
      body: "Encerra o descanso mais cedo quando sua frequência cardíaca volta a baixar, nunca abaixo de 60% do descanso planejado.",
    },
    "lab-machines": {
      name: "Aparelhos de academia Bluetooth",
      body: "Bicicletas, remos, esteiras e elípticos preenchem o tempo, a distância e a potência de uma série de cardio.",
      note: "Web: só no Chrome.",
    },
    "lab-scale": {
      name: "Balança inteligente Bluetooth",
      body: "Suba numa balança compatível e a pesagem preenche seu peso e gordura corporal para você conferir e registrar.",
      note: "Web: só no Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Controle uma caixa de som Sonos durante o treino, com um volume para as séries e outro para o descanso.",
    },
  },
  connectionGroups: {
    health: "Apps de saúde",
    watches: "Relógios e frequência cardíaca",
    bluetooth: "Equipamentos Bluetooth (Labs)",
    services: "Serviços de fitness (precisa de conta grátis)",
    music: "Música e caixas de som",
    other: "Calendários e outros apps",
  },
  connections: {
    "health-connect": {
      name: "Health Connect",
      does: "Recebe pesagens, gordura corporal, sono, VFC, frequência cardíaca, passos e alimentação; envia os treinos concluídos; e, se ligado, recebe treinos de outros apps",
    },
    "apple-health": {
      name: "Apple Saúde",
      does: "Recebe pesagens, gordura corporal, sono, VFC, frequência cardíaca, passos, alimentação, altura, idade e sexo; envia os treinos concluídos; e, se ligado, recebe treinos de outros apps",
    },
    "samsung-health": {
      name: "Samsung Health",
      does: "Os dados dele, depois que você os compartilha com o Health Connect",
    },
    "health-devices": {
      name: "Fitbit, Garmin Connect, balanças inteligentes, Hume Body Pod",
      does: "Tudo o que eles gravam no app de saúde do seu celular",
    },
    "wear-os": {
      name: "Relógios Wear OS",
      does: "O treino no pulso, frequência cardíaca, Registrar série e +30 s",
    },
    "apple-watch": {
      name: "Apple Watch",
      does: "O treino no pulso, frequência cardíaca, Registrar série e +30 s",
    },
    garmin: {
      name: "Relógios Garmin (Connect IQ)",
      does: "O treino no pulso com o app do Liftsmith para relógio",
    },
    "hr-strap": {
      name: "Cintas cardíacas Bluetooth",
      does: "Frequência cardíaca ao vivo nas séries e no descanso (qualquer cinta ou braçadeira que compartilhe frequência cardíaca no padrão Bluetooth)",
    },
    scale: {
      name: "Balanças inteligentes Bluetooth",
      does: "Peso e gordura corporal na pesagem (balanças que compartilham o serviço padrão Weight Scale ou Body Composition)",
      link: "Balanças compatíveis",
    },
    machines: {
      name: "Aparelhos de academia Bluetooth",
      does: "Tempo, distância e potência de bicicletas, remos, esteiras e elípticos que compartilham o serviço padrão Fitness Machine",
    },
    oura: {
      name: "Oura",
      does: "Recebe sono, VFC, frequência cardíaca em repouso e passos",
    },
    strava: {
      name: "Strava",
      does: "Cada treino concluído publicado no Strava",
    },
    "garmin-connect": {
      does: "Entram sono, VFC, frequência cardíaca em repouso, passos e pesagens da balança Index, e corridas, pedaladas e remadas indoor como treinos de cardio",
    },
    whoop: {
      name: "WHOOP",
      does: "Recebe sono, recuperação, VFC e frequência cardíaca em repouso",
    },
    withings: {
      name: "Withings",
      does: "Recebe pesagens, gordura corporal, sono e passos",
    },
    polar: {
      name: "Polar",
      does: "Recebe Nightly Recharge, VFC e sono",
    },
    concept2: {
      name: "Concept2 Logbook",
      does: "Recebe sessões de RowErg, SkiErg e BikeErg como treinos de cardio",
    },
    "music-apps": {
      name: "Spotify, YouTube Music e outros apps de música",
      does: "Tocar, pausar e pular em Hoje e no treino, com o nome da música",
    },
    "apple-music": {
      name: "Apple Music",
      does: "Tocar, pausar e pular em Hoje e no treino, com o nome da música",
    },
    sonos: {
      name: "Sonos",
      does: "Tocar, pausar, pular e volume no treino; a música acompanha as séries e o descanso",
    },
    calendar: {
      name: "Calendário do celular (Google, iCloud, Outlook)",
      does: "Dias de treino no seu calendário e treinos encaixados nos horários ocupados",
    },
    ics: {
      name: "Qualquer calendário (arquivo .ics)",
      does: "Dias de treino como arquivo de calendário",
    },
    import: {
      name: "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes",
      does: "Seu histórico de treinos importado do arquivo de exportação deles",
      link: "Como migrar",
    },
  },
};
