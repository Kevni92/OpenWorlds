import * as THREE from 'three'

export class PlanetMaterial extends THREE.ShaderMaterial {

  constructor(parameters) {

    super();

    this.uniforms = {
      resolution: { value: parameters.resolution || 256 },
      // textures
      cubeNormal: { value: parameters.cubeNormal },
      cubeColor:  { value: parameters.cubeColor },
      cubeDisplacements: { value: parameters.cubeDisplacements },
      // check if textures are provided
      hasNormals: { value: parameters.cubeNormal ? true : false },
      hasColors:  { value: parameters.cubeColor ? true : false },
    };

    this.vertexShader =`
        varying vec3 vPosition;
        uniform samplerCube cubeDisplacements;  

        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

    this.fragmentShader = `
        varying vec3 vPosition;
        uniform samplerCube cubeNormal;  
        uniform samplerCube cubeDisplacements;  
        uniform samplerCube cubeColor;  

        uniform bool hasNormals;
        uniform bool hasColors;

        vec4 baseColor; 
        vec4 baseNormal; 

        void tangentBitangent(inout vec3 tangent, inout vec3 bitangent, vec3 dir){
          // Determine which face we're on and calculate appropriate tangent vectors
          vec3 absDir = abs(dir);
          if (absDir.x >= absDir.y && absDir.x >= absDir.z) {
              // X face (left/right)
              tangent = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
              bitangent = normalize(cross(dir, tangent));
          } else if (absDir.y >= absDir.x && absDir.y >= absDir.z) {
              // Y face (top/bottom)
              tangent = normalize(cross(dir, vec3(1.0, 0.0, 0.0)));
              bitangent = normalize(cross(dir, tangent));
          } else {
              // Z face (front/back)
              tangent = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
              bitangent = normalize(cross(dir, tangent));
          }
        }

        vec3 localNormal(vec3 dir, vec3 tangent, vec3 bitangent, float heightScale) {
          float eps = 1./uRes;

          float right  = texture(uTex, normalize(dir + tangent * eps)).r;
          float left   = texture(uTex, normalize(dir - tangent * eps)).r;
          float top    = texture(uTex, normalize(dir + bitangent * eps)).r;
          float bottom = texture(uTex, normalize(dir - bitangent * eps)).r;

          vec2 gradient = vec2(
            (right - left) * heightScale,
            (top - bottom) * heightScale
          );
          return normalize(vec3(-gradient.x, -gradient.y, 1.0)); 
        } 


        vec3 localNormal(vec3 dir) { return texture(uTex, normalize(dir)).rgb; }

        vec3 worldNormal(vec3 dir, vec3 tangent, vec3 bitangent, float heightScale) {
          vec3 localNor = localNormal(vWorldPosition, tangent, bitangent,  heightScale);
          return normalize(
            localNor.x * tangent + 
            localNor.y * bitangent + 
            localNor.z * normalize(dir)
          );
        } 

        void main() {
          baseColor  = vec4(1.0); 
          baseNormal = vec4(1.0); 
          if(hasNormals){ baseNormal = texture( cubeNormal, vPosition );}
          if(hasColors) { baseColor  = texture( cubeColor,  vPosition );}
          gl_FragColor = baseColor;
        }`
   }

  onBeforeRender( ){
    this.uniforms.hasNormals.value = this.uniforms.cubeNormal ? true : false
    this.uniforms.hasColors.value = this.uniforms.cubeColor ? true : false
  }
}