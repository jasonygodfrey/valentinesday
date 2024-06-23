import * as THREE from 'three';

const FlowerShaderMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform samplerCube envMap;
    uniform float metalness;
    uniform float roughness;
    uniform vec3 color;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      vec3 reflectDir = reflect(viewDir, vNormal);
      vec3 envColor = textureCube(envMap, reflectDir).rgb;

      vec3 baseColor = color;
      vec3 finalColor = mix(baseColor, envColor, metalness);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  uniforms: {
    envMap: { value: null },
    metalness: { value: 0.9 },
    roughness: { value: 0.1 },
    color: { value: new THREE.Color(0xffffff) }
  }
});

export default FlowerShaderMaterial;
