// The daily quote on Today (Melvin, 2026-11-09): effort, health, hard work, discipline and motivation,
// each with its author and, where it helps, the work it comes from. One a day, the same for everyone on
// a given date, and no repeat within a year (there are more than 365).
//
// Attribution rules: only quotes with a documented source. Common misattributions are left out on
// purpose (for example "We are what we repeatedly do" is Will Durant summarising Aristotle, so it is
// credited to Durant). Classical texts use public-domain translations, so wording can differ slightly
// from other translations. Keep entries short; no long passages from copyrighted works.

export type Quote = { text: string; by: string; source?: string };

const Q = (text: string, by: string, source?: string): Quote => ({ text, by, source });

const MA = "Marcus Aurelius";
const MED = "Meditations";
const SEN = "Seneca";
const LET = "Letters to Lucilius";
const EPI = "Epictetus";
const BF = "Benjamin Franklin";
const PR = "Poor Richard's Almanack";
const PS = "Publilius Syrus";
const SAY = "Sentences";
const RWE = "Ralph Waldo Emerson";
const SS = "Samuel Smiles";
const SH = "Self-Help";
const LT = "Lao Tzu";
const TTC = "Tao Te Ching";
const CON = "Confucius";
const AN = "Analects";
const DH = "Dhammapada";

