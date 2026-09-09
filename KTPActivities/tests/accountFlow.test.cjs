const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

function load(file, mocks) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, console, process: { env: {} }, __DEV__: true,
    require(name) { if (name === 'react') return React; if (name in mocks) return mocks[name]; throw new Error(`Unmocked dependency ${name}`); },
  }, { filename: file });
  return module.exports;
}

function native(platform = 'ios') {
  return {
    Platform: { OS: platform }, useColorScheme: () => 'light',
    StyleSheet: { create: value => value }, Alert: { alert() {} },
    ActivityIndicator: 'ActivityIndicator', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
    View: 'View', Modal: 'Modal', SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', TextInput: 'TextInput',
  };
}

function home(platform, accountLoader) {
  const state = { listener: null, navigations: [], member: null, cleared: 0, directory: 0 };
  const auth = { currentUser: null };
  const screen = load('app/index.tsx', {
    'react-native': native(platform),
    'expo-web-browser': { maybeCompleteAuthSession() {} },
    'expo-auth-session/providers/google': { useIdTokenAuthRequest: () => [{}, null, async () => {}] },
    './firebaseConfig': { auth, GoogleAuthProvider: {}, onAuthStateChanged: (_auth, callback) => { state.listener = callback; return () => {}; } },
    'expo-router': { router: { replace: route => state.navigations.push(route) } },
    '@env': {}, './signin': { default: 'SignInScreen', __esModule: true },
    './components/auth': {
      clearAccountState() { state.member = null; state.cleared++; },
      loadAccount: accountLoader,
      refreshPeople() { state.directory++; },
      signOutAccount: async () => { auth.currentUser = null; await state.listener(null); },
    },
    './components/userInfoManager': { setUserInfo: member => { state.member = member; } },
  }).default;
  return { state, auth, screen };
}

for (const platform of ['ios', 'android']) {
  test(`${platform}: signed-out startup shows Google sign-in and navigates only after profile creation/load`, async () => {
    let complete;
    const pending = new Promise(resolve => { complete = resolve; });
    const h = home(platform, () => pending);
    let tree;
    await act(async () => { tree = create(React.createElement(h.screen)); });
    await act(async () => { await h.state.listener(null); });
    assert.equal(tree.root.findAllByType('SignInScreen').length, 1);
    const user = { uid: 'verified' }; h.auth.currentUser = user;
    let task;
    await act(async () => { task = h.state.listener(user); });
    assert.equal(h.state.navigations.length, 0);
    assert.equal(tree.root.findAllByType('ActivityIndicator').length, 1);
    await act(async () => { complete({ user: { id: 'saved-profile', Position: 0 } }); await task; });
    assert.equal(h.state.member.id, 'saved-profile');
    assert.deepEqual(h.state.navigations, ['/(tabs)/Calendar']);
    assert.equal(h.state.directory, 1);
    act(() => tree.unmount());
  });
}

test('backend failure keeps user out of Calendar and retry can restore an existing account', async () => {
  let fail = true;
  const h = home('ios', async () => { if (fail) throw new Error('Network unavailable'); return { user: { id: 'legacy', Position: 3 } }; });
  let tree; await act(async () => { tree = create(React.createElement(h.screen)); });
  h.auth.currentUser = { uid: 'existing' };
  await act(async () => { await h.state.listener(h.auth.currentUser); });
  assert.equal(h.state.navigations.length, 0); assert.equal(h.state.member, null);
  assert.ok(JSON.stringify(tree.toJSON()).includes('Network unavailable'));
  fail = false;
  await act(async () => { tree.root.findAllByType('TouchableOpacity')[0].props.onPress(); });
  await act(async () => { await h.state.listener(h.auth.currentUser); });
  assert.equal(h.state.member.id, 'legacy');
  assert.equal(h.state.navigations.length, 1);
  act(() => tree.unmount());
});

test('late account response cannot populate a signed-out or switched account', async () => {
  let complete; const pending = new Promise(resolve => { complete = resolve; });
  const h = home('ios', () => pending);
  let tree; await act(async () => { tree = create(React.createElement(h.screen)); });
  h.auth.currentUser = { uid: 'old-account' };
  let task; await act(async () => { task = h.state.listener(h.auth.currentUser); });
  h.auth.currentUser = null;
  await act(async () => { await h.state.listener(null); });
  await act(async () => { complete({ user: { id: 'old-profile' } }); await task; });
  assert.equal(h.state.member, null); assert.equal(h.state.navigations.length, 0);
  act(() => tree.unmount());
});

