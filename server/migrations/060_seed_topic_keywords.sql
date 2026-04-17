-- Seed search_keywords for all topics so natural-language matching works.
-- Each topic gets an array of short phrases/synonyms that a child might
-- use when talking about that subject.

-- Helper: update by topic name (idempotent — runs on every deploy safely)
-- British Curriculum: English
UPDATE topics SET search_keywords = ARRAY['phonics','reading','letters','sounds','blend','digraph','book','read aloud','story time','sounding out'] WHERE name = 'Phonics & Reading (KS1)';
UPDATE topics SET search_keywords = ARRAY['spelling','grammar','punctuation','full stop','comma','apostrophe','capital letter','sentence','noun','verb','adjective'] WHERE name = 'Spelling & Grammar (KS1-2)';
UPDATE topics SET search_keywords = ARRAY['creative writing','write a story','make up a story','story writing','poem','character','setting','plot','imagination','narrative'] WHERE name = 'Creative Writing';
UPDATE topics SET search_keywords = ARRAY['comprehension','reading','understand','text','fiction','non-fiction','predict','summarise','inference','main idea'] WHERE name = 'Comprehension & Reading Skills';
UPDATE topics SET search_keywords = ARRAY['poetry','poem','rhyme','rhythm','haiku','limerick','verse','recite','perform','spoken word'] WHERE name = 'Poetry & Performance';
UPDATE topics SET search_keywords = ARRAY['shakespeare','romeo','juliet','hamlet','classic literature','playwright','elizabethan','macbeth','midsummer'] WHERE name = 'Shakespeare & Classic Literature (KS3)';
UPDATE topics SET search_keywords = ARRAY['non-fiction','report','newspaper','persuasive','letter','instruction','explanation','formal writing','article'] WHERE name = 'Non-Fiction Writing';

-- British Curriculum: Maths
UPDATE topics SET search_keywords = ARRAY['number','place value','ones','tens','hundreds','thousands','millions','counting','ordering','rounding'] WHERE name = 'Number & Place Value';
UPDATE topics SET search_keywords = ARRAY['addition','subtraction','add','subtract','plus','minus','take away','sum','difference','mental maths'] WHERE name = 'Addition & Subtraction';
UPDATE topics SET search_keywords = ARRAY['multiplication','division','times table','multiply','divide','product','quotient','long multiplication','remainder'] WHERE name = 'Multiplication & Division';
UPDATE topics SET search_keywords = ARRAY['fraction','decimal','percentage','half','quarter','third','numerator','denominator','convert','percent'] WHERE name = 'Fractions, Decimals & Percentages';
UPDATE topics SET search_keywords = ARRAY['measurement','measure','length','weight','mass','volume','capacity','metres','centimetres','litres','kilograms'] WHERE name = 'Measurement';
UPDATE topics SET search_keywords = ARRAY['geometry','shape','triangle','square','circle','cube','sphere','angle','symmetry','coordinates','3d shape'] WHERE name = 'Geometry: Shapes & Space';
UPDATE topics SET search_keywords = ARRAY['statistics','data','bar chart','pie chart','graph','table','mean','median','mode','range','tally'] WHERE name = 'Statistics & Data';
UPDATE topics SET search_keywords = ARRAY['algebra','equation','variable','formula','sequence','pattern','solve','unknown','expression'] WHERE name = 'Algebra (KS2-3)';
UPDATE topics SET search_keywords = ARRAY['ratio','proportion','scale','recipe','enlarge','reduce','equivalent','unitary method'] WHERE name = 'Ratio & Proportion (KS3)';

