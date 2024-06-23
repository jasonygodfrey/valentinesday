import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'; // Add RGBELoader for environment map

const ThreeBackground = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  let mixers = [];
  let environmentMap = null;

  useImperativeHandle(ref, () => ({
    playDragonAnimationOnce: () => {
      const dragonMixer = mixers[0];
      if (dragonMixer && dragonMixer._actions && dragonMixer._actions.length > 0) {
        const action = dragonMixer.clipAction(dragonMixer._actions[0]._clip);
        action.reset();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();
      }
    }
  }));

  useEffect(() => {
    if (mountRef.current.children.length > 0) {
      // If the renderer already exists, do not reinitialize.
      return;
    }

    const backgroundScene = new THREE.Scene();
    const mainScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf5f5f5); // Set background color to match the image
    renderer.shadowMap.enabled = true; // Enable shadow maps
    mountRef.current.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(mainScene, camera));

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.01, 0.04, 0.0085);
    composer.addPass(bloomPass);

    // Load environment map
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/rose/sky2.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      mainScene.environment = texture;
      mainScene.background = texture; // Set the background to environment map for better reflections
      environmentMap = texture;
    });

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.0); // Adjusted intensity for balance
    mainScene.add(ambientLight);

    // Directional Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Adjusted intensity
    directionalLight.position.set(0, 10, 10);
    directionalLight.castShadow = true; // Enable shadows for directional light
    directionalLight.shadow.mapSize.width = 1024; // Shadow map size
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5; // Near plane for shadow camera
    directionalLight.shadow.camera.far = 500; // Far plane for shadow camera
    mainScene.add(directionalLight);

    // Point Light
    const pointLight = new THREE.PointLight(0xffffff, 2.0, 1000); // Increased intensity
    pointLight.position.set(50, 50, -100);
    mainScene.add(pointLight);

    // Pink Point Light
    const pinkLight = new THREE.PointLight(0xff69b4, 2.0, 1000); // Pink color
    pinkLight.position.set(0, 0, 200); // Position it next to the flower
    mainScene.add(pinkLight);

    // New Spotlight
    const spotlight = new THREE.SpotLight(0xffffff, 3.0, 1000, Math.PI / 6, 0.1, 2);
    spotlight.position.set(-50, 30, 50);
    spotlight.castShadow = true; // Enable shadows for spotlight
    spotlight.shadow.mapSize.width = 1024; // Shadow map size
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 0.5; // Near plane for shadow camera
    spotlight.shadow.camera.far = 500; // Far plane for shadow camera
    spotlight.target.position.set(0, 0, -300);
    mainScene.add(spotlight);
    mainScene.add(spotlight.target);

    const loader = new GLTFLoader();
    
    // Function to load and position roses
    const loadRose = (position) => {
      loader.load('/rose/rose.gltf', (gltf) => {
        console.log('Model loaded:', gltf); // Debugging log
        const model = gltf.scene;
        model.scale.set(1000, 1000, 1000);
        model.rotation.set(0.1,0,0)
        model.position.set(...position);
        model.traverse(node => {
          if (node.isMesh) {
            node.castShadow = true; // Cast shadows
            node.receiveShadow = true; // Receive shadows
            if (node.material) {
              node.material.metalness = 1; // Increase metalness for more reflectivity
              node.material.roughness = 0.5; // Decrease roughness for shinier surface
              if (environmentMap) {
                node.material.envMap = environmentMap; // Set environment map for reflections
                node.material.envMapIntensity = 0.90;
              }
              node.material.needsUpdate = true; // Ensure material updates
            }
          }
        });
        mainScene.add(model);

        if (gltf.animations && gltf.animations.length) {
          const portalMixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = portalMixer.clipAction(clip);
            action.play();
            action.timeScale = 0.05;
          });
          mixers.push(portalMixer);
        }
      }, undefined, (error) => {
        console.error('Error loading model:', error); // Error handling
      });
    };

    // Function to load and position the ring
    const loadRing = (position) => {
      loader.load('/ring/scene.gltf', (gltf) => {
        console.log('Ring model loaded:', gltf); // Debugging log
        const model = gltf.scene;
        model.scale.set(100, 100, 100);
        model.rotation.set(1,-1,-1)
        model.position.set(...position);
        model.traverse(node => {
          if (node.isMesh) {
            node.castShadow = true; // Cast shadows
            node.receiveShadow = true; // Receive shadows
            if (node.material) {
              node.material.metalness = 1; // Increase metalness for more reflectivity
              node.material.roughness = 0.5; // Decrease roughness for shinier surface
              if (environmentMap) {
                node.material.envMap = environmentMap; // Set environment map for reflections
                node.material.envMapIntensity = 0.90;
              }
              node.material.needsUpdate = true; // Ensure material updates
            }
          }
        });
        mainScene.add(model);

        if (gltf.animations && gltf.animations.length) {
          const ringMixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = ringMixer.clipAction(clip);
            action.play();
            action.timeScale = 0.05;
          });
          mixers.push(ringMixer);
        }
      }, undefined, (error) => {
        console.error('Error loading ring model:', error); // Error handling
      });
    };

    // Load and position three roses
    loadRose([0, -300, -200]); // Original rose
    loadRose([-100, -300, -200]); // Left rose
    loadRose([100, -320, -200]); // Right rose

    // Load and position the ring
    loadRing([0, -80, -160]);

    camera.position.set(0, 0, 5); // Ensure camera is positioned to view the model

    const clock = new THREE.Clock();
    const animate = function () {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      
      // Render background scene
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(backgroundScene, camera);
      
      // Render main scene with bloom
      composer.render(delta);
      console.log('Rendering frame'); // Debugging log
    };
    animate();

    const onDocumentMouseMove = (event) => {
      var mouseX = (event.clientX - window.innerWidth / 2) / 100;
      var mouseY = (event.clientY - window.innerHeight / 2) / 100;
      camera.position.x += (mouseX - camera.position.x) * 0.1;
      camera.position.y += (-mouseY - camera.position.y) * 0.1;
      camera.lookAt(mainScene.position);
    };

    document.addEventListener('mousemove', onDocumentMouseMove);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      document.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('resize', handleResize);
      mixers.forEach(mixer => mixer.uncacheRoot(mixer.getRoot()));
      mixers = [];
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
});

export default ThreeBackground;
