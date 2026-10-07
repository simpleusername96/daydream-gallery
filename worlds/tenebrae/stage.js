// The lit 3D garland: spiral-surface blooms that open and close under one warm key light.
// It renders the scene only; paint.js turns that render into brushwork.
import * as THREE from 'three';
import { compose, lighting, place, great, dust, staging, random, GREAT, DUST } from './orbit.js';
import { roseGeometry, leafGeometry, sepalGeometry, shedPetalGeometry, BLOOMS } from './flowers.js';
import { TONES, schemeOf } from './schemes.js';
import { prepareBotanicalMotion, poseBotanicalMotion, originRadius, clearPetal } from './motion.js';
import { batchSurfaces } from './batching.js';

const UP = new THREE.Vector3(0, 1, 0), KEY_INTENSITY = 1150;

const DIFFUSE = 'float dotNL = saturate( dot( geometryNormal, directLight.direction ) );';
const GRAIN = `varying vec3 vPaint;
float paintHash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float paintNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(paintHash(i), paintHash(i + vec3(1, 0, 0)), f.x), mix(paintHash(i + vec3(0, 1, 0)), paintHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(paintHash(i + vec3(0, 0, 1)), paintHash(i + vec3(1, 0, 1)), f.x), mix(paintHash(i + vec3(0, 1, 1)), paintHash(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float paintGrain(vec3 p){ return 0.62 * paintNoise(p) + 0.38 * paintNoise(p * 3.3 + 5.0); }`;
// Two changes to a standard material, both pinned to the three.js 0.180 shader chunks and
// both skipped harmlessly if those chunks change:
// - `through`: thin petals and leaves pass light, so the side turned away from the key
//   keeps part of its colour instead of falling to black;
// - `grain`: bristle grain is written to alpha in the object's own space, so brush marks
//   travel with a moving bloom instead of sliding over it.
function prepare(material, { through = 0, grain = 7 } = {}) {
  material.onBeforeCompile = shader => {
    const chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
    if (through && chunk.includes(DIFFUSE)) shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_pars_fragment>', chunk.replace(DIFFUSE,
      `float rawNL = dot( geometryNormal, directLight.direction ); float dotNL = max( saturate( rawNL ), ${through.toFixed(2)} * saturate( 0.3 - rawNL ) );`));
    if (!shader.vertexShader.includes('#include <begin_vertex>') || !shader.fragmentShader.includes('#include <dithering_fragment>')) return;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPaint;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaint = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + GRAIN).replace('#include <dithering_fragment>', `#include <dithering_fragment>\ngl_FragColor.a = paintGrain(vPaint * ${grain.toFixed(1)});`);
  };
  material.customProgramCacheKey = () => `paint-${through}-${grain}`;
  return material;
}

