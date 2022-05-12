type Point = {
  x: Number,
  y: Number
}

type LensData = Point & {
  pixels: Uint8ClampedArray
}

type DrawLens = (data: LensData) => void;

interface API {
  drawLens: DrawLens
}

class LensAPI implements API {

  constructor() {

  }

  drawLens(data: LensData): void {

  }

}
