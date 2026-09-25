"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from "@react-three/fiber";
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
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

// Adapted from React Bits "Lanyard" (reactbits.dev/components/lanyard).
extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const CARD_GLB = "/lanyard/card.glb";
const STRAP_PNG = "/lanyard/lanyard.png";

// The card model's front face is UV-mapped to the LEFT half of its texture
// atlas and the back face to the RIGHT half (measured from card.glb).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

// Length of each of the strap's three rope segments (React Bits uses 1).
const STRAP_SEGMENT = 0.6;
// Distance (world units) from the canvas's left edge to the strap's anchor.
const ANCHOR_FROM_LEFT = 1.3;

// Where the logo artwork actually sits inside its 1920 x 1080 SVG canvas
// (icon + wordmark); the rest of the canvas is empty padding.
const LOGO_CROP = { x: 644, y: 152, w: 632, h: 776 };

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

  const logo = new Image();
  logo.src = "/images/bollineni_vienna.svg";
  await logo.decode();
  // The SVG decodes at a tiny intrinsic size (267 x 150), so rasterize it at
  // its full 1920 x 1080 viewBox first and crop from that sharp copy.
  const logoFull = document.createElement("canvas");
  logoFull.width = 1920;
  logoFull.height = 1080;
  logoFull.getContext("2d")!.drawImage(logo, 0, 0, 1920, 1080);

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
    // Logo cropped to its artwork and drawn large. Drawing it a few times,
    // nudged by a couple of pixels, thickens its fine strokes so they survive
    // being shrunk onto a small card.
    const logoH = 400;
    const logoW = (LOGO_CROP.w / LOGO_CROP.h) * logoH;
    for (const [dx, dy] of [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]]) {
      ctx.drawImage(logoFull, LOGO_CROP.x, LOGO_CROP.y, LOGO_CROP.w, LOGO_CROP.h, (W - logoW) / 2 + dx, 120 + dy, logoW, logoH);
    }
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(90, 555, W - 180, 12);
    // Bold sans for the call to action: Cormorant's fine strokes blur on a small,
    // moving 3D card.
    ctx.font = `700 150px ${body}`;
    ctx.fillText("ENQUIRE", W / 2, 720);
    ctx.fillText("NOW!", W / 2, 880);
    ctx.fillRect(90, 985, W - 180, 12);
    ctx.font = `700 52px ${body}`;
    ctx.fillText("PULL DOWN TO OPEN", W / 2, 1110);
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

  if (!faces) return null;

  return (
    // Full-screen canvas, so the card can be dragged anywhere without being
    // cut off at the canvas edge. The canvas ignores the mouse; R3F listens on
    // <body> instead, so only the card mesh itself is interactive and the page
    // underneath stays clickable.
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
        <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} frontImage={faces.front} backImage={faces.back} onOpen={onOpen} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

type LerpedBody = RapierRigidBody & { lerped?: THREE.Vector3 };

function Band({
  isMobile,
  frontImage,
  backImage,
  onOpen,
}: {
  isMobile: boolean;
  frontImage: string;
  backImage: string;
  onOpen: () => void;
}) {
  const maxSpeed = 50;
  const minSpeed = 0;
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LerpedBody>(null!);
  const j2 = useRef<LerpedBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  // Anchor near the left edge, whatever the canvas width on this screen.
  const viewportWidth = useThree((state) => state.viewport.width);
  const anchorX = -viewportWidth / 2 + ANCHOR_FROM_LEFT;
  const pressRef = useRef<{ cardY: number } | null>(null);

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
  // The strap texture repeats along the band.
  const texture = useTexture(STRAP_PNG, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  });
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

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], STRAP_SEGMENT]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], STRAP_SEGMENT]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], STRAP_SEGMENT]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
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
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });


  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isCovered(e)) return;
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
        <RigidBody position={[STRAP_SEGMENT * 0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[STRAP_SEGMENT, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[STRAP_SEGMENT * 1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[STRAP_SEGMENT * 2, 0, 0]} ref={card} {...segmentProps} type={dragged ? "kinematicPosition" : "dynamic"}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => hover(!isCovered(e))}
            onPointerOut={() => hover(false)}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
            onPointerCancel={cancelDrag}
            onLostPointerCapture={cancelDrag}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                // Matte printed card: a metallic surface mirrors the environment
                // lighting and washes out the print.
                clearcoat={0}
                clearcoatRoughness={0.15}
                roughness={0.85}
                metalness={0}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={[{ resolution: new THREE.Vector2(1000, 1000) }]}
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={1}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB);
