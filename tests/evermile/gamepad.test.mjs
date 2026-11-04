import test from 'node:test';
import assert from 'node:assert/strict';
import {readGamepad, axis, padName, wakes, BUTTONS, BUTTON_HELP, DEADZONE} from '../../evermile/gamepad.js';

const pad = (buttons = {}, axes = [0, 0, 0, 0]) => ({id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', connected: true, axes, buttons: Array.from({length: 17}, (_, i) => ({value: buttons[i] ?? 0, pressed: (buttons[i] ?? 0) > .5}))});

test('stick dead zone eases out instead of jumping, and steering sign matches the keyboard (left is positive)', () => {
  assert.equal(axis(.05), 0); assert.equal(axis(-DEADZONE * .99), 0);
  assert.ok(axis(DEADZONE + .01) > 0 && axis(DEADZONE + .01) < .05);
  assert.equal(axis(1), 1); assert.equal(axis(-1), -1); assert.equal(axis(NaN), 0); assert.equal(axis(undefined), 0);
  assert.ok(readGamepad(pad({}, [-.8, 0])).input > .7, 'stick left steers left');
  assert.ok(readGamepad(pad({}, [.8, 0])).input < -.7, 'stick right steers right');
});

test('triggers drive, face buttons report rising edges only once, and held buttons stay held', () => {
  const first = readGamepad(pad({7: .6, 6: .2, [BUTTONS.autodrive]: 1, [BUTTONS.horn]: 1}));
  assert.ok(Math.abs(first.throttle - (.6 - .06) / .94) < 1e-9 && Math.abs(first.brake - (.2 - .06) / .94) < 1e-9, 'triggers past their dead zone');
  assert.equal(readGamepad(pad({7: .04})).throttle, 0, 'a trigger resting slightly off zero does not creep the car');
  assert.equal(first.pressed.autodrive, true); assert.equal(first.pressed.horn, true); assert.equal(first.held.horn, true); assert.equal(first.active, true);
  const second = readGamepad(pad({[BUTTONS.autodrive]: 1, [BUTTONS.horn]: 1}), first.held);
  assert.equal(second.pressed.autodrive, false, 'a button held across frames fires once');
  assert.equal(second.held.horn, true);
  const released = readGamepad(pad({}), second.held);
  assert.equal(released.held.horn, false); assert.equal(released.pressed.horn, false); assert.equal(released.active, false);
});

test('no controller, or a partial button list, reads as idle input', () => {
  const none = readGamepad(null, {horn: true});
  assert.deepEqual([none.input, none.throttle, none.brake, none.active], [0, 0, 0, false]);
  assert.equal(none.held.horn, false);
  const sparse = readGamepad({buttons: [{pressed: true}], axes: []});
  assert.equal(sparse.pressed.autodrive, true); assert.equal(sparse.held.photo, false);
});

test('every mapped button is explained in the help list, and pad names read cleanly', () => {
  const help = BUTTON_HELP.map(([, keys]) => keys).join(' ');
  for (const label of ['A', 'B', 'X', 'Y', 'LB / RB', 'Start', 'Back', 'D-pad', 'Right stick']) assert.ok(help.includes(label), label);
  assert.ok(Object.keys(BUTTONS).length >= 12);
  assert.equal(padName(pad()), 'Xbox controller');
  assert.equal(padName({id: 'Wireless Controller (Vendor: 054c Product: 0ce6)'}), 'PlayStation controller');
  assert.equal(padName({id: ''}), 'Controller');
});

test('a pad only wakes on a deliberate press, so an idle wheel or a drifting stick cannot drive the car', () => {
  assert.equal(wakes(null), false);
  assert.equal(wakes(pad({}, [.3, 0])), false, 'a little stick drift is not a wake');
  assert.equal(wakes(pad({7: .3})), false, 'a trigger resting part way is not a wake');
  assert.equal(wakes(pad({0: 1})), true); assert.equal(wakes(pad({}, [-.9, 0])), true); assert.equal(wakes(pad({7: .9})), true);
});
