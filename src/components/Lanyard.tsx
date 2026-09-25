"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import * as THREE from "three";

// Adapted from React Bits "Lanyard" (reactbits.dev/components/lanyard).

const CARD_GLB = "/lanyard/card.glb";

// The card model's front face is UV-mapped to the LEFT half of its texture
// atlas and the back face to the RIGHT half (measured from card.glb).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

// Distance (world units) from the screen's left edge to the strap's anchor,
// and the card's size relative to the React Bits original (~120px wide on a
// 1080p desktop). Phones get a smaller card that hangs closer to the edge.
// The model, its collider and the joint that holds it all scale together.
// On phones the strap is also shorter, so the card sits in the top-left
// corner above the hero title. STRAP_SEGMENT is the length of each of the
// strap's three rope segments (React Bits uses 1).
const ANCHOR_FROM_LEFT = { desktop: 1.3, mobile: 0.85 };
const CARD_SCALE = { desktop: 0.8, mobile: 0.6 };
const STRAP_SEGMENT = { desktop: 0.35, mobile: 0.14 };
// Strap thickness in world units.
const STRAP_WIDTH = { desktop: 0.2, mobile: 0.15 };

// Pulling the card this far below where the drag started (world units) and
// letting go opens the popup.
const PULL_TO_OPEN = 1.5;

// R3F listens on <body>, so it sees pointer events even when a link, button,
// the open menu or the popup is drawn over the card. Ignore those.
const BLOCKING_ELEMENTS = "a,button,input,select,textarea,label,dialog,#staggered-menu-panel";
const isCovered = (e: ThreeEvent<PointerEvent>) =>
  !!(e.nativeEvent.target as Element | null)?.closest?.(BLOCKING_ELEMENTS);

// Draws the card faces with the site's own Plus Jakarta Sans font.
async function drawCardFaces(): Promise<{ front: string; back: string }> {
  const root = getComputedStyle(document.documentElement);
  const body = root.getPropertyValue("--font-jakarta").trim() || "sans-serif";
  // Load only the real web font (the first family): next/font's local()
  // "Fallback" face makes document.fonts.load reject. If loading fails, the
  // canvas just falls back to the next family in the list.
  const first = (family: string) => family.split(",")[0];
  await Promise.allSettled([
    document.fonts.load(`700 30px ${first(body)}`),
  ]);

  // Same proportions as the card face's region in the model's texture atlas
  // (~839 x 1266 px), so the text isn't resampled.
  const W = 840;
  const H = 1268;
  const make = (paint: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    paint(ctx);
    return canvas.toDataURL("image/png");
  };

  const front = make((ctx) => {
    ctx.fillStyle = "#fbf8f1";
    ctx.fillRect(0, 0, W, H);
    // Thin inset border, so the beige card still reads as a card on the
    // beige page.
    ctx.strokeStyle = "#0c0c0c";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(30, 30, W - 60, H - 60, 36);
    ctx.stroke();
    // Just the call to action between two rules, in bold sans (Cormorant's
    // fine strokes blur on a small, moving 3D card).
    ctx.fillStyle = "#0c0c0c";
    ctx.font = `700 88px ${body}`;
    ctx.fillText("DRAG THIS!", W / 2, 285);
    ctx.fillRect(90, 390, W - 180, 14);
    // Largest size at which "ENQUIRE" still fits inside the border.
    ctx.font = `700 100px ${body}`;
    const fontSize = Math.min(190, Math.floor((100 * (W - 200)) / ctx.measureText("ENQUIRE").width));
    ctx.font = `700 ${fontSize}px ${body}`;
    ctx.fillText("ENQUIRE", W / 2, 555);
    ctx.fillText("NOW!", W / 2, 755);
    ctx.fillRect(90, 890, W - 180, 14);
  });

  const back = make((ctx) => {
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbf8f1";
    ctx.font = `700 110px ${body}`;
    ctx.fillText("Book a", W / 2, 480);
    ctx.fillText("site visit", W / 2, 610);
    ctx.font = `600 56px ${body}`;
    ctx.fillText("+91 87220 00148", W / 2, 800);
  });

  return { front, back };
}

