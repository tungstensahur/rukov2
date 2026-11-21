// Ruko Studio core, in C++, compiled to WebAssembly.
//
// The editor's geometry decisions live here: snapping a dragged object to the grid, clamping it
// to the level bounds, working out where an object's visual centre is, finding the floor height
// under the cursor, turning a mouse ray into a distance along the gizmo axis, and checking a
// level before it is published.
//
// Built for wasm32-freestanding by Zig's clang, so there is no libc: no heap, no STL, no maths
// library. Only plain arithmetic and a small bump arena for the arrays JavaScript hands in.
// The JavaScript side (public/js/43-studio-cpp.js) keeps an identical fallback for the moment
// before the module has loaded, or if WebAssembly is blocked.

typedef unsigned char u8;
typedef unsigned long usize;

static u8 arena[131072];
static usize arena_used = 0;

static double dabs(double v) { return v < 0 ? -v : v; }

static double dfloor(double v) {
  double t = (double)(long long)v;
  return t > v ? t - 1.0 : t;
}

static double dround(double v) {
  return v < 0 ? -dfloor(-v + 0.5) : dfloor(v + 0.5);
}

static double dmax(double a, double b) { return a > b ? a : b; }
static double dmin(double a, double b) { return a < b ? a : b; }

// Same as +v.toFixed(2) in the editor.
static double round2(double v) { return dround(v * 100.0) / 100.0; }

#define EXPORT(name) extern "C" __attribute__((export_name(#name)))

EXPORT(rk_alloc) double rk_alloc(double bytes) {
  usize n = (usize)bytes;
  usize at = arena_used;
  if (at + n > sizeof(arena)) {
    return -1;
  }
  arena_used = at + n + ((8 - (n % 8)) % 8);
  return (double)at;
}

EXPORT(rk_alloc_ptr) double rk_alloc_ptr() { return (double)(usize)arena; }

EXPORT(rk_reset) double rk_reset() {
  arena_used = 0;
  return 1;
}

// Snap a value to the grid; a step of 0 means "just round to two decimals".
EXPORT(rk_snap) double rk_snap(double v, double step) {
  if (step <= 0) {
    return round2(v);
  }
  return dround(v / step) * step;
}

EXPORT(rk_clamp) double rk_clamp(double v, double lo, double hi) {
  if (v != v) {
    return lo;
  }
  return dmin(dmax(v, lo), hi);
}

EXPORT(rk_round2) double rk_round2(double v) { return round2(v); }

// Where an object's centre sits, by kind: p platform, d decoration, s spawn, w weapon, c coin.
// y is the stored height, th the platform thickness, sy the decoration height.
EXPORT(rk_center_y) double rk_center_y(double kind, double y, double th, double sy) {
  int k = (int)kind;
  switch (k) {
    case 'p': return y - (th > 0 ? th : 0.5) / 2.0;
    case 'd': return y + sy / 2.0;
    case 's': return y + 0.3;
    case 'w': return y + 1.0;
    default: return y;
  }
}

// The gizmo drag: distance along the axis where the mouse ray comes closest to it.
// Mirrors lp() in the editor. Returns a large negative number when the ray is parallel.
EXPORT(rk_axis_t) double rk_axis_t(double ox, double oy, double oz, double dx, double dy, double dz,
                                  double cx, double cy, double cz, double ax, double ay,
                                  double az) {
  double wx = cx - ox, wy = cy - oy, wz = cz - oz;
  double b = ax * dx + ay * dy + az * dz;
  double d = ax * wx + ay * wy + az * wz;
  double e = dx * wx + dy * wy + dz * wz;
  double den = 1.0 - b * b;
  if (den < 1e-5) {
    return -1e9;
  }
  return (b * e - d) / den;
}

// The floor height under a point: the highest platform whose footprint contains it.
// boxes is a flat array of x, z, sx, sz, y per platform.
EXPORT(rk_ground_at) double rk_ground_at(double x, double z, double ptr, double count) {
  const double *boxes = (const double *)(usize)ptr;
  int n = (int)count;
  double best = 0;
  for (int i = 0; i < n; i++) {
    const double *b = boxes + i * 5;
    if (dabs(x - b[0]) <= b[2] / 2.0 && dabs(z - b[1]) <= b[3] / 2.0) {
      best = dmax(best, b[4]);
    }
  }
  return best;
}

// A level check before publishing. objs is x, y, z, sx, sz, th, kind, type per object,
// with kind and type as character codes. Returns a bit mask:
//   1 has a platform, 2 has a spawn point, 4 has a goal, 8 over 300 objects,
//   16 more than 8 spawn points, 32 nothing at all.
EXPORT(rk_validate) double rk_validate(double ptr, double count) {
  const double *o = (const double *)(usize)ptr;
  int n = (int)count;
  int mask = 0;
  int spawns = 0;
  for (int i = 0; i < n; i++) {
    const double *q = o + i * 8;
    int kind = (int)q[6];
    int type = (int)q[7];
    if (kind == 'p') {
      mask |= 1;
      if (type == 'g') {
        mask |= 4;
      }
    }
    if (kind == 's') {
      spawns++;
    }
  }
  if (spawns > 0) mask |= 2;
  if (n > 300) mask |= 8;
  if (spawns > 8) mask |= 16;
  if (n == 0) mask |= 32;
  return (double)mask;
}

// Distance from a point to an object's box footprint, used by the editor's focus and picking
// helpers. Kept here so the same numbers are used everywhere.
EXPORT(rk_footprint_dist) double rk_footprint_dist(double px, double pz, double x, double z,
                                                   double sx, double sz) {
  double dx = dmax(dabs(px - x) - sx / 2.0, 0.0);
  double dz = dmax(dabs(pz - z) - sz / 2.0, 0.0);
  return dx * dx + dz * dz;
}
