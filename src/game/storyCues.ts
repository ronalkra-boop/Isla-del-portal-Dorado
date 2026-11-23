export type VoiceSpeakerId =
| 'Waka'
| 'Oli'
| 'CapitanCoral'
| 'Mateo'
| 'Ixchel';

export interface StoryDialogueLine {
speaker: VoiceSpeakerId;
displayName: string;
text: string;
/** Screenplay direction for Gemini TTS */
ttsPromptText: string;
style: string;
voiceName: 'Puck' | 'Zephyr' | 'Kore' | 'Fenrir' | 'Charon';
}

export interface BiblicalQuizChallenge {
question: string;
options: string[];
correctIndex: number;
wakaHint: string;
rewardMessage: string;
}

export interface StoryCueDef {
id: string;
title: string;
subtitle?: string;
bibleVerse?: string;
lines: StoryDialogueLine[];
quiz?: BiblicalQuizChallenge;
}

export const STORY_CUES: Record<string, StoryCueDef> = {
// ============================================================================
// MUNDO 1: ISLA DEL PORTAL DORADO (EL JARDÍN DE LA CREACIÓN Y LA LUZ)
// ============================================================================
intro_island: {
id: 'intro_island',
title: '¡Mundo 1: La Isla del Portal Dorado!',
subtitle: 'El Jardín de la Creación y la Luz',
bibleVerse: 'Génesis 1:31 · "Y vio Dios todo lo que había hecho, y era bueno en gran manera."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡Sacude las plumas, Oli! ¡Mira qué isla tan gigante creó Dios! Hay delfines, cangrejos bailarines, cascadas y tres Cofres de Tesoros Bíblicos escondidos.',
ttsPromptText:
'Waka: ¡Brrr-kaka! <laugh> ¡Sacude las plumas, Oli! ¡Mira qué isla tan gigante creó Dios! Hay delfines, cangrejos bailarines, cascadas y tres Cofres de Tesoros Bíblicos escondidos.',
style:
'Hilarious, squeaky, super expressive scarlet macaw sidekick talking excitedly in Latin American Spanish for young children, playful and comedic',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Jajaja, Waka, tú siempre tan graciosa! Vamos a recoger cuatro estrellas de luz para volar, hablar con nuestros amigos y abrir los tres Cofres Bíblicos para activar el Portal Dorado.',
ttsPromptText:
'Oli: <laugh> ¡Jajaja, Waka, tú siempre tan graciosa! Vamos a recoger cuatro estrellas de luz para volar, hablar con nuestros amigos y abrir los tres Cofres Bíblicos para activar el Portal Dorado.',
style:
'Warm, curious, joyful young girl adventurer speaking clearly in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

first_star: {
id: 'first_star',
title: '¡Primera Estrella de Luz!',
bibleVerse: 'Mateo 5:14 · "Vosotros sois la luz del mundo."',
lines: [
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Atrapé una estrella de luz! ¡Siento cosquillitas doradas en mis botas!',
ttsPromptText:
'Oli: ¡Yu-huu! ¡Atrapé una estrella de luz! <laugh> ¡Siento cosquillitas doradas en mis botas!',
style:
'Excited, delighted young adventurer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Plumas al viento, Oli! Con cuatro estrellitas podrás volar como una guacamaya supersónica sin despeinarte las trenzas.',
ttsPromptText:
'Waka: <laugh> ¡Plumas al viento, Oli! Con cuatro estrellitas podrás volar como una guacamaya supersónica sin despeinarte las trenzas.',
style:
'Comedic, cheerful, silly macaw guide in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

flight_unlocked: {
id: 'flight_unlocked',
title: '¡Poder de Vuelo Desbloqueado!',
bibleVerse: 'Isaías 40:31 · "Levantarán alas como las águilas."',
lines: [
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Waka, mis pies flotan en el aire! ¡Estoy volando de verdad sobre la isla!',
ttsPromptText:
'Oli: <gasp> ¡Waka, mis pies flotan en el aire! <laugh> ¡Estoy volando de verdad sobre la isla!',
style:
'Amazed, overjoyed young girl soaring into the sky in Latin American Spanish for children',
voiceName: 'Zephyr',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Kaaa-ká! ¡Cuidado con los cocos, capitana del aire! Mantén Espacio para subir y pasa por los aros dorados para recargar energía.',
ttsPromptText:
'Waka: ¡Kaaa-ká! <laugh> ¡Cuidado con los cocos, capitana del aire! Mantén Espacio para subir y pasa por los aros dorados para recargar energía.',
style:
'Joyful, funny flying mentor macaw in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

// --- NPCs & Retos Bíblicos (Mundo 1) ---
npc_captain: {
id: 'npc_captain',
title: 'Reto Bíblico del Capitán Coral',
subtitle: 'El Misterio de la Luz en la Bahía',
bibleVerse: 'Juan 8:12 · "Yo soy la luz del mundo."',
lines: [
{
speaker: 'CapitanCoral',
displayName: 'Capitán Coral',
text: '¡Ahoy, Oli y Waka! Sobre los pilares de piedra de la bahía está el Cofre del Candelero de Oro. En la Biblia, el candelero tenía siete brazos de luz para iluminar el santuario.',
ttsPromptText:
'CapitanCoral: <laugh> ¡Ahoy, Oli y Waka! Sobre los pilares de piedra de la bahía está el Cofre del Candelero de Oro. En la Biblia, el candelero tenía siete brazos de luz para iluminar el santuario.',
style:
'Friendly, theatrical cartoon pirate captain speaking warmly to children in Latin American Spanish',
voiceName: 'Fenrir',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡A mí me encanta cuando todo brilla! Salta por las piedras del agua para abrir ese cofre, Oli.',
ttsPromptText:
'Waka: ¡Brrr-kaka! <laugh> ¡A mí me encanta cuando todo brilla! Salta por las piedras del agua para abrir ese cofre, Oli.',
style:
'Funny, enthusiastic macaw sidekick in Latin American Spanish for children',
voiceName: 'Puck',
},
],
quiz: {
question: '¿A quién representa la Luz del Candelero de Oro que ilumina nuestro camino?',
options: [
'A Jesús, la Luz del Mundo',
'A una linterna pirata submarina',
'A las luciérnagas del barco',
],
correctIndex: 0,
wakaHint: '¡Kaaa-ká! Pista de guacamaya: Él dijo "Yo soy la luz del mundo".',
rewardMessage: '¡Correcto! Jesús es la Luz del Mundo que ilumina nuestro corazón.',
},
},

npc_mateo: {
id: 'npc_mateo',
title: 'Reto Bíblico del Explorador Mateo',
subtitle: 'Los Hongos Saltarines de la Cascada',
bibleVerse: 'Salmos 119:105 · "Lámpara es a mis pies tu palabra."',
lines: [
{
speaker: 'Mateo',
displayName: 'Explorador Mateo',
text: '¡Hola, Oli! Arriba de la cascada hay un cofre muy especial que guarda la Santa Biblia. Salta encima de los hongos gigantes como trampolín para llegar a la cima.',
ttsPromptText:
'Mateo: ¡Hola, Oli! <breath> Arriba de la cascada hay un cofre muy especial que guarda la Santa Biblia. Salta encima de los hongos gigantes como trampolín para llegar a la cima.',
style:
'Friendly, enthusiastic young naturalist explorer speaking to kids in Latin American Spanish',
voiceName: 'Charon',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Boing, boing, rebota la barriga! ¡Salta de hongo en hongo para descubrir el tesoro de la Palabra de Dios!',
ttsPromptText:
'Waka: <laugh> ¡Boing, boing, rebota la barriga! ¡Salta de hongo en hongo para descubrir el tesoro de la Palabra de Dios!',
style:
'Playful, bouncy, comedic macaw sidekick in Latin American Spanish for children',
voiceName: 'Puck',
},
],
quiz: {
question: 'Según el Salmo 119:105, ¿qué es la Palabra de Dios (la Biblia) para nuestros pasos?',
options: [
'Lámpara a nuestros pies y lumbrera a nuestro camino',
'Un mapa para buscar cocos',
'Un paraguas para la cascada',
],
correctIndex: 0,
wakaHint: '¡Pista plumífera! Es como una lámpara que alumbra dónde pisamos.',
rewardMessage: '¡Exacto! La Biblia es lámpara a nuestros pies y nos guía con sabiduría.',
},
},

npc_ixchel: {
id: 'npc_ixchel',
title: 'Reto Bíblico de la Sabia Ixchel',
subtitle: 'El Secreto del Portal Dorado',
bibleVerse: 'Mateo 22:37-39 · "Amarás al Señor tu Dios y a tu prójimo como a ti mismo."',
lines: [
{
speaker: 'Ixchel',
displayName: 'Sabia Ixchel',
text: 'Bienvenida al santuario, pequeña Oli. El tercer cofre flota en el cielo sobre las escalinatas y guarda las Tablas del Amor y la Alianza. Abre los tres cofres y el Portal Dorado te llevará a dos mundos maravillosos más.',
ttsPromptText:
'Ixchel: Bienvenida al santuario, pequeña Oli. El tercer cofre flota en el cielo sobre las escalinatas y guarda las Tablas del Amor y la Alianza. Abre los tres cofres y el Portal Dorado te llevará a dos mundos maravillosos más.',
style:
'Gentle, wise, warm storybook temple guardian speaking in Latin American Spanish for children',
voiceName: 'Kore',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Gracias, Sabia Ixchel! Volaré con Waka por los aros del cielo para abrir el cofre y cruzar el Portal Dorado.',
ttsPromptText:
'Oli: ¡Gracias, Sabia Ixchel! Volaré con Waka por los aros del cielo para abrir el cofre y cruzar el Portal Dorado.',
style:
'Determined, joyful young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
quiz: {
question: '¿Cuál enseñó Jesús que es el mandamiento más importante de todos?',
options: [
'Amar a Dios con todo el corazón y amar a nuestro prójimo',
'Volar más rápido que las guacamayas',
'Contar todas las arenas del mar',
],
correctIndex: 0,
wakaHint: '¡Brrr-kaka! Empieza con la palabra más bonita de todas: ¡Amar!',
rewardMessage: '¡Muy bien! El amor a Dios y al prójimo resume toda la enseñanza de Jesús.',
},
},

// --- Cofres de Tesoros Bíblicos (Mundo 1) ---
gem_marina: {
id: 'gem_marina',
title: 'Tesoro Bíblico: El Candelero de Oro (La Menorá)',
subtitle: 'Artefacto del Tabernáculo · La Luz de Jesús',
bibleVerse: 'Éxodo 25:31 y Juan 8:12 · "Yo soy la luz del mundo; el que me sigue, no andará en tinieblas."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡Abrimos el cofre de la bahía! ¡Mira cómo brilla, Oli! ¡Es el Candelero de Oro de la Biblia!',
ttsPromptText:
'Waka: ¡Brrr-kaka! <gasp> ¡Abrimos el cofre de la bahía! ¡Mira cómo brilla, Oli! ¡Es el Candelero de Oro de la Biblia!',
style:
'Excited, funny, amazed macaw celebrating in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En la Biblia, el Candelero de Oro tenía siete lámparas con aceite de olivo que alumbraban siempre el Tabernáculo de Dios. Nos enseña que Jesús es la Luz del Mundo que ilumina nuestra vida y quita todo temor.',
ttsPromptText:
'Oli: En la Biblia, el Candelero de Oro tenía siete lámparas con aceite de olivo que alumbraban siempre el Tabernáculo de Dios. Nos enseña que Jesús es la Luz del Mundo que ilumina nuestra vida y quita todo temor.',
style:
'Warm, clear, inspiring young storyteller girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

gem_esmeralda: {
id: 'gem_esmeralda',
title: 'Tesoro Bíblico: La Santa Biblia y el Pergamino',
subtitle: 'La Palabra de Dios · Lámpara a Nuestros Pies',
bibleVerse: 'Salmos 119:105 · "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."',
lines: [
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Mira, Waka! ¡Dentro de este cofre en lo alto de la cascada encontramos la Santa Biblia y los antiguos rollos de las Escrituras!',
ttsPromptText:
'Oli: <laugh> ¡Mira, Waka! ¡Dentro de este cofre en lo alto de la cascada encontramos la Santa Biblia y los antiguos rollos de las Escrituras!',
style:
'Triumphant, happy young girl adventurer in Latin American Spanish for children',
voiceName: 'Zephyr',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Kaaa-ká! La Biblia es el tesoro más sabio del universo. En la Biblia sirve para conocer las promesas de Dios, aprender las historias de Jesús y guiar nuestros pasos como una lámpara brillante.',
ttsPromptText:
'Waka: ¡Kaaa-ká! La Biblia es el tesoro más sabio del universo. En la Biblia sirve para conocer las promesas de Dios, aprender las historias de Jesús y guiar nuestros pasos como una lámpara brillante.',
style:
'Expressive, cheerful, playful macaw teacher in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

gem_celestial: {
id: 'gem_celestial',
title: 'Tesoro Bíblico: El Arca y las Tablas del Amor',
subtitle: 'La Alianza de Dios · Amar a Dios y al Prójimo',
bibleVerse: 'Éxodo 25:10 y Mateo 22:37 · "Amarás al Señor tu Dios con todo tu corazón."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Volamos hasta las nubes y abrimos el cofre del cielo! ¡Son las Tablas de la Alianza y el Arca Dorada!',
ttsPromptText:
'Waka: <laugh> ¡Volamos hasta las nubes y abrimos el cofre del cielo! ¡Son las Tablas de la Alianza y el Arca Dorada!',
style:
'Proud, joyful, funny macaw flying companion in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En la Biblia, el Arca guardaba las tablas de los Diez Mandamientos y representaba que Dios camina con su pueblo. Jesús nos enseñó que toda la ley de Dios se cumple en el amor: amar a Dios y ayudar con alegría a los demás.',
ttsPromptText:
'Oli: En la Biblia, el Arca guardaba las tablas de los Diez Mandamientos y representaba que Dios camina con su pueblo. Jesús nos enseñó que toda la ley de Dios se cumple en el amor: amar a Dios y ayudar con alegría a los demás.',
style:
'Warm, clear, joyful young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},
// ============================================================================
// MUNDO 2: VALLE DE LOS CEDROS Y EL RÍO DE AGUA VIVA
// ============================================================================
world2_intro: {
id: 'world2_intro',
title: '¡Mundo 2: Valle de los Cedros y el Río de Agua Viva!',
subtitle: 'El Oasis del Buen Pastor',
bibleVerse: 'Salmos 23:1-2 · "Jehová es mi pastor; nada me faltará. Junto a aguas de reposo me pastoreará."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡Cruzamos el Portal Dorado y llegamos al segundo mundo! ¡Mira ese río de cristal, los cedros dorados y las ovejitas del oasis!',
ttsPromptText:
'Waka: ¡Brrr-kaka! <gasp> ¡Cruzamos el Portal Dorado y llegamos al segundo mundo! ¡Mira ese río de cristal, los cedros dorados y las ovejitas del oasis!',
style:
'Super excited, comedic macaw guide discovering a new world in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Es el Valle de los Cedros! Aquí también hay tres nuevos Cofres Bíblicos sobre el Buen Pastor, el Maná del Cielo y el Agua Viva. ¡Vamos a descubrirlos para abrir el portal hacia el tercer mundo!',
ttsPromptText:
'Oli: <laugh> ¡Es el Valle de los Cedros! Aquí también hay tres nuevos Cofres Bíblicos sobre el Buen Pastor, el Maná del Cielo y el Agua Viva. ¡Vamos a descubrirlos para abrir el portal hacia el tercer mundo!',
style:
'Amazed, enthusiastic young girl adventurer in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

w2_gem_marina: {
id: 'w2_gem_marina',
title: 'Tesoro Bíblico: El Cántaro de Agua Viva',
subtitle: 'El Río de Vida · La Promesa de Jesús',
bibleVerse: 'Juan 4:14 · "El agua que yo le daré será en él una fuente de agua que salte para vida eterna."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Glu, glu, glu! ¡Qué fresquita! ¡Encontramos el Cofre del Cántaro de Agua Viva junto a la ribera del oasis!',
ttsPromptText:
'Waka: <laugh> ¡Glu, glu, glu! ¡Qué fresquita! ¡Encontramos el Cofre del Cántaro de Agua Viva junto a la ribera del oasis!',
style:
'Funny, playful macaw making cute water sounds in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En la Biblia, los cántaros servían para llevar agua fresca en medio del desierto. Jesús habló junto al pozo y explicó que Él nos da el Agua Viva del Espíritu Santo, que refresca el alma y llena nuestro corazón de paz.',
ttsPromptText:
'Oli: En la Biblia, los cántaros servían para llevar agua fresca en medio del desierto. Jesús habló junto al pozo y explicó que Él nos da el Agua Viva del Espíritu Santo, que refresca el alma y llena nuestro corazón de paz.',
style:
'Warm, expressive young girl narrator in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

w2_gem_esmeralda: {
id: 'w2_gem_esmeralda',
title: 'Tesoro Bíblico: El Cayado del Buen Pastor',
subtitle: 'El Salmo 23 · Jesús Cuida de Sus Ovejas',
bibleVerse: 'Juan 10:11 y Salmos 23:4 · "Yo soy el buen pastor... Tu vara y tu cayado me infundirán aliento."',
lines: [
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Subimos por las flores saltarinas del cañón y abrimos el cofre! ¡Es el Cayado del Buen Pastor!',
ttsPromptText:
'Oli: ¡Subimos por las flores saltarinas del cañón y abrimos el cofre! ¡Es el Cayado del Buen Pastor!',
style:
'Joyful, bright young adventurer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Beee, beee! ¡Como las ovejitas! En la Biblia, el cayado es el bastón curvo con el que el pastor guía, defiende y rescata a sus ovejas. Nos recuerda a Jesús, nuestro Buen Pastor, que nos conoce por nombre y siempre nos cuida.',
ttsPromptText:
'Waka: <laugh> ¡Beee, beee! ¡Como las ovejitas! En la Biblia, el cayado es el bastón curvo con el que el pastor guía, defiende y rescata a sus ovejas. Nos recuerda a Jesús, nuestro Buen Pastor, que nos conoce por nombre y siempre nos cuida.',
style:
'Funny, loving macaw doing a cute sheep impression and explaining warmly in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

w2_gem_celestial: {
id: 'w2_gem_celestial',
title: 'Tesoro Bíblico: La Vasija Dorada del Maná',
subtitle: 'El Pan del Cielo · Jesús el Pan de Vida',
bibleVerse: 'Éxodo 16:15 y Juan 6:35 · "Jesús les dijo: Yo soy el pan de vida."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Mmm, huele a pan dulce con miel! ¡En este cofre del cielo encontramos la Vasija Dorada del Maná!',
ttsPromptText:
'Waka: <gasp> ¡Mmm, huele a pan dulce con miel! ¡En este cofre del cielo encontramos la Vasija Dorada del Maná!',
style:
'Playful, hungry, funny macaw sidekick in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En la Biblia, el Maná fue el alimento milagroso que Dios enviaba cada mañana desde el cielo para cuidar a su pueblo. Esa vasija apuntaba a Jesús, quien dijo: "Yo soy el Pan de Vida", porque Él fortalece nuestro corazón cada día.',
ttsPromptText:
'Oli: En la Biblia, el Maná fue el alimento milagroso que Dios enviaba cada mañana desde el cielo para cuidar a su pueblo. Esa vasija apuntaba a Jesús, quien dijo: "Yo soy el Pan de Vida", porque Él fortalece nuestro corazón cada día.',
style:
'Clear, warm, joyful young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

// ============================================================================
// MUNDO 3: CIUDADELA CELESTIAL DE SIÓN (LAS ISLAS DE LUZ Y ALABANZA)
// ============================================================================
world3_intro: {
id: 'world3_intro',
title: '¡Mundo 3: Ciudadela Celestial de Sión!',
subtitle: 'El Reino de la Alabanza y la Fe',
bibleVerse: 'Salmos 150:6 y Apocalipsis 21:21 · "Todo lo que respira alabe a Jehová."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Kaaa-ká! ¡Agárrate el sombrero, Oli! ¡Llegamos al tercer mundo: la Ciudadela Celestial de Sión sobre un mar de nubes doradas y cristal!',
ttsPromptText:
'Waka: ¡Kaaa-ká! <laugh> ¡Agárrate el sombrero, Oli! ¡Llegamos al tercer mundo: la Ciudadela Celestial de Sión sobre un mar de nubes doradas y cristal!',
style:
'Dazzled, hilarious, celebratory macaw guide in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Qué lugar tan hermoso, Waka! Hay palomas blancas, olivos luminosos y los últimos tres Cofres Bíblicos: el Escudo de la Fe, el Arpa de David y la Corona de Vida.',
ttsPromptText:
'Oli: <gasp> ¡Qué lugar tan hermoso, Waka! Hay palomas blancas, olivos luminosos y los últimos tres Cofres Bíblicos: el Escudo de la Fe, el Arpa de David y la Corona de Vida.',
style:
'Wonder-filled, joyful young girl adventurer in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

w3_gem_marina: {
id: 'w3_gem_marina',
title: 'Tesoro Bíblico: El Escudo de la Fe',
subtitle: 'La Armadura de Dios · Confianza en Jesús',
bibleVerse: 'Efesios 6:16 · "Sobre todo, tomad el escudo de la fe."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Clinc, clanc! ¡Mira qué escudo tan reluciente encontramos en los pilares de cristal! ¡Es el Escudo de la Fe!',
ttsPromptText:
'Waka: <laugh> ¡Clinc, clanc! ¡Mira qué escudo tan reluciente encontramos en los pilares de cristal! ¡Es el Escudo de la Fe!',
style:
'Playful, heroic cartoon macaw in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En la Biblia, el apóstol Pablo enseña que la Armadura de Dios no es para pelear con nadie, sino para proteger nuestro corazón con la verdad, la paz y el Escudo de la Fe, confiando siempre en el cuidado de Jesús.',
ttsPromptText:
'Oli: En la Biblia, el apóstol Pablo enseña que la Armadura de Dios no es para pelear con nadie, sino para proteger nuestro corazón con la verdad, la paz y el Escudo de la Fe, confiando siempre en el cuidado de Jesús.',
style:
'Warm, brave, encouraging young girl narrator in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

w3_gem_esmeralda: {
id: 'w3_gem_esmeralda',
title: 'Tesoro Bíblico: El Arpa de Alabanza de David',
subtitle: 'Los Salmos · Cantar con Gratitud a Dios',
bibleVerse: 'Salmos 150:3 · "Alabadle con salterio y arpa."',
lines: [
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Escucha qué notas tan dulces salen de este cofre, Waka! ¡Es el Arpa Dorada de David!',
ttsPromptText:
'Oli: <laugh> ¡Escucha qué notas tan dulces salen de este cofre, Waka! ¡Es el Arpa Dorada de David!',
style:
'Delighted, musical young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡La-la-lá, kaaa-ká! En la Biblia, cuando David cuidaba a sus ovejas, tocaba el arpa para componer los Salmos y dar gracias a Dios. Nos enseña que cantar y agradecer a Jesús llena el hogar de alegría.',
ttsPromptText:
'Waka: <laugh> ¡La-la-lá, kaaa-ká! En la Biblia, cuando David cuidaba a sus ovejas, tocaba el arpa para componer los Salmos y dar gracias a Dios. Nos enseña que cantar y agradecer a Jesús llena el hogar de alegría.',
style:
'Singing, funny, cheerful macaw guide in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

w3_gem_celestial: {
id: 'w3_gem_celestial',
title: 'Tesoro Bíblico: La Perla y la Corona de Vida',
subtitle: 'El Reino de los Cielos · El Tesoro Más Valioso',
bibleVerse: 'Mateo 13:45-46 y Santiago 1:12 · "Recibirá la corona de vida, que Dios ha prometido a los que le aman."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡Llegamos a lo más alto del cielo y abrimos el último cofre! ¡Son la Perla de Gran Precio y la Corona de Vida!',
ttsPromptText:
'Waka: ¡Brrr-kaka! <gasp> ¡Llegamos a lo más alto del cielo y abrimos el último cofre! ¡Son la Perla de Gran Precio y la Corona de Vida!',
style:
'Triumphant, amazed, funny macaw companion in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: 'En sus parábolas, Jesús comparó el Reino de Dios con una perla preciosa, el tesoro más grande que existe. Y la Corona de Vida nos recuerda la promesa de amor eterno que Jesús nos regala.',
ttsPromptText:
'Oli: En sus parábolas, Jesús comparó el Reino de Dios con una perla preciosa, el tesoro más grande que existe. Y la Corona de Vida nos recuerda la promesa de amor eterno que Jesús nos regala.',
style:
'Warm, joyful, heartfelt young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

// ============================================================================
// EVENTOS DEL PORTAL Y GUÍA GRACIOSA DE WAKA
// ============================================================================
portal_ready: {
id: 'portal_ready',
title: '¡El Portal Dorado Despertó!',
bibleVerse: 'Juan 10:9 · "Yo soy la puerta."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! ¡Abrimos los tres Cofres de Tesoros Bíblicos de este mundo! ¡Mira el templo, el Portal Dorado está brillando a toda potencia!',
ttsPromptText:
'Waka: ¡Brrr-kaka! <gasp> ¡Abrimos los tres Cofres de Tesoros Bíblicos de este mundo! ¡Mira el templo, el Portal Dorado está brillando a toda potencia!',
style:
'Dramatic, amazed, funny cartoon macaw in Latin American Spanish for children',
voiceName: 'Puck',
},
{
speaker: 'Oli',
displayName: 'Oli la Aventurera',
text: '¡Allá vamos, Waka! ¡Volemos juntos hacia el Portal Dorado para viajar al siguiente mundo!',
ttsPromptText:
'Oli: ¡Allá vamos, Waka! ¡Volemos juntos hacia el Portal Dorado para viajar al siguiente mundo!',
style:
'Heroic, excited young explorer girl in Latin American Spanish for children',
voiceName: 'Zephyr',
},
],
},

portal_locked_hint: {
id: 'portal_locked_hint',
title: 'Faltan Cofres Bíblicos por Abrir',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Alto ahí, capitana! El Portal Dorado todavía tiene sueño. Necesitamos encontrar y abrir los tres Cofres de Tesoros Bíblicos de este mundo.',
ttsPromptText:
'Waka: <laugh> ¡Alto ahí, capitana! El Portal Dorado todavía tiene sueño. Necesitamos encontrar y abrir los tres Cofres de Tesoros Bíblicos de este mundo.',
style:
'Funny, helpful, expressive macaw guide in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

waka_funny_tip_1: {
id: 'waka_funny_tip_1',
title: 'Consejo Gracioso de Waka',
bibleVerse: 'Filipenses 4:13 · "Todo lo puedo en Cristo que me fortalece."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Brrr-kaka! Reporte de radar plumífero: busca el brillo dorado en los pilares del agua, arriba de los hongos saltarines de la cascada y en los aros mágicos del cielo. ¡Y recuerda que todo lo podemos en Cristo que nos fortalece!',
ttsPromptText:
'Waka: ¡Brrr-kaka! <laugh> Reporte de radar plumífero: busca el brillo dorado en los pilares del agua, arriba de los hongos saltarines de la cascada y en los aros mágicos del cielo. ¡Y recuerda que todo lo podemos en Cristo que nos fortalece!',
style:
'Hilarious, energetic cartoon parrot guide in Latin American Spanish for children',
voiceName: 'Puck',
},
],
},

waka_funny_tip_2: {
id: 'waka_funny_tip_2',
title: 'Chiste y Pista de Waka',
bibleVerse: 'Proverbios 17:22 · "El corazón alegre constituye buen remedio."',
lines: [
{
speaker: 'Waka',
displayName: 'Waka la Guacamaya (Guía)',
text: '¡Kaaa-ká! ¿Sabes cuál es el animal favorito de una guacamaya exploradora? ¡El pez-cador de tesoros! Acércate a los personajes con signo de exclamación y presiona E para hacer su Reto Bíblico.',
ttsPromptText:
'Waka: ¡Kaaa-ká! <laugh> ¿Sabes cuál es el animal favorito de una guacamaya exploradora? ¡El pez-cador de tesoros! Acércate a los personajes con signo de exclamación y presiona E para hacer su Reto Bíblico.',
style:
'Silly, laughing cartoon parrot telling a joke to children in Latin American Spanish',
voiceName: 'Puck',
},
],
},
};