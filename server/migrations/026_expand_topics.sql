-- Migration 026: Expand topics with more entries and richer descriptions
-- Adds topics to empty categories and enriches existing topic descriptions

-- Update existing topic descriptions with richer pre-generated content
UPDATE topics SET description = 'Dinosaurs roamed the Earth millions of years ago! From the mighty T-Rex to the gentle Brachiosaurus, discover how they lived, what they ate, and why they disappeared. Did you know some dinosaurs had feathers?' WHERE name = 'Dinosaurs';
UPDATE topics SET description = 'Dive into the deep blue ocean! Meet whales, dolphins, sharks, jellyfish, and colorful coral reef fish. Learn how sea creatures breathe underwater, how deep the ocean goes, and what bioluminescence means.' WHERE name = 'Ocean Animals';
UPDATE topics SET description = 'Pets are our best friends! Learn how to care for dogs, cats, fish, hamsters, and more. Understand what they need to stay happy and healthy, and why animals love us back.' WHERE name = 'Pets';
UPDATE topics SET description = 'Why does it rain? What makes a rainbow? Explore the magic of weather — from thunderstorms and snowflakes to sunshine and wind. Learn about seasons and how weather changes around the world.' WHERE name = 'Weather';
UPDATE topics SET description = 'Blast off into space! Visit planets, zoom past stars, and learn about astronauts who explore beyond Earth. Discover black holes, galaxies, and whether life could exist on other planets.' WHERE name = 'Space';
UPDATE topics SET description = 'Robots are everywhere — from factories to homes! Learn how they work, what AI means, and imagine the robots of the future. Could you build your own robot one day?' WHERE name = 'Robots';
UPDATE topics SET description = 'Science is all about asking questions and finding answers! Try fun experiments with water, light, magnets, and everyday items. Learn the scientific method and think like a real scientist.' WHERE name = 'Experiments';
UPDATE topics SET description = 'Happiness comes in many forms — a hug, a sunny day, or finishing something you worked hard on. Explore what makes you happy, how to spread joy, and why gratitude matters.' WHERE name = 'Feeling Happy';
UPDATE topics SET description = 'Everyone feels scared sometimes, and that is completely okay! Learn about different fears, why our body reacts the way it does, and brave ways to face things that feel scary.' WHERE name = 'Feeling Scared';
UPDATE topics SET description = 'Friends make life wonderful! Learn how to make new friends, be a good friend, handle disagreements, and understand that everyone is different — and that is what makes friendships special.' WHERE name = 'Making Friends';
UPDATE topics SET description = 'Being brave does not mean never being afraid — it means doing something even when it feels hard. Discover stories of courage, learn to try new things, and celebrate your own bravery.' WHERE name = 'Being Brave';
UPDATE topics SET description = 'Enter the world of friendly dragons! Imagine flying on their backs, discovering hidden caves, and learning that even the fiercest creatures can be kind. What would your dragon look like?' WHERE name = 'Dragons';
UPDATE topics SET description = 'Every superhero has a story! Explore what it means to be a hero — having courage, helping others, and standing up for what is right. What superpower would you choose?' WHERE name = 'Superheroes';
UPDATE topics SET description = 'Once upon a time... Step into magical worlds with princes, princesses, talking animals, and enchanted forests. Classic fairy tales teach us about kindness, cleverness, and happy endings.' WHERE name = 'Fairy Tales';

-- Add new topics to existing categories
DO $$
DECLARE
  cat_animals uuid;
  cat_science uuid;
  cat_emotions uuid;
  cat_fantasy uuid;
  cat_history uuid;
  cat_arts uuid;
  cat_family uuid;
  cat_health uuid;
