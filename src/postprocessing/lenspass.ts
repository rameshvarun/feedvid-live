import * as THREE from "three";
import { ShaderMaterial, UniformsUtils, WebGLRenderTarget } from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";

const NoiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: null }
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

  fragmentShader: /* glsl */ `
		#include <common>

		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		uniform vec2 resolution;

		void main() {
			float k1 = 0.2;
			float k2 = 0.0;

			float x = (gl_FragCoord.x / resolution.x) * 2.0 - 1.0;
			float y = (gl_FragCoord.y / resolution.y) * 2.0 - 1.0;
			float r2 = x * x + y * y;

			float xp = x + x * (k1 * r2 + k2 * r2 * r2);
			float yp = y + y * (k1 * r2 + k2 * r2 * r2);

			float grow = 1.4;
			xp = xp / grow;
			yp = yp / grow;

			vec2 coord = (vec2(xp, yp) + 1.0) / 2.0;

			if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
				gl_FragColor = vec4(0.0);
			} else {
				gl_FragColor = texture2D( tDiffuse, coord );
			}
		}`
};

export class LensPass extends Pass {
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
    this.uniforms["resolution"].value = new THREE.Vector2(
      readBuffer.width,
      readBuffer.height
    );

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
