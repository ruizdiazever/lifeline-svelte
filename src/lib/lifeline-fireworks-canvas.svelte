<script lang="ts">
  import {
    LIFELINE_FIREWORKS_DURATION_S,
    LIFELINE_FIREWORKS_FRAGMENT_SHADER,
    LIFELINE_FIREWORKS_MAX_DPR,
    LIFELINE_FIREWORKS_VERTEX_SHADER,
    type LifelineFireworksPalette,
  } from "./lifeline-fireworks";

  let { palette, onDone }: { palette: LifelineFireworksPalette; onDone: () => void } = $props();

  let canvas: HTMLCanvasElement;

  $effect(() => {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) {
      onDone();
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("fireworks shader:", gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, LIFELINE_FIREWORKS_VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, LIFELINE_FIREWORKS_FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("fireworks link:", gl.getProgramInfoLog(program));
      onDone();
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uDur = gl.getUniformLocation(program, "u_dur");

    const [c0, c1, c2] = palette;
    gl.uniform3f(gl.getUniformLocation(program, "u_c0"), c0[0], c0[1], c0[2]);
    gl.uniform3f(gl.getUniformLocation(program, "u_c1"), c1[0], c1[1], c1[2]);
    gl.uniform3f(gl.getUniformLocation(program, "u_c2"), c2[0], c2[1], c2[2]);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, LIFELINE_FIREWORKS_MAX_DPR);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const t = (now - start) / 1000;
      if (t >= LIFELINE_FIREWORKS_DURATION_S) {
        onDone();
        return;
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uDur, LIFELINE_FIREWORKS_DURATION_S);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas
  bind:this={canvas}
  aria-hidden="true"
  class="pointer-events-none fixed inset-0 z-[70] h-full w-full"
></canvas>
