export type VoiceSpeakerId =
| 'Waka'
| 'Holy'
| 'CapitanCoral'
| 'Mateo'
| 'Ixchel'
| 'MineroNoe'
| 'Ester'
| 'Samuel'
| 'David'
| 'Miriam'
| 'Caleb';

export type PrebuiltVoiceName = 'Puck' | 'Zephyr' | 'Kore' | 'Fenrir' | 'Charon';

export interface VoiceProfile {
voiceName: PrebuiltVoiceName;
style: string;
pitch: number;
rate: number;
}

export const SPEAKER_VOICE_PROFILES: Record<VoiceSpeakerId, VoiceProfile> = {
Waka: {
voiceName: 'Puck',
style:
'Hilarious, energetic, playful and affectionate cartoon scarlet macaw guide speaking in lively Latin American Spanish for children, comedic timing, bright cheerful timbre.',
pitch: 1.12,
rate: 1.03,
},
Holy: {
voiceName: 'Zephyr',
style:
'Warm, expressive, curious and joyful young girl adventurer speaking clearly in Latin American Spanish for children, heartfelt storybook wonder.',
pitch: 1.05,
rate: 1.0,
},
// World 1 NPCs (Tropical Island)
CapitanCoral: {
voiceName: 'Fenrir',
style:
'Jolly, big-hearted, theatrical cartoon pirate captain speaking warmly to children in Latin American Spanish, friendly deep booming laugh in the voice.',
pitch: 0.92,
rate: 0.97,
},
Mateo: {
voiceName: 'Charon',
style:
'Friendly, enthusiastic young tropical naturalist explorer speaking to kids in Latin American Spanish, upbeat, clear diction and wonder.',
pitch: 1.0,
rate: 1.01,
},
Ixchel: {
voiceName: 'Kore',
style:
'Gentle, wise, warm and serene ancient sanctuary guardian speaking in Latin American Spanish for children, tender storybook cadence.',
pitch: 1.03,
rate: 0.96,
},
// World 2 NPCs (Underground Crystal Cavern)
MineroNoe: {
voiceName: 'Fenrir',
style:
'Warm, jolly, courageous subterranean lantern-keeper miner speaking to children in Latin American Spanish, rich comforting voice full of awe.',
pitch: 0.9,
rate: 0.96,
},
Ester: {
voiceName: 'Kore',
style:
'Bright, curious, enthusiastic young biblical archaeologist speaking in Latin American Spanish for children, excited about discovering ancient scrolls.',
pitch: 1.04,
rate: 1.0,
},
Samuel: {
voiceName: 'Charon',
style:
'Calm, deeply wise, loving and reassuring biblical elder speaking softly and clearly in Latin American Spanish for children, warm authority.',
pitch: 0.94,
rate: 0.94,
},
// World 3 NPCs (Golden Exodus Desert & Oasis)
David: {
voiceName: 'Charon',
style:
'Joyful, musical, warm-hearted young biblical shepherd speaking to children in Latin American Spanish, bright hopeful energy and kindness.',
pitch: 1.02,
rate: 1.01,
},
Miriam: {
voiceName: 'Kore',
style:
'Cheerful, lyrical, warm desert traveler and song leader speaking in Latin American Spanish for children, uplifting joyful rhythm.',
pitch: 1.05,
rate: 1.0,
},
Caleb: {
voiceName: 'Fenrir',
style:
'Brave, warm, encouraging desert elder speaking with steadfast faith to children in Latin American Spanish, heroic storybook warmth.',
pitch: 0.91,
rate: 0.96,
},
};

export function getSpeakerVoiceProfile(speaker: string): VoiceProfile {
if (speaker === 'Oli') {
return SPEAKER_VOICE_PROFILES.Holy;
}
return (
SPEAKER_VOICE_PROFILES[speaker as VoiceSpeakerId] ??
SPEAKER_VOICE_PROFILES.Holy
);
}

/**
* Strips any accidental stage tags, speaker prefixes, or emojis before sending text to TTS.
*/
export function sanitizeSpokenText(raw: string): string {
return raw
.replace(/<[^>]+>/g, ' ')
.replace(/\|[^|]+\|/g, ' ')
.replace(
/^(Waka|Holy|Oli|CapitanCoral|Mateo|Ixchel|MineroNoe|Ester|Samuel|David|Miriam|Caleb)\s*:\s*/i,
'',
)
.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
.replace(/\s+/g, ' ')
.trim();
}

export interface StoryDialogueLine {
speaker: VoiceSpeakerId;
displayName: string;
/** Pure spoken Spanish dialogue ONLY — zero tags or prefixes */
text: string;
/** Silent acting direction passed only in speechMetadata.style */
style: string;
voiceName: PrebuiltVoiceName;
}

