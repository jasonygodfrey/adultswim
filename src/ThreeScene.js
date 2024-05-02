import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

function ThreeScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0); // fully transparent
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // GLTF Loader
    const loader = new GLTFLoader();
    let mixer;
    let model; // Reference to the model
    loader.load(
      'ebonchill_magic_sword/scene.gltf',
      (gltf) => {
        model = gltf.scene; // Store the model reference
        scene.add(model);
        model.scale.set(2.5, 2.5, 2.5);
        model.position.set(-5.9, -5.2, 0);

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      error => console.error('An error happened while loading the model:', error)
    );

    // Post-processing: Bloom effect
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 2.0, 1.0, 0.25);
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(new RenderPass(scene, camera));
    bloomComposer.addPass(bloomPass);

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(new RenderPass(scene, camera));

    const clock = new THREE.Clock();

    function onMouseMove(event) {
      const mouseX = (event.clientX / width) * 2 - 1;
      const mouseY = -(event.clientY / height) * 2 + 1;
      camera.position.x = mouseX * 2;
      camera.position.y = mouseY * 2;
      camera.lookAt(scene.position);
    }

    mountRef.current.addEventListener('mousemove', onMouseMove);

    const animate = function () {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      if (model) { // Ensure the model is loaded before trying to rotate it
        model.rotation.y += 0.01; // Rotate the model around the y-axis
      }
      bloomComposer.render();
      finalComposer.render();
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      mountRef.current.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}

export default ThreeScene;
