import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import p5 from 'p5';

interface AltarItem {
  id: string;
  name: string;
  description: string;
  meaning: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  type: 'pentacle' | 'candle' | 'bowl' | 'incense' | 'tool' | 'crystal';
  element?: string;
}

@Component({
  selector: 'app-altar-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './altar-visualization.component.html',
  styleUrl: './altar-visualization.component.css'
})
export class AltarVisualizationComponent implements OnInit, OnDestroy {
  @ViewChild('p5Container', { static: true }) p5Container!: ElementRef;
  @Output() itemClick = new EventEmitter<AltarItem>();
  @Output() itemHover = new EventEmitter<AltarItem | null>();

  private p5Instance: p5 | null = null;
  private altarItems: AltarItem[] = [];
  private hoveredItem: AltarItem | null = null;
  private canvasWidth = 800;
  private canvasHeight = 600;

  public selectedItem = signal<AltarItem | null>(null);
  public showTooltip = signal(false);

  ngOnInit(): void {
    this.setupAltarItems();
    this.initializeP5();
  }

  ngOnDestroy(): void {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  }

  private setupAltarItems(): void {
    this.altarItems = [
      // Central Pentacle
      {
        id: 'pentacle',
        name: 'Pentacle',
        description: 'Protection, 5 Elements',
        meaning: 'Five-pointed star representing Spirit, Water, Fire, Earth, and Air. Provides protection and spiritual harmony.',
        position: { x: 400, y: 300 },
        size: { width: 80, height: 80 },
        color: '#FFD700',
        type: 'pentacle'
      },
      // White Candle (top center)
      {
        id: 'white-candle',
        name: 'White Candle',
        description: 'Purification, Neutral Energy',
        meaning: 'Central white candle for neutralizing energy and purification. Always start rituals with this.',
        position: { x: 400, y: 150 },
        size: { width: 30, height: 60 },
        color: '#FFFFFF',
        type: 'candle',
        element: 'Fire'
      },
      // Earth Bowl (left)
      {
        id: 'earth-bowl',
        name: 'Earth Bowl',
        description: 'Stability, Balance',
        meaning: 'Represents grounding and stability. Contains salt or earth for purification and banishing negativity.',
        position: { x: 250, y: 300 },
        size: { width: 50, height: 30 },
        color: '#8B4513', // Saddle brown - more earthy
        type: 'bowl',
        element: 'Earth'
      },
      // Water Bowl/Chalice (right)
      {
        id: 'water-bowl',
        name: 'Water Bowl / Chalice',
        description: 'Healing, Fertility',
        meaning: 'Represents healing, fertility, and emotional flow. Can be used for blessing rituals.',
        position: { x: 550, y: 300 },
        size: { width: 50, height: 40 },
        color: '#4682B4', // Steel blue - more watery
        type: 'bowl',
        element: 'Water'
      },
      // Incense (front center)
      {
        id: 'incense',
        name: 'Incense',
        description: 'Purification, Atmosphere',
        meaning: 'Sets magical atmosphere and raises energy. Different scents have different purposes (sage, frankincense, etc.).',
        position: { x: 400, y: 450 },
        size: { width: 40, height: 20 },
        color: '#DDA0DD',
        type: 'incense',
        element: 'Air'
      },
      // Crystals & Stones (top left)
      {
        id: 'crystals',
        name: 'Crystals & Stones',
        description: 'Energy Amplification',
        meaning: 'Amplify magical energy and provide specific properties based on crystal type (love, healing, protection).',
        position: { x: 200, y: 180 },
        size: { width: 60, height: 40 },
        color: '#BB9FFF', // Light purple - more mystical
        type: 'crystal'
      },
      // Feathers (top right)
      {
        id: 'feathers',
        name: 'Feathers',
        description: 'Angelic Connection',
        meaning: 'Connect with angelic energies and provide spiritual guidance. White feathers are best for purity.',
        position: { x: 600, y: 180 },
        size: { width: 50, height: 30 },
        color: '#FFFFFF',
        type: 'tool'
      },
      // Athame/Wand (bottom left)
      {
        id: 'athame',
        name: 'Athame / Wand',
        description: 'Invocation, Circle Casting',
        meaning: 'Direct energy and cast protective circles. Athame for willpower, wand for invocation and blessing.',
        position: { x: 200, y: 440 }, // Moved down to be more centered on table
        size: { width: 70, height: 25 },
        color: '#D3D3D3',
        type: 'tool'
      },
      // Cauldron/Bell/Broom (bottom right)
      {
        id: 'cauldron',
        name: 'Cauldron / Bell / Broom',
        description: 'Brewing, Banishing, Cleansing',
        meaning: 'Cauldron for transformation and brewing, bell for clearing energy, broom for cleansing negativity.',
        position: { x: 600, y: 420 },
        size: { width: 60, height: 45 },
        color: '#C0C0C0',
        type: 'tool'
      }
    ];
  }

