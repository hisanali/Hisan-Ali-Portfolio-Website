// Only exterior lens materials from the garage models belong in the lighting pass.
export function lampRole(mesh) {
  const material = mesh.material?.name || '';
  if (/^(TailLens|RearLightsPBR|EGlass_Red_Tint)/i.test(material) || mesh.name === 'lights_red') return 'tail';
  if (/^(HeadLens|FrontLightsPBR|HL_Glass|ELED_Light_Pipe|TMI_Light_011|lights$|light_2$)/i.test(material) || /^(lights|leds)$/.test(mesh.name)) return 'head';
  return null;
}