-- British Curriculum: Science
UPDATE topics SET search_keywords = ARRAY['plant','flower','seed','root','stem','leaf','photosynthesis','grow','germinate','living thing','tree'] WHERE name = 'Plants & Living Things';
UPDATE topics SET search_keywords = ARRAY['animal','human','body','skeleton','muscle','heart','lung','digest','teeth','nutrition','organ'] WHERE name = 'Animals Including Humans';
UPDATE topics SET search_keywords = ARRAY['material','property','solid','liquid','gas','metal','wood','plastic','dissolve','transparent','waterproof'] WHERE name = 'Materials & Their Properties';
UPDATE topics SET search_keywords = ARRAY['force','magnet','push','pull','friction','gravity','attract','repel','magnetic','spring'] WHERE name = 'Forces & Magnets';
UPDATE topics SET search_keywords = ARRAY['light','shadow','dark','reflect','mirror','sound','vibration','pitch','volume','ear','eye'] WHERE name = 'Light & Sound';
UPDATE topics SET search_keywords = ARRAY['electricity','circuit','battery','bulb','wire','switch','conductor','insulator','voltage','current'] WHERE name = 'Electricity & Circuits';
UPDATE topics SET search_keywords = ARRAY['earth','space','planet','moon','sun','star','orbit','solar system','galaxy','astronaut','rocket'] WHERE name = 'Earth & Space';
UPDATE topics SET search_keywords = ARRAY['evolution','inheritance','adapt','fossil','darwin','natural selection','species','trait','gene','ancestor'] WHERE name = 'Evolution & Inheritance';
UPDATE topics SET search_keywords = ARRAY['chemistry','atom','molecule','element','reaction','compound','periodic table','acid','alkali','chemical'] WHERE name = 'Chemistry: Atoms & Reactions (KS3)';
UPDATE topics SET search_keywords = ARRAY['physics','energy','wave','heat','transfer','kinetic','potential','frequency','wavelength'] WHERE name = 'Physics: Energy & Waves (KS3)';
UPDATE topics SET search_keywords = ARRAY['biology','cell','organ','tissue','system','respiratory','circulatory','digestive','nervous','reproduction'] WHERE name = 'Biology: Cells & Body Systems (KS3)';

-- British Curriculum: History
UPDATE topics SET search_keywords = ARRAY['stone age','iron age','bronze age','prehistoric','cave','hunter','gatherer','neolithic','stonehenge'] WHERE name = 'Stone Age to Iron Age';
UPDATE topics SET search_keywords = ARRAY['ancient egypt','pharaoh','pyramid','mummy','nile','hieroglyphic','tutankhamun','cleopatra','sphinx'] WHERE name = 'Ancient Egypt';
UPDATE topics SET search_keywords = ARRAY['ancient greece','greek','athens','sparta','olympics','mythology','zeus','hercules','democracy','parthenon'] WHERE name = 'Ancient Greece';
UPDATE topics SET search_keywords = ARRAY['roman','rome','emperor','gladiator','colosseum','legion','road','bath','julius caesar','invasion'] WHERE name = 'The Romans in Britain';
UPDATE topics SET search_keywords = ARRAY['anglo-saxon','viking','raid','longship','rune','alfred','danelaw','norse','saga'] WHERE name = 'Anglo-Saxons & Vikings';
UPDATE topics SET search_keywords = ARRAY['tudor','henry viii','elizabeth','throne','reformation','exploration','shakespeare','dynasty'] WHERE name = 'The Tudors';
UPDATE topics SET search_keywords = ARRAY['industrial revolution','factory','steam','engine','cotton','coal','mine','railway','invention','victorian'] WHERE name = 'The Industrial Revolution';
UPDATE topics SET search_keywords = ARRAY['world war','ww1','ww2','trench','blitz','evacuee','hitler','soldier','armistice','holocaust','d-day'] WHERE name = 'World War I & World War II';
UPDATE topics SET search_keywords = ARRAY['medieval','castle','knight','feudal','crusade','plague','black death','king','lord','serf'] WHERE name = 'Medieval Britain (KS3)';
UPDATE topics SET search_keywords = ARRAY['british empire','colony','colonialism','slave trade','commonwealth','independence','imperialism'] WHERE name = 'The British Empire & Its Legacy (KS3)';

-- British Curriculum: Geography
UPDATE topics SET search_keywords = ARRAY['map','atlas','globe','compass','grid reference','scale','symbol','key','legend','direction'] WHERE name = 'Maps & Atlases';
UPDATE topics SET search_keywords = ARRAY['weather','climate','rain','wind','temperature','forecast','season','cloud','storm','drought'] WHERE name = 'Weather & Climate';
UPDATE topics SET search_keywords = ARRAY['river','coast','erosion','waterfall','meander','estuary','cliff','beach','delta','flood'] WHERE name = 'Rivers & Coasts';
UPDATE topics SET search_keywords = ARRAY['volcano','earthquake','tectonic','plate','lava','magma','erupt','seismic','tsunami','ring of fire'] WHERE name = 'Volcanoes & Earthquakes';
UPDATE topics SET search_keywords = ARRAY['united kingdom','england','scotland','wales','northern ireland','london','british','uk','capital'] WHERE name = 'The United Kingdom';
UPDATE topics SET search_keywords = ARRAY['compare','country','continent','culture','population','language','tradition','different places'] WHERE name = 'Comparing Places Around the World';
UPDATE topics SET search_keywords = ARRAY['rainforest','desert','sahara','amazon','tropical','arid','biome','canopy','sand','oasis'] WHERE name = 'Rainforests & Deserts';
UPDATE topics SET search_keywords = ARRAY['sustainability','environment','recycle','pollution','carbon','climate change','green','renewable','conservation'] WHERE name = 'Sustainability & Environment (KS3)';

