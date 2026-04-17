-- Add keywords for topics that were missed in migration 060,
-- including common misspelling variants for important topics.

UPDATE topics SET search_keywords = ARRAY[
  'dinosaur', 'dinosaurs', 'dino', 'trex', 't-rex', 't rex',
  'tyrannosaurus', 'brachiosaurus', 'velociraptor', 'stegosaurus',
  'triceratops', 'pterodactyl', 'prehistoric', 'jurassic',
  'fossil', 'extinct', 'raptor'
] WHERE name = 'Dinosaurs';

UPDATE topics SET search_keywords = ARRAY[
  'pet', 'pets', 'dog', 'cat', 'hamster', 'rabbit', 'fish',
  'bird', 'puppy', 'kitten', 'animal care', 'vet', 'veterinarian'
] WHERE name = 'Pets' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'wildlife', 'wild animal', 'lion', 'tiger', 'elephant', 'giraffe',
  'zebra', 'bear', 'wolf', 'safari', 'jungle animal'
] WHERE name = 'Wildlife' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'ocean life', 'sea creature', 'whale', 'dolphin', 'shark',
  'octopus', 'jellyfish', 'coral', 'marine', 'underwater'
] WHERE name = 'Ocean Life' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'insect', 'bug', 'butterfly', 'bee', 'ant', 'spider',
  'beetle', 'caterpillar', 'ladybug', 'dragonfly', 'mosquito'
] WHERE name = 'Insects' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'habitat', 'ecosystem', 'forest', 'desert', 'ocean',
  'arctic', 'grassland', 'wetland', 'where animals live'
] WHERE name = 'Habitats' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'fairy tale', 'fairy tales', 'once upon a time', 'princess',
  'prince', 'castle', 'magic', 'enchanted', 'happily ever after'
] WHERE name = 'Fairy Tales' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'superhero', 'super hero', 'superpower', 'cape', 'villain',
  'save the world', 'hero', 'power', 'marvel', 'dc'
] WHERE name = 'Superheroes' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'treasure hunt', 'treasure', 'pirate', 'map', 'buried treasure',
  'adventure', 'quest', 'explore', 'hidden', 'clue'
] WHERE name = 'Treasure Hunts' AND search_keywords = '{}';

UPDATE topics SET search_keywords = ARRAY[
  'mythical creature', 'dragon', 'unicorn', 'phoenix', 'griffin',
  'mermaid', 'pegasus', 'centaur', 'fairy', 'troll', 'elf'
] WHERE name = 'Mythical Creatures' AND search_keywords = '{}';

-- Catch any remaining topics with empty keywords
UPDATE topics SET search_keywords = ARRAY[LOWER(name)]
WHERE search_keywords = '{}' OR search_keywords IS NULL;
