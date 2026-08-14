"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { UnitAsset } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";

function publicAssetPath(path: string) {
  return path.startsWith("./") ? path.slice(1) : path;
}

function materialKey(name: string) {
  return name
    .toLowerCase()
    .replace(/_collide|\.\d+|[-_]\d+$/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function loadTexture(loader: THREE.TextureLoader, path: string, renderer: THREE.WebGLRenderer) {
  const texture = await loader.loadAsync(publicAssetPath(path));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function fallbackMaterial(name: string) {
  const key = materialKey(name);
  if (/glass|glaz/.test(key)) {
    return new THREE.MeshPhysicalMaterial({ color: 0xdde9eb, transparent: true, opacity: 0.26, roughness: 0.06, depthWrite: false });
  }
  if (/gold|silver|handle|tap|hinge|drain|black/.test(key)) {
    return new THREE.MeshStandardMaterial({ color: /gold/.test(key) ? 0x8b7253 : 0x272725, metalness: 0.72, roughness: 0.25 });
  }
  if (/led/.test(key)) return new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  return new THREE.MeshStandardMaterial({ color: /cutline/.test(key) ? 0x8e8c89 : 0xe8e4de, roughness: 0.82 });
}

function fitCameraToModel(camera: THREE.PerspectiveCamera, controls: OrbitControls, model: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.72;

  controls.target.copy(center);
  controls.minDistance = radius * 0.45;
  controls.maxDistance = radius * 6;

  const openingDirection = new THREE.Vector3(0.15, 4, 0.15).normalize();
  camera.position.copy(center).addScaledVector(openingDirection, controls.maxDistance);
  controls.update();
}

function findWalkableFloorPoint(model: THREE.Object3D, blockers: THREE.Mesh[], fallback: THREE.Vector3) {
  let bestScore = -1;
  const bestPoint = fallback.clone();
  const triangles: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const blockerBounds = blockers.map((mesh) => new THREE.Box3().setFromObject(mesh));
  const floorBounds = new THREE.Box3();
  const boundsCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const scoreCandidate = () => {
    let clearance = Infinity;
    for (const box of blockerBounds) {
      const dx = Math.max(box.min.x - candidate.x, 0, candidate.x - box.max.x);
      const dz = Math.max(box.min.z - candidate.z, 0, candidate.z - box.max.z);
      clearance = Math.min(clearance, Math.hypot(dx, dz));
    }
    const centerDistance = Math.hypot(candidate.x - boundsCenter.x, candidate.z - boundsCenter.z);
    const score = clearance - centerDistance * 0.18;
    if (score <= bestScore) return;
    bestScore = score;
    bestPoint.copy(candidate);
  };

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !/^floor$/i.test(object.name)) return;
    const position = object.geometry.getAttribute("position");
    const index = object.geometry.index;
    const triangleCount = index ? index.count / 3 : position.count / 3;
    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const offset = triangle * 3;
      const ia = index ? index.getX(offset) : offset;
      const ib = index ? index.getX(offset + 1) : offset + 1;
      const ic = index ? index.getX(offset + 2) : offset + 2;
      a.fromBufferAttribute(position, ia).applyMatrix4(object.matrixWorld);
      b.fromBufferAttribute(position, ib).applyMatrix4(object.matrixWorld);
      c.fromBufferAttribute(position, ic).applyMatrix4(object.matrixWorld);
      triangles.push([a.clone(), b.clone(), c.clone()]);
      floorBounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);
    }
  });

  const isInsideTriangle = (point: THREE.Vector3, triangle: [THREE.Vector3, THREE.Vector3, THREE.Vector3]) => {
    const [v1, v2, v3] = triangle;
    const denominator = (v2.z - v3.z) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.z - v3.z);
    if (Math.abs(denominator) < 1e-7) return false;
    const alpha = ((v2.z - v3.z) * (point.x - v3.x) + (v3.x - v2.x) * (point.z - v3.z)) / denominator;
    const beta = ((v3.z - v1.z) * (point.x - v3.x) + (v1.x - v3.x) * (point.z - v3.z)) / denominator;
    const gamma = 1 - alpha - beta;
    return alpha >= 0 && beta >= 0 && gamma >= 0;
  };

  for (let xStep = 0; xStep < 32; xStep += 1) {
    for (let zStep = 0; zStep < 32; zStep += 1) {
      candidate.set(
        THREE.MathUtils.lerp(floorBounds.min.x, floorBounds.max.x, (xStep + 0.5) / 32),
        floorBounds.min.y,
        THREE.MathUtils.lerp(floorBounds.min.z, floorBounds.max.z, (zStep + 0.5) / 32),
      );
      if (!triangles.some((triangle) => isInsideTriangle(candidate, triangle))) continue;
      scoreCandidate();
    }
  }

  if (!triangles.length) {
    const bounds = new THREE.Box3().setFromObject(model);
    const downward = new THREE.Vector3(0, -1, 0);
    const floorRay = new THREE.Raycaster();
    for (let xStep = 0; xStep < 32; xStep += 1) {
      for (let zStep = 0; zStep < 32; zStep += 1) {
        const x = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, (xStep + 0.5) / 32);
        const z = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, (zStep + 0.5) / 32);
        floorRay.set(new THREE.Vector3(x, bounds.max.y + 1, z), downward);
        const floorHit = floorRay.intersectObject(model, true).find((hit) => hit.point.y <= bounds.min.y + 0.2);
        if (!floorHit) continue;
        candidate.copy(floorHit.point);
        scoreCandidate();
      }
    }
  }

  return bestPoint;
}