-- British Curriculum: DT & Computing
UPDATE topics SET search_keywords = ARRAY['design','make','build','construct','prototype','model','plan','evaluate','improve'] WHERE name = 'Designing & Making';
UPDATE topics SET search_keywords = ARRAY['mechanism','gear','lever','pulley','cam','structure','bridge','framework','axle'] WHERE name = 'Mechanisms & Structures';
UPDATE topics SET search_keywords = ARRAY['food','nutrition','cooking','recipe','healthy eating','diet','vegetable','fruit','bake','ingredient'] WHERE name = 'Food & Nutrition';
UPDATE topics SET search_keywords = ARRAY['textile','fabric','sew','stitch','pattern','weave','knit','fashion','cloth'] WHERE name = 'Textiles';
UPDATE topics SET search_keywords = ARRAY['electronics','control','sensor','motor','circuit board','microcontroller','arduino','input','output'] WHERE name = 'Electronics & Control (KS3)';
UPDATE topics SET search_keywords = ARRAY['algorithm','code','coding','program','sequence','loop','debug','instruction','computational thinking'] WHERE name = 'Algorithms & Coding Basics';
UPDATE topics SET search_keywords = ARRAY['scratch','block code','sprite','animation','game','drag and drop','event','broadcast'] WHERE name = 'Scratch & Block Coding';
UPDATE topics SET search_keywords = ARRAY['online safety','internet safety','digital literacy','password','privacy','cyberbullying','safe online','screen time','digital footprint','secure on internet','stranger online'] WHERE name = 'Online Safety & Digital Literacy';
UPDATE topics SET search_keywords = ARRAY['programming','python','javascript','text code','variable','function','class','syntax','debug'] WHERE name = 'Text-Based Programming (KS3)';
UPDATE topics SET search_keywords = ARRAY['network','internet','router','server','protocol','bandwidth','wifi','web','browser','url','http'] WHERE name = 'Computer Networks & the Internet (KS3)';

-- Languages & Citizenship
UPDATE topics SET search_keywords = ARRAY['french','bonjour','merci','france','francais','parlez','oui','non'] WHERE name = 'French Basics';
UPDATE topics SET search_keywords = ARRAY['spanish','hola','gracias','spain','espanol','habla','si','por favor'] WHERE name = 'Spanish Basics';
UPDATE topics SET search_keywords = ARRAY['language','bilingual','foreign','translate','vocabulary','accent','fluent','communicate'] WHERE name = 'Learning a New Language';
UPDATE topics SET search_keywords = ARRAY['rule','law','right','wrong','fair','unfair','court','police','justice','crime'] WHERE name = 'Rules & Laws';
UPDATE topics SET search_keywords = ARRAY['responsibility','right','duty','respect','citizen','vote','community','human rights'] WHERE name = 'Rights & Responsibilities';

-- General: Safety & Life Skills
UPDATE topics SET search_keywords = ARRAY['internet safety','online safety','safe online','cyberbullying','digital safety','secure on internet','stranger online','password','phishing','hacker'] WHERE name = 'Internet Safety';
UPDATE topics SET search_keywords = ARRAY['stranger','stranger danger','dont talk to strangers','unknown person','safe','suspicious','tell an adult'] WHERE name = 'Stranger Danger';
UPDATE topics SET search_keywords = ARRAY['road safety','cross the road','traffic','pedestrian','zebra crossing','look both ways','highway code','seat belt'] WHERE name = 'Road Safety';
UPDATE topics SET search_keywords = ARRAY['emergency','999','911','fire','ambulance','first aid','accident','help','danger','escape'] WHERE name = 'What to Do in Emergencies';

