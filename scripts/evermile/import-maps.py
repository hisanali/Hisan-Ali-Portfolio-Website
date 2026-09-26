"""Split the supplied dasy444 street and forest scenes into two runtime kits.

city-kit.glb   individual buildings (panel towers, mid-rise blocks, shop rows, street facades), each a root node with its
               footprint centred on the origin, ground at zero and real-world scale. Flat facades get a plain back volume
               and open-topped towers get a roof, so neither looks hollow from the road.
forest-kit.glb trees, boulders and undergrowth as separate prototypes for instanced planting.

The source GLBs are Sketchfab downloads (four under the Sketchfab Standard licence, one CC BY 4.0). They are read from
scripts/evermile/source/maps/ (git-ignored, so the originals are never published) or else ~/Downloads.

Run with Blender 4.5:  Blender --background --python scripts/evermile/import-maps.py
"""
import bpy, bmesh, math, pathlib, os
from mathutils import Vector, Matrix

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'evermile/assets/models'
LOCAL = pathlib.Path(__file__).resolve().parent / 'source/maps'
SRC = LOCAL if LOCAL.exists() else pathlib.Path.home() / 'Downloads'


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def load(name):
    """Import one scene; returns only its meshes, unparented with their world transforms kept."""
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(SRC / (name + '.glb')))
    new = [o for o in bpy.context.scene.objects if o not in before]
    objs = [o for o in new if o.type == 'MESH']
    for o in objs:
        o.data = o.data.copy(); m = o.matrix_world.copy(); o.parent = None; o.matrix_world = m
    for o in new:
        if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
    return objs


def bounds(objs):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi


def prefix(o):
    return o.name.split('_')[0]


def cluster(objs):
    """Objects sharing a name stem are one building; stems of similar size whose footprints mostly overlap (stacked
    storeys) join up. A small shop standing inside a big tower's bounding box stays its own building."""
    groups = {}
    for o in objs:
        groups.setdefault(prefix(o), []).append(o)
    groups = list(groups.values())
    merged = True
    while merged:
        merged = False
        for i in range(len(groups)):
            for k in range(i + 1, len(groups)):
                (a0, a1), (b0, b1) = bounds(groups[i]), bounds(groups[k])
                ox = min(a1.x, b1.x) - max(a0.x, b0.x); oy = min(a1.y, b1.y) - max(a0.y, b0.y)
                if ox <= 0 or oy <= 0:
                    continue
                areas = sorted([max((a1.x - a0.x) * (a1.y - a0.y), .01), max((b1.x - b0.x) * (b1.y - b0.y), .01)])
                if ox * oy / areas[0] > .3 and areas[1] / areas[0] < 6:
                    groups[i] += groups.pop(k); merged = True; break
            if merged:
                break
    return groups


