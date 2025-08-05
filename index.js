const width = 500;
const height = 500;
const radius = 200;
const centerX = width / 2;
const centerY = height / 2;

const stage = new Konva.Stage({
  container: 'color',
  width,
  height,
}); 

const layer = new Konva.Layer();
stage.add(layer);

// HSV круг на Canvas
const circleCanvas = document.createElement('canvas');
circleCanvas.width = width;
circleCanvas.height = height;
const ctx = circleCanvas.getContext('2d');

const imageData = ctx.createImageData(width, height);
const data = imageData.data;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const sat = dist / radius;
      const color = chroma.hsv(angle, sat, 1).rgb();

      const index = (y * width + x) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = 255;
    }
  }
}

ctx.putImageData(imageData, 0, 0);

const bgImage = new Konva.Image({
  image: circleCanvas,
  x: 0,
  y: 0,
  listening: false,
});

layer.add(bgImage);

// Функція для створення індикатора
function createIndicator(color) {
  return new Konva.Circle({
    x: centerX,
    y: centerY,
    radius: 6,
    fill: color,
    stroke: '#000',
    strokeWidth: 1,
    draggable: true,
    dragBoundFunc: function (pos) {
      const dx = pos.x - centerX;
      const dy = pos.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        const angle = Math.atan2(dy, dx);
        return {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      }
      return pos;
    }
  });
}

// Три індикатори: основний + 2 гармонійних
const main = createIndicator('#ffffff');
const triad1 = createIndicator('#ffffff');
const triad2 = createIndicator('#ffffff');

layer.add(main, triad1, triad2);
layer.draw();

// Обчислення кута та насиченості для позиції
function getHueSat(x, y) {
  const dx = x - centerX;
  const dy = y - centerY;
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  const sat = Math.min(1, Math.sqrt(dx * dx + dy * dy) / radius);
  return { hue: angle, sat };
}

function updateIndicatorPosition(indicator, hue, sat) {
  const angleRad = (hue * Math.PI) / 180;
  const dist = sat * radius;
  indicator.x(centerX + dist * Math.cos(angleRad));
  indicator.y(centerY + dist * Math.sin(angleRad));
  const color = chroma.hsv(hue, sat, 1).hex();
  indicator.fill(color);
}

function updateAllFromMain() {
  const { hue, sat } = getHueSat(main.x(), main.y());
  updateIndicatorPosition(main, hue, sat);
  updateIndicatorPosition(triad1, (hue + 120) % 360, sat);
  updateIndicatorPosition(triad2, (hue + 240) % 360, sat);

  const color = chroma.hsv(hue, sat, 1).hex();
  document.getElementById('color-preview').textContent = `Основний колір: ${color}`;
  document.getElementById('color-preview').style.backgroundColor = color;
  layer.batchDraw();
}

function syncMainFromIndicator(indicator) {
  const { hue, sat } = getHueSat(indicator.x(), indicator.y());
  updateIndicatorPosition(main, hue, sat);
  updateAllFromMain();
}

// Слухаємо всі індикатори
main.on('dragmove', updateAllFromMain);
triad1.on('dragmove', () => syncMainFromIndicator(triad1));
triad2.on('dragmove', () => syncMainFromIndicator(triad2));

// Початкове положення (Hue = 0, Sat = 0.7)
updateIndicatorPosition(main, 0, 0.7);
updateAllFromMain();