-- General: Everyday Learning
UPDATE topics SET search_keywords = ARRAY['money','saving','coin','note','bank','piggy bank','spend','budget','earn','pocket money'] WHERE name = 'Money & Saving';
UPDATE topics SET search_keywords = ARRAY['manners','please','thank you','excuse me','polite','kind','respect','table manners','greeting'] WHERE name = 'Good Manners';
UPDATE topics SET search_keywords = ARRAY['telling time','clock','hour','minute','second','half past','quarter to','oclock','watch','am pm'] WHERE name = 'Telling Time';
UPDATE topics SET search_keywords = ARRAY['colour','color','mixing','paint','red','blue','yellow','primary','secondary','rainbow'] WHERE name = 'Colors & Mixing';
UPDATE topics SET search_keywords = ARRAY['day','month','week','monday','january','calendar','year','date','yesterday','tomorrow'] WHERE name = 'Days & Months';
UPDATE topics SET search_keywords = ARRAY['alphabet','letter','phonics','abc','sound','vowel','consonant','spell','word'] WHERE name = 'Alphabet & Phonics';
UPDATE topics SET search_keywords = ARRAY['season','spring','summer','autumn','winter','weather','leaf','snow','blossom','harvest'] WHERE name = 'Seasons';
UPDATE topics SET search_keywords = ARRAY['habit','routine','brush teeth','wash hands','tidy','chore','bedtime','morning routine','healthy habit'] WHERE name = 'Good Habits';

-- General: World & Geography
UPDATE topics SET search_keywords = ARRAY['continent','country','africa','asia','europe','america','australia','nation','border','capital city'] WHERE name = 'Continents & Countries';
UPDATE topics SET search_keywords = ARRAY['language','speak','tongue','dialect','sign language','translate','multilingual','words'] WHERE name = 'Languages of the World';
UPDATE topics SET search_keywords = ARRAY['map','navigation','compass','north','south','east','west','direction','gps','treasure map'] WHERE name = 'Maps & Navigation';
UPDATE topics SET search_keywords = ARRAY['ocean','sea','wave','tide','coral','reef','marine','deep sea','pacific','atlantic'] WHERE name = 'Oceans & Seas';
UPDATE topics SET search_keywords = ARRAY['landmark','statue of liberty','eiffel tower','great wall','taj mahal','pyramid','big ben','wonder'] WHERE name = 'Famous Landmarks';
UPDATE topics SET search_keywords = ARRAY['different country','culture','tradition','festival','custom','how people live','around the world'] WHERE name = 'Life in Different Countries';

-- General: Maths & Logic
UPDATE topics SET search_keywords = ARRAY['shape','pattern','symmetry','tessellation','geometric','repeat','sequence'] WHERE name = 'Shapes & Patterns';
UPDATE topics SET search_keywords = ARRAY['counting','number','one two three','how many','count','digit','numeral'] WHERE name = 'Counting & Numbers';
UPDATE topics SET search_keywords = ARRAY['puzzle','brain teaser','riddle','logic','problem','think','challenge','trick question'] WHERE name = 'Puzzles & Brain Teasers';
UPDATE topics SET search_keywords = ARRAY['measure','ruler','tape measure','weigh','scale','thermometer','how long','how heavy'] WHERE name = 'Measuring Things';
UPDATE topics SET search_keywords = ARRAY['time','clock','hour','minute','how long','duration','timer','stopwatch'] WHERE name = 'Time & Clocks';

-- General: Wellbeing
UPDATE topics SET search_keywords = ARRAY['grateful','gratitude','thankful','appreciate','blessed','lucky','count blessings'] WHERE name = 'Gratitude';
UPDATE topics SET search_keywords = ARRAY['breathing','meditation','mindful','calm','relax','deep breath','inhale','exhale','zen'] WHERE name = 'Breathing & Meditation';
UPDATE topics SET search_keywords = ARRAY['empathy','feelings','understand','care','kind','compassion','put yourself in','perspective'] WHERE name = 'Empathy';
UPDATE topics SET search_keywords = ARRAY['change','moving','new school','new home','adapt','different','transition','cope','adjust'] WHERE name = 'Dealing with Change';
UPDATE topics SET search_keywords = ARRAY['patience','wait','patient','take time','slow down','calm','frustrated','tolerant'] WHERE name = 'Patience';
UPDATE topics SET search_keywords = ARRAY['positive thinking','optimistic','bright side','can do','believe','confident','self talk','hopeful'] WHERE name = 'Positive Thinking';

