import * as THREE from "three";
import { ShaderMaterial, UniformsUtils, WebGLRenderTarget } from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";

const NoiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 }
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

  fragmentShader: /* glsl */ `
		#include <common>

		// control parameter
		uniform float time;

		// noise effect intensity value (0 = no effect, 1 = full effect)
		uniform float nIntensity;

		uniform sampler2D tDiffuse;
		varying vec2 vUv;

        vec2 boxMuller(float u, float v) {
            float x = sqrt(-2.0 * log(u)) * cos(2.0 * PI * v);
            float y = sqrt(-2.0 * log(u)) * sin(2.0 * PI * v);

            x = clamp(x, -3.0, 3.0);
            y = clamp(y, -3.0, 3.0);

            return vec2(x, y);
        }


		void main() {
		    // sample the source
			vec4 cTextureScreen = texture2D( tDiffuse, vUv );
		    
            // make some noise
            float unif_a = rand(vUv + time);
            float unif_b = rand(vUv + time + 1.0);
            float unif_c = rand(vUv + time + 2.0);
            float unif_d = rand(vUv + time + 3.0);

            vec2 bm_a = boxMuller(unif_a, unif_b);
            vec2 bm_b = boxMuller(unif_c, unif_d);
            vec3 gaussian_noise = vec3(bm_a.x, bm_a.y, bm_b.x);

            vec3 shot_noise = cTextureScreen.rgb + (gaussian_noise * sqrt(cTextureScreen.rgb) * 0.06);

		    // add noise
			vec3 cResult = cTextureScreen.rgb + shot_noise * 0.1;

			gl_FragColor =  vec4(shot_noise, cTextureScreen.a );
		}`
};

export class NoisePass extends Pass {
  uniforms: any;
  material: ShaderMaterial;
  fsQuad: FullScreenQuad;

  constructor() {
    super();

    this.uniforms = UniformsUtils.clone(NoiseShader.uniforms);

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: NoiseShader.vertexShader,
      fragmentShader: NoiseShader.fragmentShader
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms["time"].value =
      (this.uniforms["time"].value + deltaTime) % 10;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.fsQuad.render(renderer);
    }
  }
}
