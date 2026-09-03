import React, { useEffect, useRef } from "react";

type FilterName = "none" | "vivid" | "noir" | "cyber" | "warm";

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2((a_position.x + 1.0) * 0.5, (1.0 - a_position.y) * 0.5);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform vec2 u_mediaScale;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_warmth;
  uniform float u_grain;
  uniform float u_time;
  uniform int u_filter;

  vec3 hueShift(vec3 color, float angle) {
    const mat3 toYIQ = mat3(
      0.299, 0.587, 0.114,
      0.596, -0.275, -0.321,
      0.212, -0.523, 0.311
    );
    const mat3 toRGB = mat3(
      1.0, 0.956, 0.621,
      1.0, -0.272, -0.647,
      1.0, -1.106, 1.703
    );
    vec3 yiq = toYIQ * color;
    float hue = atan(yiq.z, yiq.y) + angle;
    float chroma = sqrt(yiq.y * yiq.y + yiq.z * yiq.z);
    return clamp(toRGB * vec3(yiq.x, chroma * cos(hue), chroma * sin(hue)), 0.0, 1.0);
  }

  void main() {
    vec2 uv = (v_uv - 0.5) / u_mediaScale + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec4 source = texture2D(u_texture, uv);
    vec3 color = source.rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float saturation = u_saturation;
    float contrast = u_contrast;

    if (u_filter == 1) {
      saturation *= 1.35;
      contrast *= 1.08;
    } else if (u_filter == 2) {
      color = vec3(luminance);
      contrast *= 1.16;
    } else if (u_filter == 3) {
      color = hueShift(color, 1.15);
      saturation *= 1.35;
      contrast *= 1.12;
    } else if (u_filter == 4) {
      color.r += 0.06;
      color.b -= 0.035;
      saturation *= 1.15;
    }

    color = mix(vec3(luminance), color, saturation);
    color = (color - 0.5) * contrast + 0.5;
    color.r += u_warmth * 0.08;
    color.b -= u_warmth * 0.05;

    float noise = fract(sin(dot(v_uv * (u_time + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    color += (noise - 0.5) * u_grain;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), source.a);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader unavailable");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) ?? "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL program unavailable");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "WebGL program link failed");
  }
  return program;
}

export function GpuVideoPreview({
  videoRef,
  filter,
  contrast = 1,
  saturation = 1,
  warmth = 0,
  grain = 0,
  className,
  style,
  onCapability,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  filter: FilterName;
  contrast?: number;
  saturation?: number;
  warmth?: number;
  grain?: number;
  className?: string;
  style?: React.CSSProperties;
  onCapability?: (enabled: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef({ filter, contrast, saturation, warmth, grain });
  settingsRef.current = { filter, contrast, saturation, warmth, grain };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      onCapability?.(false);
      return;
    }

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.warn("[reel-editor] WebGL preview unavailable", error);
      onCapability?.(false);
      return;
    }

    const position = gl.createBuffer();
    const texture = gl.createTexture();
    if (!position || !texture) {
      onCapability?.(false);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const locations = {
      mediaScale: gl.getUniformLocation(program, "u_mediaScale"),
      contrast: gl.getUniformLocation(program, "u_contrast"),
      saturation: gl.getUniformLocation(program, "u_saturation"),
      warmth: gl.getUniformLocation(program, "u_warmth"),
      grain: gl.getUniformLocation(program, "u_grain"),
      time: gl.getUniformLocation(program, "u_time"),
      filter: gl.getUniformLocation(program, "u_filter"),
    };
    const filterIds: Record<FilterName, number> = { none: 0, vivid: 1, noir: 2, cyber: 3, warm: 4 };
    let raf = 0;
    let alive = true;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    onCapability?.(true);

    const draw = (now: number) => {
      if (!alive) return;
      resize();
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.readyState >= 2 && currentVideo.videoWidth > 0) {
        const canvasRatio = canvas.width / Math.max(1, canvas.height);
        const videoRatio = currentVideo.videoWidth / Math.max(1, currentVideo.videoHeight);
        const mediaScale = canvasRatio > videoRatio
          ? [1, videoRatio / canvasRatio]
          : [canvasRatio / videoRatio, 1];
        const settings = settingsRef.current;
        gl.useProgram(program);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currentVideo);
          gl.uniform2f(locations.mediaScale, mediaScale[0], mediaScale[1]);
          gl.uniform1f(locations.contrast, settings.contrast);
          gl.uniform1f(locations.saturation, settings.saturation);
          gl.uniform1f(locations.warmth, settings.warmth);
          gl.uniform1f(locations.grain, settings.grain);
          gl.uniform1f(locations.time, now * 0.001);
          gl.uniform1i(locations.filter, filterIds[settings.filter]);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } catch {
          onCapability?.(false);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(position);
      gl.deleteProgram(program);
    };
  }, [onCapability, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ ...style, pointerEvents: "none", willChange: "contents" }}
    />
  );
}

export default GpuVideoPreview;