export interface BiblicalQuizChallenge {
npcSpeaker: VoiceSpeakerId;
question: string;
options: string[];
correctIndex: number;
wakaHint: string;
wrongReply: string;
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

function line(
speaker: VoiceSpeakerId,
displayName: string,
text: string,
): StoryDialogueLine {
const profile = SPEAKER_VOICE_PROFILES[speaker];
return {
speaker,
displayName,
text,
style: profile.style,
voiceName: profile.voiceName,
};
}

export const STORY_CUES: Record<string, StoryCueDef> = {
// ============================================================================
// MUNDO 1: ISLA DEL PORTAL DORADO (ISLA TROPICAL)
// ============================================================================
intro_island: {
id: 'intro_island',
title: 'Mundo 1: La Isla del Portal Dorado',
subtitle: 'El Jardín de la Creación y la Luz',
bibleVerse:
'Génesis 1:31 · "Y vio Dios todo lo que había hecho, y era bueno en gran manera."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Sacude esas plumas, Holy! ¡Mira qué isla tropical tan maravillosa creó Dios! Hay delfines saltando, un barco pirata, una cascada gigante y tres Cofres de Tesoros Bíblicos escondidos.',
),
line(
'Holy',
'Holy la Aventurera',
'¡Qué emoción, Waka! Recojamos cuatro estrellas de luz para despertar el vuelo, hablemos con nuestros amigos y abramos los tres Cofres Bíblicos para cruzar el Portal Dorado hacia la caverna subterránea.',
),
],
},

first_star: {
id: 'first_star',
title: '¡Primera Estrella de Luz!',
bibleVerse: 'Mateo 5:14 · "Vosotros sois la luz del mundo."',
lines: [
line(
'Holy',
'Holy la Aventurera',
'¡Atrapé una estrella de luz, Waka! Si reúno cuatro estrellitas podremos volar por encima de las palmeras.',
),
],
},

flight_unlocked: {
id: 'flight_unlocked',
title: '¡Poder de Vuelo Desbloqueado!',
bibleVerse: 'Isaías 40:31 · "Levantarán alas como las águilas."',
lines: [
line(
'Holy',
'Holy la Aventurera',
'¡Waka, mis pies flotan en el aire! ¡Estoy volando de verdad!',
),
line(
'Waka',
'Waka la Guacamaya',
'¡Cuidado con los cocos, capitana del aire! Mantén presionado Volar o Espacio para subir y atraviesa los aros brillantes del cielo para recargar energía.',
),
],
},

first_mushroom: {
id: 'first_mushroom',
title: '¡Hongos Saltarines de la Cascada!',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Qué rebote tan divertido, Holy! Estos hongos gigantes son como camas elásticas naturales para subir hasta la cima de la cascada.',
),
],
},

first_wind_ring: {
id: 'first_wind_ring',
title: '¡Aro Celestial de Viento!',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Asombroso! Al pasar por el aro brillante recargaste toda la energía de tus alas.',
),
],
},

// --- NPCs & Retos Bíblicos (Mundo 1) ---
npc_captain: {
id: 'npc_captain',
title: 'Reto Bíblico del Capitán Coral',
subtitle: 'El Misterio del Candelero en la Bahía',
bibleVerse: 'Juan 8:12 · "Yo soy la luz del mundo."',
lines: [
line(
'CapitanCoral',
'Capitán Coral',
'¡Bienvenidas a la bahía, valientes Holy y Waka! Sobre los pilares de piedra junto a mi barco brilla el Cofre del Candelero de Oro. En la Biblia, sus siete lámparas iluminaban el Tabernáculo de Dios.',
),
line(
'Waka',
'Waka la Guacamaya',
'¡A mí me encanta todo lo que brilla! Salta de pilar en pilar sobre el agua turquesa para abrir ese cofre, Holy.',
),
],
quiz: {
npcSpeaker: 'CapitanCoral',
question:
'¿A quién representa la Luz del Candelero de Oro que ilumina nuestro camino?',
options: [
'A Jesús, la Luz del Mundo',
'A una linterna pirata submarina',
'A las luciérnagas del barco',
],
correctIndex: 0,
wakaHint:
'Pista de guacamaya experta: Él dijo con mucho amor, Yo soy la luz del mundo.',
wrongReply:
'¡Uy, casi le atinas! Piensa en quién ilumina nuestro corazón y quita toda oscuridad.',
rewardMessage:
'¡Excelente respuesta! Jesús es la Luz del Mundo que ilumina cada paso de nuestra vida.',
},
},

