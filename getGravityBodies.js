import * as THREE from "three";
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';

const sceneMiddle = new THREE.Vector3(0, 0, 0);

const geometries = [];
const materials = [];

const glbLoader = new GLTFLoader();
const glbPaths = ["models/CG.glb","models/CG2.glb"];

async function loadGLTFModels() {
  const promises = glbPaths.map((path) =>
    new Promise((resolve, reject) => {
      glbLoader.load(
        `${path}`,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              geometries.push(child.geometry);
              materials.push(child.material);
            }
          });
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    })
  );

  try {
    await Promise.all(promises);
    console.log("All GLTF models loaded successfully.");
    console.log(`Geometries Loaded: ${geometries.length}`);
    console.log(`Materials Loaded: ${materials.length}`);

  } catch (error) {
    console.error("Error loading GLTF models:", error);
  }
}
await loadGLTFModels();

function getGeometry(size) {
  const randomBody = Math.floor(Math.random() * geometries.length);
  const randomGeo = geometries[randomBody];
  const mat = materials[randomBody];

  const geo = randomGeo.clone();
  geo.scale(size, size, size);

  return { geometry: geo, material: mat };
}

function getBody(RAPIER, world) {
  const size = 0.1 + Math.random() * 0.15;
  const range = 12;
  const density = size  * 0.5;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;

  const body = getGeometry(size);

  const geometry = body.geometry;
  const material = body.material;

  const mesh = new THREE.Mesh(geometry, material);

  // physics
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(x, y, z);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.cuboid(.7,.2,.2).setDensity(density);
  let colliderDesc2 = RAPIER.ColliderDesc.cuboid(.2,.7,.2).setDensity(density);
  let colliderDesc3 = RAPIER.ColliderDesc.cuboid(.2,.2,.7).setDensity(density);
  world.createCollider(colliderDesc, rigid);
  world.createCollider(colliderDesc2, rigid);
  world.createCollider(colliderDesc3, rigid);

  function update() {
    rigid.resetForces(true); 
    let { x, y, z } = rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    let dir = pos.clone().sub(sceneMiddle).normalize();
    let q = rigid.rotation();
    let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);

    mesh.rotation.setFromQuaternion(rote);
    rigid.addForce(dir.multiplyScalar(-0.5), true);
    mesh.position.set(x, y, z);
  }
  return { mesh, rigid, update };
}

  function getMouseBall (RAPIER, world) {
    const mouseSize = 0.25;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
    });
    const mouseLight = new THREE.PointLight(0xffffff, 1);
    const mouseMesh = new THREE.Mesh(geometry, material);
    mouseMesh.add(mouseLight);
    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 3.0);
    world.createCollider(dynamicCollider, mouseRigid);
    function update (mousePos) {
      mouseRigid.setTranslation({ x: mousePos.x * window.innerWidth / 350, y: mousePos.y * 3.75, z: 0.2 });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
  }

  export { getBody, getMouseBall };