// Visual environments are independent of the question type and difficulty.
const QUIZ_WORLDS = {
    castle: { label: 'Castel', icon: 'castle', description: 'Coridoare de piatră, bibliotecă, temniță, arsenal, alchimie și criptă.', accent: '#e3c585',
        rooms: [{ id: 'library', name: 'Biblioteca blestemată' }, { id: 'dungeon', name: 'Temnița' }, { id: 'armory', name: 'Sala armelor' }, { id: 'alchemy', name: 'Laboratorul vrăjitorului' }, { id: 'crypt', name: 'Cripta' }], boss: { id: 'throne', name: 'Sala Dragonului' } },
    snow: { label: 'Zăpadă', icon: 'snowflake', description: 'Grotă de gheață, refugiu înzăpezit, pod înghețat și sală de cristale.', accent: '#a8dff5',
        rooms: [{ id: 'ice-cave', name: 'Grota de gheață' }, { id: 'snow-refuge', name: 'Refugiul înzăpezit' }, { id: 'frozen-bridge', name: 'Podul înghețat' }, { id: 'crystal-hall', name: 'Sala cristalelor' }], boss: { id: 'ice-palace', name: 'Palatul de gheață' } },
    desert: { label: 'Deșert', icon: 'sun', description: 'Dune, oază, templu de gresie și sală cu obeliscuri.', accent: '#e6c28b',
        rooms: [{ id: 'dunes', name: 'Trecătoarea dunelor' }, { id: 'oasis', name: 'Oaza ascunsă' }, { id: 'sand-temple', name: 'Templul de gresie' }, { id: 'obelisks', name: 'Sala obeliscurilor' }], boss: { id: 'sun-sanctuary', name: 'Sanctuarul Soarelui' } },
    jungle: { label: 'Junglă', icon: 'leaf', description: 'Luminiș tropical, ruine, pod cu liane și cameră cu o cascadă.', accent: '#a6d7ae',
        rooms: [{ id: 'clearing', name: 'Luminișul tropical' }, { id: 'vine-ruins', name: 'Ruinele cu liane' }, { id: 'canopy-bridge', name: 'Podul dintre arbori' }, { id: 'waterfall', name: 'Camera cascadei' }], boss: { id: 'ancient-tree', name: 'Sanctuarul arborelui străvechi' } }
};
function normalizeQuizWorld(value) { return Object.hasOwn(QUIZ_WORLDS, value) ? value : 'castle'; }
function quizWorldMeta(value) { return QUIZ_WORLDS[normalizeQuizWorld(value)]; }
function quizWorldRoom(value, index = 0, boss = false) {
    const world = quizWorldMeta(value);
    const roomIndex = Math.max(0, Math.trunc(Number(index) || 0));
    return boss ? world.boss : world.rooms[roomIndex % world.rooms.length];
}
const QUIZ_BASE_COLUMNS = 'id,title,description,grade,seconds_per_question,questions,published,created_at,game_mode,difficulty,lives';
async function incarcaQuizuriCuNivel(buildQuery) {
    let result = await buildQuery(QUIZ_BASE_COLUMNS + ',world_theme');
    if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && /world_theme/.test(result.error.message || '')) result = await buildQuery(QUIZ_BASE_COLUMNS);
    return result;
}
if (typeof window !== 'undefined') window.QuizWorlds = { normalize: normalizeQuizWorld, meta: quizWorldMeta, room: quizWorldRoom };