def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def normalise(o, scale):
    """Footprint centre to the origin, ground at zero, then to metres."""
    vs = [v.co for v in o.data.vertices]
    lo = Vector([min(v[i] for v in vs) for i in range(3)]); hi = Vector([max(v[i] for v in vs) for i in range(3)])
    o.data.transform(Matrix.Scale(scale, 4) @ Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
    o.data.update()
    return (hi - lo) * scale


def plain(name, rgb, rough=.9):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    return m


def slot_of(o, material):
    if material.name not in [s.material.name for s in o.material_slots if s.material]:
        o.data.materials.append(material)
    return [s.material.name for s in o.material_slots].index(material.name)


def add_box(o, lo, hi, material, side_material=None, uv_rect=None):
    """Append a closed box (lo..hi, object space). Its walls can reuse a facade material, with that facade's texture
    region wrapped round each side (uv_rect = (u0, v0, u1, v1)); the top and bottom take `material`."""
    top = slot_of(o, material); wall = slot_of(o, side_material) if side_material else top
    bm = bmesh.new(); bm.from_mesh(o.data)
    uv = bm.loops.layers.uv.active or bm.loops.layers.uv.new()
    geom = bmesh.ops.create_cube(bm, size=1)['verts']
    for v in geom:
        v.co = Vector((lo.x + (v.co.x + .5) * (hi.x - lo.x), lo.y + (v.co.y + .5) * (hi.y - lo.y), lo.z + (v.co.z + .5) * (hi.z - lo.z)))
    size = hi - lo
    for f in {f for v in geom for f in v.link_faces}:
        vertical = abs(f.normal.z) < .5
        f.material_index = wall if vertical else top
        for loop in f.loops:
            c = loop.vert.co
            if vertical and uv_rect:
                a = (c.y - lo.y) / max(size.y, 1e-6) if abs(f.normal.x) > .5 else (c.x - lo.x) / max(size.x, 1e-6)
                b = (c.z - lo.z) / max(size.z, 1e-6)
                loop[uv].uv = (uv_rect[0] + a * (uv_rect[2] - uv_rect[0]), uv_rect[1] + b * (uv_rect[3] - uv_rect[1]))
            else:
                loop[uv].uv = (c.x * .05, c.y * .05)
    bm.to_mesh(o.data); bm.free(); o.data.update()


def uv_bounds(o, slot=0):
    """The texture region used by one material's faces."""
    layer = o.data.uv_layers.active
    us = [layer.data[li].uv for p in o.data.polygons if p.material_index == slot for li in p.loop_indices]
    return (min(u.x for u in us), min(u.y for u in us), max(u.x for u in us), max(u.y for u in us)) if us else None


def has_roof(o, h):
    return any(p.normal.z > .7 and p.center.z > h * .85 for p in o.data.polygons)


def opaque(materials):
    for m in materials:
        if m:
            m.blend_method = 'OPAQUE'
            if hasattr(m, 'surface_render_method'): m.surface_render_method = 'DITHERED'


def cutout(materials):
    for m in materials:
        if m:
            m.blend_method = 'CLIP'; m.alpha_threshold = .45
            if hasattr(m, 'surface_render_method'): m.surface_render_method = 'DITHERED'


def shrink_images(limit=1024):
    for im in bpy.data.images:
        if im.size[0] > limit or im.size[1] > limit:
            k = limit / max(im.size); im.scale(max(1, int(im.size[0] * k)), max(1, int(im.size[1] * k)))
        if im.source in {'FILE', 'GENERATED'} or im.packed_file is None:
            try: im.pack()
            except RuntimeError: pass


def export(path, objs, fmt):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_extras=True, export_animations=False,
                              export_image_format=fmt, export_jpeg_quality=76, export_image_quality=80, export_apply=True)
    print('EXPORTED', path.name, round(path.stat().st_size / 1e6, 2), 'MB', len(objs), 'parts', flush=True)


# ---------- City kit ----------
# Scales are per source: the three scenes were modelled at different sizes. Chosen from storey counts on the textures.
CITY = [('street_city_7_for_games_free', 'c7', lambda h: 3.4 if h > 10 else 3.0 if h > 5 else 2.8),
        ('street_city_buildings_8', 'c8', lambda h: 6.0),
        ('low_poly_street_gameready_6', 'ls', lambda h: 2.3)]


def city():
    reset()
    roof = plain('City roof', (.24, .25, .26), .95)
    kept, index, seen = [], 0, set()
    for name, tag, scale_for in CITY:
        objs = load(name)
        for grp in cluster(objs):
            lo, hi = bounds(grp); size = hi - lo
            # Ground sheets, kerbs, fences and small street props are left out: the game draws its own streets.
            if size.z < (3 if tag == 'ls' else 1.2) or size.z < .05:
                for o in grp: bpy.data.objects.remove(o, do_unlink=True)
                continue
            s = scale_for(size.z)
            # One building per distinct shape (the scenes repeat many), and no merged multi-building sites.
            polys = sum(len(q.data.polygons) for q in grp)
            key = (tag, tuple(sorted((round(size.x * s), round(size.y * s)))), round(size.z * s), polys // 40)
            if key in seen or max(size.x, size.y) * s > 45:
                for q in grp: bpy.data.objects.remove(q, do_unlink=True)
                continue
            seen.add(key)
            o = join(grp, f'{tag}-{index:02d}'); index += 1
            dims = normalise(o, s)
            if len(o.data.polygons) > 3500:
                mod = o.modifiers.new('Street viewing detail', 'DECIMATE'); mod.ratio = 3500 / len(o.data.polygons)
                bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=mod.name)
            opaque([sl.material for sl in o.material_slots])
            vs = [v.co for v in o.data.vertices]
            lo = Vector([min(v[i] for v in vs) for i in range(3)]); hi = Vector([max(v[i] for v in vs) for i in range(3)])
            if min(dims.x, dims.y) < 1.2:
                # A single facade sheet: give it a building behind, on the side away from its face. Front ends up facing -Y.
                n = sum((p.normal * p.area for p in o.data.polygons), Vector())
                if abs(n.x) > abs(n.y):
                    o.data.transform(Matrix.Rotation(-math.pi / 2 if n.x > 0 else math.pi / 2, 4, 'Z'))
                else:
                    o.data.transform(Matrix.Rotation(math.pi if n.y > 0 else 0, 4, 'Z'))
                vs = [v.co for v in o.data.vertices]
                lo = Vector([min(v[i] for v in vs) for i in range(3)]); hi = Vector([max(v[i] for v in vs) for i in range(3)])
                depth = max(8, (hi.x - lo.x) * .8)
                add_box(o, Vector((lo.x + .05, hi.y + .02, 0)), Vector((hi.x - .05, hi.y + depth, hi.z - .05)), roof, o.material_slots[0].material, uv_bounds(o, 0))
                kind = 'facade'
            elif not has_roof(o, hi.z):
                add_box(o, Vector((lo.x + .02, lo.y + .02, hi.z - .35)), Vector((hi.x - .02, hi.y - .02, hi.z - .15)), roof)
                kind = None
            else:
                kind = None
            vs = [v.co for v in o.data.vertices]
            lo = Vector([min(v[i] for v in vs) for i in range(3)]); hi = Vector([max(v[i] for v in vs) for i in range(3)])
            h = hi.z
            o['kind'] = kind or ('tower' if h > 30 else 'block' if h > 12 else 'low')
            o['w'], o['d'], o['h'] = round(hi.x - lo.x, 2), round(hi.y - lo.y, 2), round(h, 2)
            o.location = (0, 0, 0)
            kept.append(o)
    shrink_images(768)
    for o in kept:
        print('CITY', o.name, o['kind'], o['w'], o['d'], o['h'], len(o.data.polygons), flush=True)
    export(OUT / 'city-kit.glb', kept, 'JPEG')


