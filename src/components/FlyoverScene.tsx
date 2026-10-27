"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { brand } from "@/content/site";
import { lakePolygon, lots, amenitySpots, ringPolyline, roadRings, bearingOf, type Lot } from "@/content/masterplan";
import { heightAt } from "@/lib/terrain";
import { getState, setState } from "@/lib/store";
import { sunPosition } from "@/lib/solar";

/* plano (x,y) -> mundo (x, altura, -y) */
const wx = (px: number) => px;
const wz = (py: number) => -py;

const STATUS_COLOR: Record<string, number> = {
  available: 0xc8a253,
  reserved: 0x4ec9d6,
  sold: 0x5a6076,
};

/* ---------------------------- caminho da câmera ---------------------------- */
const CAM_PLAN: [number, number, number][] = [
  [600, -470, 360],
  [360, -290, 215],
  [80, -350, 150],
  [-270, -150, 135],
  [-300, 230, 185],
  [80, 380, 205],
  [430, 250, 320],
];
const LOOK_PLAN: [number, number, number][] = [
  [0, 0, 10],
  [0, 0, 6],
  [0, -60, 4],
  [-90, 0, 4],
  [-60, 60, 10],
  [0, 40, 6],
  [0, 0, 8],
];

const toVec = (p: [number, number, number]) => new THREE.Vector3(wx(p[0]), p[2], wz(p[1]));
const UP = new THREE.Vector3(0, 1, 0);

