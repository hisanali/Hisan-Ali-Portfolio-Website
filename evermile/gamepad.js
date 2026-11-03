// Standard-mapping game controller: left stick steers, triggers drive, the face buttons do what the keyboard shortcuts do.
// readGamepad is pure so the mapping can be tested; the caller keeps `previous` between frames for rising-edge actions.
export const DEADZONE = .12;
export const BUTTONS = {autodrive: 0, handbrake: 1, horn: 2, camera: 3, indicateLeft: 4, indicateRight: 5, reset: 8, pause: 9, lights: 12, radio: 13, cruiseDown: 14, cruiseUp: 15, photo: 11};
export const BUTTON_HELP = [['Steer', 'Left stick'], ['Accelerate / brake', 'RT / LT'], ['Autodrive', 'A'], ['Handbrake', 'B'], ['Horn', 'X'], ['Camera', 'Y'], ['Indicate', 'LB / RB'], ['Pause', 'Start'], ['Reset on road', 'Back'], ['Headlights / radio', 'D-pad up / down'], ['Cruise speed', 'D-pad left / right'], ['Photo mode', 'Right stick click']];

// Rescales a stick reading so it eases out of the dead zone instead of jumping to 12 %.
export function axis(value, deadzone = DEADZONE) {
  const v = Number.isFinite(value) ? value : 0, a = Math.abs(v);
  if (a < deadzone) return 0;
  return Math.sign(v) * Math.min(1, (a - deadzone) / (1 - deadzone));
}

function value(button) { return typeof button === 'number' ? button : button?.value ?? (button?.pressed ? 1 : 0); }

// Returns the driving inputs plus the buttons that went down this frame. `held` lists the buttons that are down.
export function readGamepad(pad, previous = {}) {
  const buttons = pad?.buttons || [], axes = pad?.axes || [];
  const held = {}, pressed = {};
  for (const [name, index] of Object.entries(BUTTONS)) {
    const down = value(buttons[index]) > .5; held[name] = down;
    pressed[name] = down && !previous[name];
  }
  // Steering from the left stick; the keyboard convention is positive to the left.
  const input = -axis(axes[0]) || 0;
  const trigger = (i) => value(buttons[i]);
  const throttle = Math.max(trigger(7), 0), brake = Math.max(trigger(6), 0);
  return {input, throttle, brake, held, pressed, active: !!pad && (input !== 0 || throttle > 0 || brake > 0 || Object.values(held).some(Boolean))};
}

// A short, readable name for the connected pad.
export function padName(pad) {
  const raw = String(pad?.id || ''), id = raw.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  if (/xbox|xinput|045e/i.test(raw)) return 'Xbox controller';
  if (/dualsense|dualshock|playstation|054c/i.test(raw)) return 'PlayStation controller';
  if (/pro controller|switch|057e/i.test(raw)) return 'Switch controller';
  return id ? id.slice(0, 40) : 'Controller';
}
