import * as THREE from "three";
import { ShaderMaterial, UniformsUtils, WebGLRenderTarget } from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";

const JPEGEncodeShader = {
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

        #define BLOCK_SIZE 8

		uniform sampler2D tDiffuse;
        uniform vec2 resolution;

		varying vec2 vUv;

        float alpha(int u) {
            if (u == 0) return 1.0 / sqrt(2.0);
            else return 1.0;
        }

        float quality_factor(int x, int y) {
          if (x == 0 && y == 0) return 20.0;
          return 10.0;
        }

        void main() {
            int coord_x = int(gl_FragCoord.x);
            int coord_y = int(gl_FragCoord.y);

            int start_x = (coord_x / 8) * 8;
            int start_y = (coord_y / 8) * 8;

            int u = coord_x - start_x;
            int v = coord_y - start_y;

            vec3 sum;
            for (int x = 0; x < 8; ++x) {
                for(int y = 0; y < 8; ++y) {
                    vec3 value = texture2D( tDiffuse, (vec2(start_x, start_y) + vec2(x, y)) / resolution ).xyz;

                    float horizontal = cos( ((2.0*float(x)+1.0)*float(u)*PI)/16.0 );
                    float vertical = cos( ((2.0*float(y)+1.0)*float(v)*PI)/16.0 );
                    sum += value * horizontal * vertical;
                }
            }

            sum *= (1. / 4.) * alpha(u) * alpha(v);

            float q = quality_factor(u, v);
            sum = floor(sum * q + 0.5) / q;

			gl_FragColor = vec4(sum, 1.0);
		}
        `
};

const JPEGDecodeShader = {
  uniforms: {
    coefficients: { value: null },
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

        #define BLOCK_SIZE 8

		uniform sampler2D coefficients;
        uniform vec2 resolution;

		varying vec2 vUv;

        float alpha(int u) {
            if (u == 0) return 1.0/sqrt(2.0);
            else return 1.0;
        }

        void main() {
            gl_FragColor = texture2D(coefficients, vUv);

            int coord_x = int(gl_FragCoord.x);
            int coord_y = int(gl_FragCoord.y);

            int start_x = (coord_x / 8) * 8;
            int start_y = (coord_y / 8) * 8;

            int x = coord_x - start_x;
            int y = coord_y - start_y;

            vec3 sum;
            for (int u = 0; u < 8; ++u) {
                for(int v = 0; v < 8; ++v) {
                    vec3 value = texture2D( coefficients, (vec2(start_x, start_y) + vec2(u, v) + 0.5) / resolution ).xyz;

                    float horizontal = cos( ((2.0*float(x)+1.0)*float(u)*PI)/16.0 );
                    float vertical = cos( ((2.0*float(y)+1.0)*float(v)*PI)/16.0 );
                    sum += alpha(u) * alpha(v) * value * horizontal * vertical;
                }
            }

            sum *= 0.25;

			gl_FragColor = vec4(sum, 1.0);
		}`
};

export class JPEGPass extends Pass {
  encodeMaterial: ShaderMaterial;
  encodeQuad: FullScreenQuad;
  encodeUniforms: any;

  floatTexture: THREE.WebGLRenderTarget;

  decodeMaterial: ShaderMaterial;
  decodeQuad: FullScreenQuad;
  decodeUniforms: any;

  static isSupported(renderer: THREE.WebGL1Renderer): boolean {
    return (
      renderer.extensions.has("OES_texture_half_float") &&
      renderer.extensions.has("EXT_color_buffer_half_float")
    );
  }

  constructor(width: number, height: number) {
    super();

    this.encodeUniforms = UniformsUtils.clone(JPEGEncodeShader.uniforms);
    this.decodeUniforms = UniformsUtils.clone(JPEGDecodeShader.uniforms);

    this.encodeMaterial = new ShaderMaterial({
      uniforms: this.encodeUniforms,
      vertexShader: JPEGEncodeShader.vertexShader,
      fragmentShader: JPEGEncodeShader.fragmentShader
    });

    this.decodeMaterial = new ShaderMaterial({
      uniforms: this.decodeUniforms,
      vertexShader: JPEGDecodeShader.vertexShader,
      fragmentShader: JPEGDecodeShader.fragmentShader
    });

    this.encodeQuad = new FullScreenQuad(this.encodeMaterial);
    this.decodeQuad = new FullScreenQuad(this.decodeMaterial);

    this.floatTexture = new THREE.WebGLRenderTarget(width, height, {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      generateMipmaps: false
    });
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    // Encode
    this.encodeUniforms["tDiffuse"].value = readBuffer.texture;
    this.encodeUniforms["resolution"].value = new THREE.Vector2(
      readBuffer.width,
      readBuffer.height
    );

    renderer.setRenderTarget(this.floatTexture);
    if (this.clear) renderer.clear();
    this.encodeQuad.render(renderer);

    // Decode
    this.decodeUniforms["coefficients"].value = this.floatTexture.texture;
    this.decodeUniforms["resolution"].value = new THREE.Vector2(
      readBuffer.width,
      readBuffer.height
    );

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.decodeQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.decodeQuad.render(renderer);
    }
  }
}
