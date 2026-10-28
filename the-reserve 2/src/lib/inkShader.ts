// WebGL1 shaders for the ink stage. Two scene textures are composed per frame:
// each is cover-fitted with its own camera, optionally rendered as an ink wash,
// and the pair is blended through an organic noise threshold with a pigment fringe.

export const vertexShader = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform float uTime;
uniform float uMix;
uniform float uMode;

// per-scene: ink, mist, speed, parallax / light
uniform vec4 uSceneA;
uniform vec4 uSceneB;
uniform float uLightA;
uniform float uLightB;
uniform vec3 uCamA;
uniform vec3 uCamB;

const vec3 PAPER = vec3(0.925, 0.898, 0.835);
const vec3 INK = vec3(0.075, 0.09, 0.08);
const vec3 MIST = vec3(0.93, 0.925, 0.895);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

vec2 coverUV(vec2 uv, vec2 size, vec3 cam, float par, out vec2 center) {
  float sa = uRes.x / uRes.y;
  float ia = size.x / size.y;
  vec2 win = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  win /= cam.x;
  vec2 focus = vec2(cam.y, 1.0 - cam.z);
  center = clamp(focus, win * 0.5, 1.0 - win * 0.5);
  // foreground (bottom of frame) magnifies slightly faster than the horizon: cheap depth parallax
  float depth = 1.0 + par * pow(1.0 - uv.y, 2.0);
  return center + (uv - 0.5) * win / depth;
}

vec3 inkWash(sampler2D t, vec2 uv, vec2 texel, vec3 col) {
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  float lx = dot(texture2D(t, uv + vec2(texel.x, 0.0)).rgb, vec3(0.333));
  float ly = dot(texture2D(t, uv + vec2(0.0, texel.y)).rgb, vec3(0.333));
  float edge = abs(l - lx) + abs(l - ly);
  // Lift the photograph into a pale wash: paper dominates, ink pools only in the deepest shadows.
  float tone = pow(smoothstep(0.0, 0.62, l), 0.45);
  tone = floor(tone * 5.0 + noise(uv * 900.0) * 0.6) / 5.0 * 0.3 + tone * 0.7; // soft wash banding
  vec3 w = mix(INK, PAPER, 0.18 + 0.82 * tone);
  w = mix(w, w * vec3(0.93, 0.99, 0.95), 0.35 * (1.0 - tone)); // faint green in the mid-tones
  w = mix(w, PAPER, 0.22 * smoothstep(0.35, 1.0, vUv.y)); // the sky dissolves into bare paper
  w *= 1.0 - clamp(edge * 2.2, 0.0, 0.38); // soft brush line work
  float grain = fbm(vUv * uRes / 2.5);
  w *= 0.95 + 0.07 * grain;
  return w;
}

vec3 scene(sampler2D t, vec2 size, vec3 cam, vec4 s, float light, float seed) {
  float ink = s.x;
  float mist = s.y;
  float speed = s.z;
  float par = s.w;

  vec2 center;
  vec2 uv = coverUV(vUv, size, cam, par, center);
  vec3 col = texture2D(t, uv).rgb;

  if (speed > 0.001) {
    vec2 dir = (uv - center) * speed * 0.018;
    col = (col + texture2D(t, uv - dir).rgb + texture2D(t, uv - dir * 2.0).rgb + texture2D(t, uv - dir * 3.0).rgb) * 0.25;
  }

  // gentle editorial grade
  col = mix(col, col * vec3(1.03, 1.0, 0.95), 0.6);
  col = mix(vec3(dot(col, vec3(0.333))), col, 0.92);

  if (ink > 0.001) {
    vec3 w = inkWash(t, uv, 3.0 / size, texture2D(t, uv + 1.5 / size).rgb * 0.5 + col * 0.5);
    float f = fbm(vUv * 3.0 + seed) * 0.65 + (1.0 - length((vUv - vec2(0.5, 0.46)) * vec2(1.25, 1.0)) * 1.15) * 0.35;
    float th = ink * 1.2 - 0.1;
    float reveal = smoothstep(th - 0.06, th + 0.06, f);
    float band = 1.0 - abs(reveal * 2.0 - 1.0);
    col = mix(w, col, reveal);
    col = mix(col, col * vec3(0.32, 0.4, 0.36), band * 0.6 * (0.25 + 0.75 * fbm(vUv * 16.0 + seed)));
  }

  // drifting mist, heavier in the lower valleys
  float m = fbm(vUv * vec2(1.6, 3.4) + vec2(uTime * 0.012 + seed, -uTime * 0.004));
  float mm = smoothstep(0.38, 0.86, m) * mist * (0.55 + 0.45 * smoothstep(1.0, 0.25, vUv.y));
  col = mix(col, MIST, clamp(mm * 1.15, 0.0, 0.92));

  // warm light from above
  col += vec3(0.16, 0.11, 0.045) * light * smoothstep(0.45, 1.0, vUv.y) * (0.55 + 0.45 * fbm(vUv * 2.0 + uTime * 0.01)) * (1.0 - ink);
  return col;
}

