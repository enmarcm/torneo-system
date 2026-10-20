const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const React = require('react');

// Evaluate the real components with deterministic hooks and query states.
// The returned React trees expose whether a refresh removes the form subtree.
function harness(source, query = {}) {
  const values = [];
  let cursor = 0;
  let effects = [];
  const components = new Map();
  const component = (name) => {
    if (!components.has(name)) components.set(name, function TestSurface() {});
    return components.get(name);
  };
  const surfaces = new Proxy({ __esModule: true, default: component('DefaultSurface'), useTheme: () => ({ zIndex: { modal: 1300 }, breakpoints: { down: () => '@media(max-width:600px)' } }) }, { get: (target, name) => name in target ? target[name] : component(name) });
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], (next) => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
    },
    useMemo: (calculate) => calculate(),
    useEffect: (effect) => { effects.push(effect); },
  };
  const mutation = () => ({ isPending: false, isError: false, mutateAsync: async () => ({ playerId: 'player' }) });
  const queries = new Proxy({}, { get: (_target, name) => name === 'useRosterQuery' || name === 'useTeamRegistrationsQuery' ? () => query : () => ({ data: undefined, refetch: async () => {} }) });
  const filename = path.resolve(__dirname, '../src', source);
  const code = transformSync(fs.readFileSync(filename, 'utf8'), { loader: 'tsx', jsx: 'automatic', format: 'cjs', target: 'es2022' }).code;
  const module = { exports: {} };
  let searchParams = new URLSearchParams(query.search ?? '');
  const mockRequire = (id) => {
    if (id === 'react') return hooks;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === '@/hooks/queries') return queries;
    if (id === '@/hooks/mutations') return new Proxy({}, { get: () => mutation });
    if (id === '@/hooks/common/useToast') return { useToast: () => ({ success() {}, error() {} }) };
    if (id === '@/hooks/common/useDebouncedValue') return { useDebouncedValue: (value) => value };
    if (id === '@/store/useAuthStore') return { useAuthStore: (selector) => selector({ user: { teamId: 'club' } }) };
    if (id === '@tanstack/react-query') return { useQuery: () => ({ data: undefined }) };
    if (id === 'react-router-dom') return { useNavigate: () => () => {}, useSearchParams: () => [searchParams, (next) => { searchParams = typeof next === 'function' ? next(searchParams) : new URLSearchParams(next); }] };
    if (id === '@/api/axios') return { extractErrorMessage: (error) => error.message };
    if (id === '@/routes/routes') return { ROUTES: { team: { squads: '/equipo/plantillas' } } };
    if (id.startsWith('@/utils/')) return require(path.resolve(__dirname, '../src', id.slice(2)));
    if (id.startsWith('@mui/') || id.startsWith('@/components/') || id.startsWith('./PlayerTournament')) return surfaces;
    if (id.startsWith('@/api/')) return {};
    return require(id);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: mockRequire, URLSearchParams }, { filename });
  const Component = module.exports.default ?? module.exports.RosterEditor ?? module.exports.NewRosterPlayer ?? module.exports.AppDrawer ?? module.exports.TeamTournamentList;
  return {
    components,
    render(props = {}) {
      cursor = 0;
      effects = [];
      const tree = Component(props);
      effects.forEach((effect) => effect());
      return tree;
    },
  };
}

function find(tree, predicate) {
  if (Array.isArray(tree)) return tree.map((child) => find(child, predicate)).find(Boolean);
  if (!React.isValidElement(tree)) return undefined;
  if (predicate(tree)) return tree;
  return Object.values(tree.props).map((child) => find(child, predicate)).find(Boolean);
}
const surface = (view, tree, name) => find(tree, (element) => element.type === view.components.get(name));

test('an empty roster keeps its player form mounted during polling and refetch failures', () => {
  const query = { data: [], isLoading: false, isFetching: false, error: null, refetch: async () => {} };
  const view = harness('components/sport/RosterEditor.tsx', query);
  const props = { registrationId: 'registration', allowCreatePlayer: true };
  assert(surface(view, view.render(props), 'NewRosterPlayer'));
  query.isFetching = true;
  assert(surface(view, view.render(props), 'NewRosterPlayer'), 'polling must not replace the editor with a skeleton');
  query.isFetching = false;
  query.error = new Error('offline');
  assert(surface(view, view.render(props), 'NewRosterPlayer'), 'a background error must preserve the editor');
  query.error = null;
  assert(surface(view, view.render(props), 'NewRosterPlayer'));
});

test('initial roster errors still offer recovery when no data was ever loaded', () => {
  const view = harness('components/sport/RosterEditor.tsx', { data: undefined, isLoading: false, error: new Error('offline') });
  assert(surface(view, view.render(), 'ErrorState'));
});

