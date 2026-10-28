"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { fragmentShader, vertexShader } from "@/lib/inkShader";
import { stateAt, type SceneState } from "@/lib/timeline";
import { stills } from "@/content/site";

type Props = {
  progressRef: RefObject<number>;
  reducedMotion: boolean;
  /** Pauses rendering when the stage is fully covered (e.g. by the enquiry section). */
  activeRef: RefObject<boolean>;
};

const PAPER: [number, number, number, number] = [236, 229, 213, 255];

function srcFor(key: string, small: boolean) {
  return `/scenes/${key}-${small ? 1280 : 2400}.webp`;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function InkStage({ progressRef, reducedMotion, activeRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const [fallback, setFallback] = useState(false);

  // WebGL path
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl && vs && fs ? gl.createProgram() : null;
    if (!gl || !vs || !fs || !program) {
      queueMicrotask(() => setFallback(true));
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      queueMicrotask(() => setFallback(true));
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const U = {
      a: u("uA"), b: u("uB"), res: u("uRes"), sizeA: u("uSizeA"), sizeB: u("uSizeB"),
      time: u("uTime"), mix: u("uMix"), mode: u("uMode"),
      sceneA: u("uSceneA"), sceneB: u("uSceneB"), lightA: u("uLightA"), lightB: u("uLightB"),
      camA: u("uCamA"), camB: u("uCamB"),
    };

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
    const textures = stills.map(() => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(PAPER));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    });
    const sizes: Array<[number, number]> = stills.map(() => [16, 9]);
    let dirty = true;
    let disposed = false;

    // Progressive loading: the opening scene first, then the rest in journey order.
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (disposed) return resolve();
          gl.bindTexture(gl.TEXTURE_2D, textures[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          sizes[i] = [img.naturalWidth, img.naturalHeight];
          dirty = true;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = srcFor(stills[i].key, small);
      });
    load(0).then(async () => {
      for (let i = 1; i < stills.length; i++) await load(i);
    });

    const dprCap = small ? 1 : 1.5;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        dirty = true;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const setScene = (loc: { scene: WebGLUniformLocation | null; light: WebGLUniformLocation | null; cam: WebGLUniformLocation | null }, s: SceneState) => {
      gl.uniform4f(loc.scene, s.ink, s.mist, s.speed, s.parallax);
      gl.uniform1f(loc.light, s.light);
      // Portrait screens already crop the landscape frame hard; temper the camera push there.
      const k = canvas.width < canvas.height ? 0.4 : 1;
      gl.uniform3f(loc.cam, 1 + (s.cam.zoom - 1) * k, s.cam.fx, s.cam.fy);
    };

    let raf = 0;
    let lastP = -1;
    let frame = 0;
    const start = performance.now();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!activeRef.current || document.hidden) return;
      const p = progressRef.current ?? 0;
      frame++;
      // Ambient mist only needs ~30fps; scroll changes render every frame.
      if (p === lastP && !dirty && frame % 2 === 1) return;
      lastP = p;
      dirty = false;
      const s = stateAt(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[s.a]);
      gl.uniform1i(U.a, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[s.b]);
      gl.uniform1i(U.b, 1);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform2f(U.sizeA, sizes[s.a][0], sizes[s.a][1]);
      gl.uniform2f(U.sizeB, sizes[s.b][0], sizes[s.b][1]);
      gl.uniform1f(U.time, (performance.now() - start) / 1000);
      gl.uniform1f(U.mix, s.mix);
      gl.uniform1f(U.mode, s.mode);
      setScene({ scene: U.sceneA, light: U.lightA, cam: U.camA }, s.sa);
      setScene({ scene: U.sceneB, light: U.lightB, cam: U.camB }, s.sb);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(draw);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setFallback(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost);
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(program);
    };
  }, [reducedMotion, progressRef, activeRef]);

  const useImages = reducedMotion || fallback;

  // Still-image path: cross-fades driven by the same timeline (no camera motion under reduced motion).
  useEffect(() => {
    if (!useImages) return;
    let raf = 0;
    let lastP = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = progressRef.current ?? 0;
      if (p === lastP) return;
      lastP = p;
      const s = stateAt(p);
      imgRefs.current.forEach((img, i) => {
        if (!img) return;
        const opacity = i === s.a ? 1 - s.mix : i === s.b ? s.mix : 0;
        img.style.opacity = String(opacity);
        const st = i === s.a ? s.sa : s.sb;
        if (!reducedMotion && opacity > 0) {
          img.style.transform = `scale(${st.cam.zoom})`;
          img.style.transformOrigin = `${st.cam.fx * 100}% ${st.cam.fy * 100}%`;
        }
        if (opacity > 0) img.style.filter = `grayscale(${st.ink}) sepia(${st.ink * 0.25}) contrast(${1 - st.ink * 0.1})`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [useImages, reducedMotion, progressRef]);

  return (
    <div className="fixed inset-0 z-0 bg-paper" aria-hidden="true">
      {useImages ? (
        stills.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.key}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            src={srcFor(s.key, false)}
            srcSet={`${srcFor(s.key, true)} 1280w, ${srcFor(s.key, false)} 2400w`}
            sizes="100vw"
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover will-change-[opacity]"
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