export const QUOTES: Quote[] = [
  // Strength and the iron
  Q("The last three or four reps is what makes the muscle grow.", "Arnold Schwarzenegger", "Pumping Iron"),
  Q(
    "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.",
    "Arnold Schwarzenegger",
    "Pumping Iron",
  ),
  Q("The Iron never lies to you.", "Henry Rollins", "Iron and the Soul"),
  Q("Two hundred pounds is always two hundred pounds.", "Henry Rollins", "Iron and the Soul"),
  Q("Strong people are harder to kill than weak people, and more useful in general.", "Mark Rippetoe", "Starting Strength"),
  Q("Strength does not come from physical capacity. It comes from an indomitable will.", "Mahatma Gandhi", "Young India, 1920"),
  Q("Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.", "Jack LaLanne"),
  Q("Physical fitness is the first requisite of happiness.", "Joseph Pilates", "Return to Life Through Contrology"),
  Q("If you have a body, you are an athlete.", "Bill Bowerman"),
  Q("No man has the right to be an amateur in the matter of physical training.", "Socrates", "Xenophon, Memorabilia"),
  Q(
    "It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.",
    "Socrates",
    "Xenophon, Memorabilia",
  ),
  Q(
    "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.",
    "John F. Kennedy",
    "The Soft American, 1960",
  ),
  Q("Take care of your body. It's the only place you have to live.", "Jim Rohn"),
  Q("Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.", "Dan Gable"),
  Q("Hard work beats talent when talent doesn't work hard.", "Tim Notke"),
  Q("Talent without working hard is nothing.", "Cristiano Ronaldo"),
  Q("There may be people that have more talent than you, but there's no excuse for anyone to work harder than you do.", "Derek Jeter"),
  Q(
    "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success. Greatness will come.",
    "Dwayne Johnson",
  ),
  Q("Everybody has a plan until they get punched in the mouth.", "Mike Tyson"),
  Q(
    "The fight is won or lost far away from witnesses, behind the lines, in the gym, and out there on the road.",
    "Muhammad Ali",
    "The Greatest",
  ),
  Q("Float like a butterfly, sting like a bee.", "Muhammad Ali"),
  Q("I've failed over and over and over again in my life. And that is why I succeed.", "Michael Jordan"),
  Q("Talent wins games, but teamwork and intelligence win championships.", "Michael Jordan"),
  Q("You miss 100% of the shots you don't take.", "Wayne Gretzky"),
  Q(
    "Only the disciplined ones in life are free. If you are undisciplined, you are a slave to your moods and your passions.",
    "Eliud Kipchoge",
  ),
  Q("No human is limited.", "Eliud Kipchoge"),
  Q("To give anything less than your best is to sacrifice the gift.", "Steve Prefontaine"),
  Q("If you want to win something, run 100 metres. If you want to experience something, run a marathon.", "Emil Zátopek"),
  Q("Pressure is a privilege.", "Billie Jean King"),
  Q("Champions keep playing until they get it right.", "Billie Jean King"),
  Q("The moment of victory is much too short to live for that and nothing else.", "Martina Navratilova"),
  Q("I really think a champion is defined not by their wins but by how they can recover when they fall.", "Serena Williams"),
  Q(
    "Luck has nothing to do with it, because I have spent many, many hours, countless hours, on the court working for my one moment in time.",
    "Serena Williams",
  ),
  Q("The team, not the individual, is the ultimate champion.", "Mia Hamm", "Go for the Goal"),
  Q(
    "A winner is someone who recognizes his God-given talents, works his tail off to develop them into skills, and uses these skills to accomplish his goals.",
    "Larry Bird",
  ),
  Q("Hard work has made it easy. That is my secret. That is why I win.", "Nadia Comăneci"),
  Q("It's not the will to win that matters. Everyone has that. It's the will to prepare to win that matters.", 'Paul "Bear" Bryant'),
  Q("Ability is what you're capable of doing. Motivation determines what you do. Attitude determines how well you do it.", "Lou Holtz"),
  Q("Perfection is not attainable, but if we chase perfection we can catch excellence.", "Vince Lombardi"),
  Q("Fatigue makes cowards of us all.", "Vince Lombardi"),
  Q("It's not whether you get knocked down, it's whether you get up.", "Vince Lombardi"),
  Q(
    "The quality of a person's life is in direct proportion to their commitment to excellence, regardless of their chosen field of endeavor.",
    "Vince Lombardi",
  ),
  Q("Don't let what you cannot do interfere with what you can do.", "John Wooden"),
  Q("Be quick, but don't hurry.", "John Wooden"),
  Q("Failure is not fatal, but failure to change might be.", "John Wooden"),
  Q("Make each day your masterpiece.", "John Wooden", "His father's creed"),
  Q("It's the little details that are vital. Little things make big things happen.", "John Wooden"),
  Q("Don't give up. Don't ever give up.", "Jim Valvano", "ESPY Awards, 1993"),
  Q("A life is not important except in the impact it has on other lives.", "Jackie Robinson"),
  Q("It is not the mountain we conquer, but ourselves.", "Sir Edmund Hillary"),
  Q("The harder you practice, the luckier you get.", "Gary Player"),
  Q("Start where you are. Use what you have. Do what you can.", "Arthur Ashe"),
  Q("Discipline equals freedom.", "Jocko Willink"),
  Q("Don't count on motivation. Count on discipline.", "Jocko Willink", "Discipline Equals Freedom"),
  Q(
    "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.",
    "David Goggins",
    "Can't Hurt Me",
  ),
  Q("You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear", "Atomic Habits"),
  Q("Every action you take is a vote for the type of person you wish to become.", "James Clear", "Atomic Habits"),
  Q("Habits are the compound interest of self-improvement.", "James Clear", "Atomic Habits"),
  Q("Enthusiasm is common. Endurance is rare.", "Angela Duckworth", "Grit"),
  Q("Becoming is better than being.", "Carol Dweck", "Mindset"),
  Q("Discipline is the bridge between goals and accomplishment.", "Jim Rohn"),
  Q("Success is nothing more than a few simple disciplines, practiced every day.", "Jim Rohn"),
  Q("Success is the sum of small efforts, repeated day in and day out.", "Robert Collier"),
  Q("Whatever the mind of man can conceive and believe, it can achieve.", "Napoleon Hill", "Think and Grow Rich"),
  Q("We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant", "The Story of Philosophy"),

  // Marcus Aurelius, Meditations (George Long's translation)
  Q("Waste no more time arguing about what a good man should be. Be one.", MA, MED),
  Q("The impediment to action advances action. What stands in the way becomes the way.", MA, MED),
  Q("If it is not right, do not do it; if it is not true, do not say it.", MA, MED),
  Q("Do every act of thy life as if it were the last.", MA, MED),
  Q("Confine thyself to the present.", MA, MED),
  Q("Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.", MA, MED),
  Q("How much more grievous are the consequences of anger than the causes of it.", MA, MED),
  Q("Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", MA, MED),
  Q("Loss is nothing else but change.", MA, MED),
  Q("Never value anything as profitable to thyself which shall compel thee to break thy promise, to lose thy self-respect.", MA, MED),
  Q("Do not think that what is hard for thee to master is impossible for man.", MA, MED),
  Q("In the morning when thou risest unwillingly, let this thought be present: I am rising to the work of a human being.", MA, MED),
  Q("The art of life is more like the wrestler's art than the dancer's.", MA, MED),
  Q("Let it make no difference to thee whether thou art cold or warm, if thou art doing thy duty.", MA, MED),
  Q("Nothing happens to any man which he is not formed by nature to bear.", MA, MED),
  Q(
    "Remember that to change thy opinion and to follow him who corrects thy error is as consistent with freedom as it is to persist in thy error.",
    MA,
    MED,
  ),
  Q("Very little is needed to make a happy life.", MA, MED),
  Q("Be like the promontory against which the waves continually break, but it stands firm.", MA, MED),
  Q("Time is a sort of river of passing events, and strong is its current.", MA, MED),
  Q("Accustom thyself to attend carefully to what is said by another.", MA, MED),

  // Seneca, Letters to Lucilius and essays (Gummere and Basore translations)
  Q("While we are postponing, life speeds by.", SEN, LET),
  Q("It is not that we have a short space of time, but that we waste much of it.", SEN, "On the Shortness of Life"),
  Q("We suffer more from imagination than from reality.", SEN, LET),
  Q("No man was ever wise by chance.", SEN, LET),
  Q("When a man does not know what harbour he is making for, no wind is the right wind.", SEN, LET),
  Q("Begin at once to live, and count each separate day as a separate life.", SEN, LET),
  Q("Associate with those who will make a better man of you.", SEN, LET),
  Q("Fire tests gold, misfortune brave men.", SEN, "On Providence"),
  Q("Hold every hour in your grasp. Lay hold of today's task, and you will not need to depend so much upon tomorrow's.", SEN, LET),
  Q("Keep on learning as long as you are ignorant, even to the end of your life.", SEN, LET),
  Q("It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.", SEN, LET),
  Q("The body should be treated more rigorously, that it may not be disobedient to the mind.", SEN, LET),
  Q("Whatever can happen at any time can happen today.", SEN, "On Tranquillity of Mind"),
  Q(
    "Each day acquire something which will fortify you against poverty, against death, indeed against other misfortunes as well.",
    SEN,
    LET,
  ),
  Q("A great pilot can sail even when his canvas is rent.", SEN, LET),
  Q("Everywhere means nowhere.", SEN, LET),
  Q("Nothing is so bitter that a calm mind cannot find comfort for it.", SEN, "On Tranquillity of Mind"),
  Q("The part of life we really live is small.", SEN, "On the Shortness of Life"),
  Q("You must linger among a limited number of master-thinkers, and digest their works.", SEN, LET),
  Q("Toil summons the best men.", SEN, "On Providence"),
  Q("A man who suffers before it is necessary suffers more than is necessary.", SEN, LET),
  Q("Withdraw into yourself, as far as you can.", SEN, LET),
  Q("Disaster is virtue's opportunity.", SEN, "On Providence"),

  // Epictetus
  Q("First say to yourself what you would be; and then do what you have to do.", EPI, "Discourses"),
  Q("It is impossible for a man to learn what he thinks he already knows.", EPI, "Discourses"),
  Q("Men are disturbed not by the things which happen, but by the opinions about the things.", EPI, "Enchiridion"),
  Q("No great thing is created suddenly, any more than a bunch of grapes or a fig.", EPI, "Discourses"),
  Q("If you would be a good reader, read; if a writer, write.", EPI, "Discourses"),
  Q(
    "Every habit and faculty is maintained and increased by the corresponding actions: walking by walking, running by running.",
    EPI,
    "Discourses",
  ),
  Q("No man is free who is not master of himself.", EPI, "Fragments"),
  Q("Difficulties are things that show what men are.", EPI, "Discourses"),
  Q("If you wish to be improved, be content to appear foolish and stupid with respect to externals.", EPI, "Enchiridion"),
  Q("How long are you going to wait before you demand the best for yourself?", EPI, "Enchiridion"),
  Q("Practise yourself, for heaven's sake, in little things; and thence proceed to greater.", EPI, "Discourses"),
  Q("Who then is invincible? He whom nothing disturbs that is independent of his will.", EPI, "Discourses"),
  Q("Let silence be the general rule, or let only what is necessary be said.", EPI, "Enchiridion"),

  // Other classical voices
  Q("For the things we have to learn before we can do them, we learn by doing them.", "Aristotle", "Nicomachean Ethics"),
  Q("One swallow does not make a summer, nor does one day.", "Aristotle", "Nicomachean Ethics"),
  Q("Well begun is half done.", "Aristotle", "Politics"),
  Q("We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.", "Aristotle", "Nicomachean Ethics"),
  Q("The first and best victory is to conquer self.", "Plato", "Laws"),
  Q("He who has begun has half done. Dare to be wise; begin!", "Horace", "Epistles"),
  Q("Dripping water hollows out stone.", "Ovid", "Epistulae ex Ponto"),
  Q("They can because they think they can.", "Virgil", "Aeneid"),
  Q("Character is destiny.", "Heraclitus"),
  Q("The journey of a thousand miles begins with a single step.", LT, TTC),
  Q("He who conquers others is strong; he who conquers himself is mighty.", LT, TTC),
  Q("Knowing others is intelligence; knowing yourself is true wisdom.", LT, TTC),
  Q("A tree as big as a man's embrace grows from a tiny shoot.", LT, TTC),
  Q("Do the difficult things while they are easy and do the great things while they are small.", LT, TTC),
  Q("He who is contented is rich.", LT, TTC),
  Q("To see what is right and not to do it is want of courage.", CON, AN),
  Q(
    "When you know a thing, to hold that you know it; and when you do not know a thing, to allow that you do not know it: this is knowledge.",
    CON,
    AN,
  ),
  Q("The superior man is modest in his speech, but exceeds in his actions.", CON, AN),
  Q("Learning without thought is labour lost; thought without learning is perilous.", CON, AN),
  Q("When we see men of worth, we should think of equalling them.", CON, AN),
  Q("Is virtue a thing remote? I wish to be virtuous, and lo! virtue is at hand.", CON, AN),
  Q("Health is the greatest gift, contentment the greatest wealth.", "The Buddha", DH),
  Q(
    "Though one may conquer a thousand times a thousand men in battle, he indeed is the noblest victor who conquers himself.",
    "The Buddha",
    DH,
  ),
  Q("Drop by drop is the water pot filled.", "The Buddha", DH),
  Q("Rouse yourself! Do not be idle.", "The Buddha", DH),
  Q("Fall seven times, stand up eight.", "Japanese proverb"),
  Q("Slow and steady wins the race.", "Aesop", "The Tortoise and the Hare"),
  Q("Little by little does the trick.", "Aesop", "The Crow and the Pitcher"),
  Q("Self-help is the best help.", "Aesop", "Hercules and the Waggoner"),

  // Publilius Syrus, Sentences (1st century BC maxims)
  Q("Practice is the best of all instructors.", PS, SAY),
  Q("Anyone can hold the helm when the sea is calm.", PS, SAY),
  Q("It is a bad plan that admits of no modification.", PS, SAY),
  Q("We should provide in peace what we need in war.", PS, SAY),
  Q("No one knows what he can do till he tries.", PS, SAY),
  Q("A rolling stone gathers no moss.", PS, SAY),
  Q("The bow too tensely strung is easily broken.", PS, SAY),
  Q("Rule your mind or it will rule you.", "Horace", "Epistles"),
  Q("Even a single hair casts its shadow.", PS, SAY),
  Q("Many receive advice, few profit by it.", PS, SAY),
  Q("Never promise more than you can perform.", PS, SAY),
  Q("What is left when honour is lost?", PS, SAY),
  Q("While we stop to think, we often miss our opportunity.", PS, SAY),

  // Benjamin Franklin
  Q("Well done is better than well said.", BF, PR),
  Q("Lost time is never found again.", BF, PR),
  Q("Early to bed and early to rise makes a man healthy, wealthy, and wise.", BF, PR),
  Q("Diligence is the mother of good luck.", BF, PR),
  Q("Have you somewhat to do tomorrow? Do it today.", BF, PR),
  Q("Little strokes fell great oaks.", BF, PR),
  Q("There are no gains without pains.", BF, "The Way to Wealth"),
  Q("Dost thou love life? Then do not squander time, for that's the stuff life is made of.", BF, PR),
  Q("Eat to live, and not live to eat.", BF, PR),
  Q("One today is worth two tomorrows.", BF, "The Way to Wealth"),
  Q("He that can have patience can have what he will.", BF, PR),
  Q("Industry need not wish.", BF, "The Way to Wealth"),
  Q("Plough deep while sluggards sleep.", BF, "The Way to Wealth"),
  Q("Sloth, like rust, consumes faster than labour wears.", BF, "The Way to Wealth"),
  Q("The used key is always bright.", BF, "The Way to Wealth"),
  Q("He that riseth late must trot all day.", BF, "The Way to Wealth"),
  Q("Laziness travels so slowly that poverty soon overtakes him.", BF, "The Way to Wealth"),
  Q("Hide not your talents; they for use were made.", BF, PR),
  Q("A man in a passion rides a mad horse.", BF, PR),
  Q("He that lives upon hope will die fasting.", BF, "The Way to Wealth"),
  Q("Search others for their virtues, thyself for thy vices.", BF, PR),
  Q("To lengthen thy life, lessen thy meals.", BF, PR),
  Q("Resolve to perform what you ought; perform without fail what you resolve.", BF, "Autobiography"),

  // Emerson, Thoreau and the essayists
  Q("The first wealth is health.", RWE, "The Conduct of Life"),
  Q("Nothing great was ever achieved without enthusiasm.", RWE, "Circles"),
  Q("Do the thing, and you shall have the power.", RWE, "Compensation"),
  Q("Every artist was first an amateur.", RWE, "Progress of Culture"),
  Q("Trust thyself: every heart vibrates to that iron string.", RWE, "Self-Reliance"),
  Q("Our strength grows out of our weakness.", RWE, "Compensation"),
  Q("The reward of a thing well done is to have done it.", RWE, "New England Reformers"),
  Q("Write it on your heart that every day is the best day in the year.", RWE),
  Q(
    "If one advances confidently in the direction of his dreams, he will meet with a success unexpected in common hours.",
    "Henry David Thoreau",
    "Walden",
  ),
  Q("Methinks that the moment my legs begin to move, my thoughts begin to flow.", "Henry David Thoreau", "Journal, 1851"),
  Q(
    "It is not enough to be industrious; so are the ants. What are you industrious about?",
    "Henry David Thoreau",
    "Letter to H. G. O. Blake, 1857",
  ),
  Q("Above all, do not lose your desire to walk.", "Søren Kierkegaard", "Letter, 1847"),
  Q("Walking is the best possible exercise.", "Thomas Jefferson", "Letter to Peter Carr, 1785"),
  Q("Health must not be sacrificed to learning.", "Thomas Jefferson", "Letter to Peter Carr, 1785"),
  Q(
    "Knowing is not enough; we must apply. Willing is not enough; we must do.",
    "Johann Wolfgang von Goethe",
    "Wilhelm Meister's Journeyman Years",
  ),
  Q("Talent is formed in stillness, character in the world's torrent.", "Johann Wolfgang von Goethe", "Torquato Tasso"),
  Q(
    "Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.",
    "William Shakespeare",
    "Measure for Measure",
  ),
  Q("Things won are done; joy's soul lies in the doing.", "William Shakespeare", "Troilus and Cressida"),
  Q("Our bodies are our gardens, to the which our wills are gardeners.", "William Shakespeare", "Othello"),
  Q("Every noble work is at first impossible.", "Thomas Carlyle", "Past and Present"),
  Q("Great works are performed not by strength but by perseverance.", "Samuel Johnson", "Rasselas"),
  Q("The two most powerful warriors are patience and time.", "Leo Tolstoy", "War and Peace"),
  Q(
    "Iron rusts from disuse; stagnant water loses its purity; even so does inaction sap the vigour of the mind.",
    "Leonardo da Vinci",
    "Notebooks",
  ),
  Q("Life is like riding a bicycle. To keep your balance you must keep moving.", "Albert Einstein", "Letter to his son Eduard, 1930"),
  Q("Genius is one per cent inspiration, ninety-nine per cent perspiration.", "Thomas Edison"),
  Q("If I have seen further it is by standing on the shoulders of giants.", "Isaac Newton", "Letter to Robert Hooke, 1675"),
  Q("Nothing in life is to be feared, it is only to be understood.", "Marie Curie"),
  Q("We must have perseverance and above all confidence in ourselves.", "Marie Curie"),
  Q("I attribute my success to this: I never gave or took any excuse.", "Florence Nightingale"),
  Q("What does not kill me makes me stronger.", "Friedrich Nietzsche", "Twilight of the Idols"),
  Q("He who has a why to live can bear almost any how.", "Friedrich Nietzsche", "Twilight of the Idols"),
  Q(
    "When we are no longer able to change a situation, we are challenged to change ourselves.",
    "Viktor Frankl",
    "Man's Search for Meaning",
  ),
  Q("In the depth of winter, I finally learned that within me there lay an invincible summer.", "Albert Camus", "Return to Tipasa"),
  Q("The world breaks every one and afterward many are strong at the broken places.", "Ernest Hemingway", "A Farewell to Arms"),
  Q("Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.", "Samuel Beckett", "Worstward Ho"),
  Q(
    "Practice means to perform, over and over again in the face of all obstacles, some act of vision, of faith, of desire.",
    "Martha Graham",
    "An Athlete of God",
  ),

  // Leaders and reformers
  Q("The credit belongs to the man who is actually in the arena.", "Theodore Roosevelt", "Citizenship in a Republic, 1910"),
  Q(
    "Far and away the best prize that life offers is the chance to work hard at work worth doing.",
    "Theodore Roosevelt",
    "Labor Day address, 1903",
  ),
  Q("Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", "Theodore Roosevelt", "Address, 1903"),
  Q("Do what you can, with what you have, where you are.", "Theodore Roosevelt", "An Autobiography, quoting Bill Widener"),
  Q(
    "I wish to preach not the doctrine of ignoble ease, but the doctrine of the strenuous life.",
    "Theodore Roosevelt",
    "The Strenuous Life, 1899",
  ),
  Q("Never give in, never give in, never, never, never.", "Winston Churchill", "Harrow School, 1941"),
  Q("To improve is to change; to be perfect is to change often.", "Winston Churchill", "House of Commons, 1925"),
  Q("If there is no struggle, there is no progress.", "Frederick Douglass", "West India Emancipation speech, 1857"),
  Q(
    "Success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome.",
    "Booker T. Washington",
    "Up from Slavery",
  ),
  Q(
    "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.",
    "Martin Luther King Jr.",
    "Spelman College, 1967",
  ),
  Q("You must do the thing you think you cannot do.", "Eleanor Roosevelt", "You Learn by Living"),
  Q("Optimism is the faith that leads to achievement.", "Helen Keller", "Optimism"),
  Q("Life is either a daring adventure or nothing.", "Helen Keller", "Let Us Have Faith"),
  Q("Stay hungry. Stay foolish.", "Steve Jobs", "Stanford commencement, 2005, quoting the Whole Earth Catalog"),

  // Samuel Smiles, Self-Help (1859)
  Q("The spirit of self-help is the root of all genuine growth in the individual.", SS, SH),
  Q("Hope is like the sun, which, as we journey towards it, casts the shadow of our burden behind us.", SS),
  Q("We learn wisdom from failure much more than from success.", SS, SH),
  Q("He who never made a mistake never made a discovery.", SS, SH),
  Q("The battle of life is, in most cases, fought uphill.", SS, SH),
  Q("It is not ease, but effort; not facility, but difficulty, that makes men.", SS, SH),
  Q("Practical industry, wisely and vigorously applied, always produces its due effects.", SS, SH),
  Q(
    "The most important results in daily life are to be obtained through common qualities, such as common sense, attention, application, and perseverance.",
    SS,
    SH,
  ),
  Q("Energy accomplishes more than genius.", SS, SH),
  Q("Men must necessarily be the active agents of their own well-being.", SS, SH),
  Q("A place for everything, and everything in its place.", SS, "Thrift"),
];