-- General: Technology
UPDATE topics SET search_keywords = ARRAY['internet','web','website','browser','search','google','online','wifi','connection'] WHERE name = 'How the Internet Works';
UPDATE topics SET search_keywords = ARRAY['video game','screen time','gaming','console','minecraft','roblox','fortnite','phone','tablet','limit'] WHERE name = 'Video Games & Screen Time';
UPDATE topics SET search_keywords = ARRAY['electric car','green energy','solar','wind power','renewable','battery','sustainable','clean energy'] WHERE name = 'Electric Cars & Green Energy';
UPDATE topics SET search_keywords = ARRAY['ai','artificial intelligence','smart assistant','alexa','siri','robot','machine learning','chatbot'] WHERE name = 'AI & Smart Assistants';

-- General: Careers
UPDATE topics SET search_keywords = ARRAY['doctor','nurse','hospital','medicine','health','patient','surgery','ambulance','stethoscope'] WHERE name = 'Doctors & Nurses';
UPDATE topics SET search_keywords = ARRAY['firefighter','fire','police','officer','rescue','brave','uniform','hero','protect','law enforcement'] WHERE name = 'Firefighters & Police';
UPDATE topics SET search_keywords = ARRAY['teacher','school','classroom','learn','teach','lesson','homework','education'] WHERE name = 'Teachers';
UPDATE topics SET search_keywords = ARRAY['astronaut','space','nasa','rocket','orbit','moon landing','spacewalk','mission','iss'] WHERE name = 'Astronauts';
UPDATE topics SET search_keywords = ARRAY['chef','cook','kitchen','recipe','restaurant','bake','food','culinary','meal'] WHERE name = 'Chefs';
UPDATE topics SET search_keywords = ARRAY['career','job','work','grow up','dream job','what do you want to be','profession','future'] WHERE name = 'What Do You Want to Be?';
UPDATE topics SET search_keywords = ARRAY['food','farm','agriculture','crop','harvest','where does food come from','grow','soil','seed'] WHERE name = 'Where Food Comes From';