# ---------- Forest kit ----------
def pick_distinct(groups, count, key):
    seen, out = [], []
    for g in sorted(groups, key=key, reverse=True):
        k = key(g)
        if all(abs(k - s) > .12 * max(k, 1) for s in seen):
            seen.append(k); out.append(g)
        if len(out) >= count:
            break
    return out


def forest():
    reset()
    kept = []

    def keep(grp, name, scale, cut=True):
        o = join(grp, name); dims = normalise(o, scale)
        (cutout if cut else opaque)([s.material for s in o.material_slots])
        o['w'], o['d'], o['h'] = round(dims.x, 2), round(dims.y, 2), round(dims.z, 2); o.location = (0, 0, 0); kept.append(o)
        return o

    # Mountain forest: each tree is a trunk with photo-card crowns sharing a Cylinder.NNN stem; mossy boulders by material.
    objs = load('the_landscape_is_a_forest_in_the_mountains')
    trees = [g for stem, g in {prefix(o): [q for q in objs if prefix(q) == prefix(o)] for o in objs if prefix(o).startswith('Cylinder')}.items()]
    height = lambda g: (bounds(g)[1] - bounds(g)[0]).z
    rocks = {}
    for o in objs:
        m = o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else ''
        if m.startswith('47_') and not prefix(o).startswith('Cylinder'):
            rocks.setdefault(m[:3], o)
    for i, g in enumerate(pick_distinct(trees, 4, height)):
        keep(g, f'pine-{i}', 2.5)
    for i, o in enumerate(rocks.values()):
        keep([o], f'boulder-{i}', 2.5, cut=False)
    used = {o for o in kept}
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and o not in used]:
        bpy.data.objects.remove(o, do_unlink=True)

    # Night forest: slender pines (trunk + crown sharing a stem) and ferns.
    objs = load('a_forest_3_with_a_road_at_night_for_game')
    trees = [g for stem, g in {prefix(o): [q for q in objs if prefix(q) == prefix(o)] for o in objs if prefix(o).startswith('Cylinder')}.items() if len(g) >= 2]
    ferns = {}
    for o in objs:
        stem = o.data.name[:6]
        if stem in ('3f84ae', '05ade0') and stem not in ferns and not prefix(o).startswith('Cylinder'):
            ferns[stem] = o
    for i, g in enumerate(pick_distinct(trees, 3, height)):
        keep(g, f'spruce-{i}', 7)
    for i, o in enumerate(ferns.values()):
        keep([o], f'fern-{i}', 7)
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and o not in kept]:
        bpy.data.objects.remove(o, do_unlink=True)
    shrink_images(512)
    for o in kept:
        print('FOREST', o.name, o['w'], o['d'], o['h'], len(o.data.polygons), [s.material.name[:20] for s in o.material_slots], flush=True)
    export(OUT / 'forest-kit.glb', kept, 'WEBP')


city()
forest()
