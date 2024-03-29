<script lang="ts">
import ColorPicker from "@/components/ColorPicker.vue";
import ThrashIcon from "@/components/icons/TrashIcon.vue";
import Popup from "@/components/Popup.vue";
import type { Image } from "@/models/image";
import { sendImage } from "@/services/modules/ImageService";
import { defineComponent } from "@vue/runtime-core";
import type { Vector2 } from "@/models/vector2";

import p5 from "p5";

export default defineComponent({
  components: {
    ColorPicker,
    ThrashIcon,
    Popup
  },
  props: {
    maxPoints: {
      default: 10
    },
    debug: {
      default: false
    },
    blue: {
      default: {
        r: 0,
        g: 170,
        b: 255
      }
    },
    yellow: {
      default: {
        r: 246,
        g: 255,
        b: 0
      }
    },
  },
  data() {
    return {
      imgSrc: "",
      images: [] as any[],
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      feedback: "",
      p: null as p5 | null,
      color: "blue",
      empty: true,
      password: "",
      pwPopupOpen: true,
      startingPoints: [] as Vector2[],
      previousPoints: [] as Vector2[],
      sendingInProgress: false
    };
  },
  methods: {
    clearCanvas(setEmpty: boolean = true) {
      this.p?.clear(0, 0, 0, 0);
      if (setEmpty)
        this.empty = true;
      this.feedback = "";
    },
    send() {
      if (this.sendingInProgress) {
        console.log("Alreading sending an image");
        return;
      }
      this.feedback = "";
      this.sendingInProgress = true;
      try {
        const img = this.createImage();
        sendImage(img, this.password)
          .then(response => {
            this.sendingInProgress = false;
            console.log(response);
            this.clearCanvas();
            if (this.debug)
              this.feedback = "succesfully send!";
            // Switch the color after sending
            this.color = this.color == 'blue' ? 'yellow' : 'blue';
            this.empty = true;

          })
          .catch(error => {
            this.sendingInProgress = false;
            console.log(error);
            this.feedback = error;
          });
      }
      catch (error) {
        this.sendingInProgress = false;
        console.log(error);
      }
    },
    createImage(): Image {
      if (this.empty) {
        const errorMsg = "Drawing is empty, can not send";
        if (this.debug) {
          this.feedback = errorMsg;
        }
        throw Error(errorMsg);
      }
      const dataUrl = this.canvas?.toDataURL("image/png");
      return {
        base64: dataUrl,
        color: this.color
      } as Image;
    },
    storePreviousPoint(point: Vector2) {
      if (this.startingPoints.length < this.maxPoints) {
        this.startingPoints.push(point);
      }
      else {
        this.previousPoints.push(point);
        if (this.previousPoints.length > this.maxPoints) {
          this.previousPoints.shift();
        }
      }
    },
    drawAllPoints() {
      if (!this.p) return;
      for (let i = 1; i < this.startingPoints.length; i++) {
        const point = this.startingPoints[i];
        const ppoint = this.startingPoints[i - 1];
        this.p.strokeWeight(i * 3);
        this.p.line(point.x, point.y, ppoint.x, ppoint.y);
      }
      for (let i = 0; i < this.previousPoints.length; i++) {
        const point = this.previousPoints[i];
        if (this.previousPoints.length >= this.maxPoints && i == 0) continue;
        const ppoint = (i == 0 && this.previousPoints.length < this.maxPoints) ? this.startingPoints[this.startingPoints.length - 1] : this.previousPoints[i - 1];

        this.p.strokeWeight((this.previousPoints.length - i) * 3);
        this.p.line(point.x, point.y, ppoint.x, ppoint.y);
      }
    },
    applyMask(r: number, g: number, b: number) {
      if (!this.p) return;
      const p = this.p;
      const mask = p.get(0, 0, p.width, p.height);
      mask.loadPixels();
      for (let x = 0; x < mask.width; x++) {
        for (let y = 0; y < mask.height; y++) {
          let a = p.map(y, 0, mask.height, 255, 0);
          if (mask.get(x, y)[3] > 0) {

            mask.set(x, y, p.color(r, g, b));
          }
        }
      }
      mask.updatePixels();
      p.image(mask, 0, 0);
    },
    distance(p1: Vector2, p2: Vector2) {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },
    difference(p1: Vector2, p2: Vector2) {
      return {
        x: (p1.x - p2.x),
        y: (p1.y - p2.y)
      }
    }
  },
  mounted() {
    this.sendingInProgress = false;
    const sketch = (p: p5) => {

      p.setup = () => {
        const renderer = p.createCanvas(480, 480);
        renderer.class("shadow absolute");
        this.canvas = document.getElementById(renderer.id()) as HTMLCanvasElement;
        this.ctx = this.canvas?.getContext("2d");
        p.windowResized();

      };
      p.touchMoved = () => {
        this.color == "blue" ? p.stroke(this.blue.r, this.blue.g, this.blue.b) : p.stroke(this.yellow.r, this.yellow.g, this.yellow.b);
        p.strokeCap('round')
        if (p.mouseIsPressed === true
          && p.mouseX > 0 && p.mouseX < p.width
          && p.mouseY > 0 && p.mouseY < p.height) {
          this.storePreviousPoint({ x: p.mouseX, y: p.mouseY });
          this.drawAllPoints();
          this.empty = false;
        }

        return false;
      };

      p.touchEnded = () => {
        this.previousPoints = [];
        this.startingPoints = [];
      }

      p.windowResized = () => {
        if (this.canvas?.parentElement)
          p.resizeCanvas(this.canvas?.parentElement?.offsetWidth, this.canvas?.parentElement?.offsetHeight, false);
      }
    };
    this.p = new p5(sketch, this.$refs.p5container as HTMLElement);
  },

})
</script>