export default function Lanyard({ onOpen }: { onOpen: () => void }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [faces, setFaces] = useState<{ front: string; back: string } | null>(null);
  // True while the card hangs still: physics and rendering are paused so the
  // 3D canvas costs nothing while the visitor scrolls. Grabbing the card
  // wakes it.
  const [resting, setResting] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    drawCardFaces().then((f) => {
      if (!cancelled) setFaces(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The strap is drawn as a white SVG line over the page with
  // mix-blend-mode: difference (dark on light sections, light on dark photos).
  // It can't live in the WebGL canvas: a blend mode there would apply to the
  // whole canvas, card included. The canvas sits above it, so the card still
  // covers the strap's end.
  const strapPath = useRef<SVGPathElement>(null);

  if (!faces) return null;

  return (
    <>
      <svg className="pointer-events-none fixed inset-0 z-[39] h-full w-full mix-blend-difference" aria-hidden="true">
        <path ref={strapPath} fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Full-screen canvas, so the card can be dragged anywhere without being
          cut off at the canvas edge. The canvas ignores the mouse; R3F listens
          on <body> instead, so only the card mesh itself is interactive and the
          page underneath stays clickable. */}
      <div className="pointer-events-none fixed inset-0 z-40">
        <Canvas
          eventSource={document.body}
          eventPrefix="client"
          style={{ pointerEvents: "none" }}
          camera={{ position: [0, 0, 30], fov: 20 }}
          dpr={[1, 1.5]}
          // No filmic tone mapping: it flattens the printed card's contrast.
          flat
          gl={{ alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        >
          <ambientLight intensity={Math.PI} />
          <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60} paused={resting}>
            {/* Remount on a phone/desktop switch: the joints are created once,
                so a new card size needs a fresh rig. */}
            <Band key={isMobile ? "mobile" : "desktop"} isMobile={isMobile} frontImage={faces.front} backImage={faces.back} onOpen={onOpen} strapPath={strapPath} setResting={setResting} />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Canvas>
      </div>
    </>
  );
}

type LerpedBody = RapierRigidBody & { lerped?: THREE.Vector3 };

function Band({
  isMobile,
  frontImage,
  backImage,
  onOpen,
  strapPath,
  setResting,
}: {
  isMobile: boolean;
  frontImage: string;
  backImage: string;
  onOpen: () => void;
  strapPath: RefObject<SVGPathElement | null>;
  setResting: (resting: boolean) => void;
}) {
  const maxSpeed = 50;
  const minSpeed = 0;
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LerpedBody>(null!);
  const j2 = useRef<LerpedBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  // Anchor near the left edge, whatever the canvas width on this screen.
  const viewportWidth = useThree((state) => state.viewport.width);
  const size = isMobile ? "mobile" : "desktop";
  const cardScale = CARD_SCALE[size];
  const strapSegment = STRAP_SEGMENT[size];
  const anchorX = -viewportWidth / 2 + ANCHOR_FROM_LEFT[size];
  const pressRef = useRef<{ cardY: number } | null>(null);

  // Stop physics and rendering once the card has settled: an always-on
  // full-screen WebGL loop made page scrolling stutter. Both restart when the
  // card is grabbed (or this rig is remounted), and pause again once it hangs
  // still. The physics must pause too: while it runs it keeps requesting
  // frames.
  const setFrameloop = useThree((state) => state.setFrameloop);
  const stillFrames = useRef(0);
  const wake = () => {
    stillFrames.current = 0;
    setResting(false);
    setFrameloop("always");
  };
  useEffect(() => {
    setResting(false);
    setFrameloop("always");
  }, [setFrameloop, setResting]);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: RigidBodyProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const getLerped = (body: LerpedBody) => {
    if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
    return body.lerped;
  };

  const { nodes, materials } = useGLTF(CARD_GLB) as any;
  const frontTex = useTexture(frontImage);
  const backTex = useTexture(backImage);

  // Composite the two faces into the card's texture atlas (front = left half,
  // back = right half), cover-fitted.
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    const baseImg = baseMap.image as HTMLImageElement;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseMap;
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const scale = Math.max(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
      ctx.restore();
    };
    drawFitted(frontTex.image as HTMLImageElement, FRONT_UV_RECT);
    drawFitted(backTex.image as HTMLImageElement, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontTex, backTex, materials.base.map]);

  const [curve] = useState(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    c.curveType = "chordal";
    return c;
  });
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], strapSegment]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], strapSegment]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], strapSegment]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45 * cardScale, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  // While the card is held: no page scrolling on touch, no text selection.
  useEffect(() => {
    if (!dragged) return;
    const block = (e: TouchEvent) => e.preventDefault();
    window.addEventListener("touchmove", block, { passive: false });
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("touchmove", block);
      document.body.style.userSelect = "";
    };
  }, [dragged]);

  // Projects the strap's curve to screen pixels and draws it into the SVG path.
  const projected = new THREE.Vector3();
  const drawStrap = (camera: THREE.PerspectiveCamera, size: { width: number; height: number }) => {
    const path = strapPath.current;
    if (!path) return;
    const points = curve.getPoints(isMobile ? 16 : 32).map((p) => {
      projected.copy(p).project(camera);
      return [((projected.x + 1) / 2) * size.width, ((1 - projected.y) / 2) * size.height];
    });
    // Draw nothing rather than garbage if the physics or the canvas isn't in a
    // sane state (e.g. no WebGL): a stray path in a difference-blend layer
    // shows up as inverted streaks across the page.
    const sane = points.every(
      ([x, y]) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < size.width * 3 && Math.abs(y) < size.height * 3
    );
    if (!sane || size.width === 0) {
      path.removeAttribute("d");
      return;
    }
    const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    // World units → pixels at the card's depth (z = 0).
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    path.setAttribute("d", d);
    path.setAttribute("stroke-width", ((STRAP_WIDTH[isMobile ? "mobile" : "desktop"] * size.height) / visibleHeight).toFixed(1));
  };

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      drawStrap(state.camera as THREE.PerspectiveCamera, state.size);
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);

      const lin = card.current.linvel();
      const moving = dragged || Math.hypot(lin.x, lin.y, lin.z) > 0.02 || ang.length() > 0.02;
      stillFrames.current = moving ? 0 : stillFrames.current + 1;
      if (stillFrames.current === 45) {
        setResting(true);
        setFrameloop("demand");
      }
    }
  });


  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isCovered(e)) return;
    wake();
    (e.target as Element).setPointerCapture(e.pointerId);
    pressRef.current = { cardY: card.current.translation().y };
    drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
  };

  // A cancelled touch (e.g. the OS takes over the gesture) must not leave the
  // card "held", or the page stays unscrollable.
  const cancelDrag = () => {
    pressRef.current = null;
    drag(false);
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    drag(false);
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    // Only a real pull opens the popup — a plain click/tap does nothing.
    // Releasing makes the card dynamic again, so it springs back on its own.
    if (press.cardY - card.current.translation().y > PULL_TO_OPEN) onOpen();
  };

  return (
    <>
      {/* Anchor sits just above the top edge so the strap hangs from off-screen. */}
      <group position={[anchorX, 5.6, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[strapSegment * 0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[strapSegment, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[strapSegment * 1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[strapSegment * 2, 0, 0]} ref={card} {...segmentProps} type={dragged ? "kinematicPosition" : "dynamic"}>
          <CuboidCollider args={[0.8 * cardScale, 1.125 * cardScale, 0.01]} />
          <group
            scale={2.25 * cardScale}
            position={[0, -1.2 * cardScale, -0.05]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => hover(!isCovered(e))}
            onPointerOut={() => hover(false)}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
            onPointerCancel={cancelDrag}
            onLostPointerCapture={cancelDrag}
          >
            <mesh geometry={nodes.card.geometry}>
              {/* Unlit, so the print shows its exact colours: any lighting
                  greys the black text and washes out the logo. */}
              <meshBasicMaterial map={cardMap} map-anisotropy={16} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
    </>
  );
}

useGLTF.preload(CARD_GLB);