void main() {
  vec3 colA = scene(uA, uSizeA, uCamA, uSceneA, uLightA, 1.3);
  vec3 col = colA;
  float vig = 1.0;

  if (uMix > 0.0005) {
    vec3 colB = scene(uB, uSizeB, uCamB, uSceneB, uLightB, 7.9);
    float g;
    if (uMode < 0.5) {
      g = fbm(vUv * 2.4 + 3.1) * 0.6 + (1.0 - length(vUv - 0.5) * 1.4) * 0.4;
    } else if (uMode < 1.5) {
      g = fbm(vUv * vec2(3.0, 2.0) + 7.0) * 0.42 + (1.0 - vUv.y) * 0.58;
    } else {
      g = fbm(vUv * 2.2 + 11.0) * 0.55 + (1.0 - length(vUv - vec2(0.5, 0.4)) * 1.2) * 0.45;
    }
    float th = 1.12 - uMix * 1.25;
    float m = smoothstep(th - 0.05, th + 0.05, g);
    float band = 1.0 - abs(m * 2.0 - 1.0);
    float near = smoothstep(0.22, 0.0, abs(g - th)) * (1.0 - smoothstep(0.85, 1.0, uMix));
    col = mix(colA, colB, m);

    if (uMode < 1.5) {
      // pigment fringe + specks thrown off the leading edge
      col = mix(col, INK, band * 0.62 * (0.45 + 0.55 * fbm(vUv * 22.0 + uMix)));
      // round ink droplets: aspect-correct, rotated off the noise grid so nothing reads as pixels
      vec2 q = mat2(0.866, 0.5, -0.5, 0.866) * (vUv * vec2(uRes.x / uRes.y, 1.0));
      float specks = smoothstep(0.66, 0.71, fbm(q * 26.0 + 13.0)) * near;
      specks += smoothstep(0.74, 0.78, fbm(q * 70.0 + 29.0)) * near * 0.7;
      col = mix(col, INK, clamp(specks, 0.0, 1.0) * 0.8);
    } else {
      // clouds lift past the camera
      // clouds lift past the camera: fully covering at mid-passage, with soft grey undersides
      float lift = sin(uMix * 3.14159);
      vec2 cq = vUv * vec2(uRes.x / uRes.y, 1.0);
      float cl = fbm(cq * vec2(1.6, 2.4) + vec2(uTime * 0.02, -uMix * 2.6));
      float cl2 = fbm(cq * 4.0 + vec2(-uTime * 0.03, -uMix * 3.4) + 5.0);
      float cover = smoothstep(0.2, 0.55, cl * 0.75 + cl2 * 0.25 + lift * 1.0 - 0.32) * smoothstep(0.0, 0.3, lift);
      vec3 cloud = mix(vec3(0.87, 0.875, 0.86), vec3(0.97, 0.955, 0.92), smoothstep(0.3, 0.75, cl2 * 0.6 + vUv.y * 0.5));
      cloud += vec3(0.08, 0.05, 0.01) * smoothstep(0.55, 1.0, vUv.y); // sun through the cloud tops
      col = mix(col, cloud, cover);
      vig = 1.0 - cover * 0.8; // no dark corners inside the cloud
    }
  }

  // vignette + film grain
  col *= 1.0 - 0.28 * vig * pow(length(vUv - 0.5) * 1.3, 2.6);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}
`;
