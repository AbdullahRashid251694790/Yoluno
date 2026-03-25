-- Migration 028: Add British Curriculum topic category and subtopics
-- Covers Key Stage 1 (ages 5-7), Key Stage 2 (ages 7-11), and Key Stage 3 (ages 11-14)
-- Based on the English National Curriculum subjects and topics

DO $$
DECLARE
  cat_eng uuid;
  cat_maths uuid;
  cat_sci uuid;
  cat_hist uuid;
  cat_geo uuid;
  cat_dt uuid;
  cat_computing uuid;
  cat_languages uuid;
  cat_citizenship uuid;
BEGIN
  -- British Curriculum: English & Literacy
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: English', 'Reading, writing, spelling, grammar, and literature from the UK National Curriculum', 'book', 17)
  RETURNING id INTO cat_eng;

  -- British Curriculum: Maths
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Maths', 'Number, measurement, geometry, statistics, and problem solving from the UK National Curriculum', 'calculator', 18)
  RETURNING id INTO cat_maths;

  -- British Curriculum: Science
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Science', 'Biology, chemistry, physics, and scientific enquiry from the UK National Curriculum', 'flask', 19)
  RETURNING id INTO cat_sci;

  -- British Curriculum: History
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: History', 'British and world history from the UK National Curriculum', 'scroll', 20)
  RETURNING id INTO cat_hist;

  -- British Curriculum: Geography
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Geography', 'Places, maps, environments, and human geography from the UK National Curriculum', 'globe', 21)
  RETURNING id INTO cat_geo;

  -- British Curriculum: Design & Technology
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Design & Technology', 'Designing, making, cooking, and understanding mechanisms from the UK National Curriculum', 'wrench', 22)
  RETURNING id INTO cat_dt;

  -- British Curriculum: Computing
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Computing', 'Coding, algorithms, digital literacy, and online safety from the UK National Curriculum', 'monitor', 23)
  RETURNING id INTO cat_computing;

  -- British Curriculum: Modern Foreign Languages
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Languages', 'French, Spanish, and other modern foreign languages from the UK National Curriculum', 'languages', 24)
  RETURNING id INTO cat_languages;

  -- British Curriculum: Citizenship & PSHE
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('British Curriculum: Citizenship & PSHE', 'Personal development, citizenship, relationships, and health education from the UK National Curriculum', 'users', 25)
  RETURNING id INTO cat_citizenship;

  -----------------------------------------------------------------------
  -- ENGLISH & LITERACY TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_eng, 'Phonics & Reading (KS1)', 'Learn the sounds that letters make and blend them together to read words! Phonics is the foundation of reading in the British Curriculum. Discover digraphs, trigraphs, and tricky words as you become a confident reader.', 4, 7, true),
    (cat_eng, 'Spelling & Grammar (KS1-2)', 'From capital letters and full stops to apostrophes and conjunctions! Learn the building blocks of English grammar, practise spelling rules, and understand how sentences are constructed properly.', 5, 11, true),
    (cat_eng, 'Creative Writing', 'Let your imagination run wild! Learn to write stories, poems, and descriptions. Discover how to create characters, build settings, use powerful vocabulary, and structure your writing with a beginning, middle, and end.', 5, 14, true),
    (cat_eng, 'Comprehension & Reading Skills', 'Read like a detective! Learn to understand texts, find clues in stories, make predictions, and answer questions about what you have read. Explore fiction, non-fiction, poetry, and plays.', 5, 14, true),
    (cat_eng, 'Poetry & Performance', 'Rhyme, rhythm, and expression! Discover different types of poems — haikus, limericks, sonnets, and free verse. Learn to perform poetry aloud with confidence and even write your own.', 5, 14, true),
    (cat_eng, 'Shakespeare & Classic Literature (KS3)', 'To be or not to be! Get introduced to William Shakespeare and other classic British authors. Explore famous plays, stories, and poems that have shaped English literature for centuries.', 11, 14, true),
    (cat_eng, 'Non-Fiction Writing', 'Reports, persuasive letters, newspaper articles, and instructions! Learn how to write for different purposes and audiences. Discover how non-fiction texts inform, explain, and convince.', 7, 14, true);

  -----------------------------------------------------------------------
  -- MATHS TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_maths, 'Number & Place Value', 'Understand how numbers work! From counting in ones and tens to millions and decimals. Learn about place value, ordering numbers, rounding, and negative numbers as you progress through the curriculum.', 4, 14, true),
    (cat_maths, 'Addition & Subtraction', 'The building blocks of maths! Learn mental and written methods for adding and subtracting. Start with small numbers and work up to large calculations with confidence.', 4, 11, true),
    (cat_maths, 'Multiplication & Division', 'Times tables are your superpower! Learn all your tables up to 12x12, understand how multiplication and division are connected, and master long multiplication and division methods.', 5, 14, true),
    (cat_maths, 'Fractions, Decimals & Percentages', 'What is half a pizza? Learn about fractions, how to compare and order them, convert between fractions, decimals and percentages, and calculate with them in real-life situations.', 6, 14, true),
    (cat_maths, 'Measurement', 'How long? How heavy? How much? Learn to measure length, mass, volume, and time using standard units. Convert between units like metres to centimetres and litres to millilitres.', 5, 12, true),
    (cat_maths, 'Geometry: Shapes & Space', 'Triangles, quadrilaterals, circles, and 3D shapes! Learn about their properties, angles, symmetry, and coordinates. Discover how geometry is used in architecture, art, and everyday life.', 5, 14, true),
    (cat_maths, 'Statistics & Data', 'Collect, organise, and present data! Learn to read and create bar charts, pie charts, line graphs, and tables. Understand mean, median, mode, and range to analyse information.', 6, 14, true),
    (cat_maths, 'Algebra (KS2-3)', 'Letters and symbols in maths? Algebra uses letters to represent unknown numbers. Learn to write and solve equations, understand sequences and patterns, and use formulae.', 9, 14, true),
    (cat_maths, 'Ratio & Proportion (KS3)', 'If a recipe serves 4 and you need to serve 8, what do you do? Learn about ratio and proportion — comparing quantities, scaling up and down, and solving real-world problems.', 11, 14, true);

  -----------------------------------------------------------------------
  -- SCIENCE TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_sci, 'Plants & Living Things', 'From tiny seeds to towering trees! Learn how plants grow, what they need to survive, how they reproduce, and how scientists classify living things into groups. Discover photosynthesis and food chains.', 4, 12, true),
    (cat_sci, 'Animals Including Humans', 'Explore the amazing animal kingdom! Learn about different animal groups, lifecycles, habitats, food chains, and the human body — digestion, circulation, muscles, bones, and keeping healthy.', 4, 14, true),
    (cat_sci, 'Materials & Their Properties', 'Why is glass see-through? Why is rubber stretchy? Investigate everyday materials, learn about solids, liquids and gases, reversible and irreversible changes, and how materials are chosen for different purposes.', 5, 12, true),
    (cat_sci, 'Forces & Magnets', 'Push, pull, twist! Discover the invisible forces that make things move, stop, or change direction. Learn about gravity, friction, air resistance, water resistance, and the magical pull of magnets.', 5, 14, true),
    (cat_sci, 'Light & Sound', 'How do we see? How do we hear? Explore how light travels, how shadows form, how mirrors reflect, and how sound is created by vibrations. Discover the electromagnetic spectrum and how ears work.', 5, 14, true),
    (cat_sci, 'Electricity & Circuits', 'Flip the switch! Learn how electricity flows through circuits, what conductors and insulators are, how to draw circuit diagrams, and the difference between series and parallel circuits.', 7, 14, true),
    (cat_sci, 'Earth & Space', 'Our planet is spinning through space right now! Learn about the solar system, why we have day and night, the phases of the Moon, and how the Earth orbits the Sun. Explore rocks, soil, and fossils too.', 7, 14, true),
    (cat_sci, 'Evolution & Inheritance', 'Why do you look like your parents? Discover how living things have changed over millions of years through evolution. Learn about fossils, adaptation, natural selection, and how traits are passed on.', 9, 14, true),
    (cat_sci, 'Chemistry: Atoms & Reactions (KS3)', 'Everything is made of atoms! Learn about elements, compounds, mixtures, the periodic table, chemical reactions, and acids and alkalis. Discover how chemistry explains the world around you.', 11, 14, true),
    (cat_sci, 'Physics: Energy & Waves (KS3)', 'Energy cannot be created or destroyed — only transferred! Explore different types of energy, how waves carry sound and light, and the physics behind everyday things from boiling kettles to roller coasters.', 11, 14, true),
    (cat_sci, 'Biology: Cells & Body Systems (KS3)', 'You are made of trillions of tiny cells! Discover how cells work, how your organs form systems, and how the human body breathes, digests food, fights disease, and reproduces.', 11, 14, true);

  -----------------------------------------------------------------------
  -- HISTORY TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_hist, 'Stone Age to Iron Age', 'Travel back thousands of years to when early Britons hunted mammoths, built Stonehenge, and discovered how to make tools from bronze and iron. Discover how life changed over these incredible ages.', 7, 11, true),
    (cat_hist, 'Ancient Egypt', 'Pharaohs, pyramids, mummies, and hieroglyphics! Explore one of the world''s greatest ancient civilisations. Learn how Egyptians lived along the Nile, built incredible monuments, and believed in the afterlife.', 7, 12, true),
    (cat_hist, 'Ancient Greece', 'The birthplace of democracy, the Olympics, and great thinkers! Discover Greek gods and myths, the city-states of Athens and Sparta, and how Ancient Greece shaped the modern world.', 7, 12, true),
    (cat_hist, 'The Romans in Britain', 'When the mighty Roman Empire invaded Britain! Learn about Julius Caesar, Roman roads, Hadrian''s Wall, Roman baths, gladiators, and how the Romans changed Britain forever.', 7, 12, true),
    (cat_hist, 'Anglo-Saxons & Vikings', 'After the Romans left, new invaders arrived! Discover the Anglo-Saxon kingdoms, Viking raids and settlements, King Alfred the Great, and the dramatic events that shaped early medieval Britain.', 7, 12, true),
    (cat_hist, 'The Tudors', 'Henry VIII and his six wives! Explore the Tudor dynasty, the break with Rome, Elizabeth I, the Spanish Armada, Shakespeare, and the dramatic events of one of England''s most famous royal families.', 9, 14, true),
    (cat_hist, 'The Industrial Revolution', 'Steam engines, factories, and railways transformed Britain! Learn how the Industrial Revolution changed how people lived, worked, and travelled. Discover inventions that shaped the modern world.', 9, 14, true),
    (cat_hist, 'World War I & World War II', 'The two great wars that changed the world. Learn about the causes, key events, life on the home front, the Blitz, D-Day, and how ordinary people showed extraordinary courage during times of conflict.', 9, 14, true),
    (cat_hist, 'Medieval Britain (KS3)', 'Castles, crusades, and the Black Death! Explore life in medieval England — from William the Conqueror and the feudal system to Magna Carta and the Peasants'' Revolt.', 11, 14, true),
    (cat_hist, 'The British Empire & Its Legacy (KS3)', 'Britain once ruled a quarter of the world. Explore how the Empire grew, the impact on colonised peoples, the slave trade and abolition, and the legacy that shapes our diverse society today.', 11, 14, true);

  -----------------------------------------------------------------------
  -- GEOGRAPHY TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_geo, 'Maps & Atlases', 'Learn to read maps like an explorer! Understand map symbols, compass directions, grid references, contour lines, and scale. Discover how to find places using an atlas and even create your own maps.', 5, 14, true),
    (cat_geo, 'Weather & Climate', 'Why does it rain more in Manchester than Madrid? Learn about weather patterns, climate zones around the world, the water cycle, and how climate change is affecting our planet.', 5, 14, true),
    (cat_geo, 'Rivers & Coasts', 'Follow a river from its source to the sea! Learn about erosion, deposition, waterfalls, meanders, and floodplains. Explore how waves shape our coastlines and create beaches, cliffs, and caves.', 7, 14, true),
    (cat_geo, 'Volcanoes & Earthquakes', 'The Earth is alive beneath our feet! Learn about tectonic plates, how volcanoes erupt and earthquakes shake the ground. Discover the Ring of Fire and how people live in these dangerous zones.', 7, 14, true),
    (cat_geo, 'The United Kingdom', 'Explore your home! Learn about the countries, cities, counties, and regions of the UK. Discover the landscapes, landmarks, and human geography that make Britain unique.', 5, 12, true),
    (cat_geo, 'Comparing Places Around the World', 'How is life in a village in Kenya different from a city in Japan? Compare places around the world — their climates, cultures, economies, and environments. Understand what connects us all.', 7, 14, true),
    (cat_geo, 'Rainforests & Deserts', 'The hottest, driest, wettest, and most biodiverse places on Earth! Explore tropical rainforests and scorching deserts. Learn about the plants, animals, and people who call these extreme environments home.', 7, 14, true),
    (cat_geo, 'Sustainability & Environment (KS3)', 'How can we look after our planet? Explore climate change, deforestation, pollution, renewable energy, and what sustainability means. Discover how young people are making a difference.', 11, 14, true);

  -----------------------------------------------------------------------
  -- DESIGN & TECHNOLOGY TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_dt, 'Designing & Making', 'Think it, draw it, build it! Learn the design process — from brainstorming ideas to creating prototypes. Discover how real designers solve problems and make products that people use every day.', 5, 14, true),
    (cat_dt, 'Mechanisms & Structures', 'Levers, pulleys, gears, and axles! Learn how mechanisms make things move and how structures are built to be strong. Discover how bridges, buildings, and machines work.', 5, 14, true),
    (cat_dt, 'Food & Nutrition', 'Where does your food come from and what makes a healthy meal? Learn about food groups, the Eatwell Guide, food hygiene, and basic cooking skills. Understand nutrition and how to prepare simple dishes.', 5, 14, true),
    (cat_dt, 'Textiles', 'From threading a needle to designing clothes! Learn basic sewing skills, explore different fabrics, and discover how textiles are used in fashion, home furnishings, and industry.', 7, 14, true),
    (cat_dt, 'Electronics & Control (KS3)', 'Build circuits that do cool things! Learn about electronic components, microcontrollers, and how technology uses electronics to sense, process, and control the world around us.', 11, 14, true);

  -----------------------------------------------------------------------
  -- COMPUTING TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_computing, 'Algorithms & Coding Basics', 'An algorithm is a set of step-by-step instructions — like a recipe for a computer! Learn to think like a programmer, create simple algorithms, and understand how computers follow instructions.', 5, 12, true),
    (cat_computing, 'Scratch & Block Coding', 'Make games, animations, and stories with code! Scratch uses colourful blocks you snap together to program. Learn about loops, variables, and events while creating your own interactive projects.', 5, 12, true),
    (cat_computing, 'Online Safety & Digital Literacy', 'Stay safe and smart online! Learn about strong passwords, protecting personal information, recognising fake content, cyberbullying, and being a responsible digital citizen.', 5, 14, true),
    (cat_computing, 'Text-Based Programming (KS3)', 'Ready to write real code? Learn programming languages like Python. Understand variables, loops, conditions, functions, and data structures. Debug your code and build programs that solve real problems.', 11, 14, true),
    (cat_computing, 'Computer Networks & the Internet (KS3)', 'How does the internet actually work? Learn about networks, servers, IP addresses, the world wide web, encryption, and how data travels around the world in milliseconds.', 11, 14, true);

  -----------------------------------------------------------------------
  -- MODERN FOREIGN LANGUAGES TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_languages, 'French Basics', 'Bonjour! Learn basic French — greetings, numbers, colours, family members, food, and animals. Practise simple conversations and discover the culture of France and French-speaking countries.', 7, 14, true),
    (cat_languages, 'Spanish Basics', 'Hola! Discover the Spanish language — learn to introduce yourself, count, describe your family, order food, and talk about your hobbies. Explore the cultures of Spain and Latin America.', 7, 14, true),
    (cat_languages, 'Learning a New Language', 'Why learn another language? Discover how languages work, the benefits of being bilingual, tips for memorising vocabulary, and how understanding other languages opens doors to new cultures and friendships.', 7, 14, true);

  -----------------------------------------------------------------------
  -- CITIZENSHIP & PSHE TOPICS
  -----------------------------------------------------------------------
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_citizenship, 'Rules & Laws', 'Why do we have rules? From classroom rules to laws of the land, learn why rules keep us safe and fair. Discover how laws are made in the UK, what Parliament does, and why democracy matters.', 5, 14, true),
    (cat_citizenship, 'Rights & Responsibilities', 'Every child has rights! Learn about the UN Convention on the Rights of the Child, what your rights mean in everyday life, and the responsibilities that come with them.', 7, 14, true),
    (cat_citizenship, 'Diversity & Respect', 'Britain is a wonderfully diverse country! Learn about different cultures, religions, and traditions. Understand why treating everyone with respect and fairness matters, and celebrate what makes us all unique.', 5, 14, true),
    (cat_citizenship, 'Healthy Relationships', 'Good relationships are built on respect, trust, and kindness. Learn about different types of relationships — family, friends, and community. Understand boundaries, consent, and how to get help if needed.', 5, 14, true),
    (cat_citizenship, 'Mental Health & Wellbeing', 'Your mental health is just as important as your physical health! Learn about managing stress, building resilience, asking for help, and simple techniques to look after your mind.', 7, 14, true),
    (cat_citizenship, 'Money & Finance (KS3)', 'Budgets, banks, and being smart with money! Learn about earning, saving, spending, and giving. Understand how the economy works, what taxes pay for, and how to make wise financial decisions.', 11, 14, true);

END $$;