// A second set, grouped by theme. Same rules: documented source, public-domain translation for the classics.
QUOTES.push(
  // Patience and persistence
  Q("Perseverance is not a long race; it is many short races one after the other.", "Walter Elliot", "The Spiritual Life"),
  Q("Our greatest glory is not in never falling, but in rising every time we fall.", "Oliver Goldsmith", "The Citizen of the World"),
  Q("Genius is nothing but a great aptitude for patience.", "Georges-Louis Leclerc, Comte de Buffon"),
  Q("Adversity is the first path to truth.", "Lord Byron", "Don Juan"),
  Q("By perseverance the snail reached the ark.", "Charles Spurgeon", "Salt-Cellars"),
  Q("Great things are done by a series of small things brought together.", "Vincent van Gogh", "Letter to Theo, 1882"),
  Q("I am always doing what I cannot do yet, in order to learn how to do it.", "Vincent van Gogh", "Letter to Anthon van Rappard, 1885"),
  Q(
    "If you hear a voice within you say you cannot paint, then by all means paint, and that voice will be silenced.",
    "Vincent van Gogh",
    "Letter to Theo, 1883",
  ),
  Q("What would life be if we had no courage to attempt anything?", "Vincent van Gogh", "Letter to Theo, 1881"),
  Q("I learned that courage was not the absence of fear, but the triumph over it.", "Nelson Mandela", "Long Walk to Freedom"),
  Q("After climbing a great hill, one only finds that there are many more hills to climb.", "Nelson Mandela", "Long Walk to Freedom"),
  Q("Courage is resistance to fear, mastery of fear, not absence of fear.", "Mark Twain", "Pudd'nhead Wilson"),
  Q(
    "Habit is habit, and not to be flung out of the window by any man, but coaxed downstairs a step at a time.",
    "Mark Twain",
    "Pudd'nhead Wilson",
  ),
  Q("The best way out is always through.", "Robert Frost", "A Servant to Servants"),
  Q("In three words I can sum up everything I've learned about life: it goes on.", "Robert Frost"),
  Q("Do not go gentle into that good night.", "Dylan Thomas"),
  Q("To strive, to seek, to find, and not to yield.", "Alfred, Lord Tennyson", "Ulysses"),
  Q("Though much is taken, much abides.", "Alfred, Lord Tennyson", "Ulysses"),
  Q("I am the master of my fate, I am the captain of my soul.", "William Ernest Henley", "Invictus"),
  Q("My head is bloody, but unbowed.", "William Ernest Henley", "Invictus"),
  Q("Ah, but a man's reach should exceed his grasp.", "Robert Browning", "Andrea del Sarto"),
  Q("Hope is the thing with feathers that perches in the soul.", "Emily Dickinson"),
  Q("If you can keep your head when all about you are losing theirs.", "Rudyard Kipling", "If—"),
  Q("If you can fill the unforgiving minute with sixty seconds' worth of distance run.", "Rudyard Kipling", "If—"),
  Q("Let us, then, be up and doing, with a heart for any fate.", "Henry Wadsworth Longfellow", "A Psalm of Life"),
  Q(
    "The heights by great men reached and kept were not attained by sudden flight, but they, while their companions slept, were toiling upward in the night.",
    "Henry Wadsworth Longfellow",
    "The Ladder of St. Augustine",
  ),
  Q("Lives of great men all remind us we can make our lives sublime.", "Henry Wadsworth Longfellow", "A Psalm of Life"),
  Q("Learn to labour and to wait.", "Henry Wadsworth Longfellow", "A Psalm of Life"),
  Q("Not in the clamour of the crowded street, but in ourselves, are triumph and defeat.", "Henry Wadsworth Longfellow", "The Poets"),
  Q("Great is the art of beginning, but greater is the art of ending.", "Henry Wadsworth Longfellow"),

  // Health, rest and the body
  Q("Rest is not idleness.", "John Lubbock", "The Use of Life"),
  Q("Sleep is that golden chain that ties health and our bodies together.", "Thomas Dekker", "The Gull's Hornbook"),
  Q(
    "Those who think they have no time for bodily exercise will sooner or later have to find time for illness.",
    "Edward Stanley, Earl of Derby",
    "Address, 1873",
  ),
  Q("A sound mind in a sound body.", "Juvenal", "Satires"),
  Q("He who has health has hope; and he who has hope has everything.", "Arabian proverb"),
  Q("The body is a sacred garment.", "Martha Graham", "Blood Memory"),
  Q("Take rest; a field that has rested gives a bountiful crop.", "Ovid", "Ars Amatoria"),
  Q("A good laugh and a long sleep are the best cures in the doctor's book.", "Irish proverb"),
  Q("An ounce of prevention is worth a pound of cure.", BF, "Letter to the Pennsylvania Gazette, 1735"),
  Q("He who takes medicine and neglects to diet wastes the skill of his doctors.", "Chinese proverb"),
  Q("The cure for anything is salt water: sweat, tears or the sea.", "Isak Dinesen", "Seven Gothic Tales"),

  // Beginning and doing
  Q("The beginning is the most important part of the work.", "Plato", "The Republic"),
  Q("Action is the antidote to despair.", "Joan Baez"),
  Q("Do one thing every day that scares you.", "Mary Schmich", "Chicago Tribune, 1997"),
  Q("The best time to plant a tree was twenty years ago. The second best time is now.", "Chinese proverb"),
  Q("A year from now you may wish you had started today.", "Karen Lamb"),
  Q(
    "Most of the important things in the world have been accomplished by people who have kept on trying when there seemed to be no hope at all.",
    "Dale Carnegie",
  ),
  Q("You can't cross the sea merely by standing and staring at the water.", "Rabindranath Tagore", "Stray Birds"),
  Q("Don't watch the clock; do what it does. Keep going.", "Sam Levenson"),
  Q("The secret of your future is hidden in your daily routine.", "Mike Murdock"),
  Q("Motivation is what gets you started. Habit is what keeps you going.", "Jim Ryun"),
  Q("We are what we pretend to be, so we must be careful about what we pretend to be.", "Kurt Vonnegut", "Mother Night"),
  Q("Do not let what you cannot do interfere with what you can do.", "John Wooden"),
  Q("Do what you can't.", "Casey Neistat"),
  Q("Effort only fully releases its reward after a person refuses to quit.", "Napoleon Hill"),

  // Champions on preparation and work
  Q("I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", "Muhammad Ali"),
  Q(
    "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up. Figure out how to climb it, go through it, or work around it.",
    "Michael Jordan",
  ),
  Q("Everything negative, pressure, challenges, is all an opportunity for me to rise.", "Kobe Bryant"),
  Q("Rest at the end, not in the middle.", "Kobe Bryant"),
  Q("You can't put a limit on anything. The more you dream, the farther you get.", "Michael Phelps"),
  Q(
    "I start early and I stay late, day after day, year after year. It took me 17 years and 114 days to become an overnight success.",
    "Lionel Messi",
  ),
  Q(
    "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
    "Pelé",
  ),
  Q("The more difficult the victory, the greater the happiness in winning.", "Pelé"),
  Q(
    "We all have dreams. But in order to make dreams come into reality, it takes an awful lot of determination, dedication, self-discipline, and effort.",
    "Jesse Owens",
  ),
  Q("The battles that count aren't the ones for gold medals. The struggles within yourself are where it's at.", "Jesse Owens"),
  Q("Never underestimate the power of dreams and the influence of the human spirit.", "Wilma Rudolph"),
  Q("The thrill isn't in the winning, it's in the doing.", "Jackie Joyner-Kersee"),
  Q("The man who can drive himself further once the effort gets painful is the man who will win.", "Roger Bannister"),
  Q("Discipline is doing what you hate to do, but doing it like you love it.", "Mike Tyson"),
  Q("When you want to succeed as bad as you want to breathe, then you'll be successful.", "Eric Thomas"),
  Q("It's not about how bad you want it. It's about how hard you're willing to work for it.", "Eric Thomas"),
  Q("Anything in life is possible if you make it happen.", "Jack LaLanne"),
  Q("A champion is someone who gets up when he can't.", "Jack Dempsey"),
  Q("Run when you can, walk if you have to, crawl if you must; just never give up.", "Dean Karnazes"),
  Q("Somewhere in the world someone is training when you are not. When you race him, he will win.", "Tom Fleming"),
  Q("It never gets easier, you just go faster.", "Greg LeMond"),
  Q("Ask yourself: Can I give more? The answer is usually yes.", "Paul Tergat"),
  Q("Show me a guy who's afraid to look bad, and I'll show you a guy you can beat every time.", "Lou Brock"),
  Q("The difference between the impossible and the possible lies in a person's determination.", "Tommy Lasorda"),
  Q("Excellence is the gradual result of always striving to do better.", "Pat Riley"),
  Q("You were born to be a player. You were meant to be here. This moment is yours.", "Herb Brooks", "1980 Olympics"),
  Q("Great moments are born from great opportunity.", "Herb Brooks", "1980 Olympics"),
  Q(
    "The principle is competing against yourself. It's about self-improvement, about being better than you were the day before.",
    "Steve Young",
  ),
  Q("Persistence can change failure into extraordinary achievement.", "Matt Biondi"),
  Q("A quitter never wins, and a winner never quits.", "Napoleon Hill", "Think and Grow Rich"),
  Q("The price of success is hard work, dedication to the job at hand.", "Vince Lombardi"),
  Q("Practice does not make perfect. Only perfect practice makes perfect.", "Vince Lombardi"),
  Q("Once you learn to quit, it becomes a habit.", "Vince Lombardi"),
  Q("Adversity causes some men to break; others to break records.", "William Arthur Ward"),
  Q("Do not let making a living prevent you from making a life.", "John Wooden"),
  Q("Ability may get you to the top, but it takes character to keep you there.", "John Wooden"),
  Q("Things turn out best for the people who make the best of the way things turn out.", "John Wooden"),
  Q("If you don't have time to do it right, when will you have time to do it over?", "John Wooden"),
  Q("Never mistake activity for achievement.", "John Wooden"),
  Q("Don't measure yourself by what you have accomplished, but by what you should have accomplished with your ability.", "John Wooden"),
  Q("The road to success is always under construction.", "Lily Tomlin"),
  Q("I've learned that something constructive comes from every defeat.", "Tom Landry"),
  Q("Leadership is getting someone to do what they don't want to do, to achieve what they want to achieve.", "Tom Landry"),
  Q("A trophy carries dust. Memories last forever.", "Mary Lou Retton"),
  Q("Gold medals are made out of your sweat, blood and tears and effort in the gym every day.", "Gabby Douglas"),
  Q("Hard days are the best because that's when champions are made.", "Gabby Douglas"),
  Q("I'm not the next Usain Bolt or Michael Phelps. I'm the first Simone Biles.", "Simone Biles"),
  Q("Dreams don't work unless you do.", "John C. Maxwell"),
  Q("Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", "John C. Maxwell"),
  Q("You'll never change your life until you change something you do daily.", "John C. Maxwell"),

  // Mind, attitude and courage
  Q("Nothing is particularly hard if you divide it into small jobs.", "Henry Ford"),
  Q("Keep your eyes on the stars, and your feet on the ground.", "Theodore Roosevelt"),
  Q("The only man who never makes a mistake is the man who never does anything.", "Theodore Roosevelt", "Letter, 1900"),
  Q("Act as if what you do makes a difference. It does.", "William James"),
  Q("Act as if it were impossible to fail.", "Dorothea Brande", "Wake Up and Live!"),
  Q("The harder the conflict, the more glorious the triumph.", "Thomas Paine", "The American Crisis"),
  Q("What we obtain too cheap, we esteem too lightly.", "Thomas Paine", "The American Crisis"),
  Q("Determine never to be idle.", "Thomas Jefferson", "Letter to his daughter Martha, 1787"),
  Q("Courage is grace under pressure.", "Ernest Hemingway"),
  Q("You may encounter many defeats, but you must not be defeated.", "Maya Angelou"),
  Q("Do the best you can until you know better. Then when you know better, do better.", "Maya Angelou"),
  Q("Success is liking yourself, liking what you do, and liking how you do it.", "Maya Angelou"),
  Q("The most difficult thing is the decision to act; the rest is merely tenacity.", "Amelia Earhart"),
  Q("Alone we can do so little; together we can do so much.", "Helen Keller"),
  Q("Character cannot be developed in ease and quiet.", "Helen Keller", "Helen Keller's Journal"),
  Q("Although the world is full of suffering, it is also full of the overcoming of it.", "Helen Keller", "Optimism"),
  Q("Knowledge is power.", "Francis Bacon", "Meditationes Sacrae"),
  Q("He that will not apply new remedies must expect new evils.", "Francis Bacon", "Of Innovations"),
  Q("Victorious warriors win first and then go to war.", "Sun Tzu", "The Art of War"),
  Q("Absorb what is useful, discard what is useless, and add what is specifically your own.", "Bruce Lee", "Tao of Jeet Kune Do"),
  Q(
    "If you always put limits on everything you do, physical or anything else, it will spread into your work and into your life.",
    "Bruce Lee",
  ),
  Q(
    "For me life is continuously being hungry. The meaning of life is not simply to exist, to survive, but to move ahead, to go up, to conquer.",
    "Arnold Schwarzenegger",
  ),
  Q("Light weight, baby!", "Ronnie Coleman"),
  Q("A river cuts through rock not because of its power, but because of its persistence.", "Jim Watkins"),
  Q("Strength and growth come only through continuous effort and struggle.", "Napoleon Hill"),
  Q("Patience, persistence and perspiration make an unbeatable combination for success.", "Napoleon Hill"),
  Q("The starting point of all achievement is desire.", "Napoleon Hill", "Think and Grow Rich"),
  Q("Every adversity carries with it the seed of an equal or greater benefit.", "Napoleon Hill", "Think and Grow Rich"),
);

/** Days since 1 January 1970 in the device's own time zone, so the quote changes at local midnight. */
export function localDay(now: number): number {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/**
 * Today's quote. A fixed shuffle (seeded, so every device agrees) walks the whole list before any quote
 * comes round again, so neighbouring days don't get quotes from the same author.
 */
export function quoteOfDay(now: number, list: Quote[] = QUOTES): Quote {
  return list[quoteIndexOfDay(now, list.length)];
}

/** Where today's quote sits in a list of n quotes. Its text in the app's language is `quote.<index>`. */
export function quoteIndexOfDay(now: number, n: number = QUOTES.length): number {
  const order = shuffled(n);
  const day = localDay(now);
  return order[((day % n) + n) % n];
}

let cache: { n: number; order: number[] } | null = null;
function shuffled(n: number): number[] {
  if (cache?.n === n) return cache.order;
  const order = Array.from({ length: n }, (_, i) => i);
  let seed = 0x9e3779b9;
  const rand = () => {
    // mulberry32: small, fast and the same on every device.
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  cache = { n, order };
  return order;
}
