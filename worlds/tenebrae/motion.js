// Subtle attached-surface motion and conservative clearance for windborne petals.
// All poses use active scene time; seeking never depends on the previous frame.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { const t = clamp(v); return t * t * t * (t * (6 * t - 15) + 10); };

// Add two small additive bend fields to the existing openness morphs. The root stays
// fixed, while angular phase offsets keep neighbouring petals from moving as one bowl.
export function prepareBotanicalMotion(geometry, leaf = false) {
  if (geometry.userData.botanicalMotion) return geometry.userData.botanicalMotion;
  const base = geometry.attributes.position, positions = geometry.morphAttributes.position ||= [], normals = geometry.morphAttributes.normal ||= [];
  const start = positions.length;
  geometry.computeBoundingBox();
  const bound = geometry.boundingBox.clone();
  for (let key = 0; key < 2; key++) {
    const p = base.clone();
    for (let i = 0; i < p.count; i++) {
      const x = base.getX(i), y = base.getY(i), z = base.getZ(i), radius = Math.hypot(x, z);
      const weight = leaf ? Math.pow(clamp(y), 2) : Math.pow(clamp((Math.hypot(radius, y) - 0.16) / 0.84), 2);
      const phase = leaf ? x * 3 + y * 2 : Math.atan2(z, x) * 2 + radius * 2;
      const bend = (leaf ? 0.065 : 0.026) * weight * (key ? Math.cos(phase) : Math.sin(phase));
      if (leaf) p.setXYZ(i, x + bend * 0.25, y, z + bend);
      else p.setXYZ(i, x + bend * x * 0.25, y + bend, z + bend * z * 0.25);
    }
    const target = new THREE.BufferGeometry();
    target.setAttribute('position', p); target.setIndex(geometry.index); target.computeVertexNormals();
    positions.push(p); normals.push(target.attributes.normal);
    target.dispose();
  }
  // Openness keys are convex combinations; the two signed bend keys can add to them.
  // Enclose that additive displacement as well, including shadows and frustum culling.
  const pad = leaf ? 0.14 : 0.07;
  geometry.boundingBox.copy(bound).expandByScalar(pad);
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  return geometry.userData.botanicalMotion = { start, leaf };
}

export function poseBotanicalMotion(mesh, time, phase) {
  const motion = mesh.geometry.userData.botanicalMotion;
  const angle = time * TAU / (motion.leaf ? 11 + phase : 17 + phase) + phase;
  const strength = 0.72 + 0.28 * Math.sin(time * TAU / 43 + phase);
  mesh.morphTargetInfluences[motion.start] = Math.sin(angle) * strength;
  mesh.morphTargetInfluences[motion.start + 1] = Math.cos(angle) * strength;
}

// A petal's entire rotated shape fits inside this radius about its instance origin.
export function originRadius(geometry) {
  const p = geometry.attributes.position;
  let radius = 0;
  for (let i = 0; i < p.count; i++) radius = Math.max(radius, Math.hypot(p.getX(i), p.getY(i), p.getZ(i)));
  return radius;
}

// Route around the visible geometry envelopes on their +Z side. A broad, C2 shoulder
// begins outside the occupied XY footprint, so a petal never teleports at contact.
// This is an authored flow, not a bounce simulation: overlapping obstacles compose by
// max height, cannot push into one another, and remain safe at arbitrary seek times.
export function clearPetal(position, radius, obstacles) {
  const [x, y, z] = position;
  let front = z;
  for (const box of obstacles) {
    const dx = Math.max(box.min.x - radius - x, 0, x - box.max.x - radius);
    const dy = Math.max(box.min.y - radius - y, 0, y - box.max.y - radius);
    const shoulder = 1.25 + radius;
    const weight = 1 - ease(Math.hypot(dx, dy) / shoulder);
    front = Math.max(front, z + Math.max(0, box.max.z + radius + 0.035 - z) * weight);
  }
  return [x, y, front];
}
