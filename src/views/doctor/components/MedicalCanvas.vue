<script setup>
import { ref, watch, onMounted } from 'vue';


const props = defineProps({
  baseImageSrc: String,
  gradCamSrc: String, // New prop for AI Result
  brushType: { type: String, default: 'normal' },
  brushSize: { type: Number, default: 1 },
  brushOpacity: { type: Number, default: 0.65 },
  viewMode: { type: String, default: 'raw' }
});

const emit = defineEmits(['update:drawings']);

const width = 400;
const height = 400;
const stageConfig = { width, height };

// REFS
const stageRef = ref(null);
const baseImageObj = ref(null);
const maskImageObj = ref(null); // This displays the editable mask on the Konva stage
const gradCamOverlayObj = ref(null); // Fallback visual layer if pixel processing fails
const debugStatus = ref("Waiting for AI...");

// NATIVE CANVAS FOR MASKING
let maskCanvas = null;
let maskCtx = null;

const isDrawing = ref(false);
const isTainted = ref(false);

const brushColors = {
  normal: '#00FF00',
  benign: '#FFC107',
  malignant: '#FF0000',
  nocancer: '#0099ff',
  white: '#ffffff',
  erase: 'destination-out'
};

const initMaskCanvas = () => {
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

  // Create a Konva-compatible image wrapper for this canvas
  const img = new Image();
  img.src = maskCanvas.toDataURL();
  maskImageObj.value = img;
};

// 1. LOAD BASE IMAGE
const loadImage = (src) => {
  if (!src) return;
  isTainted.value = false;
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => { baseImageObj.value = img; };
  img.onerror = () => {
    // Fallback if CORS fails (tainted mode)
    const taintedImg = new Image();
    taintedImg.onload = () => {
      baseImageObj.value = taintedImg;
      isTainted.value = true;
    };
    taintedImg.src = src;
  };
  img.src = src;
};

// 2. IMPORT AI GRADCAM LOGIC
const processGradCam = (src) => {
  console.log("processGradCam triggered with:", src);
  if (!src) return;

  // Reset state
  gradCamOverlayObj.value = null;

  const img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = () => {
    console.log("GradCAM Image Loaded. Copying full heatmap...");
    try {
      if (!maskCtx) return;

      // CLEAR existing content first (optional, but good for cleanliness)
      maskCtx.clearRect(0, 0, width, height);

      // DRAW EXACT COPY (No filtering)
      // This preserves Blue, Red, Holes, and Gradients perfectly.
      maskCtx.drawImage(img, 0, 0, width, height);

      // For editing, we might want to make the "Black" pixels transparent?
      // Usually GradCAM has black borders. Let's do a quick pass just for pure black/white background removal if needed
      // But user asked for "Full Blue", so we keep it as is.
      // Transparency is handled by the v-image opacity in the template.

      updateKonvaVisual();

    } catch (e) {
      console.error("Heatmap copy failed:", e);
      fallbackLoad(src);
    }
  };

  img.onerror = (err) => {
    console.warn("CORS Load Failed. Switching to Fallback.", err);
    fallbackLoad(src);
  };

  img.src = src;
};

// Fallback: Load image without CORS and display as a passive underlay
const fallbackLoad = (src) => {
  const img = new Image();
  // No crossOrigin set
  img.onload = () => {
    gradCamOverlayObj.value = img;
  };
  img.onerror = () => {
    // Fallback failed to load
  };
  img.src = src;
}

const updateKonvaVisual = () => {
  if (!maskCanvas) return;
  const newImg = new Image();
  newImg.src = maskCanvas.toDataURL();
  newImg.onload = () => {
    maskImageObj.value = newImg;
  };
};

// 3. DRAWING HANDLERS
const getPointerPos = (e) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  return pos;
};

