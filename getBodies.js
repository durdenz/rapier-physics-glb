import * as THREE from "three";
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';

const sceneMiddle = new THREE.Vector3(0, 0, 0);

let objectGeometry, objectMaterial, mesh; // 061925 G4 

function getBody(RAPIER, world) {
    const size = 0.1 + Math.random() * 0.25;
    const range = 6;
    const density = size  * 1.0;
    let x = Math.random() * range - range * 0.5;
    let y = Math.random() * range - range * 0.5 + 3;
    let z = Math.random() * range - range * 0.5;
    // physics
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
    let rigid = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
    world.createCollider(colliderDesc, rigid);
  
    // Define Body Instance -- 061925 G4
    const gltfLoader = new GLTFLoader();
    const gltf = gltfLoader.load(
                      'models/BoomBox.glb',
                      function( gltf ) {

                        // const _ObjectMesh = gltf.scene.getObjectByName('Scene');
                        const _ObjectMesh = gltf.scene;


                        // objectGeometry = _ObjectMesh.geometry.clone();
                        objectGeometry = _ObjectMesh.geometry;


                        const defaultTransform = new THREE.Matrix4()
                                        .makeRotationX( Math.PI )
                                        .multiply( new THREE.Matrix4().makeScale(7,7,7));

                        // objectGeometry.applyMatrix4( defaultTransform );

                        objectMaterial = _ObjectMesh.material;

                        mesh = new THREE.Mesh(objectGeometry, objectMaterial);
                        // mesh = gltf.scene;
                      }
    );

    // Original using standard Geometry
    // const geometry = new THREE.IcosahedronGeometry(size, 1);
    // const material = new THREE.MeshStandardMaterial({
    //   color: 0xffffff,
    //   flatShading: true
    // });
    // const mesh = new THREE.Mesh(geometry, material);
  
    // Define Surface of Body Instance (Wiremesh in this case)
    // const wireMat = new THREE.MeshBasicMaterial({
    //   color: 0x990000,
    //   wireframe: true
    // });
    // const wireMesh = new THREE.Mesh(geometry, wireMat);
    // wireMesh.scale.setScalar(1.01);
    // mesh.add(wireMesh);
    // End Define Body Instance
    
    function update () {
      rigid.resetForces(true); 
      let { x, y, z } = rigid.translation();
      let pos = new THREE.Vector3(x, y, z);
      let dir = pos.clone().sub(sceneMiddle).normalize();
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
      mouseRigid.setTranslation({ x: mousePos.x * 5, y: mousePos.y * 5, z: 0.2 });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
  }

  export { getBody, getMouseBall };