npc_mateo: {
id: 'npc_mateo',
title: 'Reto Bíblico del Explorador Mateo',
subtitle: 'La Escalera de Hongos hacia la Palabra',
bibleVerse: 'Salmos 119:105 · "Lámpara es a mis pies tu palabra."',
lines: [
line(
'Mateo',
'Explorador Mateo',
'¡Hola, Holy! En la terraza más alta de la cascada hay un cofre precioso que guarda la Santa Biblia. Rebota sobre los hongos saltarines de colores para subir hasta la cima.',
),
line(
'Waka',
'Waka la Guacamaya',
'¡A saltar como resortes, Holy! Allá arriba nos espera el tesoro de la Palabra de Dios.',
),
],
quiz: {
npcSpeaker: 'Mateo',
question:
'Según el Salmo ciento diecinueve, ¿qué es la Palabra de Dios para nuestros pasos?',
options: [
'Lámpara a nuestros pies y lumbrera a nuestro camino',
'Un mapa secreto para encontrar cocos',
'Un paraguas gigante para la cascada',
],
correctIndex: 0,
wakaHint:
'¡Pista emplumada! Sirve para alumbrar el sendero en la oscuridad, igual que una lámpara.',
wrongReply:
'¡Jajaja, qué ocurrencia! Intenta de nuevo buscando la opción que nos alumbra el camino.',
rewardMessage:
'¡Exacto! La Biblia es lámpara a nuestros pies y nos guía siempre con la sabiduría de Dios.',
},
},

npc_ixchel: {
id: 'npc_ixchel',
title: 'Reto Bíblico de la Sabia Ixchel',
subtitle: 'El Secreto del Portal Dorado',
bibleVerse:
'Mateo 22:37-39 · "Amarás al Señor tu Dios y a tu prójimo como a ti mismo."',
lines: [
line(
'Ixchel',
'Sabia Ixchel',
'Bienvenida al templo antiguo, pequeña Holy. El tercer cofre flota entre los aros del cielo y guarda el Arca y las Tablas del Amor. Cuando abras los tres cofres, el Portal Dorado te llevará a una misteriosa caverna subterránea.',
),
line(
'Holy',
'Holy la Aventurera',
'¡Gracias, Sabia Ixchel! Volaremos por el cielo con Waka para abrir el tercer cofre y descubrir el mundo subterráneo.',
),
],
quiz: {
npcSpeaker: 'Ixchel',
question:
'¿Cuál enseñó Jesús que es el mandamiento más importante de toda la Biblia?',
options: [
'Amar a Dios con todo el corazón y amar a nuestro prójimo',
'Volar más rápido que todas las guacamayas',
'Contar todas las arenas de la playa',
],
correctIndex: 0,
wakaHint:
'Empieza con la palabra más hermosa y poderosa del cielo: ¡Amar!',
wrongReply:
'¡Mmm, esa no es! Recuerda lo que Jesús nos enseñó sobre el amor en el corazón.',
rewardMessage:
'¡Maravilloso! Amar a Dios y amar a nuestro prójimo resume toda la enseñanza de Jesús.',
},
},
// --- Cofres de Tesoros Bíblicos (Mundo 1) ---
gem_marina: {
id: 'gem_marina',
title: 'Tesoro Bíblico: El Candelero de Oro (La Menorá)',
subtitle: 'Artefacto del Tabernáculo · La Luz de Jesús',
bibleVerse:
'Éxodo 25:31 y Juan 8:12 · "Yo soy la luz del mundo; el que me sigue, no andará en tinieblas."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Abrimos el cofre de la bahía! ¡Mira qué resplandor tan precioso, Holy! ¡Es el Candelero de Oro de la Biblia!',
),
line(
'Holy',
'Holy la Aventurera',
'En la Biblia, el Candelero de Oro tenía siete lámparas con aceite de olivo que nunca se apagaban dentro del Tabernáculo de Dios. Nos enseña que Jesús es la Luz del Mundo que ilumina nuestra vida y nos acompaña siempre.',
),
],
},

gem_esmeralda: {
id: 'gem_esmeralda',
title: 'Tesoro Bíblico: La Santa Biblia y el Pergamino',
subtitle: 'La Palabra de Dios · Lámpara a Nuestros Pies',
bibleVerse:
'Salmos 119:105 · "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."',
lines: [
line(
'Holy',
'Holy la Aventurera',
'¡Lo logramos, Waka! ¡Dentro de este cofre en lo alto de la cascada encontramos la Santa Biblia y los antiguos pergaminos de las Escrituras!',
),
line(
'Waka',
'Waka la Guacamaya',
'La Biblia es el libro más valioso del universo. En ella descubrimos las promesas de Dios, las historias de Jesús y la sabiduría que ilumina cada paso de nuestro camino.',
),
],
},

gem_celestial: {
id: 'gem_celestial',
title: 'Tesoro Bíblico: El Arca y las Tablas del Amor',
subtitle: 'La Alianza de Dios · Amar a Dios y al Prójimo',
bibleVerse:
'Éxodo 25:10 y Mateo 22:37 · "Amarás al Señor tu Dios con todo tu corazón."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Volamos hasta lo más alto del cielo y abrimos el cofre! ¡Son el Arca Dorada y las Tablas de la Alianza!',
),
line(
'Holy',
'Holy la Aventurera',
'En la Biblia, el Arca guardaba los Diez Mandamientos y recordaba al pueblo que Dios caminaba con ellos. Jesús nos enseñó que toda la ley de Dios se cumple cuando amamos a Dios y ayudamos con alegría a los demás.',
),
],
},

