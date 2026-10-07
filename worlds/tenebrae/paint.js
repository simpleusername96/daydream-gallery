// Turns the lit render into oil paint. Passes, all at a capped "paint" resolution except
// the last: tone → structure tensor → tensor blur → anisotropic Kuwahara (colour laid in
// patches that follow form) → bristle streaks and paint thickness → canvas, relief
// lighting and varnish at display resolution.
// The Kuwahara pass follows Kyprianidis, Kang & Döllner, "Anisotropic Kuwahara Filtering
// with Polynomial Weighting Functions" (2010).
import * as THREE from 'three';

const VERTEX = `in vec3 position; out vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const HEAD = `precision highp float; in vec2 vUv; out vec4 color;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
`;

// Linear HDR → display values, then the grade of the colour scheme: a tint for the
// shadows, a tint for the lights and a saturation.
const TONE = HEAD + `uniform sampler2D source; uniform float fade; uniform vec3 shadowTint; uniform vec3 lightTint; uniform float saturation;
void main(){
  vec4 lit = texture(source, vUv);
  vec3 c = lit.rgb * 1.05;
  c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
  c = pow(c, vec3(1.0 / 2.2));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, saturation);
  c *= mix(shadowTint, lightTint, smoothstep(0.0, 0.55, l));
  // Alpha carries the bristle grain each surface wrote in its own space.
  color = vec4(clamp(c, 0.0, 1.0) * fade, lit.a);
}`;

const TENSOR = HEAD + `uniform sampler2D source; uniform vec2 texel;
void main(){
  vec3 tl = texture(source, vUv + texel * vec2(-1, 1)).rgb, t = texture(source, vUv + texel * vec2(0, 1)).rgb, tr = texture(source, vUv + texel * vec2(1, 1)).rgb;
  vec3 l = texture(source, vUv + texel * vec2(-1, 0)).rgb, r = texture(source, vUv + texel * vec2(1, 0)).rgb;
  vec3 bl = texture(source, vUv + texel * vec2(-1, -1)).rgb, b = texture(source, vUv + texel * vec2(0, -1)).rgb, br = texture(source, vUv + texel * vec2(1, -1)).rgb;
  vec3 gx = (tr + 2.0 * r + br - tl - 2.0 * l - bl) * 0.25, gy = (tl + 2.0 * t + tr - bl - 2.0 * b - br) * 0.25;
  color = vec4(dot(gx, gx), dot(gy, gy), dot(gx, gy), 1.0);
}`;

const BLUR = HEAD + `uniform sampler2D source; uniform vec2 along;
void main(){
  // Linear filtering combines adjacent Gaussian taps without changing their weights.
  vec4 sum = vec4(0.0);
  sum += texture(source, vUv + along * -6.32690382) * 0.20106381;
  sum += texture(source, vUv + along * -4.37754067) * 0.66046450;
  sum += texture(source, vUv + along * -2.43099867) * 1.40726806;
  sum += texture(source, vUv + along * -0.48611468) * 1.94595947;
  sum += texture(source, vUv + along * 1.45842952) * 1.74669687;
  sum += texture(source, vUv + along * 3.40398481) * 1.01764295;
  sum += texture(source, vUv + along * 5.35180578) * 0.38468749;
  sum += texture(source, vUv + along * 7.00000000) * 0.06572853;
  color = sum / 7.42951169;
}`;

const ORIENT = `
// Local flow from the smoothed tensor: xy = unit direction along the form, z = anisotropy.
vec3 flow(vec3 t){
  float root = sqrt(max(0.0, (t.x - t.y) * (t.x - t.y) + 4.0 * t.z * t.z));
  float l1 = 0.5 * (t.x + t.y + root), l2 = 0.5 * (t.x + t.y - root);
  vec2 v = vec2(l1 - t.x, -t.z);
  return vec3(length(v) > 1e-7 ? normalize(v) : vec2(0.0, 1.0), l1 + l2 > 1e-7 ? (l1 - l2) / (l1 + l2) : 0.0);
}`;

const KUWAHARA = HEAD + ORIENT + `uniform sampler2D source; uniform sampler2D tensor; uniform vec2 texel; uniform float radius;
void main(){
  vec3 centre = texture(source, vUv).rgb, structure = texture(tensor, vUv).xyz;
  // The near-black flat ground has no detail to abstract; preserve its own colour.
  if (max(centre.r, max(centre.g, centre.b)) < 0.015 && structure.x + structure.y < 0.000002) { color = vec4(centre, 1.0); return; }
  vec3 f = flow(structure);
  float angle = -atan(f.y, f.x), a = radius * clamp(1.0 + f.z, 0.1, 2.0), b = radius * clamp(1.0 / (1.0 + f.z), 0.1, 2.0);
  float ca = cos(angle), sa = sin(angle);
  mat2 SR = mat2(0.5 / a, 0.0, 0.0, 0.5 / b) * mat2(ca, sa, -sa, ca);
  int mx = int(sqrt(a * a * ca * ca + b * b * sa * sa)), my = int(sqrt(a * a * sa * sa + b * b * ca * ca));
  float zeta = 2.0 / radius, zero = 0.58, sc = sin(zero), eta = (zeta + cos(zero)) / (sc * sc);
  vec4 m[8]; vec3 s[8];
  for (int k = 0; k < 8; k++) { m[k] = vec4(0.0); s[k] = vec3(0.0); }
  for (int y = -my; y <= my; y++) for (int x = -mx; x <= mx; x++) {
    vec2 v = SR * vec2(float(x), float(y));
    if (dot(v, v) > 0.25) continue;
    vec3 c = texture(source, vUv + vec2(float(x), float(y)) * texel).rgb;
    float w[8]; float sum = 0.0, z, vxx = zeta - eta * v.x * v.x, vyy = zeta - eta * v.y * v.y;
    z = max(0.0, v.y + vxx); w[0] = z * z; z = max(0.0, -v.x + vyy); w[2] = z * z;
    z = max(0.0, -v.y + vxx); w[4] = z * z; z = max(0.0, v.x + vyy); w[6] = z * z;
    vec2 d = 0.70710678 * vec2(v.x - v.y, v.x + v.y);
    vxx = zeta - eta * d.x * d.x; vyy = zeta - eta * d.y * d.y;
    z = max(0.0, d.y + vxx); w[1] = z * z; z = max(0.0, -d.x + vyy); w[3] = z * z;
    z = max(0.0, -d.y + vxx); w[5] = z * z; z = max(0.0, d.x + vyy); w[7] = z * z;
    for (int k = 0; k < 8; k++) sum += w[k];
    float g = exp(-3.125 * dot(v, v)) / max(sum, 1e-6);
    for (int k = 0; k < 8; k++) { float wk = w[k] * g; m[k] += vec4(c * wk, wk); s[k] += c * c * wk; }
  }
  vec4 result = vec4(0.0);
  for (int k = 0; k < 8; k++) {
    vec3 mean = m[k].rgb / max(m[k].w, 1e-6), variance = abs(s[k] / max(m[k].w, 1e-6) - mean * mean);
    float w = 1.0 / (1.0 + pow(8000.0 * (variance.r + variance.g + variance.b), 4.0));
    result += vec4(mean * w, w);
  }
  // Where every sector is busy (a glint, a hard crossing) the weights vanish together:
  // keep the pixel's own colour there.
  color = vec4(result.w > 1e-18 ? result.rgb / result.w : texture(source, vUv).rgb, 1.0);
}`;

// Bristle streaks: the grain of each surface smeared along the local flow, so marks wrap
// fruit and petals, travel with them, and sweep in broad arcs where the picture is flat.
// Alpha carries paint height.
const STROKE = HEAD + ORIENT + `uniform sampler2D source; uniform sampler2D tensor; uniform sampler2D grain; uniform vec2 resolution; uniform float scale;
void main(){
  vec3 base = texture(source, vUv).rgb, f = flow(texture(tensor, vUv).xyz);
  vec2 px = vUv * resolution / scale;
  float sweep = noise(px * 0.012) * 6.2832 + noise(px * 0.004 + 9.0) * 3.0;
  vec2 broad = vec2(cos(sweep), sin(sweep)), dir = dot(f.xy, broad) < 0.0 ? -f.xy : f.xy;
  float strength = texture(tensor, vUv).x + texture(tensor, vUv).y;
  dir = normalize(mix(broad, dir, smoothstep(0.00002, 0.0008, strength) * smoothstep(0.05, 0.4, f.z)));
  float fine = 0.0, coarse = 0.0, total = 0.0;
  for (int i = -8; i <= 8; i++) {
    float w = 1.0 - abs(float(i)) / 9.0; vec2 along = dir * float(i) * scale / resolution;
    fine += texture(grain, vUv + along * 1.6).a * w; coarse += texture(grain, vUv + along * 5.0).a * w; total += w;
  }
  fine /= total; coarse /= total;
  float height = clamp(0.5 + (fine - 0.5) * 1.5 + (coarse - 0.5) * 1.9, 0.0, 1.0);
  float l = dot(base, vec3(0.299, 0.587, 0.114));
  // Lights are laid thick, darks are thin glazes.
  float body = mix(0.3, 1.0, smoothstep(0.12, 0.75, l));
  vec3 paint = base * (1.0 + (height - 0.5) * 0.09 * body) + (coarse - 0.5) * 0.012;
  color = vec4(clamp(paint, 0.0, 1.0), height * body);
}`;

// Canvas weave, raking light over the paint relief, varnish sheen and a soft vignette.
const FINISH = HEAD + `uniform sampler2D paint; uniform vec2 texel; uniform vec2 screen; uniform float weave;
float thread(vec2 p){ vec2 q = p / weave; return 0.5 + 0.5 * sin(q.x * 3.14159) * sin(q.y * 3.14159) * (0.7 + 0.3 * noise(q * 0.5)) + (noise(q * 2.0) - 0.5) * 0.25; }
void main(){
  vec4 p = texture(paint, vUv);
  float hx = texture(paint, vUv + vec2(texel.x, 0.0)).a - texture(paint, vUv - vec2(texel.x, 0.0)).a;
  float hy = texture(paint, vUv + vec2(0.0, texel.y)).a - texture(paint, vUv - vec2(0.0, texel.y)).a;
  vec2 at = gl_FragCoord.xy;
  float cloth = thread(at), cx = thread(at + vec2(1.0, 0.0)) - cloth, cy = thread(at + vec2(0.0, 1.0)) - cloth;
  float l = dot(p.rgb, vec3(0.299, 0.587, 0.114)), thin = 1.0 - smoothstep(0.1, 0.6, l);
  vec3 n = normalize(vec3(-hx * 1.5 - cx * (0.08 + 0.14 * thin), -hy * 1.5 - cy * (0.08 + 0.14 * thin), 1.0));
  vec3 light = normalize(vec3(-0.45, 0.6, 0.66));
  float relief = dot(n, light) / light.z - 1.0;
  relief *= 0.3 + 0.7 * smoothstep(0.03, 0.3, l);
  vec3 c = p.rgb * (1.0 + relief * 0.16) + relief * 0.008;
  float sheen = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 48.0) - 0.012;
  c += max(sheen, 0.0) * vec3(1.0, 0.95, 0.85) * (0.015 + 0.06 * p.a);
  vec2 v = (vUv - 0.5) * vec2(1.05, 1.15);
  c *= 1.0 - 0.55 * smoothstep(0.25, 0.85, length(v));
  color = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export function createPainter(renderer) {
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const quad = new THREE.Mesh(triangle), flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false;
  const pass = (fragmentShader, uniforms) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERTEX, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const u = v => ({ value: v });
  const tone = pass(TONE, { source: u(null), fade: u(1), shadowTint: u(new THREE.Vector3(1.1, 0.96, 0.78)), lightTint: u(new THREE.Vector3(1.03, 1, 0.93)), saturation: u(1.1) }), tensor = pass(TENSOR, { source: u(null), texel: u(new THREE.Vector2()) });
  const blur = pass(BLUR, { source: u(null), along: u(new THREE.Vector2()) });
  const kuwahara = pass(KUWAHARA, { source: u(null), tensor: u(null), texel: u(new THREE.Vector2()), radius: u(6) });
  const stroke = pass(STROKE, { source: u(null), tensor: u(null), grain: u(null), resolution: u(new THREE.Vector2()), scale: u(1) });
  const copy = pass(HEAD + 'uniform sampler2D source; void main(){ color = vec4(texture(source, vUv).rgb, 1.0); }', { source: u(null) });
  const finish = pass(FINISH, { paint: u(null), texel: u(new THREE.Vector2()), screen: u(new THREE.Vector2()), weave: u(3) });
  const target = (type, extra = {}) => new THREE.WebGLRenderTarget(4, 4, { type, depthBuffer: false, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, ...extra });
  const lit = target(THREE.HalfFloatType, { depthBuffer: true, samples: 0 }), toned = target(THREE.UnsignedByteType);
  const tensorA = target(THREE.HalfFloatType), tensorB = target(THREE.HalfFloatType), laid = target(THREE.UnsignedByteType), painted = target(THREE.UnsignedByteType);
  const targets = [lit, toned, tensorA, tensorB, laid, painted];
  let width = 4, height = 4, raw = false;

  function run(material, output) { quad.material = material; renderer.setRenderTarget(output); renderer.render(quad, flat); }

  function resize(displayWidth, displayHeight, maxPixels) {
    const fit = Math.min(1, Math.sqrt(maxPixels / (displayWidth * displayHeight)));
    width = Math.max(4, Math.round(displayWidth * fit)); height = Math.max(4, Math.round(displayHeight * fit));
    renderer.setSize(displayWidth, displayHeight, false);
    for (const t of targets) if (t !== laid) t.setSize(width, height);
    // Only the expensive colour abstraction is coarser; lighting, edges and bristles
    // retain the full painted resolution, and the final canvas remains display-sized.
    const filterFit = Math.min(1, Math.sqrt(300_000 / (width * height)));
    laid.setSize(Math.max(4, Math.round(width * filterFit)), Math.max(4, Math.round(height * filterFit)));
    const texel = new THREE.Vector2(1 / width, 1 / height);
    tensor.uniforms.texel.value.copy(texel); kuwahara.uniforms.texel.value.copy(texel); finish.uniforms.texel.value.copy(texel);
    // Brush size follows the picture, not the pixel grid: the same strokes at any resolution.
    const unit = Math.sqrt(width * height) / 1000;
    kuwahara.uniforms.radius.value = Math.max(3, 4.3 * unit);
    stroke.uniforms.resolution.value.set(width, height); stroke.uniforms.scale.value = unit;
    finish.uniforms.screen.value.set(displayWidth, displayHeight); finish.uniforms.weave.value = Math.max(2.2, Math.sqrt(displayWidth * displayHeight) / 520);
    return [width, height];
  }

  function render(scene, camera, fade = 1) {
    renderer.setRenderTarget(lit); renderer.render(scene, camera);
    tone.uniforms.source.value = lit.texture; tone.uniforms.fade.value = fade;
    run(tone, toned);
    if (raw) { copy.uniforms.source.value = toned.texture; run(copy, null); return; }
    tensor.uniforms.source.value = toned.texture; run(tensor, tensorA);
    blur.uniforms.source.value = tensorA.texture; blur.uniforms.along.value.set(1 / width, 0); run(blur, tensorB);
    blur.uniforms.source.value = tensorB.texture; blur.uniforms.along.value.set(0, 1 / height); run(blur, tensorA);
    kuwahara.uniforms.source.value = toned.texture; kuwahara.uniforms.tensor.value = tensorA.texture; run(kuwahara, laid);
    stroke.uniforms.source.value = laid.texture; stroke.uniforms.tensor.value = tensorA.texture; stroke.uniforms.grain.value = toned.texture; run(stroke, painted);
    finish.uniforms.paint.value = painted.texture; run(finish, null);
  }

  function dispose() {
    for (const t of targets) t.dispose();
    for (const m of [tone, tensor, blur, kuwahara, stroke, finish, copy]) m.dispose();
    triangle.dispose();
  }
  // `setRaw(true)` shows the untreated render, for judging what the brushwork adds.
  function setGrade(grade) { tone.uniforms.shadowTint.value.set(...grade.shadow); tone.uniforms.lightTint.value.set(...grade.light); tone.uniforms.saturation.value = grade.saturation; }
  return { resize, render, dispose, setGrade, setRaw(value) { raw = Boolean(value); }, size: () => [width, height] };
}
