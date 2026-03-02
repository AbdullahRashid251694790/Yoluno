-- Seed template steps for the 6 templates that are missing steps

-- Reading Adventure (14 days, learning)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Reading Adventure' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Pick Your Book', 'Choose a book that excites you', 'activity', '{"tip": "Pick something with a fun cover or a topic you love!"}', 10),
      (tid, 2, 'Read for 15 Minutes', 'Find a cozy spot and read for 15 minutes', 'activity', '{"tip": "Set a timer so you can focus fully"}', 15),
      (tid, 3, 'What Happened So Far?', 'Tell someone about what you read', 'reflection', '{"prompt": "Who is the main character? What are they doing?"}', 5),
      (tid, 4, 'Read a New Chapter', 'Keep going with your book today', 'activity', '{"tip": "Try reading a little longer today!"}', 20),
      (tid, 5, 'Favorite Part', 'Draw or write about your favorite part so far', 'reflection', '{"prompt": "What was the most exciting or funny moment?"}', 10),
      (tid, 6, 'Halfway There!', 'You have been reading for a whole week!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 7, 'Read to Someone', 'Read a page out loud to a family member or pet', 'activity', '{"tip": "Use different voices for different characters!"}', 15),
      (tid, 8, 'New Word Explorer', 'Find 3 new words and look up what they mean', 'activity', '{"tip": "Start your own word collection!"}', 10),
      (tid, 9, 'Story Prediction', 'Guess what will happen next in your book', 'reflection', '{"prompt": "Were your earlier guesses right?"}', 5),
      (tid, 10, 'Finish Strong', 'Read the final chapters of your book', 'activity', '{"tip": "Find a quiet time to enjoy the ending"}', 20),
      (tid, 11, 'Book Review', 'Write a mini review: would you recommend this book?', 'reflection', '{"prompt": "Rate it 1-5 stars and say why!"}', 10),
      (tid, 12, 'Reading Adventurer!', 'You completed the reading adventure!', 'milestone', '{"celebration": "badge", "badge": "reading_adventurer"}', 5);
  END IF;
END $$;

-- Healthy Body (7 days, health)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Healthy Body' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Water Champion', 'Drink 6 glasses of water today', 'activity', '{"tip": "Add a slice of fruit for flavor!"}', 5),
      (tid, 2, 'Move Your Body', 'Do 10 minutes of your favorite exercise', 'activity', '{"exercises": ["dancing", "jumping jacks", "running", "yoga"]}', 10),
      (tid, 3, 'How Do You Feel?', 'Notice how exercise makes your body feel', 'reflection', '{"prompt": "Do you feel more energized after moving?"}', 5),
      (tid, 4, 'Rainbow Plate', 'Eat fruits or veggies of 3 different colors today', 'activity', '{"tip": "Red, green, orange — can you find all the colors?"}', 10),
      (tid, 5, 'Halfway Healthy!', 'You are building great habits!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 6, 'Rest and Recharge', 'Go to bed 15 minutes earlier tonight', 'activity', '{"tip": "No screens 30 minutes before bed helps you sleep better"}', 5),
      (tid, 7, 'Healthy Body Hero!', 'You completed the healthy body journey!', 'milestone', '{"celebration": "badge", "badge": "healthy_hero"}', 5);
  END IF;
END $$;

-- Creative Explorer (10 days, creativity)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Creative Explorer' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Doodle Time', 'Draw anything that comes to mind for 10 minutes', 'activity', '{"tip": "There are no mistakes in art — just happy accidents!"}', 10),
      (tid, 2, 'Color Your World', 'Create something using only 3 colors', 'activity', '{"tip": "Try unusual color combinations!"}', 15),
      (tid, 3, 'What Did You Create?', 'Show someone what you made and tell them about it', 'reflection', '{"prompt": "What inspired your creation?"}', 5),
      (tid, 4, 'Build Something', 'Use blocks, boxes, or craft materials to build something', 'activity', '{"tip": "Recycle cardboard boxes into amazing creations!"}', 20),
      (tid, 5, 'Halfway Creative!', 'Your imagination is growing stronger!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 6, 'Story Inventor', 'Make up a short story with a beginning, middle, and end', 'activity', '{"tip": "Start with What if...?"}', 15),
      (tid, 7, 'Music Maker', 'Create a song or rhythm using household items', 'activity', '{"tip": "Pots, spoons, and boxes make great instruments!"}', 10),
      (tid, 8, 'Nature Art', 'Go outside and create art using leaves, sticks, or stones', 'activity', '{"tip": "Take a photo of your creation before you leave!"}', 20),
      (tid, 9, 'Creative Reflection', 'Which creative activity was your favorite and why?', 'reflection', '{"prompt": "What would you like to try next?"}', 5),
      (tid, 10, 'Creative Explorer!', 'You unlocked your creative superpowers!', 'milestone', '{"celebration": "badge", "badge": "creative_explorer"}', 5);
  END IF;
END $$;

-- Gratitude Garden (7 days, social)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Gratitude Garden' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Three Good Things', 'Name 3 things you are grateful for today', 'activity', '{"tip": "They can be big or small — even a yummy snack counts!"}', 5),
      (tid, 2, 'Thank Someone', 'Say thank you to someone and tell them why', 'activity', '{"tip": "Be specific about what you appreciate"}', 5),
      (tid, 3, 'Gratitude Drawing', 'Draw a picture of something that makes you happy', 'activity', '{"tip": "Hang it up where you can see it every day!"}', 10),
      (tid, 4, 'Gratitude Check-In', 'How does being grateful make you feel?', 'reflection', '{"prompt": "Has noticing good things changed your day?"}', 5),
      (tid, 5, 'Halfway Growing!', 'Your gratitude garden is blooming!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 6, 'Gratitude Letter', 'Write a short letter to someone you appreciate', 'activity', '{"tip": "You can give it to them or keep it for yourself"}', 10),
      (tid, 7, 'Gratitude Gardener!', 'You grew a beautiful gratitude garden!', 'milestone', '{"celebration": "badge", "badge": "gratitude_gardener"}', 5);
  END IF;
END $$;

-- Science Discovery (10 days, learning)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Science Discovery' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Question of the Day', 'Ask a "why" or "how" question about something you see', 'activity', '{"tip": "Great scientists start by being curious!"}', 5),
      (tid, 2, 'Kitchen Scientist', 'Mix baking soda and vinegar and observe what happens', 'activity', '{"tip": "Add food coloring for a colorful reaction!", "materials": ["baking soda", "vinegar", "cup"]}', 15),
      (tid, 3, 'What Did You Discover?', 'Write or draw what happened in your experiment', 'reflection', '{"prompt": "Why do you think that happened?"}', 10),
      (tid, 4, 'Nature Detective', 'Go outside and observe 5 different living things', 'activity', '{"tip": "Look closely — bugs, plants, and birds all count!"}', 15),
      (tid, 5, 'Halfway Scientist!', 'You are thinking like a real scientist!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 6, 'Magnet Explorer', 'Test 10 objects to see which ones are magnetic', 'activity', '{"tip": "Make a chart: magnetic vs not magnetic"}', 15),
      (tid, 7, 'Water Experiment', 'Test which objects float and which sink in water', 'activity', '{"tip": "Try different sizes and materials!"}', 15),
      (tid, 8, 'Shadow Tracker', 'Trace your shadow at 3 different times of day', 'activity', '{"tip": "Notice how the shadow moves and changes size"}', 10),
      (tid, 9, 'Science Journal', 'Write about your favorite experiment and what you learned', 'reflection', '{"prompt": "What surprised you the most?"}', 10),
      (tid, 10, 'Science Discoverer!', 'You explored the wonders of science!', 'milestone', '{"celebration": "badge", "badge": "science_discoverer"}', 5);
  END IF;
END $$;

-- Mindfulness Journey (7 days, health)
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM journey_templates WHERE title = 'Mindfulness Journey' LIMIT 1;
  IF tid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM journey_template_steps WHERE template_id = tid) THEN
    INSERT INTO journey_template_steps (template_id, step_order, title, description, type, content, estimated_minutes) VALUES
      (tid, 1, 'Belly Breathing', 'Take 5 slow deep breaths, feeling your belly rise and fall', 'activity', '{"tip": "Put a stuffed animal on your belly and watch it go up and down!"}', 5),
      (tid, 2, 'Listening Game', 'Close your eyes for 1 minute and count all the sounds you hear', 'activity', '{"tip": "You might be surprised how many sounds are around you!"}', 5),
      (tid, 3, 'How Do You Feel?', 'Check in with your body and emotions right now', 'reflection', '{"prompt": "Where do you feel calm? Where do you feel tense?"}', 5),
      (tid, 4, 'Mindful Eating', 'Eat one snack very slowly, noticing every taste and texture', 'activity', '{"tip": "Try a raisin or a piece of chocolate — really taste it!"}', 10),
      (tid, 5, 'Halfway Mindful!', 'You are learning to be present!', 'milestone', '{"celebration": "confetti"}', 2),
      (tid, 6, 'Gratitude Moment', 'Before bed, think of 3 things from today that made you smile', 'activity', '{"tip": "This helps your brain focus on the good stuff!"}', 5),
      (tid, 7, 'Mindfulness Master!', 'You completed the mindfulness journey!', 'milestone', '{"celebration": "badge", "badge": "mindfulness_master"}', 5);
  END IF;
END $$;