// ============================================================================
// MUNDO 2: CAVERNA SUBTERRÁNEA DE CRISTAL Y FUEGO VIVO
// ============================================================================
world2_intro: {
id: 'world2_intro',
title: 'Mundo 2: Caverna Subterránea de Cristal',
subtitle: 'La Luz que Brilla en las Profundidades',
bibleVerse:
'Juan 1:5 · "La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Guau, Holy, qué cambio tan impresionante! ¡Cruzamos el Portal Dorado y bajamos a una gigantesca caverna subterránea llena de cristales brillantes, antorchas, murciélagos simpáticos y un río luminoso!',
),
line(
'Holy',
'Holy la Aventurera',
'¡Qué lugar tan increíble! Aunque estemos bajo tierra, la luz de las antorchas y los cristales lo ilumina todo. Busquemos los tres Cofres Bíblicos de la caverna para abrir el portal hacia el desierto dorado.',
),
],
},

w2_first_geyser: {
id: 'w2_first_geyser',
title: '¡Géiser de Cristal Impulsor!',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Hasta el techo de estalactitas! Estos géiseres de cristal nos lanzan directo a las galerías altas de la caverna.',
),
],
},

// --- NPCs & Retos Bíblicos (Mundo 2: Subterráneo) ---
npc_noe: {
id: 'npc_noe',
title: 'Reto Bíblico del Minero Noé',
subtitle: 'El Guardián de las Antorchas Subterráneas',
bibleVerse: 'Juan 1:5 · "La luz en las tinieblas resplandece."',
lines: [
line(
'MineroNoe',
'Minero Noé',
'¡Hola, pequeños exploradores! Qué alegría verlos aquí abajo. Al otro lado del lago subterráneo, sobre las columnas de cristal amatista, brilla el Cofre de la Lámpara de Aceite de la Biblia.',
),
line(
'Waka',
'Waka la Guacamaya',
'¡No tengas miedo a la oscuridad, Holy! Con la luz de Jesús y buenos saltos llegaremos directo a ese cofre.',
),
],
quiz: {
npcSpeaker: 'MineroNoe',
question:
'En la parábola de Jesús sobre las lámparas de aceite, ¿qué nos enseña mantener nuestra lámpara encendida?',
options: [
'Estar siempre preparados y cerca de Jesús con fe y alegría',
'Guardar piedras brillantes debajo de la cama',
'Dormir todo el día dentro de una cueva',
],
correctIndex: 0,
wakaHint:
'Pista subterránea: mantener la lámpara encendida significa tener siempre el corazón listo para Jesús.',
wrongReply:
'¡Casi, casi! Piensa en cómo nos preparamos para recibir a Jesús con el corazón lleno de luz.',
rewardMessage:
'¡Brillante como un cristal! Mantener nuestra lámpara encendida significa caminar cada día listos y confiando en Jesús.',
},
},

npc_ester: {
id: 'npc_ester',
title: 'Reto Bíblico de la Arqueóloga Ester',
subtitle: 'Los Pergaminos Escondidos en las Cuevas',
bibleVerse:
'Isaías 40:8 · "Mas la palabra del Dios nuestro permanece para siempre."',
lines: [
line(
'Ester',
'Arqueóloga Ester',
'¡Bienvenidos a la galería de cristales, Holy y Waka! ¿Sabían que en la vida real se encontraron antiguos rollos de la Biblia guardados dentro de cuevas en vasijas de barro? Usa los géiseres de cristal para subir a descubrir nuestro cofre de pergaminos.',
),
line(
'Holy',
'Holy la Aventurera',
'¡Qué dato tan genial, Ester! Subiremos por los géiseres luminosos hasta la terraza de la cascada subterránea.',
),
],
quiz: {
npcSpeaker: 'Ester',
question:
'¿Dónde se conservaron durante siglos muchos pergaminos antiguos de la Biblia para que hoy podamos leerlos?',
options: [
'Dentro de vasijas de barro escondidas en cuevas',
'En el fondo de un volcán de lava',
'Pegados en las nubes del cielo',
],
correctIndex: 0,
wakaHint:
'¡Mira a tu alrededor en este segundo mundo! Estaban protegidos dentro de vasijas en lugares como este.',
wrongReply:
'¡Ups! Allí se habrían mojado o quemado. Busca dónde se guardaron a salvo los rollos antiguos.',
rewardMessage:
'¡Correctísimo! Dios cuidó su Palabra dentro de vasijas en las cuevas porque su Palabra permanece para siempre.',
},
},