  private initializeP5(): void {
    const sketch = (p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(this.canvasWidth, this.canvasHeight);
        canvas.parent(this.p5Container.nativeElement);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Arial');
      };

      p.draw = () => {
        // Dark mystical background with gradient
        this.drawBackground(p);
        
        // Draw altar table base
        this.drawAltarTable(p);
        
        // Draw altar cloth
        this.drawAltarCloth(p);
        
        // Draw all altar items
        this.drawAltarItems(p);
        
        // Draw connecting energy lines
        this.drawEnergyLines(p);
        
        // Draw hover effects
        if (this.hoveredItem) {
          this.drawHoverEffect(p, this.hoveredItem);
        }
      };

      p.mouseMoved = () => {
        this.checkHover(p.mouseX, p.mouseY);
      };

      p.mousePressed = () => {
        this.checkClick(p.mouseX, p.mouseY);
      };
    };

    this.p5Instance = new p5(sketch);
  }

  private drawBackground(p: p5): void {
    // Create mystical gradient background
    for (let i = 0; i <= this.canvasHeight; i++) {
      const inter = p.map(i, 0, this.canvasHeight, 0, 1);
      const c = p.lerpColor(p.color(25, 25, 40), p.color(45, 25, 60), inter);
      p.stroke(c);
      p.line(0, i, this.canvasWidth, i);
    }
    
    // Add mystical stars
    p.fill(255, 255, 255, 150);
    p.noStroke();
    for (let i = 0; i < 20; i++) {
      const x = p.random(this.canvasWidth);
      const y = p.random(this.canvasHeight * 0.3);
      p.circle(x, y, p.random(1, 3));
    }
  }

  private drawAltarTable(p: p5): void {
    // Draw altar table base
    p.fill(101, 67, 33);
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.rect(100, 380, 600, 180, 10);
    
    // Table legs
    p.fill(80, 50, 20);
    p.rect(120, 540, 20, 40);
    p.rect(660, 540, 20, 40);
  }

  private drawAltarCloth(p: p5): void {
    // Draw altar cloth (deep purple)
    p.fill(75, 0, 130, 200);
    p.stroke(138, 43, 226);
    p.strokeWeight(2);
    p.rect(90, 370, 620, 200, 15);
    
    // Add mystical patterns on cloth
    p.stroke(138, 43, 226, 100);
    p.strokeWeight(1);
    p.noFill();
    
    // Draw decorative border
    for (let i = 0; i < 3; i++) {
      p.rect(95 + i * 3, 375 + i * 3, 610 - i * 6, 190 - i * 6, 12);
    }
  }

  private drawAltarItems(p: p5): void {
    this.altarItems.forEach(item => {
      p.push();
      
      // Glow effect for hovered item
      if (this.hoveredItem === item) {
        p.drawingContext.shadowColor = item.color;
        p.drawingContext.shadowBlur = 20;
      }
      
      this.drawItem(p, item);
      
      p.pop();
    });
  }

  private drawItem(p: p5, item: AltarItem): void {
    const { x, y } = item.position;
    const { width, height } = item.size;

    switch (item.type) {
      case 'pentacle':
        this.drawPentacle(p, x, y, width);
        break;
      case 'candle':
        this.drawCandle(p, x, y, width, height, item.color);
        break;
      case 'bowl':
        this.drawBowl(p, x, y, width, height, item.color);
        break;
      case 'incense':
        this.drawIncense(p, x, y, width, height);
        break;
      case 'crystal':
        this.drawCrystals(p, x, y, width, height, item.color);
        break;
      case 'tool':
        this.drawTool(p, x, y, width, height, item.color, item.id);
        break;
    }

    // Draw label
    if (this.hoveredItem === item) {
      this.drawLabel(p, item);
    }
  }

  private drawPentacle(p: p5, x: number, y: number, size: number): void {
    p.stroke('#FFD700');
    p.strokeWeight(3);
    p.noFill();
    
    // Draw outer circle
    p.circle(x, y, size);
    
    // Draw pentagram
    const radius = size / 2.5;
    const points: Array<{x: number, y: number}> = [];
    
    for (let i = 0; i < 5; i++) {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / 5);
      points.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius
      });
    }
    
    // Connect every second point to create pentagram
    p.stroke('#FFD700');
    p.strokeWeight(2);
    for (let i = 0; i < 5; i++) {
      const start = points[i];
      const end = points[(i + 2) % 5];
      p.line(start.x, start.y, end.x, end.y);
    }
    
    // Add element labels
    const elementNames = ['Spirit', 'Water', 'Fire', 'Earth', 'Air'];
    const elementColors = ['#9D4EDD', '#0077BE', '#FF6B35', '#2D5016', '#FFD23F'];
    
    p.textSize(8);
    for (let i = 0; i < 5; i++) {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / 5);
      const labelX = x + Math.cos(angle) * (radius + 15);
      const labelY = y + Math.sin(angle) * (radius + 15);
      
      p.fill(elementColors[i]);
      p.noStroke();
      p.text(elementNames[i], labelX, labelY);
    }
  }

  private drawCandle(p: p5, x: number, y: number, width: number, height: number, color: string): void {
    // Candle base
    p.fill(color);
    p.stroke(200);
    p.strokeWeight(1);
    p.rect(x - width/2, y - height/2, width, height, 5);
    
    // Flame
    p.fill(255, 200, 0);
    p.noStroke();
    p.ellipse(x, y - height/2 - 8, 8, 15);
    
    // Inner flame
    p.fill(255, 255, 100);
    p.ellipse(x, y - height/2 - 6, 4, 8);
    
    // Wax drip
    p.fill(color);
    p.ellipse(x + 5, y + height/2, 6, 8);
  }

  private drawBowl(p: p5, x: number, y: number, width: number, height: number, color: string): void {
    p.push();
    
    // Animated floating effect
    const floatOffset = Math.sin(p.frameCount * 0.05) * 2;
    p.translate(0, floatOffset);
    
    // Draw gradient bowl based on your HTML example
    const radius = width / 2;
    
    // Create gradient for the bowl (black to dark gray)
    for (let r = radius; r > 0; r--) {
      const inter = p.map(r, 0, radius, 0, 1);
      const c = p.lerpColor(p.color(20), p.color(80), inter); // Black to dark gray
      p.stroke(c);
      p.strokeWeight(2);
      // Draw semicircle (bowl shape)
      p.arc(x, y, r * 2, r * 2, 0, Math.PI);
    }
    
    // Remove stroke for semicircles
    p.noStroke();
    
    // Set circle color based on element type
    if (color === '#4682B4') {
      // Water bowl - blue circles
      p.fill(30, 144, 255);
    } else {
      // Earth bowl - brown circles  
      p.fill(139, 69, 19);
    }
    
    // Define sizes: small, big, medium (in that order)
    const smallSize = radius * 0.15;
    const bigSize = radius * 0.35;
    const mediumSize = radius * 0.25;
    
    // Calculate positions to cover 90% of bowl width without gaps
    const bowlWidth = radius * 2 * 0.9; // 90% of bowl width
    const startX = x - bowlWidth / 2;
    
    // Define width proportions: small=1, big=3, medium=2 (total=6 parts)
    const totalParts = 1 + 3 + 2; // 6 parts total
    const partWidth = bowlWidth / totalParts;
    
    // Calculate widths for each semicircle
    const smallWidth = partWidth * 1;
    const bigWidth = partWidth * 3;
    const mediumWidth = partWidth * 2;
    
    // Heights remain proportional to make them visually different sizes
    const smallHeight = radius * 0.15;
    const bigHeight = radius * 0.35;
    const mediumHeight = radius * 0.25;
    
    // Position semicircles at the bowl's top edge (y level)
    const ballHeight = y;
    
    // Draw three semicircles stretched horizontally without gaps
    // Small semicircle (left) - stretched to smallWidth
    p.push();
    p.translate(startX + smallWidth/2, ballHeight);
    p.scale(smallWidth/smallHeight, 1); // Stretch horizontally
    p.arc(0, 0, smallHeight, smallHeight, Math.PI, p.TWO_PI);
    p.pop();
    
    // Big semicircle (center) - stretched to bigWidth
    p.push();
    p.translate(startX + smallWidth + bigWidth/2, ballHeight);
    p.scale(bigWidth/bigHeight, 1); // Stretch horizontally
    p.arc(0, 0, bigHeight, bigHeight, Math.PI, p.TWO_PI);
    p.pop();
    
    // Medium semicircle (right) - stretched to mediumWidth
    p.push();
    p.translate(startX + smallWidth + bigWidth + mediumWidth/2, ballHeight);
    p.scale(mediumWidth/mediumHeight, 1); // Stretch horizontally
    p.arc(0, 0, mediumHeight, mediumHeight, Math.PI, p.TWO_PI);
    p.pop();
    
    // Add magical sparkles for extra mystical effect
    p.fill(255, 255, 255, 150);
    p.noStroke();
    for (let i = 0; i < 3; i++) {
      const sparkleX = x + p.random(-radius * 0.7, radius * 0.7);
      const sparkleY = y + p.random(-radius * 0.3, radius * 0.1);
      const twinkle = Math.sin(p.frameCount * 0.1 + i) * 0.5 + 0.5;
      p.circle(sparkleX, sparkleY, 1 + twinkle * 2);
    }
    
    p.pop();
  }

  private drawIncense(p: p5, x: number, y: number, width: number, height: number): void {
    // Incense holder
    p.fill(101, 67, 33);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(x - width/2, y, width, height, 3);
    
    // Incense sticks
    p.stroke(139, 69, 19);
    p.strokeWeight(2);
    p.line(x - 10, y, x - 5, y - 20);
    p.line(x, y, x + 5, y - 25);
    p.line(x + 10, y, x + 15, y - 18);
    
    // Smoke
    p.stroke(200, 200, 200, 150);
    p.strokeWeight(2);
    p.noFill();
    for (let i = 0; i < 3; i++) {
      const smokeX = x + i * 7 - 7;
      p.beginShape();
      for (let j = 0; j < 8; j++) {
        const waveX = smokeX + Math.sin(j * 0.5 + p.frameCount * 0.1) * 3;
        const waveY = y - 20 - j * 8;
        p.vertex(waveX, waveY);
      }
      p.endShape();
    }
  }

  private drawCrystals(p: p5, x: number, y: number, width: number, height: number, color: string): void {
    p.push();
    
    // Magical glow around crystal cluster
    p.drawingContext.shadowColor = color;
    p.drawingContext.shadowBlur = 15;
    
    // Based on the Processing sketch - create complex crystal cluster
    const scale = 0.3; // Scale down to fit the altar space
    p.translate(x - width/2, y - height/2);
    p.scale(scale);
    
    p.stroke(0, 0, 0);
    p.fill(color);
    p.strokeWeight(2);
    
    // Largest crystal on the ground, to the left
    p.strokeWeight(3);
    p.beginShape();
    p.vertex(35, 275);
    p.vertex(65, 250);
    p.vertex(100, 265);
    p.vertex(125, 285);
    p.vertex(75, 300);
    p.vertex(40, 290);
    p.endShape(p.CLOSE);
    
    // Internal crystal structure lines
    p.strokeWeight(1);
    p.stroke(0, 0, 0, 150);
    p.line(55, 275, 65, 250);
    p.line(55, 275, 75, 300);
    p.line(55, 275, 40, 290);
    p.line(55, 275, 95, 275);
    p.line(95, 275, 125, 285);
    
    // Largest vertical crystal
    p.strokeWeight(3);
    p.stroke(0, 0, 0);
    p.beginShape();
    p.vertex(90, 260);
    p.vertex(30, 50);
    p.vertex(50, 0);
    p.vertex(80, 10);
    p.vertex(110, 70);
    p.vertex(125, 200);
    p.endShape(p.CLOSE);
    
    // Internal structure
    p.strokeWeight(1);
    p.stroke(0, 0, 0, 150);
    p.line(60, 40, 30, 50);
    p.line(60, 40, 50, 0);
    p.line(60, 40, 80, 10);
    p.line(60, 40, 50, 110);
    p.line(105, 65, 65, 165);
    
    // Left crystal
    p.strokeWeight(3);
    p.stroke(0, 0, 0);
    p.beginShape();
    p.vertex(55, 255);
    p.vertex(10, 190);
    p.vertex(0, 140);
    p.vertex(15, 115);
    p.vertex(57, 150);
    p.vertex(90, 260);
    p.vertex(65, 250);
    p.endShape(p.CLOSE);
    
    // Internal structure
    p.strokeWeight(1);
    p.stroke(0, 0, 0, 150);
    p.line(20, 150, 10, 190);
    p.line(20, 150, 15, 115);
    p.line(40, 175, 42, 237);
    p.line(40, 175, 65, 165);
    
    // Small crystal cluster on the right
    p.strokeWeight(3);
    p.stroke(0, 0, 0);
    p.beginShape();
    p.vertex(150, 100);
    p.vertex(200, 85);
    p.vertex(195, 135);
    p.vertex(145, 200);
    p.vertex(135, 185);
    p.vertex(125, 200);
    p.vertex(120, 160);
    p.endShape(p.CLOSE);
    
    // Add magical sparkles around crystals
    p.drawingContext.shadowBlur = 0;
    p.fill(255, 255, 255, 200);
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      const sparkleX = p.random(0, 200);
      const sparkleY = p.random(0, 250);
      const twinkle = Math.sin(p.frameCount * 0.1 + i) * 0.5 + 0.5;
      p.circle(sparkleX, sparkleY, 1 + twinkle * 3);
    }
    
    p.pop();
  }

  private drawTool(p: p5, x: number, y: number, width: number, height: number, color: string, id: string): void {
    p.fill(color);
    p.stroke(0, 0, 0, 150);
    p.strokeWeight(2);
    
    switch (id) {
      case 'athame':
        // Draw detailed magical wand based on your HTML example
        this.drawMagicalWand(p, x, y, width, height);
        break;
      case 'feathers':
        // Draw detailed white feathers based on Processing sketch
        this.drawDetailedFeathers(p, x, y, width, height);
        break;
      case 'cauldron':
        // Draw detailed cauldron with base based on your HTML example
        this.drawDetailedCauldron(p, x, y, width, height);
        break;
      default:
        p.rect(x - width/2, y - height/2, width, height, 5);
    }
  }

  private drawDetailedFeathers(p: p5, x: number, y: number, width: number, height: number): void {
    p.push();
    
    // Draw multiple feathers with detailed structure based on Processing sketch
    const featherCount = 3;
    for (let f = 0; f < featherCount; f++) {
      const offsetX = (f - 1) * 16;
      const featherX = x + offsetX;
      const featherLength = height * 0.8;
      const featherWidth = width * 0.15;
      
      // Feather rotation for natural look
      const rotation = (f - 1) * 0.1;
      
      p.push();
      p.translate(featherX, y);
      p.rotate(rotation);
      
      // Draw feather shadow
      p.fill(0, 0, 0, 30);
      p.noStroke();
      p.ellipse(2, 2, featherWidth + 2, featherLength + 2);
      
      // Main feather shaft (rachis)
      p.stroke(220, 220, 220);
      p.strokeWeight(2);
      p.line(0, -featherLength/2, 0, featherLength/2);
      
      // Draw barbs (feather fibers) with natural curvature
      p.strokeWeight(1);
      const barbCount = 20;
      
      for (let i = 0; i < barbCount; i++) {
        const t = i / (barbCount - 1);
        const barbY = p.map(t, 0, 1, -featherLength/2 + 5, featherLength/2 - 5);
        
        // Barb length varies along the feather
        let barbLength = featherWidth * (1 - Math.abs(t - 0.5) * 2);
        if (t < 0.2) barbLength *= t / 0.2; // Taper at top
        if (t > 0.8) barbLength *= (1 - t) / 0.2; // Taper at bottom
        
        // Barb color - pure white with slight transparency
        p.stroke(255, 255, 255, 200 - i * 3);
        
        // Left side barbs
        p.line(0, barbY, -barbLength/2, barbY + p.random(-2, 2));
        // Right side barbs  
        p.line(0, barbY, barbLength/2, barbY + p.random(-2, 2));
        
        // Add some barb detail lines for texture
        if (i % 3 === 0) {
          p.stroke(255, 255, 255, 100);
          p.strokeWeight(0.5);
          // Left barb details
          for (let j = 0; j < 5; j++) {
            const detailX = p.map(j, 0, 4, 0, -barbLength/2);
            p.line(detailX, barbY, detailX - 1, barbY + p.random(-1, 1));
          }
          // Right barb details
          for (let j = 0; j < 5; j++) {
            const detailX = p.map(j, 0, 4, 0, barbLength/2);
            p.line(detailX, barbY, detailX + 1, barbY + p.random(-1, 1));
          }
          p.strokeWeight(1);
        }
      }
      
      // Add subtle glow effect
      p.drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
      p.drawingContext.shadowBlur = 8;
      p.stroke(255, 255, 255, 150);
      p.strokeWeight(1);
      p.line(0, -featherLength/2, 0, featherLength/2);
      p.drawingContext.shadowBlur = 0;
      
      // Feather tip
      p.fill(255, 255, 255, 220);
      p.noStroke();
      p.ellipse(0, -featherLength/2, 3, 6);
      
      p.pop();
    }
    
    // Add magical sparkles around feathers
    p.fill(255, 255, 255, 150);
    p.noStroke();
    for (let i = 0; i < 6; i++) {
      const sparkleX = x + p.random(-width/2, width/2);
      const sparkleY = y + p.random(-height/2, height/2);
      const twinkle = Math.sin(p.frameCount * 0.08 + i) * 0.5 + 0.5;
      p.circle(sparkleX, sparkleY, 1 + twinkle * 2);
    }
    
    p.pop();
  }

  private drawMagicalWand(p: p5, x: number, y: number, width: number, height: number): void {
    p.push();
    
    // Position and angle the wand (diagonal pointing up-right)
    const wandLength = width * 0.9;
    const wandAngle = -Math.PI / 6; // 30 degrees up
    
    p.translate(x, y);
    p.rotate(wandAngle);
    
    // Draw wand stick with wood texture
    this.drawWandStick(p, wandLength, height * 0.3);
    
    // Draw handle details
    this.drawWandHandle(p, wandLength);
    
    p.pop();
    
    // Calculate crystal position (at the tip with proper separation)
    const crystalOffset = wandLength * 0.85 + 15; // Add extra separation from stick end
    const crystalX = x + Math.cos(wandAngle) * crystalOffset;
    const crystalY = y + Math.sin(wandAngle) * crystalOffset;
    
    // Draw crystal at the tip
    this.drawWandCrystal(p, crystalX, crystalY);
    
    // Draw magical aura around crystal (positioned away from stick)
    this.drawWandAura(p, crystalX, crystalY);
  }

  private drawWandStick(p: p5, wandLength: number, thickness: number): void {
    // Main stick with gradient (wood-like texture)
    // Only draw up to 80% of length to leave space for crystal
    const stickEnd = wandLength * 0.8;
    
    for (let i = 0; i < stickEnd; i += 2) {
      const t = i / stickEnd;
      const currentThickness = p.lerp(thickness, thickness * 0.6, t); // Tapers toward tip
      
      // Wood color gradient with natural variation
      const r = p.lerp(101, 139, Math.sin(t * 10) * 0.3 + 0.7);
      const g = p.lerp(67, 95, Math.sin(t * 10) * 0.3 + 0.7);
      const b = p.lerp(33, 51, Math.sin(t * 10) * 0.3 + 0.7);
      
      p.stroke(r, g, b);
      p.strokeWeight(currentThickness);
      const naturalCurve = Math.sin(i * 0.05) * 0.5; // Slight natural curve
      p.point(i, naturalCurve);
    }
    
    // Wood grain lines for texture
    p.stroke(80, 50, 25, 150);
    p.strokeWeight(1);
    for (let i = 0; i < 3; i++) {
      const yOffset = (i - 1) * thickness * 0.3;
      p.line(wandLength * 0.1, yOffset, stickEnd * 0.9, yOffset * 0.8);
    }
  }

  private drawWandHandle(p: p5, wandLength: number): void {
    const handleStart = wandLength * 0.1;
    const handleLength = wandLength * 0.3;
    
    // Leather wrap sections
    p.fill(61, 43, 31);
    p.noStroke();
    
    for (let i = 0; i < 6; i++) {
      const x = handleStart + i * (handleLength / 6);
      const wrapWidth = 8;
      const wrapHeight = 12;
      p.ellipse(x, 0, wrapWidth, wrapHeight);
    }
    
    // Metal bands for detail
    p.fill(120, 120, 140);
    p.rect(handleStart + 10, -3, 4, 6);
    p.rect(handleStart + handleLength - 10, -3, 4, 6);
    
    // End cap
    p.fill(80, 70, 60);
    p.ellipse(handleStart - 5, 0, 10, 10);
  }

  private drawWandCrystal(p: p5, x: number, y: number): void {
    p.push();
    p.translate(x, y);
    
    // Crystal core with mystical colors
    p.fill(200, 180, 255, 200);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(1.5);
    
    // Main crystal shape (diamond-like)
    p.beginShape();
    p.vertex(0, -12);   // top point
    p.vertex(5, -5);    // top right
    p.vertex(7, 5);     // bottom right
    p.vertex(0, 15);    // bottom point
    p.vertex(-7, 5);    // bottom left
    p.vertex(-5, -5);   // top left
    p.endShape(p.CLOSE);
    
    // Crystal facets for depth
    p.fill(255, 240, 255, 100);
    p.triangle(0, -12, 5, -5, 0, 0);
    p.triangle(0, -12, -5, -5, 0, 0);
    
    p.fill(180, 160, 255, 80);
    p.triangle(0, 0, 5, -5, 7, 5);
    p.triangle(0, 0, -5, -5, -7, 5);
    
    // Crystal highlights
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(0.8);
    p.line(-1, -9, 1, -6);
    p.line(-3, -3, -1, 0);
    p.line(1, 0, 3, -3);
    
    p.pop();
  }

  private drawWandAura(p: p5, x: number, y: number): void {
    p.push();
    p.translate(x, y);
    
    // Outer magical glow - increased radius for better separation
    for (let r = 50; r > 0; r -= 6) {
      const alpha = p.map(r, 0, 50, 35, 0);
      p.fill(200, 180, 255, alpha);
      p.noStroke();
      p.ellipse(0, 0, r, r);
    }
    
    // Magical particles circling the crystal - larger orbit
    const time = p.frameCount * 0.02;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const distance = 25 + Math.sin(time + i) * 10; // Increased distance
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      
      const size = 2 + Math.sin(time * 2 + i) * 1;
      const alpha = 150 + Math.sin(time * 3 + i) * 100;
      
      p.fill(255, 200, 255, alpha);
      p.noStroke();
      p.ellipse(px, py, size, size);
    }
    
    // Energy wisps around crystal - larger radius
    p.stroke(180, 160, 255, 80);
    p.strokeWeight(1.5);
    p.noFill();
    for (let i = 0; i < 2; i++) {
      const offset = i * Math.PI + time;
      p.beginShape();
      for (let t = 0; t < Math.PI * 2; t += 0.3) {
        const r = 20 + Math.sin(t * 2 + offset) * 8; // Increased radius
        const px = Math.cos(t + offset) * r;
        const py = Math.sin(t + offset) * r;
        p.vertex(px, py);
      }
      p.endShape();
    }
    
    p.pop();
  }

  private drawDetailedCauldron(p: p5, x: number, y: number, width: number, height: number): void {
    p.push();
    
    // Scale the cauldron to fit the allocated space
    const radius = Math.min(width, height) * 0.4;
    
    // Draw the bowl with gradient (black to dark gray)
    for (let r = radius; r > 0; r--) {
      const inter = p.map(r, 0, radius, 0, 1);
      const c = p.lerpColor(p.color(20), p.color(80), inter); // Black to dark gray
      p.stroke(c);
      p.strokeWeight(2);
      // Draw semicircle (bowl shape)
      p.arc(x, y, r * 2, r * 2, 0, Math.PI);
    }
    
    // Draw trapezoid base at the bottom of the bowl
    p.fill(60, 60, 60); // Dark gray for base
    p.noStroke();
    
    const baseHeight = 20;
    const baseTopWidth = radius * 1.6; // Width at bowl bottom
    const baseBottomWidth = radius * 2.0;
    const baseY = y + radius; // Start at bottom of bowl
    
    // Draw trapezoid base
    p.beginShape();
    p.vertex(x - baseTopWidth/2, baseY); // Top left
    p.vertex(x + baseTopWidth/2, baseY); // Top right
    p.vertex(x + baseBottomWidth/2, baseY + baseHeight); // Bottom right
    p.vertex(x - baseBottomWidth/2, baseY + baseHeight); // Bottom left
    p.endShape(p.CLOSE);
    
    // Draw oval cover (line-like with circular corners)
    p.fill(100, 100, 100); // Gray for cover
    p.noStroke();
    
    // Start at right top of bowl semicircle
    const startX = x + radius;
    const startY = y;
    
    // Calculate end position with 45 degree angle and 110% width
    const coverLength = radius * 2 * 1.1; // 110% of bowl width
    const angle45 = p.radians(-45); // 45 degree lift (negative for upward)
    const endX = startX + coverLength * Math.cos(angle45);
    const endY = startY + coverLength * Math.sin(angle45);
    
    // Draw very thin oval (line-like with circular corners)
    p.push();
    p.translate((startX + endX) / 2, (startY + endY) / 2);
    p.rotate(angle45);
    p.ellipse(0, 0, coverLength, 6); // Very thin height to look like a line
    p.pop();
    
    // Add traditional cauldron handles
    p.noFill();
    p.stroke(80, 80, 80);
    p.strokeWeight(3);
    
    // Left handle
    p.arc(x - radius - 8, y - radius * 0.3, 16, 20, 0, Math.PI);
    // Right handle
    p.arc(x + radius + 8, y - radius * 0.3, 16, 20, 0, Math.PI);
    
    // Add magical steam/smoke effect
    p.stroke(200, 200, 200, 100);
    p.strokeWeight(2);
    p.noFill();
    
    for (let i = 0; i < 3; i++) {
      const smokeX = x + (i - 1) * radius * 0.3;
      p.beginShape();
      for (let j = 0; j < 6; j++) {
        const waveX = smokeX + Math.sin(j * 0.8 + p.frameCount * 0.1 + i) * 4;
        const waveY = y - radius - j * 12;
        p.vertex(waveX, waveY);
      }
      p.endShape();
    }
    
    // Add mystical glow around the cauldron
    p.fill(100, 50, 150, 30);
    p.noStroke();
    p.ellipse(x, y, radius * 3, radius * 2);
    
    p.pop();
  }

  private drawLabel(p: p5, item: AltarItem): void {
    const { x, y } = item.position;
    
    // Background
    p.fill(0, 0, 0, 180);
    p.stroke(255, 215, 0);
    p.strokeWeight(1);
    p.rect(x - 80, y + 50, 160, 40, 5);
    
    // Text
    p.fill(255, 215, 0);
    p.noStroke();
    p.textSize(12);
    p.text(item.name, x, y + 65);
    p.textSize(9);
    p.text(item.description, x, y + 78);
  }

  private drawEnergyLines(p: p5): void {
    // Draw subtle energy connections between elements
    p.stroke(255, 215, 0, 50);
    p.strokeWeight(1);
    
    const pentacle = this.altarItems.find(item => item.id === 'pentacle');
    if (!pentacle) return;
    
    // Connect pentacle to main elements
    const elements = ['earth-bowl', 'water-bowl', 'white-candle', 'incense'];
    elements.forEach(elementId => {
      const element = this.altarItems.find(item => item.id === elementId);
      if (element) {
        p.line(pentacle.position.x, pentacle.position.y, 
               element.position.x, element.position.y);
      }
    });
  }

  private drawHoverEffect(p: p5, item: AltarItem): void {
    const { x, y } = item.position;
    const { width, height } = item.size;
    
    // Pulsing glow
    const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.stroke(255, 215, 0, 100 + pulse * 100);
    p.strokeWeight(3);
    p.noFill();
    p.rect(x - width/2 - 10, y - height/2 - 10, width + 20, height + 20, 10);
  }

  private checkHover(mouseX: number, mouseY: number): void {
    let foundItem: AltarItem | null = null;
    
    for (const item of this.altarItems) {
      const { x, y } = item.position;
      const { width, height } = item.size;
      
      if (mouseX >= x - width/2 && mouseX <= x + width/2 &&
          mouseY >= y - height/2 && mouseY <= y + height/2) {
        foundItem = item;
        break;
      }
    }
    
    if (foundItem !== this.hoveredItem) {
      this.hoveredItem = foundItem;
      this.itemHover.emit(foundItem);
      this.showTooltip.set(!!foundItem);
    }
  }

  private checkClick(mouseX: number, mouseY: number): void {
    for (const item of this.altarItems) {
      const { x, y } = item.position;
      const { width, height } = item.size;
      
      if (mouseX >= x - width/2 && mouseX <= x + width/2 &&
          mouseY >= y - height/2 && mouseY <= y + height/2) {
        this.selectedItem.set(item);
        this.itemClick.emit(item);
        break;
      }
    }
  }

  // Public methods for parent component
  public getHoveredItem(): AltarItem | null {
    return this.hoveredItem;
  }

  public getSelectedItem(): AltarItem | null {
    return this.selectedItem();
  }
}
