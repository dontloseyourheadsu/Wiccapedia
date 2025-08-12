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
        color: '#DEB887',
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
        color: '#87CEEB',
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
        color: '#ADD8E6',
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
        color: '#F0E68C',
        type: 'tool'
      },
      // Athame/Wand (bottom left)
      {
        id: 'athame',
        name: 'Athame / Wand',
        description: 'Invocation, Circle Casting',
        meaning: 'Direct energy and cast protective circles. Athame for willpower, wand for invocation and blessing.',
        position: { x: 200, y: 420 },
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
    // Bowl
    p.fill(color);
    p.stroke(0, 0, 0, 100);
    p.strokeWeight(2);
    p.ellipse(x, y, width, height);
    
    // Rim
    p.stroke(0, 0, 0, 150);
    p.strokeWeight(3);
    p.noFill();
    p.ellipse(x, y - 5, width, height * 0.3);
    
    // Contents (water or earth)
    if (color === '#87CEEB') {
      // Water
      p.fill(65, 105, 225, 150);
      p.noStroke();
      p.ellipse(x, y, width * 0.8, height * 0.6);
    } else {
      // Earth/Salt
      p.fill(139, 69, 19);
      p.noStroke();
      p.ellipse(x, y, width * 0.8, height * 0.6);
    }
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
    // Multiple crystals
    const crystalCount = 4;
    for (let i = 0; i < crystalCount; i++) {
      const offsetX = (i - crystalCount/2) * 15;
      const offsetY = p.random(-5, 5);
      const crystalHeight = p.random(15, 25);
      
      p.fill(color);
      p.stroke(0, 0, 0, 100);
      p.strokeWeight(1);
      
      // Crystal shape
      p.beginShape();
      p.vertex(x + offsetX, y + offsetY);
      p.vertex(x + offsetX - 5, y + offsetY + crystalHeight);
      p.vertex(x + offsetX + 5, y + offsetY + crystalHeight);
      p.endShape(p.CLOSE);
      
      // Crystal top
      p.triangle(x + offsetX, y + offsetY - 8, 
                x + offsetX - 3, y + offsetY, 
                x + offsetX + 3, y + offsetY);
    }
  }

  private drawTool(p: p5, x: number, y: number, width: number, height: number, color: string, id: string): void {
    p.fill(color);
    p.stroke(0, 0, 0, 150);
    p.strokeWeight(2);
    
    switch (id) {
      case 'athame':
        // Athame blade
        p.rect(x - width/2, y - height/2, width * 0.7, height, 5);
        // Handle
        p.fill(101, 67, 33);
        p.rect(x + width/2 - width * 0.3, y - height/2, width * 0.3, height, 3);
        break;
      case 'feathers':
        // Draw feathers
        for (let i = 0; i < 3; i++) {
          p.fill(255, 255, 255, 200);
          p.ellipse(x + (i - 1) * 15, y, 12, height);
          p.stroke(200, 200, 200);
          p.line(x + (i - 1) * 15, y - height/2, x + (i - 1) * 15, y + height/2);
        }
        break;
      case 'cauldron':
        // Cauldron
        p.fill(50, 50, 50);
        p.ellipse(x, y, width, height);
        // Handle
        p.noFill();
        p.stroke(50, 50, 50);
        p.strokeWeight(3);
        p.arc(x - width/2 - 5, y, 15, 15, 0, p.PI);
        p.arc(x + width/2 + 5, y, 15, 15, 0, p.PI);
        break;
      default:
        p.rect(x - width/2, y - height/2, width, height, 5);
    }
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