export default function FlyoverScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    /* A construção da cena é pesada; adiamos alguns quadros para o preloader
       aparecer e animar antes do trabalho síncrono começar. */
    const build = () => {
    let disposed = false;
    const clock = new THREE.Clock();
    const pointer = { x: 0, y: 0 };

    /* órbita por arraste (clique + arrastar) além do scroll */
    let dragging = false;
    let lastPX = 0;
    let lastPY = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let orbitYawTarget = 0;
    let orbitPitchTarget = 0;
    const PITCH_MIN = -0.55;
    const PITCH_MAX = 0.85;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 1, 6000);
    camera.position.copy(toVec(CAM_PLAN[0]));

    const fogColor = new THREE.Color(0x1a2136);
    scene.fog = new THREE.Fog(fogColor, 520, 2400);

    /* ------------------------------- céu ------------------------------- */
    const sunDir = new THREE.Vector3(0.4, 0.5, 0.6).normalize();
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x070912) },
        mid: { value: new THREE.Color(0x27314f) },
        bottom: { value: new THREE.Color(0x5b6280) },
        sun: { value: sunDir },
        sunColor: { value: new THREE.Color(0xffd8a8) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
        uniform vec3 sun; uniform vec3 sunColor;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(bottom, mid, smoothstep(0.42, 0.62, h));
          col = mix(col, top, smoothstep(0.6, 1.0, h));
          float d = max(dot(normalize(vDir), normalize(sun)), 0.0);
          col += sunColor * pow(d, 220.0) * 2.2;
          col += sunColor * pow(d, 12.0) * 0.20;
          float haze = pow(1.0 - abs(vDir.y), 8.0);
          col = mix(col, vec3(0.42, 0.47, 0.58), haze * 0.5);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 40, 24), skyMat);
    sky.frustumCulled = false;
    scene.add(sky);

    /* ------------------------------ luzes ------------------------------ */
    const hemi = new THREE.HemisphereLight(0xa9c0ee, 0x1a1f2c, 0.62);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe3bd, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -420; sc.right = 420; sc.top = 420; sc.bottom = -420; sc.near = 1; sc.far = 1800;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 1.2;
    scene.add(sun, sun.target);

    const pmrem = new THREE.PMREMGenerator(renderer);
    let envRT: THREE.WebGLRenderTarget | null = null;
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 16), skyMat));
    const refreshEnv = () => {
      envRT?.dispose();
      envRT = pmrem.fromScene(envScene, 0.02);
      scene.environment = envRT.texture;
    };

    /* ----------------------------- terreno ----------------------------- */
    const SIZE = 2600;
    const SEG = 260;
    const terrainGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    terrainGeo.rotateX(-Math.PI / 2);
    {
      const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const px = x;
        const py = -z;
        const d = Math.hypot(px, py);
        let h = heightAt(px, py);
        // beira do mapa desce para o horizonte
        h -= Math.max(0, d - 900) * 0.06;
        pos.setY(i, h);
      }
      terrainGeo.computeVertexNormals();
    }
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2b3a2c,
      roughness: 0.96,
      metalness: 0,
      flatShading: false,
    });
    // variação de cor por altura/inclinação
    terrainMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vH; varying vec3 vN2;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvH = position.y; vN2 = normal;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vH; varying vec3 vN2;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           vec3 sand = vec3(0.36, 0.33, 0.26);
           vec3 grass = vec3(0.20, 0.28, 0.18);
           vec3 high  = vec3(0.28, 0.30, 0.23);
           float t = smoothstep(-2.0, 3.5, vH);
           vec3 c = mix(sand, grass, t);
           c = mix(c, high, smoothstep(14.0, 34.0, vH));
           float slope = 1.0 - clamp(vN2.y, 0.0, 1.0);
           c = mix(c, vec3(0.27,0.25,0.22), smoothstep(0.25, 0.7, slope));
           diffuseColor.rgb *= c * 3.7;`
        );
    };
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    /* ------------------------------- lago ------------------------------ */
    const lakeShape = new THREE.Shape(lakePolygon.map(([x, y]) => new THREE.Vector2(x, y)));
    const waterGeo = new THREE.ShapeGeometry(lakeShape, 24);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshStandardMaterial({
        color: 0x0d1f2e,
        roughness: 0.045,
        metalness: 0.95,
        envMapIntensity: 1.4,
      })
    );
    water.position.y = 0.15;
    water.receiveShadow = false;
    scene.add(water);

    // orla clara (faixa de areia/pedra)
    const shoreGeo = new THREE.ShapeGeometry(
      new THREE.Shape(lakePolygon.map(([x, y]) => {
        const r = Math.hypot(x, y);
        return new THREE.Vector2((x / r) * (r + 7), (y / r) * (r + 7));
      })),
      24
    );
    shoreGeo.rotateX(-Math.PI / 2);
    const shore = new THREE.Mesh(shoreGeo, new THREE.MeshStandardMaterial({ color: 0x4a4438, roughness: 1 }));
    shore.position.y = -0.15;
    shore.receiveShadow = true;
    scene.add(shore);

    /* ------------------------------- vias ------------------------------ */
    function ribbon(points: [number, number][], width: number, lift = 0.5) {
      const g = new THREE.BufferGeometry();
      const verts: number[] = [];
      const idx: number[] = [];
      const n = points.length;
      for (let i = 0; i < n; i++) {
        const [x, y] = points[i];
        const [nx, ny] = points[(i + 1) % n];
        const [bx, by] = points[(i - 1 + n) % n];
        let tx = nx - bx;
        let ty = ny - by;
        const len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        const ox = -ty * (width / 2);
        const oy = tx * (width / 2);
        const ax = x + ox, ay = y + oy, cx = x - ox, cy = y - oy;
        verts.push(wx(ax), heightAt(ax, ay) + lift, wz(ay));
        verts.push(wx(cx), heightAt(cx, cy) + lift, wz(cy));
      }
      for (let i = 0; i < n; i++) {
        const a = i * 2, b = i * 2 + 1;
        const c = ((i + 1) % n) * 2, d = ((i + 1) % n) * 2 + 1;
        idx.push(a, c, b, b, c, d);
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }
    const roadGeos = roadRings.map((r) => ribbon(ringPolyline(r.offset, 260), r.width));
    const roads = new THREE.Mesh(
      mergeGeometries(roadGeos, false)!,
      new THREE.MeshStandardMaterial({ color: 0x191c26, roughness: 0.85, metalness: 0.05 })
    );
    roads.receiveShadow = true;
    scene.add(roads);

    /* ------------------------------- lotes ----------------------------- */
    const lotMeshes: Record<string, THREE.Mesh> = {};
    const lineGroups: Record<string, THREE.LineSegments> = {};
    const lotCenters = new Map<string, THREE.Vector3>();

    function lotGeometry(l: Lot, lift: number) {
      const shape = new THREE.Shape(l.polygon.map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ShapeGeometry(shape, 2);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setY(i, heightAt(x, -z) + lift);
      }
      g.computeVertexNormals();
      return g;
    }

    (["available", "reserved", "sold"] as const).forEach((status) => {
      const subset = lots.filter((l) => l.status === status);
      const fills = subset.map((l) => lotGeometry(l, 0.9));
      const mesh = new THREE.Mesh(
        mergeGeometries(fills, false)!,
        new THREE.MeshBasicMaterial({
          color: STATUS_COLOR[status],
          transparent: true,
          opacity: status === "available" ? 0.26 : status === "reserved" ? 0.18 : 0.09,
          depthWrite: false,
        })
      );
      scene.add(mesh);
      lotMeshes[status] = mesh;

      const linePts: number[] = [];
      subset.forEach((l) => {
        const pts = l.polygon;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          linePts.push(wx(a[0]), heightAt(a[0], a[1]) + 1.1, wz(a[1]));
          linePts.push(wx(b[0]), heightAt(b[0], b[1]) + 1.1, wz(b[1]));
        }
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
      const lines = new THREE.LineSegments(
        lg,
        new THREE.LineBasicMaterial({
          color: STATUS_COLOR[status],
          transparent: true,
          opacity: status === "sold" ? 0.28 : 0.6,
        })
      );
      scene.add(lines);
      lineGroups[status] = lines;
    });

    lots.forEach((l) =>
      lotCenters.set(l.id, new THREE.Vector3(wx(l.center[0]), heightAt(l.center[0], l.center[1]), wz(l.center[1])))
    );

    // realce do lote selecionado
    const highlight = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })
    );
    highlight.visible = false;
    scene.add(highlight);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 90, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.visible = false;
    scene.add(beam);

    /* ------------------------------ árvores ---------------------------- */
    const treeGeo = mergeGeometries(
      [
        new THREE.ConeGeometry(3.2, 9, 6).translate(0, 6.5, 0),
        new THREE.CylinderGeometry(0.5, 0.7, 3, 5).translate(0, 1.5, 0),
      ],
      false
    )!;
    const TREES = 2200;
    const trees = new THREE.InstancedMesh(
      treeGeo,
      new THREE.MeshStandardMaterial({ color: 0x1d3323, roughness: 1, metalness: 0 }),
      TREES
    );
    trees.castShadow = true;
    trees.receiveShadow = true;
    {
      const dummy = new THREE.Object3D();
      let placed = 0;
      let guard = 0;
      while (placed < TREES && guard < TREES * 40) {
        guard++;
        const a = Math.random() * Math.PI * 2;
        const rr = 120 + Math.pow(Math.random(), 0.6) * 900;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        const h = heightAt(px, py);
        if (h < 1.2) continue;
        const dist = Math.hypot(px, py);
        // evita a faixa das quadras
        if (dist > 118 && dist < 300) {
          const wedge = Object.values(amenitySpots).some(
            (s) => Math.hypot(s.x - px, s.y - py) < 34
          );
          if (!wedge && Math.random() > 0.06) continue;
        }
        dummy.position.set(wx(px), h, wz(py));
        const s = 0.65 + Math.random() * 0.9;
        dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        trees.setMatrixAt(placed++, dummy.matrix);
      }
      trees.count = placed;
      trees.instanceMatrix.needsUpdate = true;
    }
    scene.add(trees);

    /* --------------------------- amenidades ---------------------------- */
    const amenGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x20242f, roughness: 0.7, metalness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0e1420,
      roughness: 0.1,
      metalness: 0.6,
      emissive: 0xffc98a,
      emissiveIntensity: 0.35,
    });
    Object.entries(amenitySpots).forEach(([key, s], i) => {
      const g = new THREE.Group();
      const w = key === "clube" ? 46 : 24;
      const d = key === "clube" ? 26 : 16;
      const hgt = key === "mirante" ? 14 : 7;
      const base = heightAt(s.x, s.y);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), wallMat);
      body.position.y = hgt / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      const band = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, hgt * 0.3, d * 1.01), glassMat);
      band.position.y = hgt * 0.55;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.15, 0.7, d * 1.25), wallMat);
      roof.position.y = hgt + 0.35;
      roof.castShadow = true;
      g.add(body, band, roof);
      g.position.set(wx(s.x), base, wz(s.y));
      g.rotation.y = -Math.atan2(s.y, s.x) + Math.PI / 2;
      g.userData.key = key;
      amenGroup.add(g);
      void i;
    });
    scene.add(amenGroup);

    // deck sobre a água
    {
      const s = amenitySpots["deck"];
      const dir = new THREE.Vector2(-s.x, -s.y).normalize();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(46, 0.8, 14), new THREE.MeshStandardMaterial({ color: 0x3a2f24, roughness: 0.9 }));
      const dx = s.x + dir.x * 44;
      const dy = s.y + dir.y * 44;
      deck.position.set(wx(dx), 1.4, wz(dy));
      deck.rotation.y = -Math.atan2(dy, dx) + Math.PI / 2;
      deck.castShadow = true;
      scene.add(deck);
    }

    /* -------------------------- animação / loop ------------------------ */
    const camCurve = new THREE.CatmullRomCurve3(CAM_PLAN.map(toVec), false, "catmullrom", 0.3);
    const lookCurve = new THREE.CatmullRomCurve3(LOOK_PLAN.map(toVec), false, "catmullrom", 0.3);

    const desiredPos = new THREE.Vector3().copy(camera.position);
    const desiredLook = new THREE.Vector3(0, 0, 0);
    const currentLook = new THREE.Vector3(0, 0, 0);
    let smoothProgress = 0;
    let lastSunKey = "";

    function applySun(month: number, hour: number) {
      const { azimuth, altitude } = sunPosition(brand.site.latitude, month, hour);
      setState({ sunAz: azimuth, sunAlt: altitude });
      const planBearing = ((azimuth - brand.site.northOffsetDeg) * Math.PI) / 180;
      const altR = (Math.max(altitude, -6) * Math.PI) / 180;
      const dx = Math.sin(planBearing) * Math.cos(altR);
      const dy = Math.cos(planBearing) * Math.cos(altR);
      const dyy = Math.sin(altR);
      const D = 900;
      sun.position.set(wx(dx * D), dyy * D, wz(dy * D));
      sun.target.position.set(0, 0, 0);
      sun.target.updateMatrixWorld();
      sunDir.set(wx(dx), dyy, wz(dy)).normalize();
      skyMat.uniforms.sun.value.copy(sunDir);

      const day = THREE.MathUtils.clamp((altitude + 4) / 22, 0, 1);
      sun.intensity = 0.25 + day * 2.6;
      const warm = 1 - day;
      sun.color.setHSL(0.09 - warm * 0.03, 0.35 + warm * 0.45, 0.62);
      hemi.intensity = 0.18 + day * 0.5;
      const top = new THREE.Color().setHSL(0.62, 0.5, 0.02 + day * 0.06);
      const mid = new THREE.Color().setHSL(0.6, 0.42, 0.06 + day * 0.22);
      const bot = new THREE.Color().setHSL(0.09 + day * 0.45, 0.4 + warm * 0.3, 0.12 + day * 0.42);
      skyMat.uniforms.top.value.copy(top);
      skyMat.uniforms.mid.value.copy(mid);
      skyMat.uniforms.bottom.value.copy(bot);
      fogColor.copy(mid).lerp(bot, 0.6);
      renderer.setClearColor(fogColor);
      refreshEnv();
    }

    let raf = 0;
    function frame() {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      const st = getState();
      const t = clock.getElapsedTime();

      const sunKey = `${st.month}|${st.hour.toFixed(2)}`;
      if (sunKey !== lastSunKey) {
        lastSunKey = sunKey;
        applySun(st.month, st.hour);
      }

      smoothProgress += (st.progress - smoothProgress) * 0.055;
      const p = THREE.MathUtils.clamp(smoothProgress, 0, 1);

      const focus = st.focusLot ? lotCenters.get(st.focusLot) : null;
      if (focus) {
        const away = focus.clone().setY(0).normalize();
        desiredPos.copy(focus).addScaledVector(away, 78).setY(focus.y + 52);
        desiredLook.copy(focus);
      } else {
        camCurve.getPoint(p, desiredPos);
        lookCurve.getPoint(p, desiredLook);
      }

      // parallax suave com o mouse
      desiredPos.x += pointer.x * 14;
      desiredPos.y += pointer.y * 8;

      // órbita manual (clique + arrastar) em torno do ponto observado
      orbitYaw += (orbitYawTarget - orbitYaw) * 0.12;
      orbitPitch += (orbitPitchTarget - orbitPitch) * 0.12;
      if (orbitYaw !== 0 || orbitPitch !== 0) {
        const offset = desiredPos.clone().sub(desiredLook);
        offset.applyAxisAngle(UP, orbitYaw);
        const right = new THREE.Vector3().crossVectors(UP, offset).normalize();
        if (right.lengthSq() > 1e-6) offset.applyAxisAngle(right, orbitPitch);
        desiredPos.copy(desiredLook).add(offset);
      }

      camera.position.lerp(desiredPos, focus ? 0.045 : 0.06);
      currentLook.lerp(desiredLook, 0.07);
      camera.lookAt(currentLook);

      const dx = currentLook.x - camera.position.x;
      const dy = -(currentLook.z - camera.position.z);
      const b = Math.round(bearingOf(dx, dy));
      if (b !== st.bearing) setState({ bearing: b });

      // brilho pulsante do lote selecionado
      if (st.focusLot !== highlight.userData.id) {
        const lot = lots.find((l) => l.id === st.focusLot);
        highlight.geometry.dispose();
        if (lot) {
          highlight.geometry = lotGeometry(lot, 1.6);
          highlight.visible = true;
          const c = lotCenters.get(lot.id)!;
          beam.position.set(c.x, c.y + 45, c.z);
          beam.visible = true;
        } else {
          highlight.geometry = new THREE.BufferGeometry();
          highlight.visible = false;
          beam.visible = false;
        }
        highlight.userData.id = st.focusLot;
      }
      if (highlight.visible) {
        (highlight.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2.4) * 0.18;
      }

      // leve ondulação do reflexo na água
      water.position.y = 0.15 + Math.sin(t * 0.45) * 0.05;

      renderer.render(scene, camera);
    }

    /* --------------------------- ciclo de vida ------------------------- */
    const onResize = () => {
      if (!host) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);

      if (dragging) {
        const dx = e.clientX - lastPX;
        const dy = e.clientY - lastPY;
        orbitYawTarget -= dx * 0.006;
        orbitPitchTarget = THREE.MathUtils.clamp(orbitPitchTarget - dy * 0.005, PITCH_MIN, PITCH_MAX);
        lastPX = e.clientX;
        lastPY = e.clientY;
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      document.body.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      dragging = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    applySun(getState().month, getState().hour);
    frame();
    renderer.render(scene, camera);
    setState({ ready: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.cursor = "";
      renderer.dispose();
      pmrem.dispose();
      envRT?.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      host.removeChild(renderer.domElement);
    };
    };

    let teardown: (() => void) | null = null;
    const boot = window.setTimeout(() => {
      teardown = build();
    }, 320);

    return () => {
      window.clearTimeout(boot);
      teardown?.();
    };
  }, []);

  return <div ref={hostRef} className="fixed inset-0 z-0 h-dvh w-full" aria-hidden />;
}
