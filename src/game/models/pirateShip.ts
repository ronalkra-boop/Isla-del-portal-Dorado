import * as THREE from 'three';
import {
  createPirateFlagTexture,
  createSailFabricTexture,
  createWoodPlankTextures,
} from '../textures';

export function createPirateShip(maxAniso: number): THREE.Group {
  const ship = new THREE.Group();

  const wood = createWoodPlankTextures(maxAniso);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: wood.map,
    bumpMap: wood.bumpMap,
    bumpScale: 0.04,
    roughness: 0.72,
  });
  const trimWoodMat = new THREE.MeshStandardMaterial({
    color: 0x452815,
    roughness: 0.65,
  });
  const sailMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createSailFabricTexture(maxAniso),
    roughness: 0.88,
    side: THREE.DoubleSide,
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createPirateFlagTexture(maxAniso),
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffe49e,
    emissive: 0xffa733,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });

  // 1. Sculpted Galleon Hull using extruded boat profile
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, -6.2);
  hullShape.quadraticCurveTo(2.4, -3.4, 2.35, 1.4);
  hullShape.quadraticCurveTo(2.15, 4.9, 1.45, 5.8);
  hullShape.lineTo(-1.45, 5.8);
  hullShape.quadraticCurveTo(-2.15, 4.9, -2.35, 1.4);
  hullShape.quadraticCurveTo(-2.4, -3.4, 0, -6.2);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 2.3,
    bevelEnabled: true,
    bevelThickness: 0.55,
    bevelSize: 0.45,
    bevelSegments: 3,
  });
  hullGeo.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 1.6;
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);

  // Raised Stern Captain Cabin
  const sternCabin = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.85, 3.1),
    trimWoodMat,
  );
  sternCabin.position.set(0, 2.55, 4.0);
  sternCabin.castShadow = true;
  ship.add(sternCabin);

  // Warm Stern Cabin Windows
  for (const x of [-0.8, 0, 0.8]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.6, 0.1), lanternMat);
    win.position.set(x, 2.75, 5.56);
    ship.add(win);
  }

  // Bowsprit pointing forward (-Z)
  const bowsprit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.2, 4.6, 8),
    trimWoodMat,
  );
  bowsprit.rotation.x = Math.PI * 0.36;
  bowsprit.position.set(0, 2.75, -7.2);
  ship.add(bowsprit);

  // Twin Masts + Yardarms + Billowing Curved Sails
  function addMast(zPos: number, height: number, sailWidth: number): void {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, height, 10),
      trimWoodMat,
    );
    mast.position.set(0, 1.8 + height * 0.5, zPos);
    mast.castShadow = true;
    ship.add(mast);

    // Lower & upper sails (curved cylinder slice)
    const lowerSailGeo = new THREE.CylinderGeometry(
      sailWidth * 1.15,
      sailWidth * 1.15,
      height * 0.42,
      12,
      1,
      true,
      -Math.PI * 0.28,
      Math.PI * 0.56,
    );
    const lowerSail = new THREE.Mesh(lowerSailGeo, sailMat);
    lowerSail.position.set(0, 1.8 + height * 0.44, zPos + sailWidth * 0.85);
    lowerSail.rotation.y = Math.PI;
    lowerSail.castShadow = true;
    ship.add(lowerSail);

    const upperSailGeo = new THREE.CylinderGeometry(
      sailWidth * 0.82,
      sailWidth * 0.82,
      height * 0.28,
      10,
      1,
      true,
      -Math.PI * 0.28,
      Math.PI * 0.56,
    );
    const upperSail = new THREE.Mesh(upperSailGeo, sailMat);
    upperSail.position.set(0, 1.8 + height * 0.78, zPos + sailWidth * 0.58);
    upperSail.rotation.y = Math.PI;
    upperSail.castShadow = true;
    ship.add(upperSail);

    // Yardarms
    const yard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, sailWidth * 1.5, 8),
      trimWoodMat,
    );
    yard.rotation.z = Math.PI / 2;
    yard.position.set(0, 1.8 + height * 0.65, zPos);
    ship.add(yard);
  }

  addMast(-1.6, 8.8, 3.2);
  addMast(2.2, 7.2, 2.5);

  // Crow's nest & Pirate Flag at top of main mast
  const crowsNest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.42, 0.48, 12),
    trimWoodMat,
  );
  crowsNest.position.set(0, 9.1, -1.6);
  ship.add(crowsNest);

  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.15, 6, 1), flagMat);
  flag.position.set(0.95, 10.45, -1.6);
  ship.add(flag);

  return ship;
}
