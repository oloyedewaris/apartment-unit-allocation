"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadBuildingMaterials } from "@/lib/three/building-materials";
import type { Apartment } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";

interface BuildingViewerProps {
  apartments: Apartment[];
  visibleNumbers: Set<string>;
  filtersActive: boolean;
  hoveredNumber: string | null;
  selectedNumber: string | null;
  onHover(number: string | null): void;
  onSelect(number: string): void;
}

interface ModelUnit {
  number: string;
  meshes: THREE.Mesh[];
}

export function BuildingViewer(props: BuildingViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const unitsRef = useRef<ModelUnit[]>([]);
  const repaintRef = useRef(() => {});
  propsRef.current = props;

  useEffect(() => {
    repaintRef.current();
  }, [props.visibleNumbers, props.filtersActive, props.hoveredNumber, props.selectedNumber]);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4ece6);
    scene.add(new THREE.HemisphereLight(0xe8f0fa, 0x443b35, 1.05));
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 2000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.zoomSpeed = 5.5;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2.04;

    const colors = {
      idle: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      filtered: new THREE.MeshBasicMaterial({ color: 0xf4ece6, transparent: true, opacity: 0.58, depthWrite: false }),
      hover: new THREE.MeshBasicMaterial({ color: 0xe7a07e, transparent: true, opacity: 0.6, depthWrite: false, depthTest: false }),
      selected: new THREE.MeshBasicMaterial({ color: 0xdf815f, transparent: true, opacity: 0.72, depthWrite: false, depthTest: false }),
    };

    repaintRef.current = () => {
      const current = propsRef.current;
      for (const unit of unitsRef.current) {
        const visible = current.visibleNumbers.has(unit.number);
        const material = unit.number === current.selectedNumber ? colors.selected
          : unit.number === current.hoveredNumber ? colors.hover
          : !visible && current.filtersActive ? colors.filtered : colors.idle;
        unit.meshes.forEach((mesh) => { mesh.material = material; mesh.renderOrder = material === colors.selected ? 12 : material === colors.hover ? 11 : 3; });
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function pick(event: PointerEvent) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const targets = unitsRef.current.filter((unit) => propsRef.current.visibleNumbers.has(unit.number)).flatMap((unit) => unit.meshes);
      return raycaster.intersectObjects(targets, false)[0]?.object.userData.unitNumber as string | undefined;
    }

    renderer.domElement.onpointermove = (event) => {
      const number = pick(event) || null;
      renderer.domElement.style.cursor = number ? "pointer" : "grab";
      if (number !== propsRef.current.hoveredNumber) propsRef.current.onHover(number);
    };
    renderer.domElement.onpointerleave = () => propsRef.current.onHover(null);
    renderer.domElement.onclick = (event) => {
      const number = pick(event);
      if (number) propsRef.current.onSelect(number);
    };

    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let materialLibrary: Awaited<ReturnType<typeof loadBuildingMaterials>> | undefined;
    async function initialize() {
      const loadedMaterials = await loadBuildingMaterials(renderer);
      materialLibrary = loadedMaterials;
      const draco = new DRACOLoader().setDecoderPath("/vendor/draco/");
      const root = (await new GLTFLoader().setDRACOLoader(draco).loadAsync("/volta-skai.glb")).scene;
      if (disposed) return;

      const apartmentMeshes = new Map<string, THREE.Mesh[]>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const match = /^apartment_(\d+)/i.exec(object.name);
        if (match) {
          const number = String(Number(match[1]));
          const meshes = apartmentMeshes.get(number) || [];
          meshes.push(object);
          apartmentMeshes.set(number, meshes);
          object.userData.unitNumber = number;
          return;
        }
        if (/^BILLBOARD_00[12]$/i.test(object.name) || /^BUILDING_(TOWERA|TOWERB|PODIUM)$/i.test(object.name)) object.visible = false;
        else object.material = loadedMaterials.materialFor(object.name);
      });

      unitsRef.current = props.apartments.map((unit) => ({ number: String(Number(unit.number_num)), meshes: apartmentMeshes.get(String(Number(unit.number_num))) || [] })).filter((unit) => unit.meshes.length > 0);
      scene.add(root);
      root.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(root), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), radius = size.length() / 2;
      controls.target.set(center.x, center.y - size.y * 0.08, center.z);
      const direction = new THREE.Vector3(0.72, 1.48, 1.48).normalize();
      const distance = radius * 3.05;
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.minDistance = radius * 0.46;
      controls.maxDistance = distance;
      camera.near = radius / 150;
      camera.far = radius * 20;
      camera.updateProjectionMatrix();
      controls.update();
      repaintRef.current();
      container.querySelector(".building-loading")?.remove();
    }

    initialize().catch((error) => {
      console.error("Unable to initialize building viewer", error);
      const loading = container.querySelector(".building-loading");
      if (loading) loading.textContent = "The building model could not be loaded.";
    });
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

    return () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      materialLibrary?.dispose();
      Object.values(colors).forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.apartments]);

  return <div className="building-viewer" ref={host}><div className="building-loading"><Loader /></div><span className="building-hint">Drag to rotate · scroll to zoom · select an apartment</span></div>;
}
