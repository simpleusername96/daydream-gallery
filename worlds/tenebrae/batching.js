// Repeated foliage keeps independent transforms and morphs while sharing draw calls.
import * as THREE from 'three';

export function batchSurfaces(surfaces, parent) {
  const grouped = new Map();
  for (const source of surfaces) {
    let materials = grouped.get(source.geometry);
    if (!materials) grouped.set(source.geometry, materials = new Map());
    let sources = materials.get(source.material);
    if (!sources) materials.set(source.material, sources = []);
    sources.push(source);
  }
  const batches = [];
  for (const [geometry, materials] of grouped) for (const [material, sources] of materials) {
    const mesh = new THREE.InstancedMesh(geometry, material, sources.length);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Sources remain the pose and collision owners, on an unrendered layer.
    for (const source of sources) source.layers.set(31);
    parent.add(mesh); batches.push({ mesh, sources });
  }
  const inverse = new THREE.Matrix4(), local = new THREE.Matrix4();
  return {
    update() {
      inverse.copy(parent.matrixWorld).invert();
      for (const { mesh, sources } of batches) {
        sources.forEach((source, index) => {
          mesh.setMatrixAt(index, local.multiplyMatrices(inverse, source.matrixWorld));
          if (source.morphTargetInfluences) mesh.setMorphAt(index, source);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.morphTexture) mesh.morphTexture.needsUpdate = true;
      }
    },
    dispose() { for (const { mesh } of batches) { parent.remove(mesh); mesh.dispose(); } },
    count: batches.length
  };
}