npc_samuel: {
id: 'npc_samuel',
title: 'Reto Bíblico del Anciano Samuel',
subtitle: 'El Santuario Tallado en la Roca',
bibleVerse:
'Mateo 7:24-25 · "El hombre prudente edificó su casa sobre la roca."',
lines: [
line(
'Samuel',
'Anciano Samuel',
'La paz sea con ustedes, Holy y Waka. Ante ustedes se alza el Santuario de la Roca. En lo alto de la bóveda subterránea, atravesando los aros de linternas doradas, hallarán el Cofre de la Roca Firme.',
),
line(
'Waka',
'Waka la Guacamaya',
'¡A despegar bajo las estalactitas, Holy! Atrapa el cofre de la Roca Firme y el Portal Dorado nos llevará al desierto soleado.',
),
],
quiz: {
npcSpeaker: 'Samuel',
question:
'En la historia de Jesús sobre las dos casas, ¿por qué no se cayó la casa del constructor sabio durante la tormenta?',
options: [
'Porque estaba construida sobre la Roca Firme, que representa obedecer a Jesús',
'Porque tenía un techo hecho de gelatina',
'Porque la construyó sobre arena suelta',
],
correctIndex: 0,
wakaHint:
'Pista firme como piedra: la casa aguantó la tormenta porque sus cimientos estaban sobre una gran roca.',
wrongReply:
'¡Ay, esa casa se caería con el primer viento! Elige el cimiento más fuerte que enseñó Jesús.',
rewardMessage:
'¡Sabia respuesta! Cuando escuchamos y practicamos las palabras de Jesús, nuestra vida está segura sobre la Roca Firme.',
},
},

// --- Cofres de Tesoros Bíblicos (Mundo 2: Subterráneo) ---
w2_gem_marina: {
id: 'w2_gem_marina',
title: 'Tesoro Bíblico: La Lámpara de Aceite Antigua',
subtitle: 'Parábola de las Lámparas · Luz en la Oscuridad',
bibleVerse:
'Mateo 25:4 y Juan 1:5 · "La luz en las tinieblas resplandece."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Saltamos sobre las columnas de amatista y abrimos el primer cofre subterráneo! ¡Es una hermosa Lámpara de Aceite bíblica!',
),
line(
'Holy',
'Holy la Aventurera',
'En tiempos de la Biblia, estas pequeñas lámparas de aceite alumbraban las casas y los caminos de noche. Jesús usó la lámpara para enseñarnos que su luz brilla incluso en las cuevas más oscuras y que nunca debemos apagar nuestra fe.',
),
],
},

w2_gem_esmeralda: {
id: 'w2_gem_esmeralda',
title: 'Tesoro Bíblico: Los Rollos Antiguos de las Cuevas',
subtitle: 'Vasija de Pergaminos · La Palabra que Permanece',
bibleVerse:
'Isaías 40:8 · "La palabra del Dios nuestro permanece para siempre."',
lines: [
line(
'Holy',
'Holy la Aventurera',
'¡Mira, Waka! ¡Dentro de este cofre en la galería alta hay una vasija de barro con los Rollos Antiguos de las Escrituras!',
),
line(
'Waka',
'Waka la Guacamaya',
'¡Qué hallazgo tan asombroso! Antes de que existieran libros con páginas, la Biblia se escribía a mano en rollos de pergamino. Dios protegió estos rollos en cuevas durante siglos para que hoy conozcamos el gran amor de Jesús.',
),
],
},

w2_gem_celestial: {
id: 'w2_gem_celestial',
title: 'Tesoro Bíblico: La Piedra Angular y la Roca Firme',
subtitle: 'El Cimiento Seguro · Cristo Nuestra Roca',
bibleVerse:
'Mateo 7:24 y 1 Pedro 2:6 · "He aquí, pongo en Sion la principal piedra del ángulo, escogida, preciosa."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Volamos por debajo de los cristales del techo y abrimos el cofre de la bóveda! ¡Es la Piedra Angular dorada!',
),
line(
'Holy',
'Holy la Aventurera',
'En la Biblia, la piedra angular era la roca más fuerte y perfecta sobre la que se apoyaba todo el edificio. Nos enseña que Jesús es la Roca Firme: cuando confiamos en Él, ninguna tormenta puede derribarnos.',
),
],
},

// ============================================================================
// MUNDO 3: DESIERTO DORADO DEL ÉXODO Y EL OASIS DE PROMESA
// ============================================================================
world3_intro: {
id: 'world3_intro',
title: 'Mundo 3: Desierto Dorado y Oasis de Promesa',
subtitle: 'La Travesía de la Fe, el Maná y el Agua Viva',
bibleVerse:
'Salmos 23:1-2 · "Jehová es mi pastor; nada me faltará. Junto a aguas de reposo me pastoreará."',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Salimos de la caverna hacia el sol brillante! ¡Mira esas dunas doradas, el gran arco de piedra roja, los camellos, las tiendas del campamento y un oasis verde con palmeras de dátiles!',
),
line(
'Holy',
'Holy la Aventurera',
'¡Es el Desierto del Éxodo y el Oasis de Promesa! Vamos a explorar la pirámide antigua, el oasis de las ovejitas y los remolinos de viento para descubrir los últimos tres Cofres Bíblicos.',
),
],
},

