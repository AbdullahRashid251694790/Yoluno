-- Migration 038: Add IB (International Baccalaureate) Curriculum topics
-- 8 categories, 62 topics covering PYP (ages 3-12) and MYP (ages 11-14)

DO $$
DECLARE
  cat_who uuid;
  cat_express uuid;
  cat_world uuid;
  cat_organize uuid;
  cat_planet uuid;
  cat_place uuid;
  cat_thinking uuid;
  cat_design uuid;
BEGIN
  -- Create IB categories
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: Who We Are', 'Identity, beliefs, values, wellbeing, and what it means to be human — from the IB curriculum', 'user', 26)
  RETURNING id INTO cat_who;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: How We Express Ourselves', 'Creativity, communication, art, music, drama, and media literacy — from the IB curriculum', 'palette', 27)
  RETURNING id INTO cat_express;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: How the World Works', 'Scientific inquiry, patterns, systems, technology, and ethics — from the IB curriculum', 'flask', 28)
  RETURNING id INTO cat_world;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: How We Organize Ourselves', 'Communities, economics, government, fairness, and entrepreneurship — from the IB curriculum', 'building', 29)
  RETURNING id INTO cat_organize;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: Sharing the Planet', 'Sustainability, biodiversity, climate, peace, human rights, and global citizenship — from the IB curriculum', 'globe', 30)
  RETURNING id INTO cat_planet;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: Where We Are in Place and Time', 'History, migration, exploration, ancient civilizations, and how the world has changed — from the IB curriculum', 'scroll', 31)
  RETURNING id INTO cat_place;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: Thinking & Learning Skills', 'Critical thinking, research, collaboration, reflection, resilience, and how to learn — from the IB curriculum', 'lightbulb', 32)
  RETURNING id INTO cat_thinking;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('IB: Design Thinking & Innovation', 'The design cycle, prototyping, user empathy, digital design, and sustainable innovation — from the IB curriculum', 'wrench', 33)
  RETURNING id INTO cat_design;

  -----------------------------------------------------------------------
  -- CATEGORY 1: Who We Are (Identity & Wellbeing)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_who, 'My Identity & What Makes Me Unique', 'Explore what makes you YOU — your personality, talents, culture, and the things you love. Discover how everyone is unique and that is what makes the world interesting.', 3, 8, true),
    (cat_who, 'Beliefs & Values Around the World', 'People believe different things and that is okay! Explore how beliefs and values shape the way we live, make decisions, and treat others. What do you believe in?', 7, 14, true),
    (cat_who, 'Understanding My Emotions (Emotional Intelligence)', 'Why do we feel angry, sad, excited, or nervous? Learn to name your emotions, understand what triggers them, and discover healthy ways to manage big feelings.', 3, 10, true),
    (cat_who, 'Physical, Mental & Social Wellbeing', 'Your health is more than just your body! Learn how physical activity, good sleep, kind friendships, and a calm mind all work together to keep you feeling great.', 5, 12, true),
    (cat_who, 'Growth Mindset & Learning to Learn', 'Your brain gets stronger every time you try! Discover the power of "yet" — you cannot do it YET. Learn how mistakes help you grow and why effort matters more than talent.', 5, 14, true),
    (cat_who, 'Rights & Responsibilities of Children', 'Every child in the world has rights — to learn, to play, to be safe. But rights come with responsibilities too. Explore the UN Convention on the Rights of the Child.', 7, 14, true),
    (cat_who, 'Spiritual Health & Inner Peace', 'Quiet moments matter. Learn about mindfulness, reflection, and finding calm. Explore how different cultures practice stillness and how taking time to think makes you stronger.', 7, 14, true);

  -----------------------------------------------------------------------
  -- CATEGORY 2: How We Express Ourselves (Creativity & Communication)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_express, 'Stories, Myths & Legends from Around the World', 'Every culture has stories that explain the world! Discover creation myths, folk tales, and legends from Africa, Asia, Europe, the Americas, and Oceania. What story does your family tell?', 4, 12, true),
    (cat_express, 'Art as Communication', 'A painting can say more than words! Explore how artists across history and cultures have used colour, shape, and symbols to share ideas, feelings, and beliefs.', 4, 12, true),
    (cat_express, 'Music & Dance Across Cultures', 'From African drumming to Indian classical dance to hip-hop — every culture expresses itself through rhythm and movement. Discover how music and dance connect us all.', 4, 12, true),
    (cat_express, 'Signs, Symbols & Visual Language', 'From emojis to road signs to ancient hieroglyphics — humans have always used visual symbols to communicate. Learn how images carry meaning across languages.', 5, 12, true),
    (cat_express, 'Drama, Role-Play & Storytelling', 'Step into someone else''s shoes! Learn how drama and performance help us understand different perspectives, express emotions, and share ideas with an audience.', 4, 12, true),
    (cat_express, 'Media Literacy: Understanding Messages', 'Ads, videos, news, and social media — messages are everywhere! Learn to think critically about who created a message, why, and whether you should believe it.', 8, 14, true),
    (cat_express, 'The Beauty of Language & Poetry', 'Words can paint pictures and make you feel things! Explore the power of language — metaphors, rhythm, wordplay — across different languages and cultures.', 7, 14, true);

  -----------------------------------------------------------------------
  -- CATEGORY 3: How the World Works (Scientific Inquiry)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_world, 'Asking Questions Like a Scientist', 'Science starts with curiosity! Learn the inquiry cycle — ask a question, make a prediction, test it, observe what happens, and share what you found. Think like a real researcher.', 3, 10, true),
    (cat_world, 'Patterns in Nature', 'Spirals in shells, hexagons in honeycombs, symmetry in snowflakes — nature is full of mathematical patterns! Discover the hidden order in the world around you.', 5, 12, true),
    (cat_world, 'Cause and Effect in the Natural World', 'Why do volcanoes erupt? Why do seasons change? Learn to trace chains of cause and effect and understand that everything in nature is connected.', 5, 12, true),
    (cat_world, 'How Technology Changes Our Lives', 'From the wheel to the smartphone — technology keeps changing how we live. Explore how inventions solve problems but can also create new ones. What will YOU invent?', 6, 14, true),
    (cat_world, 'Systems and Cycles', 'Water cycle, carbon cycle, life cycle, food chains — the world runs on interconnected systems. Learn how one change can ripple through an entire system.', 7, 14, true),
    (cat_world, 'Models and Representations', 'Scientists use models to understand things they cannot see — atoms, solar systems, weather patterns. Learn how maps, diagrams, and models help us make sense of complicated things.', 8, 14, true),
    (cat_world, 'Ethics in Science and Technology', 'Just because we CAN do something, should we? Explore the big questions about AI, cloning, space exploration, and the responsibility scientists have to use knowledge wisely.', 10, 14, true);

  -----------------------------------------------------------------------
  -- CATEGORY 4: How We Organize Ourselves (Systems & Society)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_organize, 'How Communities Work', 'From your family to your school to your city — communities have structures, roles, and rules. Explore how people organize themselves to live and work together.', 4, 10, true),
    (cat_organize, 'How Decisions Are Made', 'Who decides the rules? Explore how decisions are made in families, schools, communities, and governments. Learn about voting, consensus, and why everyone''s voice matters.', 7, 14, true),
    (cat_organize, 'Economics for Kids: Needs, Wants & Trade', 'Why do things cost money? Learn about supply and demand, how trade connects countries, and the difference between needs and wants. Become a smart thinker about money and resources.', 6, 12, true),
    (cat_organize, 'Organizations That Help the World', 'The United Nations, the Red Cross, charities big and small — discover how organizations are structured and how they work to solve problems around the world.', 8, 14, true),
    (cat_organize, 'Fairness, Equity & Social Justice', 'Is fair the same as equal? Explore why some people have more opportunities than others and what fairness really means. Discover how young people are standing up for justice.', 8, 14, true),
    (cat_organize, 'Government and Democracy', 'How are countries run? Explore different types of government — democracy, monarchy, and more. Learn how laws are made and why civic participation matters.', 9, 14, true),
    (cat_organize, 'Entrepreneurship & Problem-Solving', 'Got an idea to make the world better? Learn how entrepreneurs spot problems, design solutions, and create things people need. You are never too young to start!', 8, 14, true);

  -----------------------------------------------------------------------
  -- CATEGORY 5: Sharing the Planet (Sustainability & Global Citizenship)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_planet, 'Sharing Earth''s Resources', 'Water, food, energy, land — there is only so much to go around. Explore how resources are shared (or not shared) and why it matters for every person and creature on Earth.', 5, 12, true),
    (cat_planet, 'Biodiversity & Ecosystems', 'Every living thing has a role to play! Learn about ecosystems — how plants, animals, insects, and microorganisms depend on each other. What happens when one piece goes missing?', 5, 12, true),
    (cat_planet, 'Climate Action for Kids', 'The planet is getting warmer and young people are leading the charge! Learn what climate change means, why it matters, and the real actions you can take to make a difference.', 7, 14, true),
    (cat_planet, 'Peace & Conflict Resolution', 'Disagreements happen — between friends, communities, and countries. Learn about peaceful ways to resolve conflicts, the importance of listening, and how peace is built.', 6, 14, true),
    (cat_planet, 'Human Rights & Global Citizenship', 'What does it mean to be a citizen of the world? Explore human rights, learn about people who have fought for justice, and discover your role in making the world more fair.', 8, 14, true),
    (cat_planet, 'Sustainable Living', 'Reduce, reuse, recycle — and so much more! Explore how everyday choices about food, transport, clothing, and energy affect the planet. Learn to live in a way that protects the future.', 5, 14, true),
    (cat_planet, 'Interconnectedness: How Everything Is Connected', 'A butterfly in Brazil, a factory in China, your lunch in London — everything is connected. Explore globalization, supply chains, and how local actions have global effects.', 8, 14, true),
    (cat_planet, 'Caring for Other Living Things', 'We share this planet with millions of species. Learn about animal welfare, conservation, endangered species, and why every creature — from whales to worms — matters.', 3, 10, true);

  -----------------------------------------------------------------------
  -- CATEGORY 6: Where We Are in Place and Time (History & Discovery)
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_place, 'Personal Histories & Family Stories', 'Where did your grandparents grow up? What was life like when your parents were young? Explore your own history and discover how personal stories connect to bigger events.', 3, 10, true),
    (cat_place, 'Human Migration: Why People Move', 'From ancient nomads to modern refugees — people have always moved. Explore why people leave their homes, the journeys they take, and how migration shapes the world.', 7, 14, true),
    (cat_place, 'Great Explorers & Discoveries', 'From Zheng He to Ibn Battuta to Amelia Earhart — meet the adventurers who explored unknown lands, seas, and skies. What drove them to discover the unknown?', 6, 12, true),
    (cat_place, 'Ancient Civilizations (Global Perspective)', 'Beyond Egypt, Greece, and Rome! Explore the Indus Valley, Mesopotamia, the Maya, the Benin Kingdom, and Ancient China. Every civilization contributed something amazing to humanity.', 7, 14, true),
    (cat_place, 'How Our World Has Changed Over Time', 'From caves to skyscrapers, from horses to rockets. Explore how human life has transformed over thousands of years — and imagine what might come next.', 5, 12, true),
    (cat_place, 'Maps, Navigation & Understanding Space', 'How did ancient people find their way? From star navigation to compasses to GPS — explore how humans have understood and mapped their world throughout history.', 6, 12, true);

  -----------------------------------------------------------------------
  -- CATEGORY 7: Thinking & Learning Skills
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_thinking, 'Thinking Like a Detective (Critical Thinking)', 'Do not believe everything you hear! Learn to ask good questions, look for evidence, spot bias, and make smart decisions based on facts rather than feelings.', 6, 14, true),
    (cat_thinking, 'Creative Thinking & Innovation', 'Great ideas start with "What if...?" Learn to brainstorm, think outside the box, combine ideas in new ways, and develop your own creative process.', 5, 14, true),
    (cat_thinking, 'Research Skills: Finding Reliable Information', 'Not everything on the internet is true! Learn how to find trustworthy sources, take notes, compare information, and present what you have discovered.', 7, 14, true),
    (cat_thinking, 'Collaboration & Teamwork', 'Two heads are better than one! Learn how to work effectively in groups, listen to others, share responsibilities, and achieve things together that you could not alone.', 4, 12, true),
    (cat_thinking, 'Self-Management & Goal Setting', 'Want to achieve something big? Break it down! Learn to set goals, manage your time, organize your work, stay motivated, and reflect on your progress.', 6, 14, true),
    (cat_thinking, 'Being an Inquirer: The Power of Questions', 'The best learners ask the best questions! Discover how to ask questions that open doors to new knowledge. Learn the difference between thin and thick questions.', 4, 12, true),
    (cat_thinking, 'Reflection: Learning from Experience', 'What went well? What would you do differently? Learn the art of reflection — looking back at your experiences to understand yourself better and grow.', 5, 14, true),
    (cat_thinking, 'Risk-Taking & Resilience', 'It is okay to fail — that is how you learn! Discover why taking risks (safe ones!) helps you grow, how to bounce back from setbacks, and why perseverance matters.', 5, 14, true),
    (cat_thinking, 'Being Open-Minded', 'There is always another way to see things! Learn to consider different perspectives, appreciate other cultures, and understand that being open-minded makes you a better learner and person.', 5, 14, true);

  -----------------------------------------------------------------------
  -- CATEGORY 8: Design Thinking & Innovation
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_design, 'The Design Cycle: From Problem to Solution', 'Every great product started as a problem! Learn the IB Design Cycle — investigate, brainstorm ideas, create a solution, and evaluate how well it works.', 8, 14, true),
    (cat_design, 'Understanding User Needs (Empathy in Design)', 'Before you design something, you need to understand who will use it! Learn to interview, observe, and empathize with people to create things that truly help.', 8, 14, true),
    (cat_design, 'Prototyping & Testing', 'Build it, test it, improve it, repeat! Learn why designers make rough versions (prototypes) first and why testing and feedback make everything better.', 8, 14, true),
    (cat_design, 'Digital Design: Apps, Websites & UX', 'How are apps and websites designed? Learn about user experience (UX), layouts, wireframes, and how digital designers create things millions of people use every day.', 10, 14, true),
    (cat_design, 'Product Design & Sustainability', 'Can you design a product that is useful AND good for the planet? Explore eco-friendly materials, ergonomic design, and how great designers think about sustainability.', 10, 14, true),
    (cat_design, 'Innovation Through History', 'From the printing press to the internet — explore how design thinking has driven human progress. What problems did inventors solve and what new problems did they create?', 8, 14, true);

END $$;