test('the delegate page keeps the form and its section stable after background updates', () => {
  const query = { data: [{ id: 'youth', roster: [], competition: { id: 'youth', name: 'Menores', ageGroup: 'YOUTH' } }], isLoading: false, isFetching: false, error: null };
  const view = harness('pages/team/TeamPlayers.tsx', query);
  const initial = surface(view, view.render(), 'NewRosterPlayer');
  assert(initial);
  query.isFetching = true;
  assert.equal(surface(view, view.render(), 'NewRosterPlayer').key, initial.key);
  query.isFetching = false;
  query.error = new Error('offline');
  assert.equal(surface(view, view.render(), 'NewRosterPlayer').key, initial.key);
  query.error = null;
  query.data.push({ id: 'adult', roster: [], competition: { id: 'adult', name: 'Adultos', ageGroup: 'ADULT' } });
  assert.equal(surface(view, view.render(), 'NewRosterPlayer').key, initial.key, 'new registrations must not change the current section and remount the form');
});

test('outside taps keep the form open; closing and reopening preserves the draft until Cancel', () => {
  const view = harness('components/sport/NewRosterPlayer.tsx');
  const props = { registrationId: 'registration' };
  const clickNew = (tree) => find(tree, (element) => element.props.children === 'Nuevo jugador').props.onClick();
  clickNew(view.render(props));
  let tree = view.render(props);
  find(tree, (element) => element.props.label === 'Nombre').props.onChange({ target: { value: 'Ana' } });
  tree = view.render(props);
  surface(view, tree, 'AppDrawer').props.onClose('backdropClick');
  assert.equal(surface(view, view.render(props), 'AppDrawer').props.open, true);
  surface(view, view.render(props), 'PlayerPhotoFields').props.onBusyChange(true);
  surface(view, view.render(props), 'AppDrawer').props.onClose('closeButton');
  assert.equal(surface(view, view.render(props), 'AppDrawer').props.open, true, 'an upload must not be interrupted by closing the form');
  surface(view, view.render(props), 'PlayerPhotoFields').props.onBusyChange(false);
  surface(view, view.render(props), 'AppDrawer').props.onClose('closeButton');
  tree = view.render(props);
  assert.equal(surface(view, tree, 'AppDrawer').props.open, false);
  clickNew(tree);
  tree = view.render(props);
  assert.equal(find(tree, (element) => element.props.label === 'Nombre').props.value, 'Ana');
  find(tree, (element) => element.props.children === 'Cancelar').props.onClick();
  clickNew(view.render(props));
  assert.equal(find(view.render(props), (element) => element.props.label === 'Nombre').props.value, '');
});

test('the drawer distinguishes outside dismissal from the explicit close button', () => {
  const reasons = [];
  const view = harness('components/ui/AppDrawer.tsx');
  const tree = view.render({ open: true, title: 'Jugador', onClose: (reason) => reasons.push(reason) });
  surface(view, tree, 'Drawer').props.onClose({}, 'backdropClick');
  find(tree, (element) => element.props['aria-label'] === 'Cerrar').props.onClick();
  assert.deepEqual(reasons, ['backdropClick', 'closeButton']);
});

test('opening a tournament from Inicio selects its own roster and section, and closing removes the selection', () => {
  const registrations = ['ADULT', 'YOUTH'].map((ageGroup) => ({ id: ageGroup, competitionId: ageGroup, status: 'ACTIVE', outcome: 'NONE', roster: [], competition: { id: ageGroup, name: ageGroup, ageGroup, maxPlayers: 25, status: 'ACTIVE' } }));
  const view = harness('pages/team/TeamSquads.tsx', { data: registrations, search: '?plantilla=YOUTH', isLoading: false });
  let tree = view.render();
  assert.equal(surface(view, tree, 'RosterEditor').props.registrationId, 'YOUTH');
  assert.equal(surface(view, tree, 'CompetitionSectionTabs').props.value, 'YOUTH');
  surface(view, tree, 'AppDrawer').props.onClose();
  assert.equal(surface(view, view.render(), 'RosterEditor'), undefined);
});

test('compact tournament entries open their own roster and preserve read-only history', () => {
  const registrations = ['ACTIVE', 'FINISHED'].map((status, index) => ({ id: String(index), status: 'ACTIVE', outcome: 'NONE', roster: [{ status: 'ACTIVE' }, { status: 'INACTIVE' }], competition: { id: String(index), name: 'Torneo', ageGroup: 'YOUTH', maxPlayers: 25, status, edition: { name: 'Apertura 2026', year: 2026 } } }));
  const view = harness('components/sport/TeamTournamentList.tsx');
  const opened = [];
  const tree = view.render({ registrations, onManage: (id) => opened.push(id) });
  find(tree, (element) => element.props.children === 'Gestionar jugadores').props.onClick();
  find(tree, (element) => element.props.children === 'Ver plantilla').props.onClick();
  assert.deepEqual(opened, ['0', '1']);
  assert(find(tree, (element) => element.props['aria-label'] === '1 de 25 jugadores'));
});