w3_first_whirlwind: {
id: 'w3_first_whirlwind',
title: '¡Remolino Ascendente del Desierto!',
lines: [
line(
'Waka',
'Waka la Guacamaya',
'¡Viento en las alas! Estos remolinos suaves del oasis nos elevan hasta lo más alto de las mesetas rojas del desierto.',
),
],
},

// --- NPCs & Retos Bíblicos (Mundo 3: Desierto) ---
npc_miriam: {
id: 'npc_miriam',
title: 'Reto Bíblico de la Guía Miriam',
subtitle: 'La Pirámide de las Dunas y el Maná',
bibleVerse: 'Juan 6:35 · "Jesús les dijo: Yo soy el pan de vida."',
lines: [
line(
'Miriam',
'Guía Miriam',
'¡Shalom, Holy y Waka! Bienvenidos al campamento del desierto. Si escalas los escalones de la antigua pirámide de arena al oeste, encontrarás el Cofre de la Vasija Dorada del Maná que Dios envió del cielo.',
),
line(
'Waka',
'Waka la Guacamaya',
'¡Pan del cielo con sabor a miel! ¡Vamos corriendo hacia las ruinas y la pirámide de las dunas, Holy!',
),
],
quiz: {
npcSpeaker: 'Miriam',
question:
'¿Qué alimento milagroso enviaba Dios cada mañana del cielo en el desierto, que simboliza a Jesús como Pan de Vida?',
options: [
'El Maná del cielo',
'Helado de arena del desierto',
'Pescados voladores de las dunas',
],
correctIndex: 0,
wakaHint:
'¡Pista sabrosa! Su nombre es cortito, empieza con M y sabía a hojuelas con miel.',
wrongReply:
'¡Jajaja, arena con helado crujiría demasiado! Busca el pan milagroso que Dios envió del cielo.',
rewardMessage:
'¡Muy bien! Dios envió el Maná cada día para mostrar su cuidado, y Jesús es el verdadero Pan de Vida.',
},
},