test('Profile editor saves names and optional academics, updates cached profile, and retains edits on failure', async () => {
  const user = { id: 'legacy', FirstName: 'Old', LastName: 'Name', Class: 'Zeta', BUEmail: 'test@bu.edu', Position: 2, Major: [], Minor: [], Colleges: [] };
  let current = user, closed = 0, failed = false, sent, people = [user];
  const alerts = []; const rn = native(); rn.Alert.alert = (...args) => alerts.push(args);
  const auth = { currentUser: { uid: 'firebase-id' } };
  const Modal = load('app/components/EditProfileModal.tsx', {
    'react-native': rn,
    'react-native-element-dropdown': { MultiSelect: 'MultiSelect' },
    axios: { patch: async (_url, body) => { sent = body; if (failed) throw new Error('offline'); return { data: { user: { ...user, ...body } } }; } },
    '@env': { BACKEND_URL: 'http://mock' }, './buinfo': { __esModule: true, default: [] },
    './auth': { accountHeaders: async () => ({ Authorization: 'Bearer mock-token' }) },
    '../firebaseConfig': { auth },
    './userInfoManager': { getUserInfo: () => current, setUserInfo: value => { current = value; } },
    './allUsersManager': { getAllUsersInfo: () => people, setAllUsersInfo: value => { people = value; } },
  }).default;
  let tree;
  await act(async () => { tree = create(React.createElement(Modal, { visible: true, user, onClose: () => { closed++; } })); });
  const field = name => tree.root.findAllByType('TextInput').find(input => input.props.accessibilityLabel === name);
  assert.equal(field('Class').props.value, 'Zeta');
  await act(async () => {
    field('Class').props.onChangeText(' Alpha ');
    field('First name').props.onChangeText('New'); field('Last name').props.onChangeText('Member');
    field('Majors').props.onChangeText('Computer Science, Economics'); field('Graduation year').props.onChangeText('2030');
  });
  const save = () => tree.root.findAllByType('TouchableOpacity').at(-1).props.onPress();
  failed = true; await act(save);
  assert.equal(closed, 0); assert.equal(field('First name').props.value, 'New'); assert.equal(alerts.length, 1);
  assert.equal(field('Class').props.value, ' Alpha ');
  failed = false; await act(save);
  assert.equal(closed, 1); assert.equal(current.id, 'legacy'); assert.equal(current.Position, 2);
  assert.equal(current.FirstName, 'New'); assert.equal(current.Major.length, 2);
  assert.equal(sent.Class, 'Alpha'); assert.equal(current.Class, 'Alpha'); assert.equal(people[0].Class, 'Alpha');
  await act(async () => { field('Class').props.onChangeText(''); });
  await act(save);
  assert.equal(current.Class, '');
  assert.equal(people.length, 1); assert.equal(people[0].FirstName, 'New');
  assert.equal('Position' in sent, false); assert.equal('BUEmail' in sent, false);
  act(() => tree.unmount());
});

test('sign-out clears profile, directory and token caches; failed directory loads do not block login', async () => {
  const states = { user: {}, people: [{}], token: 'old', persisted: true };
  const auth = { currentUser: { uid: 'signed-in' } };
  const module = load('app/components/auth.tsx', {
    axios: { get: async () => { throw new Error('offline'); }, post: async () => ({ data: { user: { id: 'saved' } } }) },
    '@env': { BACKEND_URL: 'http://mock' }, 'expo-constants': { expoConfig: { extra: {} } },
    '../firebaseConfig': { auth, signOut: async () => { auth.currentUser = null; } },
    './userInfoManager': { setUserInfo: v => { states.user = v; } },
    './allUsersManager': { setAllUsersInfo: v => { states.people = v; } },
    './userTokenManager': { setUserToken: v => { states.token = v; } },
    '@react-native-async-storage/async-storage': { removeItem: async () => { states.persisted = false; } },
    '@react-native-google-signin/google-signin': { GoogleSignin: { signOut: async () => {} } },
    'react-native': native(),
  });
  await module.refreshPeople(auth.currentUser);
  await module.signOutAccount();
  assert.equal(auth.currentUser, null); assert.equal(states.user, null); assert.equal(states.token, null);
  assert.equal(states.people.length, 0); assert.equal(states.persisted, false);
});