-- IB topics (sample — cover the key ones)
UPDATE topics SET search_keywords = ARRAY['identity','who am i','unique','special','myself','personality','individual','self'] WHERE name = 'My Identity & What Makes Me Unique';
UPDATE topics SET search_keywords = ARRAY['belief','value','religion','faith','culture','tradition','spiritual','moral','ethics'] WHERE name = 'Beliefs & Values Around the World';
UPDATE topics SET search_keywords = ARRAY['emotion','feeling','angry','sad','happy','scared','emotional intelligence','mood','regulate','manage feelings'] WHERE name = 'Understanding My Emotions (Emotional Intelligence)';
UPDATE topics SET search_keywords = ARRAY['wellbeing','mental health','physical health','social','healthy','exercise','sleep','self care','wellness'] WHERE name = 'Physical, Mental & Social Wellbeing';
UPDATE topics SET search_keywords = ARRAY['growth mindset','learn from mistakes','try again','persevere','resilience','effort','challenge','improve'] WHERE name = 'Growth Mindset & Learning to Learn';
UPDATE topics SET search_keywords = ARRAY['rights','children rights','unicef','responsibility','fair','unfair','equality','justice'] WHERE name = 'Rights & Responsibilities of Children';
UPDATE topics SET search_keywords = ARRAY['myth','legend','fairy tale','folklore','fable','ancient story','hero','quest','oral tradition'] WHERE name = 'Stories, Myths & Legends from Around the World';
UPDATE topics SET search_keywords = ARRAY['art','communicate','express','paint','draw','sculpture','creative','visual','design'] WHERE name = 'Art as Communication';
UPDATE topics SET search_keywords = ARRAY['music','dance','rhythm','beat','instrument','sing','choreography','cultural dance','melody'] WHERE name = 'Music & Dance Across Cultures';
UPDATE topics SET search_keywords = ARRAY['scientist','question','experiment','hypothesis','investigate','observe','evidence','method'] WHERE name = 'Asking Questions Like a Scientist';
UPDATE topics SET search_keywords = ARRAY['pattern','nature','fibonacci','spiral','symmetry','fractal','repeat','natural pattern'] WHERE name = 'Patterns in Nature';
UPDATE topics SET search_keywords = ARRAY['cause','effect','consequence','result','because','reason','impact','chain reaction'] WHERE name = 'Cause and Effect in the Natural World';
UPDATE topics SET search_keywords = ARRAY['technology','invention','innovation','change','progress','digital','modern','future tech'] WHERE name = 'How Technology Changes Our Lives';
UPDATE topics SET search_keywords = ARRAY['community','neighbourhood','town','city','village','local','together','help each other','society'] WHERE name = 'How Communities Work';
UPDATE topics SET search_keywords = ARRAY['decision','choice','choose','vote','democracy','discuss','debate','opinion','consensus'] WHERE name = 'How Decisions Are Made';
UPDATE topics SET search_keywords = ARRAY['economics','need','want','trade','buy','sell','market','supply','demand','money'] WHERE name = 'Economics for Kids: Needs, Wants & Trade';
UPDATE topics SET search_keywords = ARRAY['organization','charity','ngo','united nations','red cross','help','volunteer','aid'] WHERE name = 'Organizations That Help the World';
UPDATE topics SET search_keywords = ARRAY['fairness','equity','equality','social justice','discrimination','prejudice','inclusion','diversity'] WHERE name = 'Fairness, Equity & Social Justice';
UPDATE topics SET search_keywords = ARRAY['government','democracy','parliament','president','prime minister','law','policy','election'] WHERE name = 'Government and Democracy';
UPDATE topics SET search_keywords = ARRAY['entrepreneur','business','start up','idea','innovate','problem solving','create','invent'] WHERE name = 'Entrepreneurship & Problem-Solving';
UPDATE topics SET search_keywords = ARRAY['share earth','planet','global','responsibility','steward','protect','nature','resource'] WHERE name = 'Sharing Earth';
UPDATE topics SET search_keywords = ARRAY['biodiversity','ecosystem','habitat','species','endangered','extinction','food chain','web of life'] WHERE name = 'Biodiversity & Ecosystems';
UPDATE topics SET search_keywords = ARRAY['climate','climate change','global warming','carbon','greenhouse','footprint','reduce','reuse','recycle'] WHERE name = 'Climate Action for Kids';
UPDATE topics SET search_keywords = ARRAY['peace','conflict','resolution','negotiate','compromise','mediate','war','harmony','reconcile'] WHERE name = 'Peace & Conflict Resolution';
UPDATE topics SET search_keywords = ARRAY['human rights','freedom','dignity','universal','declaration','refugee','asylum','equality'] WHERE name = 'Human Rights & Global Citizenship';
UPDATE topics SET search_keywords = ARRAY['sustainable','living','eco','green','reduce waste','compost','organic','ethical','planet'] WHERE name = 'Sustainable Living';
UPDATE topics SET search_keywords = ARRAY['connected','interconnected','web','system','depend','relationship','chain','network','global'] WHERE name = 'Interconnectedness: How Everything Is Connected';
UPDATE topics SET search_keywords = ARRAY['care','animal','pet','nature','wildlife','protect','rescue','kindness to animals','welfare'] WHERE name = 'Caring for Other Living Things';
UPDATE topics SET search_keywords = ARRAY['family history','family story','ancestor','heritage','tradition','generation','roots','genealogy'] WHERE name = 'Personal Histories & Family Stories';
UPDATE topics SET search_keywords = ARRAY['migration','immigrant','refugee','move','travel','journey','settle','diaspora','homeland'] WHERE name = 'Human Migration: Why People Move';
UPDATE topics SET search_keywords = ARRAY['explorer','discovery','columbus','magellan','marco polo','expedition','voyage','navigation'] WHERE name = 'Great Explorers & Discoveries';
UPDATE topics SET search_keywords = ARRAY['ancient civilization','mesopotamia','indus','maya','aztec','inca','dynasty','empire','ancient world'] WHERE name = 'Ancient Civilizations (Global Perspective)';

-- Also set search_keywords = name as fallback for any topic not explicitly covered
UPDATE topics SET search_keywords = ARRAY[LOWER(name)] WHERE search_keywords = '{}' OR search_keywords IS NULL;