const handleMouseDown = (e) => {
  isDrawing.value = true;
  const pos = getPointerPos(e);

  maskCtx.beginPath();
  maskCtx.moveTo(pos.x, pos.y);

  // Setup Brush
  const mode = props.brushType === 'erase' ? 'destination-out' : 'source-over';
  maskCtx.globalCompositeOperation = mode;
  maskCtx.lineCap = 'round';
  maskCtx.lineJoin = 'round';
  maskCtx.lineWidth = props.brushSize * 5;
  maskCtx.globalAlpha = props.brushType === 'erase' ? 1.0 : props.brushOpacity; // Full opacity for eraser, brush opacity for drawing

  if (props.brushType !== 'erase') {
    maskCtx.strokeStyle = brushColors[props.brushType];
  }

  maskCtx.lineTo(pos.x + 0.01, pos.y);
  maskCtx.stroke();

  updateKonvaVisual();
};

const handleMouseMove = (e) => {
  if (!isDrawing.value) return;
  const pos = getPointerPos(e);

  maskCtx.lineTo(pos.x, pos.y);
  maskCtx.stroke();
  updateKonvaVisual();
};

const handleMouseUp = () => {
  isDrawing.value = false;
  maskCtx.closePath();
  emit('update:drawings', 'updated');
};

// 4. EXPORT
const getStageDataURL = () => {
  if (stageRef.value && stageRef.value.getStage()) {
    return stageRef.value.getStage().toDataURL({ pixelRatio: 2 });
  }
  return null;
};

defineExpose({ getStageDataURL, isTainted });

onMounted(() => {
  try {
    initMaskCanvas();
    if (props.baseImageSrc) loadImage(props.baseImageSrc);

    // Check if Src is already present
    if (props.gradCamSrc) {
      processGradCam(props.gradCamSrc);
    }
  } catch (e) {
    console.error("Mount Error:", e.message);
  }
});

// Watchers
watch(() => props.baseImageSrc, loadImage);
watch(() => props.gradCamSrc, (newVal) => {
  if (newVal) {
    processGradCam(newVal);
  }
});

</script>

<template>
  <div class="flex flex-col md:flex-row gap-6 justify-center">

    <div class="flex flex-col items-center">
      <div class="rounded-xl overflow-hidden border-4 border-white shadow-lg relative bg-black cursor-crosshair group"
        :style="{ width: width + 'px', height: height + 'px' }">
        <v-stage ref="stageRef" :config="stageConfig" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
          <v-layer>
            <!-- 1. Base Image (Patient Ultrasound) -->
            <v-image v-if="baseImageObj" :config="{ image: baseImageObj, width, height }" />

            <!-- 1.5 Fallback AI Overlay -->
            <v-image v-if="gradCamOverlayObj" :config="{
              image: gradCamOverlayObj,
              width,
              height,
              opacity: 0.5,
              listening: false
            }" />

            <!-- 2. Overlay Tint for "Raw" view mode (Optional styling) -->
            <v-rect v-if="baseImageObj" :config="{
              x: 0, y: 0, width, height,
              opacity: 0.1,
              listening: false
            }" />

            <!-- 3. Mask Layer (The Editable Part) -->
            <!-- We set opacity to ~0.6 so the USG is visible BEHIND the full blue heatmap -->
            <v-image v-if="maskImageObj" :config="{
              image: maskImageObj,
              width: width,
              height: height,
              // opacity: props.brushOpacity, // REMOVED: Managed via stroke globalAlpha, so layer is always 100%
              listening: false
            }" />
          </v-layer>
        </v-stage>

        <!-- View Mode Overlay Effect (Simulates Smooth Contour) -->
        <div v-if="viewMode === 'normalized'" class="absolute inset-0 pointer-events-none"
          style="backdrop-filter: blur(8px) contrast(1.2); mix-blend-mode: hard-light; opacity: 0.7;">
        </div>

      </div>
      <p class="mt-3 font-bold text-slate-600 uppercase tracking-widest text-xs">
        {{ viewMode }} VIEW
      </p>
    </div>

  </div>
</template>