<template>
  <div class="bg-white text-gray-900 flex flex-col h-screen">
    <Popup :isOpen="pwPopupOpen">
      <div class="flex items-center gap-x-4 text-2xl font-semibold py-6">
        <label>password:</label>
        <input type="password" v-model="password" class="bg-white border border-black h-20" />
      </div>
      <button
        class="px-8 py-4 bg-blue-500 rounded-xl text-white text-2xl"
        @click="pwPopupOpen = false"
      >Set Password</button>
    </Popup>

    <p>{{ feedback }}</p>

    <div class="flex h-full">
      <ColorPicker
        :active="color == 'blue'"
        color="rgb(1, 92, 188)"
        :class="'w-1/6 ' + (empty ? 'animate-pulse' : '')"
        @click="color = 'blue'; clearCanvas()"
      />
      <div class="relative w-4/6 mx-auto flex flex-col">
        <div ref="p5container" class="w-full h-full relative">
          <div class="absolute flex justify-center w-full my-4">
            <div class="bg-gray-400 rounded-full cursor-pointer z-10" @click="clearCanvas()">
              <ThrashIcon class="w-24 h-24 p-6 text-gray-100" />
            </div>
          </div>

          <div class="absolute inset-x-0 inset-y-0 flex justify-center items-center w-full h-full pt-12">
            <img v-if="empty" class="w-full h-4/5 opacity-100 animate-pulse" src="/img/heartTemplate.svg" />
          </div>
          <div
            class="absolute z-20 bottom-6 inset-x-0 flex justify-center text-4xl font-bold italic"
          ></div>
        </div>
        <button
          :class="'w-1/2 mx-auto my-4 rounded-lg h-24 shadow font-bold text-4xl text-white'"
          :style="(color == 'blue' ? ' background-color: rgb(1, 92, 188)' : 'background-color: rgb(255, 213, 4)')"
          @click="send()"
        >Send</button>
      </div>
      <ColorPicker
        :flip="true"
        :active="color == 'yellow'"
        color="rgb(255, 213, 4)"
        :class="'w-1/6 ' + (empty ? 'animate-pulse' : '')"
        @click="color = 'yellow'; clearCanvas()"
      />
    </div>
  </div>
</template>

<style>
</style>
