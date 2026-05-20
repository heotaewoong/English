export interface OPIcTopic {
  id: string;
  category: string;
  title: string;
  titleKo: string;
  questions: string[];
  sampleAnswers: {
    IM: string;
    IH: string;
    AL: string;
  };
  tips: string[];
}

export interface OPIcExpression {
  purpose: string;
  purposeKo: string;
  phrases: { english: string; korean: string }[];
}

export const opicTopics: OPIcTopic[] = [
  // ─── Self-Introduction ───
  {
    id: 'topic-1',
    category: 'Self-Introduction',
    title: 'Tell Me About Yourself',
    titleKo: '자기소개',
    questions: [
      'Tell me a little bit about yourself.',
      'What do you do for a living?',
      'Describe your personality. What kind of person are you?',
      'What are some of your strengths and weaknesses?',
    ],
    sampleAnswers: {
      IM: "Hi, my name is Minjun. I'm 28 years old and I live in Seoul. I work as a software developer. In my free time, I like watching movies and playing games. I think I'm a friendly person.",
      IH: "Let me tell you a bit about myself. I'm Minjun, a 28-year-old software developer based in Seoul. I've been in the tech industry for about 5 years now, and I really enjoy solving complex problems. Outside of work, I'm passionate about movies and gaming. I'd describe myself as someone who's curious and always eager to learn new things.",
      AL: "I'd be happy to introduce myself. I'm Minjun, and I've been working as a software developer in Seoul for the past five years, primarily focusing on web applications. What drew me to this field was the creative problem-solving aspect — there's something incredibly satisfying about building solutions from scratch. Beyond my professional life, I'm an avid film enthusiast and gamer. I believe these hobbies actually complement my work because they fuel my creativity. As for my personality, I tend to be analytical yet open-minded, which helps me approach challenges from multiple perspectives.",
    },
    tips: [
      'Start with basic info, then add personal details',
      'Connect your hobbies to your personality',
      'Use transitional phrases like "In addition" or "As for..."',
      'Avoid memorized scripts — sound natural',
    ],
  },
  // ─── Hobbies: Movies ───
  {
    id: 'topic-2',
    category: 'Hobbies',
    title: 'Movies & TV Shows',
    titleKo: '영화 & TV 프로그램',
    questions: [
      'What kinds of movies do you like to watch?',
      'Tell me about a movie you saw recently. What was it about?',
      'How has your taste in movies changed over the years?',
      'Describe your favorite movie theater or how you usually watch movies.',
    ],
    sampleAnswers: {
      IM: "I like watching action movies and comedies. Last week, I watched a new Marvel movie. It was very exciting. I usually watch movies at home on Netflix. Sometimes I go to the theater with my friends.",
      IH: "I'm a big fan of sci-fi and thriller movies. Recently, I watched Interstellar again, and it still amazes me every time. The story about space exploration and the relationship between a father and daughter is really touching. I usually watch movies on streaming platforms like Netflix, but for blockbusters, I prefer going to the theater for the full experience.",
      AL: "I've always been drawn to films that challenge conventional storytelling — particularly sci-fi and psychological thrillers. Recently, I rewatched Interstellar, which I consider a masterpiece in terms of how it weaves complex scientific concepts with deeply emotional human stories. What fascinates me about Christopher Nolan's work is his ability to make you think and feel simultaneously. My taste has evolved significantly over the years. In my teens, I was all about action and comedy, but as I've matured, I've developed an appreciation for independent films and foreign cinema that offer unique perspectives on the human condition.",
    },
    tips: [
      'Name specific movies and genres',
      'Explain WHY you like certain types',
      'Use past tense for describing movie plots',
      'Add personal reactions and emotions',
    ],
  },
  // ─── Hobbies: Music ───
  {
    id: 'topic-3',
    category: 'Hobbies',
    title: 'Music',
    titleKo: '음악',
    questions: [
      'What kind of music do you enjoy listening to?',
      'Have you been to any concerts recently? Tell me about the experience.',
      'Do you play any musical instruments? Tell me about it.',
      'How do you usually listen to music in your daily life?',
    ],
    sampleAnswers: {
      IM: "I like listening to K-pop and pop music. I listen to music on Spotify every day. I usually listen to music when I take the subway. My favorite singer is IU.",
      IH: "I have a pretty diverse taste in music. I mainly listen to indie rock and R&B, but I also enjoy jazz when I want to relax. I use Spotify and Apple Music throughout the day — during my commute, while working, and before bed. Last month, I went to a Coldplay concert, and it was an incredible experience.",
      AL: "Music is genuinely one of the most important parts of my daily routine. My taste ranges from indie rock and alternative to jazz and classical, depending on my mood and what I'm doing. I find that music significantly affects my productivity — I tend to listen to lo-fi beats or ambient electronic music when I'm coding, and switch to something more energetic like rock when I'm exercising. The most memorable concert I attended was Coldplay's world tour last year. The combination of their live performance, the LED wristbands lighting up the entire stadium, and the collective energy of thousands of fans created an almost transcendent experience.",
    },
    tips: [
      'Mention specific artists, genres, and songs',
      'Describe when and where you listen to music',
      'Use sensory language for concert experiences',
      'Connect music to your emotions and activities',
    ],
  },
  // ─── Hobbies: Sports ───
  {
    id: 'topic-4',
    category: 'Hobbies',
    title: 'Sports & Exercise',
    titleKo: '스포츠 & 운동',
    questions: [
      'Do you exercise regularly? What do you do?',
      'Tell me about a sport you enjoy watching or playing.',
      'Describe your exercise routine.',
      'Have you ever had an injury while exercising? What happened?',
    ],
    sampleAnswers: {
      IM: "I go to the gym three times a week. I do weight training and running. I also like watching soccer. My favorite team is Tottenham. I exercise to stay healthy.",
      IH: "I try to maintain a consistent workout routine. I go to the gym about four times a week, focusing on a mix of strength training and cardio. On weekdays, I usually go in the morning before work because it gives me energy for the rest of the day. I'm also really into watching soccer — I never miss a Premier League match. Being a Tottenham fan can be stressful sometimes, but that's what makes it exciting.",
      AL: "Fitness has become a cornerstone of my lifestyle over the past few years. I follow a structured program that combines weightlifting four days a week with running and yoga on alternate days. What I've found particularly beneficial is the mental clarity that comes from regular exercise — it's not just about physical health for me, it's essentially a form of meditation. As for spectator sports, I'm a devoted Premier League follower and a long-suffering Tottenham fan. There's something about the tactical complexity and the raw emotion of football that keeps me completely captivated, even when the results don't go our way.",
    },
    tips: [
      'Be specific about your routine (days, times, activities)',
      'Express your feelings about exercise',
      'Use action verbs and sports terminology',
      'Tell a story if asked about experiences',
    ],
  },
  // ─── Hobbies: Cooking ───
  {
    id: 'topic-5',
    category: 'Hobbies',
    title: 'Cooking',
    titleKo: '요리',
    questions: [
      'Do you enjoy cooking? What do you usually cook?',
      'Tell me about a dish you recently made. How did you make it?',
      'Who taught you how to cook?',
      'What is the most challenging dish you have ever attempted?',
    ],
    sampleAnswers: {
      IM: "I like cooking simple meals. I usually make pasta and fried rice. I learned cooking from YouTube videos. Last weekend, I made kimchi jjigae. It was delicious.",
      IH: "I've been getting really into cooking over the past couple of years. I started with basic recipes like pasta and stir-fries, but now I enjoy trying more complex dishes. Recently, I made homemade ramen from scratch, including the broth, which took about 6 hours. My mom taught me the basics of Korean cooking, and I've picked up other cuisines from YouTube channels like Joshua Weissman.",
      AL: "Cooking has evolved from a necessity into a genuine passion of mine. I find the entire process — from selecting fresh ingredients at the local market to plating the final dish — to be incredibly therapeutic and creative. Recently, I challenged myself to make authentic ramen from scratch. The process involved simmering pork bones for over six hours to achieve that rich, milky tonkotsu broth. While it was time-consuming, the result was extraordinary and far superior to anything I'd had at a restaurant. My culinary journey started with my mother's Korean cooking, and I've since expanded my repertoire to include Italian, Japanese, and Thai cuisines.",
    },
    tips: [
      'Describe the cooking process step by step',
      'Use cooking vocabulary (simmer, stir-fry, marinate)',
      'Share your feelings about the results',
      'Mention where you learned recipes',
    ],
  },
  // ─── Hobbies: Travel ───
  {
    id: 'topic-6',
    category: 'Hobbies',
    title: 'Travel',
    titleKo: '여행',
    questions: [
      'Do you enjoy traveling? Where have you been recently?',
      'Tell me about your most memorable trip.',
      'How do you usually plan your trips?',
      'Do you prefer traveling alone or with others? Why?',
    ],
    sampleAnswers: {
      IM: "I love traveling. Last year, I went to Japan. I visited Tokyo and Osaka. The food was amazing. I like traveling with my friends. We had a great time.",
      IH: "Traveling is one of my greatest passions. My most memorable trip was to Japan last fall. I spent two weeks exploring Tokyo, Kyoto, and Osaka. What made it special was the perfect blend of modern city life and traditional culture. I usually plan my trips by researching on YouTube and travel blogs, then creating a rough itinerary. I prefer traveling with a small group of close friends because we can share experiences while still keeping things flexible.",
      AL: "Travel is something I consider essential for personal growth — it broadens your perspective in ways that nothing else quite can. My most transformative trip was a two-week journey through Japan last autumn. What struck me most was the seamless coexistence of centuries-old traditions with cutting-edge modernity. Walking through the bamboo groves of Arashiyama one day and then experiencing the sensory overload of Akihabara the next was a fascinating contrast. In terms of planning, I've developed a hybrid approach — I research extensively using travel blogs and local food guides to identify must-visit spots, but I deliberately leave room for spontaneity, which often leads to the most memorable discoveries.",
    },
    tips: [
      'Use vivid descriptions of places',
      'Include sensory details (sights, sounds, tastes)',
      'Compare and contrast experiences',
      'Share what you learned from traveling',
    ],
  },
  // ─── Daily Life: Routine ───
  {
    id: 'topic-7',
    category: 'Daily Life',
    title: 'Daily Routine',
    titleKo: '일상 루틴',
    questions: [
      'Describe your typical weekday routine.',
      'What do you usually do on weekends?',
      'Has your routine changed compared to a few years ago?',
      'What is the first thing you do when you wake up?',
    ],
    sampleAnswers: {
      IM: "I wake up at 7 AM every day. I eat breakfast and go to work. I work from 9 to 6. After work, I go to the gym. Then I eat dinner and watch TV. I go to bed at 11 PM.",
      IH: "My typical weekday starts around 6:30 AM. I wake up, do some light stretching, and have a quick breakfast — usually toast and coffee. I commute to work by subway, which takes about 40 minutes. I work from 9 to 6, and after that, I either hit the gym or meet friends for dinner. On weekends, I like to sleep in a bit and spend time on my hobbies like cooking or watching movies.",
      AL: "My daily routine has become quite structured over the years, and I find that this consistency is key to my productivity. I typically rise at 6:30, beginning my day with a 20-minute meditation session followed by a light workout. Mornings are my most productive period, so I try to tackle the most demanding tasks during that window. My routine has evolved significantly — three years ago, I was much more haphazard about my schedule. The transformation came when I realized that having intentional habits isn't about being rigid; it's about creating a framework that supports your goals while still allowing flexibility.",
    },
    tips: [
      'Use time expressions (at 7 AM, after lunch)',
      'Include transitions between activities',
      'Show variety between weekdays and weekends',
      'Mention how your routine affects your mood',
    ],
  },
  // ─── Daily Life: Home ───
  {
    id: 'topic-8',
    category: 'Daily Life',
    title: 'Your Home',
    titleKo: '집',
    questions: [
      'Describe your home. What does it look like?',
      'What is your favorite room? Why?',
      'Have you made any changes to your home recently?',
      'What do you like most about where you live?',
    ],
    sampleAnswers: {
      IM: "I live in an apartment in Seoul. It has two bedrooms, a living room, and a kitchen. My favorite room is my bedroom because it is comfortable. I like my home because it is near the subway station.",
      IH: "I live in a modern apartment in Gangnam, Seoul. It's a two-bedroom place with a spacious living room and an open kitchen. My favorite spot is definitely the living room because I set it up as a cozy space with a big sofa, bookshelves, and warm lighting. Recently, I added some plants, which really brightened up the space. The best thing about my location is that everything I need is within walking distance.",
      AL: "I currently reside in a contemporary two-bedroom apartment in Gangnam. What I appreciate most about the space is how I've managed to create distinct zones for different activities — a productive workspace by the window with natural light, a comfortable reading nook, and an entertainment area. I recently undertook a small renovation project, transforming the second bedroom into a home office with custom shelving and acoustic panels. The neighborhood itself is incredibly convenient, offering a perfect balance between urban amenities and the tranquility of nearby Yangjae Forest, where I often go for weekend walks.",
    },
    tips: [
      'Use spatial vocabulary (next to, across from)',
      'Describe specific details and decorations',
      'Express feelings about different spaces',
      'Compare to previous living situations if relevant',
    ],
  },
  // ─── Daily Life: Neighborhood ───
  {
    id: 'topic-9',
    category: 'Daily Life',
    title: 'Your Neighborhood',
    titleKo: '동네',
    questions: [
      'Describe the area where you live.',
      'What are some good places to visit in your neighborhood?',
      'Has your neighborhood changed over the years?',
      'What would you change about your neighborhood if you could?',
    ],
    sampleAnswers: {
      IM: "I live in a busy area in Seoul. There are many restaurants and cafes near my home. There is also a park where I go walking. I like my neighborhood because it is convenient.",
      IH: "My neighborhood is in the Mapo district of Seoul, which is known for its vibrant arts and food scene. There are tons of great cafes and restaurants within walking distance, and the Hongdae area nearby is always buzzing with energy. One of my favorite spots is a small independent bookstore that also serves great coffee. The area has changed a lot over the past decade — it's become more trendy and commercial, which has its pros and cons.",
      AL: "I live in the Mapo district, which has undergone a remarkable transformation over the past decade. It's evolved from a relatively quiet residential area into one of Seoul's most culturally dynamic neighborhoods. The streets are lined with an eclectic mix of independent cafes, art galleries, and restaurants that cater to diverse tastes. What I find particularly charming is the juxtaposition of old hanok houses alongside modern architecture. If I could change one thing, I'd advocate for more green spaces — while we have a few parks, the rapid development has come at the expense of natural areas that contribute to residents' quality of life.",
    },
    tips: [
      'Use location and direction vocabulary',
      'Describe the atmosphere and vibe',
      'Include specific examples of places',
      'Discuss changes over time',
    ],
  },
  // ─── Work/School ───
  {
    id: 'topic-10',
    category: 'Work/School',
    title: 'Your Job or Studies',
    titleKo: '직장/학교',
    questions: [
      'Tell me about your job or what you study.',
      'What do you like most about your work or school?',
      'Describe a typical day at work or school.',
      'Have you ever had a difficult project? Tell me about it.',
    ],
    sampleAnswers: {
      IM: "I work as a developer at a tech company. I make websites and apps. I like my job because I can learn new things. Sometimes it is stressful, but I enjoy it.",
      IH: "I work as a frontend developer at a tech startup in Seoul. My main responsibility is building user interfaces for our web applications. What I enjoy most is the creative aspect — turning designs into interactive, functional products. A typical day involves morning stand-up meetings, coding in the afternoon, and code reviews before I leave. The most challenging project I worked on was migrating our entire platform to a new framework within a tight deadline.",
      AL: "I'm currently working as a senior frontend developer at a rapidly growing tech startup. My role involves not only writing code but also mentoring junior developers and making architectural decisions that shape our product's direction. What I find most fulfilling about this position is the intersection of technical problem-solving and creative design thinking. The most formidable challenge I've faced was leading the migration of our entire platform from a legacy codebase to a modern framework. It required meticulous planning, coordinating across multiple teams, and maintaining product stability throughout the transition — essentially rebuilding the ship while sailing it.",
    },
    tips: [
      'Be specific about your role and responsibilities',
      'Use professional vocabulary naturally',
      'Share both positive and challenging aspects',
      'Tell stories about specific experiences',
    ],
  },
  // ─── Technology ───
  {
    id: 'topic-11',
    category: 'Technology',
    title: 'Technology in Daily Life',
    titleKo: '일상 속 기술',
    questions: [
      'How do you use technology in your daily life?',
      'What is your favorite app or device? Why?',
      'How has technology changed the way people communicate?',
      'Do you think people rely too much on technology?',
    ],
    sampleAnswers: {
      IM: "I use my smartphone every day. I use it for messaging, social media, and watching videos. My favorite app is YouTube. I think technology is very important in modern life.",
      IH: "Technology is deeply integrated into my daily life. I use my smartphone for almost everything — communication, entertainment, navigation, and even health tracking. My MacBook is essential for work, and I recently got an iPad for reading and note-taking. I think the biggest impact of technology has been on communication. We can instantly connect with anyone around the world, which is amazing but also sometimes overwhelming.",
      AL: "Technology has become so seamlessly woven into the fabric of daily life that it's almost invisible. From the moment my smart alarm wakes me based on my sleep cycle to the AI-powered tools I use at work, technology augments nearly every aspect of my existence. What fascinates me most is how rapidly communication has evolved — we've gone from waiting weeks for letters to having real-time video calls across continents. However, I do believe there's a double-edged sword here. While technology has democratized access to information and connection, it's also created challenges around attention spans, digital addiction, and the erosion of face-to-face social skills.",
    },
    tips: [
      'Give specific examples of apps and devices',
      'Discuss both advantages and disadvantages',
      'Use technology-related vocabulary naturally',
      'Share personal opinions with supporting reasons',
    ],
  },
  // ─── Health ───
  {
    id: 'topic-12',
    category: 'Health',
    title: 'Health & Wellness',
    titleKo: '건강',
    questions: [
      'What do you do to stay healthy?',
      'Have you ever tried to change a bad habit? Tell me about it.',
      'How do you deal with stress?',
      'What are some health trends that are popular in your country?',
    ],
    sampleAnswers: {
      IM: "I try to eat healthy food and exercise regularly. I drink a lot of water every day. When I feel stressed, I listen to music or go for a walk. I think sleep is very important for health.",
      IH: "I take a holistic approach to health. I work out regularly, try to eat balanced meals, and make sure I get at least 7 hours of sleep. For stress management, I've started practicing meditation using the Headspace app, which has been really helpful. One bad habit I've been working on breaking is staying up too late scrolling through my phone. I've started putting my phone in another room before bed, which has significantly improved my sleep quality.",
      AL: "My approach to health and wellness has matured considerably over the years. I've moved away from focusing solely on physical fitness to adopting a more holistic perspective that encompasses mental health, nutrition, and recovery. I maintain a consistent exercise routine, practice intermittent fasting, and have recently incorporated cold exposure into my morning routine after being inspired by research on its benefits for inflammation and mental resilience. As for stress management, I've found that a combination of meditation, journaling, and spending time in nature creates a powerful buffer against the pressures of modern life. In Korea, there's been a fascinating shift toward wellness culture — from the rise of home training during the pandemic to the growing popularity of mindfulness apps and plant-based diets.",
    },
    tips: [
      'Be specific about health habits and routines',
      'Use health and wellness vocabulary',
      'Share personal experiences and results',
      'Discuss trends with examples',
    ],
  },
  // ─── Role-Play ───
  {
    id: 'topic-13',
    category: 'Role-Play',
    title: 'Making a Reservation',
    titleKo: '예약하기',
    questions: [
      'Call a restaurant and make a reservation for this Saturday.',
      'You need to change your reservation time. Call and explain.',
      'You arrived at the restaurant but they lost your reservation. Handle the situation.',
    ],
    sampleAnswers: {
      IM: "Hello, I want to make a reservation. For Saturday, please. Two people. At 7 PM. My name is Kim Minjun. Thank you.",
      IH: "Hi, I'd like to make a reservation for this Saturday evening, please. It would be for a party of four, and we'd prefer a table around 7 PM if possible. Also, could we get a table by the window? One of our guests has a seafood allergy, so could you let the chef know in advance? My name is Kim Minjun, and my number is 010-1234-5678.",
      AL: "Good afternoon. I'm hoping to make a dinner reservation for this Saturday evening, please. We'd be a party of four, and ideally we'd like to be seated around 7 PM. I was wondering if you might have a table with a view available? Additionally, I should mention that one member of our party has a fairly severe shellfish allergy, so it would be essential for the kitchen to be aware. If it's not too much trouble, could you also let me know if there's a corkage fee? We'd like to bring a special bottle of wine for a birthday celebration. The reservation would be under Kim Minjun.",
    },
    tips: [
      'Be polite and use formal language',
      'Include specific details (date, time, number of people)',
      'Ask follow-up questions naturally',
      'Handle problems calmly and suggest solutions',
    ],
  },
  // ─── Unexpected Questions ───
  {
    id: 'topic-14',
    category: 'Unexpected Questions',
    title: 'Problem-Solving Scenarios',
    titleKo: '돌발 질문',
    questions: [
      'You just found out your flight has been cancelled. What do you do?',
      'Your friend wants to borrow a large amount of money. How do you respond?',
      'You received the wrong order at a restaurant. Handle the situation.',
      'Your neighbor is making too much noise late at night. What do you do?',
    ],
    sampleAnswers: {
      IM: "Oh no, my flight is cancelled. I will go to the desk and ask for help. I will ask for another flight. If there is no flight today, I will ask for a hotel.",
      IH: "If my flight were cancelled, the first thing I'd do is stay calm and head to the airline's service desk. I'd politely ask about alternative flights to my destination, whether there are seats available on partner airlines, and what compensation they can offer. If there are no flights until the next day, I'd request hotel accommodation and meal vouchers. I'd also check the airline's app for rebooking options, since that's sometimes faster than waiting in line.",
      AL: "In that situation, I'd immediately take a multi-pronged approach rather than relying solely on one solution. First, I'd check the airline's app to see if there are any available rebooking options — this is often faster than waiting in the inevitably long queue at the service desk. Simultaneously, I'd search for alternative flights on other airlines. While doing this, I'd also make my way to the customer service counter to explore my options face-to-face, as representatives sometimes have access to solutions not available through the app. I'd make sure to document everything and politely but firmly inquire about my rights regarding compensation, accommodation, and meal provisions, as regulations typically require airlines to provide these for cancellations within their control.",
    },
    tips: [
      'Stay calm and think through steps logically',
      'Use conditional language (If..., I would...)',
      'Show problem-solving skills',
      'Be specific about actions you would take',
    ],
  },
  // ─── Work/School: Presentation ───
  {
    id: 'topic-15',
    category: 'Work/School',
    title: 'Giving Presentations',
    titleKo: '발표하기',
    questions: [
      'Tell me about a presentation you gave recently.',
      'How do you prepare for important presentations?',
      'What challenges do you face when giving presentations?',
      'Do you have any tips for giving a good presentation?',
    ],
    sampleAnswers: {
      IM: "Last month, I gave a presentation at work about our new project. I was very nervous. I practiced many times before. I think practice is the most important thing for presentations.",
      IH: "I recently gave a quarterly review presentation to our team of about 30 people. I spent a few days preparing slides and rehearsing my talking points. The biggest challenge for me is managing nervousness in the first few minutes, but once I get into the flow, it becomes more natural. My preparation process usually involves outlining key points, designing clean slides with minimal text, and doing at least three practice runs.",
      AL: "I recently delivered a presentation to our company's stakeholders on the technical roadmap for the upcoming year. The preparation was quite extensive — I started by identifying the key messages I wanted to convey, then worked backward to structure the narrative. Rather than cramming slides with information, I focused on creating a compelling story arc that would resonate with both technical and non-technical audience members. One technique that's transformed my presentation skills is the concept of deliberate practice — not just rehearsing the content, but specifically working on areas of weakness like pacing, pausing for emphasis, and reading the room to adjust my delivery in real-time.",
    },
    tips: [
      'Describe your preparation process in detail',
      'Be honest about challenges and how you overcome them',
      'Use presentation-related vocabulary',
      'Share specific strategies and techniques',
    ],
  },
  {
    id: 'topic-16',
    category: 'Hobbies',
    title: 'Reading & Books',
    titleKo: '독서',
    questions: [
      'Do you enjoy reading? What kind of books do you prefer?',
      'Tell me about a book that had a big impact on you.',
      'How do you find time to read in your busy schedule?',
    ],
    sampleAnswers: {
      IM: "I like reading books. I usually read self-help books and novels. I read before I go to bed. My favorite book is Atomic Habits.",
      IH: "I try to read at least 20-30 minutes every day, usually before bed. I enjoy a mix of non-fiction — particularly books about psychology and business — and fiction like science fiction novels. One book that really changed my perspective was Atomic Habits by James Clear. It taught me that small, consistent changes can lead to remarkable results over time.",
      AL: "Reading is an indispensable part of my intellectual diet. I alternate between non-fiction works — spanning psychology, economics, and technology — and literary fiction that offers windows into different human experiences. The book that perhaps had the most profound impact on my daily life was Atomic Habits by James Clear. What made it transformative wasn't just the concepts themselves, which are relatively straightforward, but rather how it provided a systematic framework for implementing behavioral change. I integrate reading into my schedule through a combination of physical books in the evening and audiobooks during my commute, which allows me to consume roughly 30-40 books per year.",
    },
    tips: [
      'Mention specific book titles and authors',
      'Explain what you learned or how you were affected',
      'Describe your reading habits concretely',
    ],
  },
];