npc_david: {
id: 'npc_david',
title: 'Reto Bíblico del Pastor David',
subtitle: 'El Oasis del Buen Pastor y el Arpa',
bibleVerse:
'Juan 10:11 y Salmos 150:3 · "Yo soy el buen pastor... Alabadle con salterio y arpa."',
lines: [
line(
'David',
'Pastor David',
'¡Hola, amigos! Aquí junto al oasis cuido a mis ovejitas y toco melodías de gratitud a Dios. Si subes por los remolinos dorados detrás de las palmeras hasta la meseta roja, hallarás el Cofre del Cayado del Buen Pastor y el Arpa de Alabanza.',
),
line(
'Holy',
'Holy la Aventurera',
'¡Qué ovejitas tan tiernas, David! Subiremos por los remolinos del oasis hasta la meseta alta.',
),
],
quiz: {
npcSpeaker: 'David',
question:
'¿Para qué usaba el pastor su cayado en la Biblia, recordándonos cómo nos cuida Jesús?',
options: [
'Para guiar, proteger y rescatar con amor a sus ovejas',
'Para construir barcos piratas en las dunas',
'Para jugar tenis con los camellos',
],
correctIndex: 0,
wakaHint:
'Pista del oasis: el Buen Pastor usa su cayado para que ninguna ovejita se pierda ni corra peligro.',
wrongReply:
'¡Jajaja, imagínate a un camello jugando tenis! Elige cómo cuida Jesús a sus ovejas.',
rewardMessage:
'¡Acertaste! Jesús es nuestro Buen Pastor que nos conoce por nuestro nombre y siempre nos protege.',
},
},
npc_caleb: {
  id: 'npc_caleb',
  title: 'Reto Bíblico del Anciano Caleb',
  subtitle: 'La Subida al Monte de la Promesa',
  bibleVerse:
  'Juan 4:14 y Santiago 1:12 · "Recibirá la corona de vida, que Dios ha prometido a los que le aman."',
  lines: [
  line(
  'Caleb',
  'Anciano Caleb',
  '¡Fuerza y valentía, pequeños aventureros! Al atravesar el gran arco de piedra y volar por los aros del sol sobre el cañón, hallarán el último cofre: el Cántaro de Agua Viva y la Corona de Vida.',
  ),
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Un último vuelo como águilas sobre el desierto, Holy! ¡Con ese cofre completaremos los tres mundos!',
  ),
  ],
  quiz: {
  npcSpeaker: 'Caleb',
  question:
  '¿Qué nos prometió Jesús cuando habló del Agua Viva que nunca se acaba?',
  options: [
  'Su Espíritu Santo y vida eterna que llenan el corazón de paz y alegría',
  'Una piscina gigante en medio de las nubes',
  'Agua salada del mar para beber',
  ],
  correctIndex: 0,
  wakaHint:
  'Pista del desierto: el Agua Viva de Jesús refresca nuestra alma con paz y vida eterna.',
  wrongReply:
  '¡Uy, el agua salada da más sed! Busca el regalo eterno que Jesús prometió para nuestro corazón.',
  rewardMessage:
  '¡Gloria a Dios! Jesús nos da el Agua Viva de su Espíritu y la promesa de la Corona de Vida.',
  },
  },

  // --- Cofres de Tesoros Bíblicos (Mundo 3: Desierto) ---
  w3_gem_marina: {
  id: 'w3_gem_marina',
  title: 'Tesoro Bíblico: La Vasija Dorada del Maná',
  subtitle: 'El Pan del Cielo · Jesús el Pan de Vida',
  bibleVerse:
  'Éxodo 16:15 y Juan 6:35 · "Jesús les dijo: Yo soy el pan de vida."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Escalaste toda la pirámide de las dunas, Holy! ¡Dentro de este cofre brilla la Vasija Dorada del Maná!',
  ),
  line(
  'Holy',
  'Holy la Aventurera',
  'En la Biblia, cuando el pueblo caminaba por el desierto, Dios envió cada mañana el Maná desde el cielo para que nunca les faltara alimento. Esa vasija nos recuerda que Jesús es el Pan de Vida que fortalece nuestro corazón cada día.',
  ),
  ],
  },

  w3_gem_esmeralda: {
  id: 'w3_gem_esmeralda',
  title: 'Tesoro Bíblico: El Cayado del Buen Pastor y el Arpa',
  subtitle: 'Salmo 23 y Salmo 150 · Cuidado y Alabanza',
  bibleVerse:
  'Juan 10:11 y Salmos 150:3 · "Yo soy el buen pastor... Alabadle con arpa."',
  lines: [
  line(
  'Holy',
  'Holy la Aventurera',
  '¡Subimos a la meseta roja sobre el oasis y abrimos el cofre! ¡Encontramos el Cayado del Buen Pastor junto al Arpa Dorada de David!',
  ),
  line(
  'Waka',
  'Waka la Guacamaya',
  'En la Biblia, el cayado representa el amor con que Jesús, nuestro Buen Pastor, guía y rescata a sus ovejitas. Y el arpa nos recuerda los Salmos con que David cantaba con alegría y gratitud a Dios.',
  ),
  ],
  },

  w3_gem_celestial: {
  id: 'w3_gem_celestial',
  title: 'Tesoro Bíblico: El Cántaro de Agua Viva y la Corona',
  subtitle: 'Fuente de Vida Eterna · La Promesa de Jesús',
  bibleVerse:
  'Juan 4:14 y Santiago 1:12 · "Una fuente de agua que salte para vida eterna."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Volamos sobre todo el desierto y abrimos el último cofre! ¡Son el Cántaro de Agua Viva y la Corona de Vida!',
  ),
  line(
  'Holy',
  'Holy la Aventurera',
  'En el desierto el agua es vida, y Jesús prometió darnos el Agua Viva que llena el corazón de paz verdadera. Y la Corona de Vida nos recuerda la hermosa promesa del cielo para todos los que aman a Jesús.',
  ),
  ],
  },

  // ============================================================================
  // PORTAL, GUÍA WAKA POR MUNDO Y CELEBRACIONES
  // ============================================================================
  portal_ready_w1: {
  id: 'portal_ready_w1',
  title: '¡El Portal hacia la Caverna Subterránea Despertó!',
  bibleVerse: 'Juan 10:9 · "Yo soy la puerta."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Abrimos los tres Cofres Bíblicos de la isla! ¡Mira el templo, el Portal Dorado está encendido y listo para llevarnos a la Caverna Subterránea de Cristal!',
  ),
  line(
  'Holy',
  'Holy la Aventurera',
  '¡Allá vamos, Waka! ¡Volemos directo hacia la luz del Portal Dorado!',
  ),
  ],
  },

  portal_ready_w2: {
  id: 'portal_ready_w2',
  title: '¡El Portal hacia el Desierto Dorado Despertó!',
  bibleVerse: 'Juan 1:5 · "La luz en las tinieblas resplandece."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Increíble, Holy! ¡Descubrimos los tres Cofres Bíblicos de la caverna subterránea! El Portal del Santuario de la Roca se ha abierto para llevarnos al Desierto Dorado.',
  ),
  line(
  'Holy',
  'Holy la Aventurera',
  '¡Volemos hacia el portal del santuario para descubrir el Oasis de Promesa!',
  ),
  ],
  },

  portal_ready_w3: {
  id: 'portal_ready_w3',
  title: '¡El Portal de la Promesa Resplandece!',
  bibleVerse: '2 Timoteo 4:7 · "He acabado la carrera, he guardado la fe."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Lo logramos, Holy! ¡Los tres Cofres Bíblicos del desierto están abiertos! ¡Sube al santuario del Monte de la Promesa y cruza el Portal Dorado final!',
  ),
  line(
  'Holy',
  'Holy la Aventurera',
  '¡Qué aventura tan inolvidable por la isla, la caverna y el desierto! ¡Vamos al Portal Dorado!',
  ),
  ],
  },

  portal_locked_hint: {
  id: 'portal_locked_hint',
  title: 'Faltan Cofres Bíblicos por Abrir',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Alto ahí, capitana! El Portal Dorado todavía está dormido. Primero debemos abrir los tres Cofres de Tesoros Bíblicos de este mundo.',
  ),
  ],
  },

  victory_w1: {
  id: 'victory_w1',
  title: '¡Isla del Portal Dorado Completada!',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Lo logramos, Holy! ¡Prepárate porque al cruzar este portal bajaremos a la increíble Caverna Subterránea de Cristal!',
  ),
  ],
  },

  victory_w2: {
  id: 'victory_w2',
  title: '¡Caverna Subterránea Completada!',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Salimos victoriosos de las profundidades! ¡Ahora el Portal Dorado nos lleva al soleado Desierto Dorado del Éxodo!',
  ),
  ],
  },

  victory_w3: {
  id: 'victory_w3',
  title: '¡Gran Aventura Bíblica Completada!',
  lines: [
  line(
  'Holy',
  'Holy la Aventurera',
  '¡Completamos los tres mundos y reunimos los nueve Tesoros Bíblicos! Gracias por acompañarme en esta gran aventura de fe.',
  ),
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Eres la mejor exploradora del mundo, Holy! Podemos volver a visitar la isla, la caverna o el desierto cuando tú quieras.',
  ),
  ],
  },

  // --- Consejos Graciosos de Waka Específicos por Mundo ---
  w1_waka_tip_1: {
  id: 'w1_waka_tip_1',
  title: 'Radar Plumífero de Waka · Isla',
  bibleVerse: 'Filipenses 4:13 · "Todo lo puedo en Cristo que me fortalece."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Reporte de radar plumífero! En la isla busca los pilares de la bahía pirata, salta por los hongos de la cascada y vuela por los aros del cielo. ¡Todo lo podemos en Cristo que nos fortalece!',
  ),
  ],
  },

  w1_waka_tip_2: {
  id: 'w1_waka_tip_2',
  title: 'Chiste Tropical de Waka',
  bibleVerse: 'Proverbios 17:22 · "El corazón alegre constituye buen remedio."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¿Sabes cuál es el deporte favorito de los cangrejos de esta isla? ¡Caminar de ladito mientras buscan tesoros! Habla con el Capitán Coral, Mateo e Ixchel para hacer sus retos bíblicos.',
  ),
  ],
  },

  w2_waka_tip_1: {
  id: 'w2_waka_tip_1',
  title: 'Radar de Cristales de Waka · Caverna',
  bibleVerse: 'Salmos 27:1 · "Jehová es mi luz y mi salvación; ¿de quién temeré?"',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Eco, eco, eco! En la caverna subterránea salta sobre las columnas moradas del lago luminoso, usa los géiseres de cristal del este y vuela por los aros de linternas bajo el techo.',
  ),
  ],
  },

  w2_waka_tip_2: {
  id: 'w2_waka_tip_2',
  title: 'Chiste Subterráneo de Waka',
  bibleVerse: 'Juan 1:5 · "La luz en las tinieblas resplandece."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Me encanta esta cueva porque mis plumas rojas brillan como una linterna con alas! No olvides saludar al Minero Noé, a la Arqueóloga Ester y al Anciano Samuel.',
  ),
  ],
  },

  w3_waka_tip_1: {
  id: 'w3_waka_tip_1',
  title: 'Radar del Desierto de Waka',
  bibleVerse: 'Isaías 40:31 · "Levantarán alas como las águilas."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  '¡Alerta de arena en las plumas! En el desierto sube la pirámide dorada al oeste, aprovecha los remolinos junto al oasis de las ovejas y vuela sobre el gran arco de piedra roja.',
  ),
  ],
  },

  w3_waka_tip_2: {
  id: 'w3_waka_tip_2',
  title: 'Chiste del Oasis de Waka',
  bibleVerse: 'Salmos 23:1 · "Jehová es mi pastor; nada me faltará."',
  lines: [
  line(
  'Waka',
  'Waka la Guacamaya',
  'Le pregunté a un camello si tenía sed y me dijo que prefería beber Agua Viva junto al oasis. ¡Habla con Miriam, David y Caleb para completar sus retos bíblicos!',
  ),
  ],
  },
  };
