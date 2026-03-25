-- Migration 027: Add new topic categories and topics
-- Adds 8 new categories: Safety & Life Skills, World & Geography, Math & Logic,
-- Mindfulness & Wellbeing, Everyday Learning, Technology & Future, Careers & Dreams, Food & Cooking

DO $$
DECLARE
  cat_safety uuid;
  cat_geography uuid;
  cat_math uuid;
  cat_mindfulness uuid;
  cat_everyday uuid;
  cat_technology uuid;
  cat_careers uuid;
  cat_food uuid;
BEGIN
  -- Create new categories
  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Safety & Life Skills', 'Learn important skills to stay safe and navigate everyday life', 'shield', 9)
  RETURNING id INTO cat_safety;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('World & Geography', 'Explore countries, landmarks, and cultures from around the globe', 'globe', 10)
  RETURNING id INTO cat_geography;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Math & Logic', 'Discover the fun side of numbers, shapes, and problem solving', 'calculator', 11)
  RETURNING id INTO cat_math;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Mindfulness & Wellbeing', 'Practice calm, kindness, and taking care of your mind', 'heart', 12)
  RETURNING id INTO cat_mindfulness;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Everyday Learning', 'Fun facts and skills you use every single day', 'book-open', 13)
  RETURNING id INTO cat_everyday;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Technology & Future', 'Understand the tech around you and imagine what comes next', 'cpu', 14)
  RETURNING id INTO cat_technology;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Careers & Dreams', 'Explore different jobs and discover what you might want to be', 'briefcase', 15)
  RETURNING id INTO cat_careers;

  INSERT INTO topic_categories (name, description, icon, sort_order)
  VALUES ('Food & Cooking', 'Learn where food comes from and how to make yummy things', 'utensils', 16)
  RETURNING id INTO cat_food;

  -- Safety & Life Skills topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_safety, 'Internet Safety', 'The internet is amazing but it is important to stay safe! Learn about passwords, not sharing personal info, and what to do if something online makes you uncomfortable. Be a smart digital citizen!', 5, 12, true),
    (cat_safety, 'Stranger Danger', 'Most people are kind, but it is important to know how to stay safe. Learn about trusted adults, what to do if you feel unsafe, and how to say no. Your safety always comes first!', 3, 10, true),
    (cat_safety, 'Road Safety', 'Look left, look right, look left again! Learn the rules of crossing the road, what traffic signs mean, why seat belts matter, and how to be safe on bikes and scooters.', 3, 10, true),
    (cat_safety, 'What to Do in Emergencies', 'Stay calm and know what to do! Learn about calling for help, fire safety, first aid basics, and how to find a trusted adult when something goes wrong. Being prepared is being brave!', 4, 12, true),
    (cat_safety, 'Money & Saving', 'Coins, notes, and piggy banks! Learn what money is, how people earn it, the difference between needs and wants, and why saving up for something special feels so great.', 5, 12, true),
    (cat_safety, 'Good Manners', 'Please, thank you, and excuse me go a long way! Learn why manners matter, how to be polite at the table, in school, and online. Good manners make everyone feel respected and happy.', 3, 10, true);

  -- World & Geography topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_geography, 'Continents & Countries', 'Our world has 7 continents and nearly 200 countries! Travel the globe and learn about different places, from the icy Arctic to the hot Sahara Desert. Where would you love to visit?', 4, 12, true),
    (cat_geography, 'Languages of the World', 'Bonjour! Hola! Konnichiwa! There are over 7,000 languages spoken around the world. Discover how people communicate in different countries and try learning a few fun words!', 4, 12, true),
    (cat_geography, 'Maps & Navigation', 'X marks the spot! Learn how to read maps, use a compass, and understand directions. From treasure maps to GPS, discover how people have found their way for thousands of years.', 5, 12, true),
    (cat_geography, 'Oceans & Seas', 'Over 70% of Earth is covered in water! Explore the five great oceans, learn about tides and waves, and discover the incredible creatures that live in the deepest parts of the sea.', 4, 12, true),
    (cat_geography, 'Famous Landmarks', 'From the Eiffel Tower to the Great Wall of China! Discover the most famous buildings, monuments, and natural wonders that people travel from all over the world to see.', 4, 12, true),
    (cat_geography, 'Life in Different Countries', 'What is it like to be a kid in Japan? Or Brazil? Or Kenya? Explore how children around the world go to school, play, eat, and celebrate. We are all different and all connected!', 4, 12, true);

  -- Math & Logic topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_math, 'Shapes & Patterns', 'Circles, triangles, squares — shapes are everywhere! Find them in buildings, nature, and art. Learn about patterns too — stripes, zigzags, and spirals that repeat in beautiful ways.', 3, 8, true),
    (cat_math, 'Counting & Numbers', 'Numbers are the building blocks of math! Practice counting, learn about big numbers, discover what zero means, and see how numbers help us in everyday life — from cooking to shopping.', 3, 8, true),
    (cat_math, 'Puzzles & Brain Teasers', 'Challenge your brain! Solve riddles, work through mazes, try logic puzzles, and discover that making mistakes is part of the fun. Every puzzle you solve makes your brain stronger!', 4, 12, true),
    (cat_math, 'Measuring Things', 'How tall are you? How heavy is an elephant? Learn about rulers, scales, and measuring cups. Discover how we measure length, weight, and volume — and why it matters in real life.', 4, 10, true),
    (cat_math, 'Time & Clocks', 'Tick tock! Learn to tell time on analog and digital clocks. Understand hours, minutes, and seconds. Discover time zones — when you are eating breakfast, someone across the world is having dinner!', 4, 10, true);

  -- Mindfulness & Wellbeing topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_mindfulness, 'Gratitude', 'Being thankful makes us happier! Learn to notice the good things in your day — a kind friend, a yummy meal, a beautiful sunset. Practicing gratitude helps your heart feel warm and full.', 3, 12, true),
    (cat_mindfulness, 'Breathing & Meditation', 'Take a deep breath in... and slowly let it out. Learn simple breathing exercises and meditation techniques that help you feel calm, focused, and peaceful — anytime, anywhere.', 3, 12, true),
    (cat_mindfulness, 'Empathy', 'Empathy means understanding how someone else feels. Learn to put yourself in another person''s shoes, be a better listener, and discover that kindness starts with trying to understand others.', 4, 12, true),
    (cat_mindfulness, 'Dealing with Change', 'Moving to a new school, a new sibling, or a new home — change can feel scary. Learn that change is a normal part of life, and discover ways to feel brave and hopeful about new beginnings.', 4, 12, true),
    (cat_mindfulness, 'Patience', 'Good things take time! Learn why waiting can be hard, discover fun ways to practice patience, and understand that some of the best things in life are worth waiting for.', 3, 10, true),
    (cat_mindfulness, 'Positive Thinking', 'Your thoughts are powerful! Learn how to turn negative thoughts into positive ones, practice self-encouragement, and discover that believing in yourself is the first step to achieving anything.', 4, 12, true);

  -- Everyday Learning topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_everyday, 'Telling Time', 'What time is breakfast? When does school start? Learn to read clocks, understand morning and afternoon, and plan your day. Knowing the time helps you be ready for all the fun ahead!', 3, 8, true),
    (cat_everyday, 'Colors & Mixing', 'Red and blue make purple — magic! Explore primary and secondary colors, learn about warm and cool colors, and discover how artists and nature use colors to create beautiful things.', 3, 8, true),
    (cat_everyday, 'Days & Months', 'Monday, Tuesday, Wednesday... January, February, March! Learn the days of the week, months of the year, and understand how calendars help us plan birthdays, holidays, and fun events.', 3, 8, true),
    (cat_everyday, 'Alphabet & Phonics', 'A-B-C-D-E-F-G! Letters are the building blocks of words. Learn the sounds each letter makes, discover how letters combine to form words, and start your journey to reading and writing.', 3, 7, true),
    (cat_everyday, 'Seasons', 'Spring flowers, summer sunshine, autumn leaves, winter snow! Learn why seasons change, what happens to animals and plants in each season, and what makes each time of year special.', 3, 8, true),
    (cat_everyday, 'Good Habits', 'Brush your teeth, tidy your room, eat your veggies! Learn about healthy daily routines and habits that help you grow strong, stay organized, and feel great every day.', 3, 10, true);

  -- Technology & Future topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_technology, 'How the Internet Works', 'How does a video get from the other side of the world to your screen in seconds? Discover how the internet connects billions of people, what websites are, and how data travels through cables and satellites.', 6, 12, true),
    (cat_technology, 'Video Games & Screen Time', 'Video games can be fun and even educational! Learn about how games are made, why taking breaks is important, and how to balance screen time with outdoor play and other activities.', 5, 12, true),
    (cat_technology, 'Electric Cars & Green Energy', 'Cars that run on electricity? Energy from the sun and wind? Discover how technology is helping us take care of our planet with clean energy and cool inventions for a greener future.', 5, 12, true),
    (cat_technology, 'AI & Smart Assistants', 'Hey Siri! OK Google! Learn what artificial intelligence means, how smart assistants understand your voice, and imagine how AI might help people in the future. You are talking to one right now!', 6, 12, true);

  -- Careers & Dreams topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_careers, 'Doctors & Nurses', 'Doctors and nurses are everyday heroes! Learn how they help people get better, what happens at a hospital, and the amazing tools they use. Maybe one day you will save lives too!', 3, 10, true),
    (cat_careers, 'Firefighters & Police', 'When there is an emergency, firefighters and police officers are there to help! Learn about their brave work, the equipment they use, and how they keep our communities safe every day.', 3, 10, true),
    (cat_careers, 'Teachers', 'Teachers help us learn and grow! Discover what it takes to be a teacher, how they plan lessons, and why they love helping children discover new things. Who is your favorite teacher?', 3, 10, true),
    (cat_careers, 'Astronauts', 'Imagine floating in space! Astronauts train for years to explore beyond Earth. Learn about life on the International Space Station, spacewalks, and what it takes to become a real space explorer.', 4, 12, true),
    (cat_careers, 'Chefs', 'Chefs create delicious meals that make people happy! Learn about cooking techniques, famous cuisines from around the world, and how creativity in the kitchen turns simple ingredients into amazing dishes.', 3, 10, true),
    (cat_careers, 'What Do You Want to Be?', 'The world is full of amazing jobs — scientists, artists, engineers, athletes, musicians, and so many more! Explore different careers and start dreaming about what you want to be when you grow up.', 3, 12, true);

  -- Food & Cooking topics
  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    (cat_food, 'Where Food Comes From', 'Before food reaches your plate, it goes on an amazing journey! Learn how fruits grow on trees, vegetables come from the ground, and milk comes from cows. Understand farm to table!', 3, 10, true),
    (cat_food, 'Baking Basics', 'Flour, sugar, eggs, and a pinch of love! Learn the basics of baking — how to make cookies, cakes, and bread. Discover why we measure ingredients and what makes dough rise.', 4, 12, true),
    (cat_food, 'Fruits & Vegetables', 'Eat the rainbow! Learn about different fruits and vegetables, their colors, flavors, and the vitamins they give your body. Discover exotic fruits from around the world and why veggies make you strong.', 3, 10, true),
    (cat_food, 'Food Around the World', 'Sushi from Japan, tacos from Mexico, pasta from Italy! Every country has special dishes that tell a story about its culture. Take a delicious trip around the world without leaving your seat!', 4, 12, true),
    (cat_food, 'Kitchen Safety', 'The kitchen is a fun place but safety comes first! Learn about handling sharp objects carefully, what to do around hot stoves, washing hands before cooking, and keeping the kitchen clean.', 4, 12, true);

END $$;