// Alias for convenience
export const topics = opicTopics;

export interface OPIcExpressionCompat {
  category: string;
  phrases: { english: string; korean: string; usage: string }[];
}

export interface SurveyPreset {
  id: string;
  name: string;
  difficulty: string;
  description: string;
}

export const surveyPresets: SurveyPreset[] = [
  {
    id: 'preset-5-5',
    name: '5-5 (IM Target)',
    difficulty: 'IM',
    description: 'Intermediate Mid target. Questions focus on familiar topics with straightforward language. Good for building confidence.',
  },
  {
    id: 'preset-5-6',
    name: '5-6 (IH Target)',
    difficulty: 'IH',
    description: 'Intermediate High target. Mix of familiar and some complex topics. Requires more detailed and organized responses.',
  },
  {
    id: 'preset-6-6',
    name: '6-6 (AL Target)',
    difficulty: 'AL',
    description: 'Advanced Low target. Complex topics requiring sophisticated language, detailed examples, and nuanced opinions.',
  },
];

export const opicExpressions: OPIcExpression[] = [
  {
    purpose: 'Opening / Starting Your Answer',
    purposeKo: '답변 시작하기',
    phrases: [
      { english: "Well, let me think about that...", korean: "음, 그것에 대해 생각해볼게요..." },
      { english: "That's a great question.", korean: "좋은 질문이네요." },
      { english: "I'd be happy to tell you about that.", korean: "그것에 대해 기꺼이 말씀드릴게요." },
      { english: "Sure, I can talk about that.", korean: "네, 그것에 대해 이야기할 수 있어요." },
      { english: "Oh, where do I begin?", korean: "어디서부터 시작해야 할까요?" },
    ],
  },
  {
    purpose: 'Giving Examples',
    purposeKo: '예시 들기',
    phrases: [
      { english: "For example, ...", korean: "예를 들어, ..." },
      { english: "For instance, ...", korean: "예를 들면, ..." },
      { english: "To give you an example, ...", korean: "예를 들어드리자면, ..." },
      { english: "A good example of this would be ...", korean: "좋은 예시로는 ... 가 있어요" },
      { english: "Let me give you a specific example.", korean: "구체적인 예를 들어볼게요." },
    ],
  },
  {
    purpose: 'Transitions / Connecting Ideas',
    purposeKo: '전환 / 아이디어 연결',
    phrases: [
      { english: "In addition to that, ...", korean: "그것에 더해서, ..." },
      { english: "On top of that, ...", korean: "게다가, ..." },
      { english: "Another thing I should mention is ...", korean: "또 하나 언급해야 할 것은 ..." },
      { english: "Speaking of which, ...", korean: "그 말이 나와서 말인데, ..." },
      { english: "That actually reminds me of ...", korean: "그게 사실 ...을 떠올리게 하네요" },
    ],
  },
  {
    purpose: 'Expressing Opinions',
    purposeKo: '의견 표현하기',
    phrases: [
      { english: "In my opinion, ...", korean: "제 의견으로는, ..." },
      { english: "I personally think that ...", korean: "저는 개인적으로 ...라고 생각해요" },
      { english: "From my perspective, ...", korean: "제 관점에서는, ..." },
      { english: "The way I see it, ...", korean: "제가 보기에는, ..." },
      { english: "I strongly believe that ...", korean: "저는 ...라고 강하게 믿어요" },
    ],
  },
  {
    purpose: 'Comparing & Contrasting',
    purposeKo: '비교 & 대조',
    phrases: [
      { english: "Compared to before, ...", korean: "이전과 비교하면, ..." },
      { english: "On the other hand, ...", korean: "반면에, ..." },
      { english: "While ... is great, I prefer ...", korean: "...도 좋지만, 저는 ...을 더 좋아해요" },
      { english: "The main difference is ...", korean: "주요 차이점은 ..." },
      { english: "Unlike ..., I tend to ...", korean: "...와 달리, 저는 ...하는 편이에요" },
    ],
  },
  {
    purpose: 'Describing Past Experiences',
    purposeKo: '과거 경험 묘사',
    phrases: [
      { english: "I remember when ...", korean: "...했던 때가 기억나요" },
      { english: "There was this one time when ...", korean: "이런 적이 있었는데 ..." },
      { english: "A few years ago, ...", korean: "몇 년 전에, ..." },
      { english: "Looking back, ...", korean: "돌이켜보면, ..." },
      { english: "One memorable experience was when ...", korean: "기억에 남는 경험 중 하나는 ..." },
    ],
  },
  {
    purpose: 'Closing / Wrapping Up',
    purposeKo: '마무리하기',
    phrases: [
      { english: "So, that's basically how I feel about it.", korean: "그래서, 기본적으로 그것에 대한 제 생각이에요." },
      { english: "Overall, I would say ...", korean: "전반적으로, ...라고 말하겠어요" },
      { english: "To sum it up, ...", korean: "요약하자면, ..." },
      { english: "All in all, ...", korean: "결론적으로, ..." },
      { english: "I think that pretty much covers it.", korean: "그것으로 대충 다 된 것 같아요." },
    ],
  },
  {
    purpose: 'Buying Time / Fillers',
    purposeKo: '시간 벌기',
    phrases: [
      { english: "Let me think about that for a second.", korean: "잠시 생각해볼게요." },
      { english: "That's an interesting question.", korean: "흥미로운 질문이네요." },
      { english: "How should I put this...", korean: "이걸 어떻게 말하면 좋을까..." },
      { english: "You know, it's funny because ...", korean: "있잖아요, 재밌는 게 ..." },
      { english: "I haven't really thought about this before, but ...", korean: "이것에 대해 생각해본 적은 없지만, ..." },
    ],
  },
];

// Compat alias: expressions with usage field mapped from opicExpressions
export const expressions: OPIcExpressionCompat[] = opicExpressions.map((e) => ({
  category: e.purpose,
  phrases: e.phrases.map((p) => ({
    english: p.english,
    korean: p.korean,
    usage: e.purposeKo,
  })),
}));