BEGIN
  SELECT id INTO cat_animals FROM topic_categories WHERE name = 'Animals & Nature';
  SELECT id INTO cat_science FROM topic_categories WHERE name = 'Science & Space';
  SELECT id INTO cat_emotions FROM topic_categories WHERE name = 'Emotions & Feelings';
  SELECT id INTO cat_fantasy FROM topic_categories WHERE name = 'Adventure & Fantasy';
  SELECT id INTO cat_history FROM topic_categories WHERE name = 'History & Culture';
  SELECT id INTO cat_arts FROM topic_categories WHERE name = 'Arts & Creativity';
  SELECT id INTO cat_family FROM topic_categories WHERE name = 'Family & Friends';
  SELECT id INTO cat_health FROM topic_categories WHERE name = 'Health & Body';

  INSERT INTO topics (category_id, name, description, age_appropriate_min, age_appropriate_max, is_default) VALUES
    -- Additional Animals & Nature
    (cat_animals, 'Insects & Bugs', 'Tiny creatures, big world! Discover butterflies, ants, bees, ladybugs, and fireflies. Learn how insects help our planet, why bees are so important, and how a caterpillar becomes a butterfly.', 3, 10, true),
    (cat_animals, 'Rainforest', 'Explore the lush, green rainforest! Meet toucans, jaguars, tree frogs, and monkeys swinging through the trees. Learn why rainforests are called the lungs of the Earth.', 4, 12, true),
    (cat_animals, 'Farm Animals', 'Visit the farm! Meet cows, chickens, pigs, horses, and sheep. Learn where our food comes from and how farmers care for their animals every day.', 3, 8, true),

    -- Additional Science & Space
    (cat_science, 'Volcanoes & Earthquakes', 'The Earth is alive under our feet! Learn how volcanoes erupt, why earthquakes happen, and discover the fiery core at the center of our planet.', 5, 12, true),
    (cat_science, 'Human Body', 'Your body is an amazing machine! Discover how your heart pumps blood, how your brain thinks, why you need sleep, and what happens when you eat food.', 4, 12, true),
    (cat_science, 'Inventions', 'From the wheel to the internet — humans are incredible inventors! Learn about amazing inventions that changed the world and imagine what you could invent one day.', 5, 12, true),

    -- Additional Emotions & Feelings
    (cat_emotions, 'Dealing with Anger', 'Feeling angry is normal, but learning to manage it is a superpower! Discover calming techniques, understand what triggers anger, and learn healthy ways to express big feelings.', 3, 12, true),
    (cat_emotions, 'Feeling Sad', 'Sadness is a part of life, and it is okay to cry sometimes. Learn that sad feelings pass, how to comfort yourself and others, and that asking for help is always brave.', 3, 12, true),
    (cat_emotions, 'Self-Confidence', 'You are amazing just the way you are! Learn to believe in yourself, celebrate your strengths, accept your mistakes, and understand that everyone grows at their own pace.', 4, 12, true),

    -- Additional Adventure & Fantasy
    (cat_fantasy, 'Pirates & Treasure', 'Ahoy, matey! Sail the seven seas, search for buried treasure, and explore mysterious islands. Learn about maps, compasses, and the exciting life of adventure on the ocean.', 3, 10, true),
    (cat_fantasy, 'Magical Creatures', 'Unicorns, phoenixes, mermaids, and griffins! Dive into the world of mythical beings from stories around the globe. What magical creature would you want as a friend?', 3, 10, true),
    (cat_fantasy, 'Time Travel', 'What if you could travel through time? Visit ancient Egypt, see real dinosaurs, or zoom into the future! Explore the exciting idea of time travel and what you would do.', 5, 12, true),

    -- History & Culture (previously empty)
    (cat_history, 'Ancient Egypt', 'Discover the land of pharaohs and pyramids! Learn about mummies, hieroglyphics, the River Nile, and how ancient Egyptians built incredible monuments thousands of years ago.', 5, 12, true),
    (cat_history, 'World Festivals', 'Every culture celebrates in unique ways! Explore Diwali, Eid, Christmas, Chinese New Year, Hanukkah, and more. Learn what makes each festival special and how people celebrate around the world.', 3, 12, true),
    (cat_history, 'Famous Explorers', 'Brave explorers discovered new lands, climbed the highest mountains, and sailed across oceans. Learn about their incredible journeys and the courage it took to explore the unknown.', 5, 12, true),
    (cat_history, 'Castles & Knights', 'Step back in time to the age of castles, knights, and kingdoms! Learn about drawbridges, armor, and the code of chivalry. What would life be like in a medieval castle?', 4, 12, true),
    (cat_history, 'Traditions Around the World', 'People around the world have amazing traditions — from Japanese tea ceremonies to African drumming circles. Discover how different cultures express their values through customs and rituals.', 4, 12, true),

    -- Arts & Creativity (previously empty)
    (cat_arts, 'Drawing & Painting', 'Express yourself with colors and shapes! Learn about different art styles, famous painters, and fun techniques to create your own masterpieces. Every artist started with a single line.', 3, 12, true),
    (cat_arts, 'Music & Instruments', 'Music is everywhere! Discover different instruments — drums, piano, guitar, flute, and more. Learn about rhythm, melody, and how music can change the way you feel.', 3, 12, true),
    (cat_arts, 'Dance & Movement', 'Move your body to the beat! Explore ballet, hip-hop, folk dances, and freestyle. Dancing is a wonderful way to express yourself and have fun.', 3, 12, true),
    (cat_arts, 'Creative Writing', 'Everyone has a story to tell! Learn how to write your own stories, poems, and songs. Discover the power of imagination and how words can create entire worlds.', 5, 12, true),
    (cat_arts, 'Crafts & Building', 'Make amazing things with your hands! From origami and clay to building models and recycled art. Crafting teaches patience, creativity, and problem-solving.', 3, 12, true),

    -- Family & Friends (previously empty)
    (cat_family, 'Being a Good Friend', 'Good friends listen, share, and care about each other. Learn what makes a friendship strong, how to be there for someone, and how to handle it when friends disagree.', 3, 12, true),
    (cat_family, 'Brothers & Sisters', 'Having siblings can be fun and challenging! Learn about sharing, taking turns, resolving fights, and why your brothers and sisters can become your lifelong best friends.', 3, 12, true),
    (cat_family, 'Grandparents', 'Grandparents are treasure chests of stories and wisdom! Learn about respecting elders, the special bond with grandparents, and how families carry traditions through generations.', 3, 12, true),
    (cat_family, 'Teamwork', 'Together everyone achieves more! Learn how to work as a team, listen to others ideas, share responsibilities, and celebrate success together.', 4, 12, true),
    (cat_family, 'Kindness & Sharing', 'A small act of kindness can make a big difference! Learn why sharing matters, how to be generous, and how being kind to others makes you feel good too.', 3, 12, true),

    -- Health & Body (previously empty)
    (cat_health, 'Healthy Eating', 'Food is fuel for your body! Learn about fruits, vegetables, proteins, and why a colorful plate is a healthy plate. Discover how different foods help you grow strong and smart.', 3, 12, true),
    (cat_health, 'Exercise & Sports', 'Running, jumping, swimming, and playing — exercise keeps your body strong and your mind sharp! Explore different sports and find activities you love.', 3, 12, true),
    (cat_health, 'Sleep & Rest', 'Sleep is your body''s superpower! Learn why you need rest, what happens to your brain while you sleep, and how to build a bedtime routine that helps you feel great.', 3, 12, true),
    (cat_health, 'Hygiene & Cleanliness', 'Keeping clean keeps you healthy! Learn about brushing teeth, washing hands, bathing, and why good hygiene habits protect you and everyone around you.', 3, 10, true),
    (cat_health, 'Feelings & Your Body', 'Your body and feelings are connected! Learn why your tummy hurts when you are nervous, why you blush when embarrassed, and how deep breathing can calm your whole body.', 4, 12, true)
  ON CONFLICT DO NOTHING;
END $$;
