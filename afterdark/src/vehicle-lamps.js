// Only exterior lens materials from the garage models belong in the lighting pass.
export function lampRole(mesh, escalade = false) {
  if (escalade) {
    const name = mesh.name;
    if (/clear_plastic|swb_chml_glass/.test(name)) return 'cover';
    if (name.includes('common_running_facia_lamps')) return 'drl';
    if (/common_(headlights_etched|running_headlight)/.test(name)) return 'head';
    if (name.includes('swb_tail_lamp_long')) return 'tail';
    if (name.includes('swb_chml_red')) return 'stop';
    return null;
  }
  const material = mesh.material?.name || '';
  if (/^(TailLens|RearLightsPBR|EGlass_Red_Tint)/i.test(material) || mesh.name === 'lights_red') return 'tail';
  if (/^(HeadLens|FrontLightsPBR|HL_Glass|ELED_Light_Pipe|TMI_Light_011|lights$|light_2$)/i.test(material) || /^(lights|leds)$/.test(mesh.name)) return 'head';
  return null;
}

export function clearLampCover(material) {
  const cover = material.clone();
  cover.transparent = true;
  cover.opacity = .10;
  cover.depthWrite = false;
  cover.metalness = .1;
  cover.roughness = .12;
  return cover;
}