export function UnitModelViewer({ asset }: { asset: UnitAsset }) {
  const host = useRef<HTMLDivElement>(null);
  const enterTour = useRef<() => void>(() => undefined);
  const leaveTour = useRef<() => void>(() => undefined);
  const setMovement = useRef<(direction: string, pressed: boolean) => void>(() => undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f1e9);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x928578, 2.2));
    const sunlight = new THREE.DirectionalLight(0xfff3e5, 2);
    sunlight.position.set(-8, 15, 9);
    scene.add(sunlight);

    const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.zoomSpeed = 1.2;

    const pressed = new Set<string>();
    const collisionMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const clock = new THREE.Clock();
    const overviewPosition = new THREE.Vector3();
    const overviewTarget = new THREE.Vector3();
    const tourPosition = new THREE.Vector3();
    const tourLookTarget = new THREE.Vector3();
    const modelCenter = new THREE.Vector3();
    const modelBounds = new THREE.Box3();
    let tourEnabled = false;
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;

    const updateTourRotation = () => {
      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch, yaw, 0);
    };

    const keyDirection = (key: string) => {
      const normalized = key.toLowerCase();
      if (normalized === "w" || normalized === "arrowup") return "forward";
      if (normalized === "s" || normalized === "arrowdown") return "backward";
      if (normalized === "a" || normalized === "arrowleft") return "left";
      if (normalized === "d" || normalized === "arrowright") return "right";
      return "";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!tourEnabled) return;
      const direction = keyDirection(event.key);
      if (!direction) return;
      event.preventDefault();
      pressed.add(direction);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const direction = keyDirection(event.key);
      if (direction) pressed.delete(direction);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!tourEnabled) return;
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!tourEnabled || !dragging) return;
      yaw -= (event.clientX - pointerX) * 0.004;
      pitch -= (event.clientY - pointerY) * 0.003;
      pitch = THREE.MathUtils.clamp(pitch, -Math.PI * 0.47, Math.PI * 0.47);
      pointerX = event.clientX;
      pointerY = event.clientY;
      updateTourRotation();
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    async function loadModel() {
      try {
        const textureLoader = new THREE.TextureLoader();
        const textures = await Promise.all(asset.textures.map((path) => loadTexture(textureLoader, path, renderer)));
        const atlas = asset.format === "atlas" ? textures[0] : undefined;
        const materialTextures = new Map<string, THREE.Texture>();

        if (!atlas) {
          asset.textures.forEach((path, index) => {
            const filename =
              path
                .split("/")
                .at(-1)
                ?.replace(/^[0-9a-f]{10}-/, "")
                .replace(/\.[^.]+$/, "") || "";
            materialTextures.set(materialKey(filename), textures[index]);
          });
        }

        if (asset.environment) {
          const environment = await loadTexture(textureLoader, asset.environment, renderer);
          environment.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = environment;
        }

        const model = (await new GLTFLoader().loadAsync(publicAssetPath(asset.model))).scene;
        let walkMarker: THREE.Mesh | undefined;
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          if (/enterwalk/i.test(object.name)) {
            walkMarker = object;
            object.visible = false;
            return;
          }
          if (/_collide/i.test(object.name) && !/(floor|tiles|aptglaz)/i.test(object.name)) collisionMeshes.push(object);
          if (atlas) {
            if (/aptglaz/i.test(object.name)) object.material = fallbackMaterial("glass");
            else {
              const bakedUv = object.geometry.getAttribute("uv1");
              if (bakedUv) object.geometry.setAttribute("uv", bakedUv);
              object.material = new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false });
            }
            return;
          }
          const map = materialTextures.get(materialKey(object.name));
          object.material = map ? new THREE.MeshStandardMaterial({ map, roughness: 0.72 }) : fallbackMaterial(object.name);
        });

        if (disposed) return;
        scene.add(model);
        model.updateWorldMatrix(true, true);
        fitCameraToModel(camera, controls, model);
        modelBounds.setFromObject(model);
        modelBounds.getCenter(modelCenter);
        overviewPosition.copy(camera.position);
        overviewTarget.copy(controls.target);

        const markerCenter = walkMarker
          ? new THREE.Box3().setFromObject(walkMarker).getCenter(new THREE.Vector3())
          : findWalkableFloorPoint(model, collisionMeshes, modelCenter);
        tourPosition.set(markerCenter.x, modelBounds.min.y + 1.62, markerCenter.z);
        tourLookTarget.copy(modelCenter);
        tourLookTarget.y = tourPosition.y;
        if (tourLookTarget.distanceToSquared(tourPosition) < 0.16) tourLookTarget.x += 1;

        enterTour.current = () => {
          overviewPosition.copy(camera.position);
          overviewTarget.copy(controls.target);
          controls.enabled = false;
          tourEnabled = true;
          pressed.clear();
          camera.fov = 68;
          camera.near = 0.04;
          camera.position.copy(tourPosition);
          camera.lookAt(tourLookTarget);
          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
          pitch = euler.x;
          yaw = euler.y;
          updateTourRotation();
          camera.updateProjectionMatrix();
          clock.getDelta();
        };
        leaveTour.current = () => {
          tourEnabled = false;
          dragging = false;
          pressed.clear();
          camera.fov = 24;
          camera.near = 0.05;
          camera.position.copy(overviewPosition);
          controls.target.copy(overviewTarget);
          controls.enabled = true;
          controls.update();
          camera.updateProjectionMatrix();
        };
        setMovement.current = (direction, isPressed) => {
          if (isPressed) pressed.add(direction);
          else pressed.delete(direction);
        };
        setStatus("ready");
      } catch (error) {
        console.error("Unable to load unit model", error);
        if (!disposed) setStatus("error");
      }
    }

    loadModel();
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (tourEnabled) {
        const forwardAmount = Number(pressed.has("forward")) - Number(pressed.has("backward"));
        const rightAmount = Number(pressed.has("right")) - Number(pressed.has("left"));
        if (forwardAmount || rightAmount) {
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const movement = forward.multiplyScalar(forwardAmount).addScaledVector(right, rightAmount).normalize();
          const distance = delta * 1.65;
          raycaster.set(camera.position, movement);
          raycaster.far = distance + 0.28;
          const blocked = raycaster.intersectObjects(collisionMeshes, false).length > 0;
          if (!blocked) {
            camera.position.addScaledVector(movement, distance);
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, modelBounds.min.x + 0.2, modelBounds.max.x - 0.2);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, modelBounds.min.z + 0.2, modelBounds.max.z - 0.2);
          }
        }
      } else controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset]);

  return (
    <div className={`unit-model${tourActive ? " is-tour-active" : ""}`} ref={host}>
      {status === "loading" && (
        <div className="model-state">
          <Loader />
        </div>
      )}
      {status === "error" && <div className="model-state">The interior model could not be loaded.</div>}
      {status === "ready" && !tourActive && (
        <button
          className="tour-button"
          type="button"
          onClick={() => {
            enterTour.current();
            setTourActive(true);
          }}
        >
          <span aria-hidden="true">↳</span> Virtual tour
        </button>
      )}
      {tourActive && (
        <>
          <button
            className="tour-exit"
            type="button"
            onClick={() => {
              leaveTour.current();
              setTourActive(false);
            }}
          >
            <span aria-hidden="true">←</span> Back to 3D model
          </button>
          <div className="tour-movement" aria-label="Virtual tour movement controls">
            <button
              type="button"
              aria-label="Move forward"
              onPointerDown={() => setMovement.current("forward", true)}
              onPointerUp={() => setMovement.current("forward", false)}
              onPointerLeave={() => setMovement.current("forward", false)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move left"
              onPointerDown={() => setMovement.current("left", true)}
              onPointerUp={() => setMovement.current("left", false)}
              onPointerLeave={() => setMovement.current("left", false)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Move backward"
              onPointerDown={() => setMovement.current("backward", true)}
              onPointerUp={() => setMovement.current("backward", false)}
              onPointerLeave={() => setMovement.current("backward", false)}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Move right"
              onPointerDown={() => setMovement.current("right", true)}
              onPointerUp={() => setMovement.current("right", false)}
              onPointerLeave={() => setMovement.current("right", false)}
            >
              →
            </button>
          </div>
        </>
      )}
      <span className="model-hint">{tourActive ? "Drag to look · WASD to move" : "Drag to rotate · scroll to zoom"}</span>
    </div>
  );
}