// A scumbled dark ground: near black, with a faint warm glow on the side away from the light.
function backdropMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { glow: { value: new THREE.Vector2(0.6, 0.45) }, tint: { value: new THREE.Vector3(0.02, 0.011, 0.0055) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform vec2 glow; uniform vec3 tint;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 p = (vUv - 0.5) * vec2(40.0, 20.0);
        float cloud = noise(p * 0.35) * 0.6 + noise(p * 0.9 + 7.0) * 0.3 + noise(p * 2.3) * 0.1;
        float d = length((vUv - glow) * vec2(2.2, 2.8));
        float lift = exp(-d * d * 2.0) * (0.55 + 0.45 * cloud) + 0.05 * cloud;
        vec3 ground = mix(vec3(0.0015, 0.0012, 0.0012), tint, lift);
        gl_FragColor = vec4(ground, 0.62 * noise(p * 9.0) + 0.38 * noise(p * 30.0));
      }`,
    toneMapped: false, fog: false
  });
}

export function createStage(renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  // Depth is darkness: the far side of every orbit sinks into the ground colour.
  scene.fog = new THREE.Fog(0x040302, 1, 2);
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 160);

  // Reflections of the same window light plus a faint warm room.
  const pmrem = new THREE.PMREMGenerator(renderer), room = new THREE.Scene();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.045, 0.03, 0.018), side: THREE.BackSide }));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 5.6, 3.9), side: THREE.DoubleSide }));
  panel.position.set(-8, 8, 6); panel.lookAt(0, 0, 0); room.add(shell, panel);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture; scene.environmentIntensity = 0.45;
  shell.geometry.dispose(); shell.material.dispose(); panel.geometry.dispose(); panel.material.dispose(); pmrem.dispose();

  const key = new THREE.SpotLight(0xffd9a8, KEY_INTENSITY, 90, 0.44, 1, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 5; key.shadow.camera.far = 34;
  key.shadow.bias = -0.0012; key.shadow.normalBias = 0.06; key.shadow.radius = 6;
  // A coloured light from behind, opposite the key: it rims the petals and glows through
  // them. It stays off in the old-master scheme.
  const back = new THREE.DirectionalLight(0xffffff, 0);
  const bounce = new THREE.HemisphereLight(0x2a1c12, 0x3a2414, 0.2);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(140, 70), backdropMaterial());
  scene.add(key, key.target, back, back.target, bounce, backdrop);

  const shared = new Set(), keep = geometry => { shared.add(geometry); return geometry; };
  const ball = keep(new THREE.SphereGeometry(1, 24, 16)), leaves = [0.1, 0.5, 0.9].map(v => keep(leafGeometry(v))), sepal = keep(sepalGeometry()), petalShape = keep(shedPetalGeometry());
  const petalRadius = originRadius(petalShape);
  const materials = {
    petal: prepare(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide }), { through: 0.22, grain: 9 }),
    shed: prepare(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide }), { through: 0.35, grain: 4 }),
    leaf: prepare(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.68, side: THREE.DoubleSide }), { through: 0.3, grain: 8 }),
    stem: prepare(new THREE.MeshStandardMaterial({ color: 0x33421c, roughness: 0.7 }), { grain: 12 })
  };

  let botanical = [], obstacles = [], batches = null;
  let group = null, composition = null, scheme = null, movers = [], heart = null, petals = null;
  const leafBase = new THREE.Color(1, 1, 1), stemBase = new THREE.Color(0x33421c);
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), basis = new THREE.Matrix4(), q = new THREE.Quaternion(), euler = new THREE.Euler(), m4 = new THREE.Matrix4(), tint = new THREE.Color();
  const lit = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };

  // A leaf growing along `direction` with its upper face turned toward `face`.
  function leafAt(position, direction, length, variant, width = 1, face = UP, shape = leaves[Math.floor(variant * leaves.length) % leaves.length]) {
    const mesh = lit(new THREE.Mesh(shape, materials.leaf));
    v1.copy(direction).normalize();
    v2.copy(face).addScaledVector(v1, -face.dot(v1));
    if (v2.lengthSq() < 1e-4) v2.set(0, 0, 1);
    v2.normalize(); v3.crossVectors(v1, v2);
    mesh.quaternion.setFromRotationMatrix(basis.makeBasis(v3, v1, v2));
    mesh.position.copy(position); mesh.scale.set(length * width, length, length);
    return mesh;
  }

  // A cut stem trailing from the back of a head, toward local +X, with a few leaves.
  function stemOf(rng, length, leafCount, leafSize) {
    const parts = [], curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.12, 0), new THREE.Vector3(0.05, -length * 0.55, 0), new THREE.Vector3(length * 0.75, -length, (rng() - 0.5) * 0.5));
    parts.push(lit(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.045, 6), materials.stem)));
    for (let i = 0; i < leafCount; i++) {
      const t = 0.25 + 0.6 * (i + rng() * 0.6) / leafCount, at = curve.getPoint(t), tangent = curve.getTangent(t), turn = rng() * 6.28;
      v2.crossVectors(tangent, UP).normalize(); v3.crossVectors(tangent, v2).normalize();
      const direction = new THREE.Vector3().addScaledVector(v2, Math.cos(turn)).addScaledVector(v3, Math.sin(turn)).addScaledVector(tangent, 0.35);
      parts.push(leafAt(at, direction, leafSize * (0.8 + rng() * 0.5), rng(), 1.3, new THREE.Vector3(0, 1, 0.3)));
    }
    return parts;
  }

  function bloom(b, rng) {
    const holder = new THREE.Group();
    const head = lit(new THREE.Mesh(roseGeometry(TONES[b.tone], rng, { ...BLOOMS[b.kind], cups: [1.06, 0.56], detail: b.r > 1 ? 1.2 : 1 }), materials.petal));
    head.rotation.y = b.phase;
    const calyx = lit(new THREE.Mesh(ball, materials.stem));
    calyx.scale.set(0.15, 0.13, 0.15); calyx.position.y = -0.13;
    holder.add(head, calyx, ...stemOf(rng, 1.7, 3, 1.25));
    // Five narrow sepals turn back under the head, between it and the stem.
    for (let i = 0; i < 5; i++) holder.add(leafAt(new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(Math.cos(i * 1.257), 0.1, Math.sin(i * 1.257)), 0.42, 0, 1, UP, sepal));
    return { holder, head };
  }

  function clear() {
    if (!group) return;
    batches?.dispose(); batches = null;
    scene.remove(group);
    group.traverse(node => {
      if (node.isInstancedMesh) node.dispose();
      if (node.geometry && !shared.has(node.geometry)) node.geometry.dispose();
    });
    group = null; movers = []; heart = null; petals = null; botanical = []; obstacles = [];
  }

  function setSeed(seed) {
    clear();
    composition = compose(seed); scheme = schemeOf(seed);
    group = new THREE.Group();
    key.color.setHex(scheme.key); back.color.setHex(scheme.back);
    materials.leaf.color.copy(leafBase).multiply(tint.setRGB(...scheme.foliage)); materials.stem.color.copy(stemBase).multiply(tint);
    backdrop.material.uniforms.tint.value.set(...scheme.ground);
    composition.rings.forEach((ring, r) => ring.bodies.forEach((b, i) => {
      const made = bloom(b, random(seed, 400 + r * 50 + i));
      made.holder.scale.setScalar(b.r);
      group.add(made.holder); movers.push({ ring, b, ...made });
    }));
    // The central flower and its attached stem/foliage move as one connected branch.
    const central = new THREE.Group(); group.add(central);
    const centre = new THREE.Vector3(...GREAT.centre), facing = new THREE.Vector3(composition.lightSide * 0.12, 0.58, 0.8).normalize(), holder = new THREE.Group();
    holder.position.copy(centre); holder.quaternion.setFromUnitVectors(UP, facing);
    const tone = composition.tones[composition.greatOffset];
    const head = lit(new THREE.Mesh(roseGeometry(TONES[tone], random(seed, 900 + composition.greatOffset), { ...BLOOMS.great, cups: [1.08, 0.72, 0.4], detail: 1.35 }), materials.petal));
    holder.add(head);
    const heads = { [tone]: head };
    const calyx = lit(new THREE.Mesh(ball, materials.stem)); holder.add(calyx);
    const below = centre.clone().addScaledVector(facing, -0.45), stalk = new THREE.QuadraticBezierCurve3(below, new THREE.Vector3(centre.x, centre.y - 3, centre.z - 1.2), new THREE.Vector3(centre.x - composition.lightSide * 0.6, centre.y - 9, centre.z - 0.6));
    const trunk = lit(new THREE.Mesh(new THREE.TubeGeometry(stalk, 30, 0.085, 7), materials.stem)), rng = random(seed, 950);
    central.add(holder, trunk);
    for (let i = 0; i < 7; i++) {
      const t = 0.22 + 0.42 * (i + rng() * 0.5) / 7, turn = i * 2.4 + rng();
      central.add(leafAt(stalk.getPoint(t), new THREE.Vector3(Math.cos(turn), 0.35 - t * 0.5, Math.sin(turn) * 0.8 + 0.3), 1.5 + rng() * 0.9, rng(), 1.5));
    }
    heart = { holder, heads, calyx };
    central.position.copy(centre);
    for (const child of central.children) child.position.sub(centre);
    heart.rig = central;
    let part = 0;
    group.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (mesh.material === materials.petal || mesh.material === materials.leaf) {
        prepareBotanicalMotion(mesh.geometry, mesh.material === materials.leaf);
        mesh.updateMorphTargets();
        botanical.push({ mesh, phase: 0.4 + random(seed, 1500 + part++)() * 6 });
      }
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      obstacles.push({ mesh, box: new THREE.Box3() });
    });
    batches = batchSurfaces(obstacles.map(({ mesh }) => mesh).filter(mesh => mesh.material === materials.leaf || mesh.geometry === ball), group);
    petals = new THREE.InstancedMesh(petalShape, materials.shed, DUST);
    petals.castShadow = true; petals.receiveShadow = true; petals.frustumCulled = false;
    petals.setColorAt(0, tint.set(1, 1, 1)); group.add(petals);
    scene.environmentRotation.y = composition.lightSide > 0 ? 1.9 : 0;
    scene.add(group);
  }

  function setAspect(aspect) {
    const stage = staging(aspect);
    camera.aspect = aspect; camera.fov = stage.fov; camera.far = Math.max(160, stage.backdropDistance + 1);
    camera.position.set(0, stage.lookY + stage.distance * Math.sin(stage.elevation), stage.distance * Math.cos(stage.elevation));
    camera.lookAt(0, stage.lookY, 0); camera.updateProjectionMatrix();
    backdrop.quaternion.copy(camera.quaternion);
    backdrop.position.copy(camera.position).add(v1.set(0, 0, -stage.backdropDistance).applyQuaternion(camera.quaternion));
    scene.fog.near = stage.distance - 3; scene.fog.far = stage.distance + 8;
  }

  // Poses every bloom, the central flower, its shed petals and the light for `time`.
  function pose(time) {
    const light = lighting(composition, time);
    key.position.set(...light.position); key.target.position.set(...light.target);
    key.intensity = KEY_INTENSITY * light.gain;
    back.position.set(-light.position[0] * 0.8, light.position[1] * 0.45, -Math.abs(light.position[2]) - 7); back.intensity = 4.5 * scheme.backPower * light.gain;
    backdrop.material.uniforms.glow.value.set(0.5 - composition.lightSide * 0.1, 0.5);
    for (const mover of movers) {
      const at = place(composition, mover.ring, mover.b, time), holder = mover.holder;
      holder.position.set(...at.position);
      // The head keeps its face toward the viewer, swinging a little outward as it
      // travels, the way a painter turns every bloom to show its heart; its cut stem trails.
      v1.copy(camera.position).sub(holder.position).normalize().multiplyScalar(0.62).addScaledVector(v2.set(...at.outward), 0.4).add(v2.set(0, 0.62, 0)).normalize();
      v2.set(...at.travel).multiplyScalar(-1).addScaledVector(v3.set(...at.outward), -0.4);
      v2.addScaledVector(v1, -v2.dot(v1)).normalize(); v3.crossVectors(v2, v1);
      holder.quaternion.setFromRotationMatrix(basis.makeBasis(v2, v1, v3));
      mover.head.morphTargetInfluences[0] = 1 - at.open;
    }
    const life = great(composition, time);
    heart.rig.position.set(...life.position); heart.rig.rotation.set(...life.rotation);
    for (const [tone, head] of Object.entries(heart.heads)) {
      head.visible = tone === life.tone;
      head.scale.setScalar(life.scale);
      head.rotation.y = life.spin;
      const o = Math.min(1, life.open);
      head.morphTargetInfluences[0] = o >= 0.5 ? (1 - o) * 2 : o * 2;
      head.morphTargetInfluences[1] = o >= 0.5 ? 0 : 1 - o * 2;
    }
    heart.calyx.scale.set(0.13 * life.scale + 0.05, 0.1 * life.scale + 0.04, 0.13 * life.scale + 0.05); heart.calyx.position.y = -0.14 * life.scale - 0.03;
    for (const { mesh, phase } of botanical) poseBotanicalMotion(mesh, time, phase);
    group.updateMatrixWorld(true);
    batches.update();
    const occupied = [];
    for (const { mesh, box } of obstacles) {
      if (!mesh.visible) continue;
      box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld); occupied.push(box);
    }
    const shed = dust(composition, time);
    for (let i = 0; i < DUST; i++) {
      const p = shed[i];
      if (!p) { petals.setMatrixAt(i, m4.makeScale(0, 0, 0)); continue; }
      petals.setMatrixAt(i, m4.compose(v1.set(...clearPetal(p.position, p.scale * petalRadius, occupied)), q.setFromEuler(euler.set(...p.rotation)), v2.setScalar(p.scale)));
      petals.setColorAt(i, tint.setHex(TONES[p.tone].mid));
    }
    petals.instanceMatrix.needsUpdate = true; petals.instanceColor.needsUpdate = true;
    return life;
  }

  function destroy() {
    clear();
    for (const geometry of shared) geometry.dispose();
    backdrop.geometry.dispose(); backdrop.material.dispose();
    for (const material of Object.values(materials)) material.dispose();
    environment.dispose(); key.shadow.map?.dispose(); key.dispose(); back.dispose(); bounce.dispose();
  }

  return {
    scene, camera, setSeed, setAspect, pose, destroy, grade: () => scheme.grade,
    describe: () => ({ scheme: scheme.name, lightSide: composition.lightSide, tones: composition.tones, bodies: composition.rings.map(r => r.bodies.length) })
  };
}
