import { Component, OnInit, OnDestroy, Output, EventEmitter, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import p5 from 'p5';

interface Star {
  x: number;
  y: number;
  size: number;
  name: string;
  page: string;
  brightness: number;
  twinkle: number;
  color: { r: number; g: number; b: number };
}

interface Connection {
  from: Star;
  to: Star;
  opacity: number;
}

interface NavigationPage {
  name: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-constellation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './constellation.component.html',
  styleUrl: './constellation.component.css'
})
export class ConstellationComponent implements OnInit, OnDestroy {
  @ViewChild('p5Container', { static: true }) p5Container!: ElementRef;
  @Output() navigateTo = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private p5Instance: p5 | null = null;
  private stars: Star[] = [];
  private backgroundStars: any[] = [];
  private connections: Connection[] = [];
  private shootingStars: any[] = [];
  private time = 0;
  public hoveredStar: Star | null = null;
  private isClosing = signal(false);

  // Navigation pages configuration
  private pages: NavigationPage[] = [
    {
      name: 'gems',
      title: 'Mystic Gem Vault',
      subtitle: 'Descubre la magia de las gemas místicas',
      icon: 'fas fa-gem',
      description: 'Explora nuestra colección de gemas místicas y sus propiedades mágicas'
    },
    {
      name: 'altar',
      title: 'Pentagram Altar',
      subtitle: 'Invoca los poderes de la naturaleza',
      icon: 'fas fa-star',
      description: 'Descubre los rituales y ceremonias del altar pentagonal'
    },
    {
      name: 'runes',
      title: 'Runes',
      subtitle: 'Explore the ancient alphabets of the North',
      icon: 'fas fa-rune',
      description: 'Descubre los alfabetos rúnicos: Elder Futhark, Younger Futhark y Anglo-Saxon Futhorc'
    }
  ];

  ngOnInit(): void {
    this.initializeP5();
  }

  ngOnDestroy(): void {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  }

  private initializeP5(): void {
    const sketch = (p: p5) => {
      let canvas: any;

      p.setup = () => {
        canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        this.setupStars(p);
        this.setupConnections();
        this.setupBackgroundStars(p);
        this.setupShootingStars(p);
      };

      p.draw = () => {
        if (this.isClosing()) {
          this.drawClosingAnimation(p);
          return;
        }

        this.drawGradientBackground(p);
        this.time += 0.02;

        this.drawBackgroundStars(p);
        this.drawShootingStars(p);
        this.drawConnections(p);
        this.drawConstellationStars(p);
        this.drawTitle(p);
        this.drawInstructions(p);
      };

      p.mousePressed = () => {
        this.handleMousePressed(p);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        this.recalculateStarPositions(p);
      };
    };

    this.p5Instance = new p5(sketch, this.p5Container.nativeElement);
  }

  private setupStars(p: p5): void {
    // Create constellation pattern - three-star navigation
    const constellationPattern = [
      { x: 250, y: 250, name: 'Gems Portal', page: 'gems', size: 15 },
      { x: 400, y: 180, name: 'Altar Portal', page: 'altar', size: 15 },
      { x: 550, y: 250, name: 'Runes Portal', page: 'runes', size: 15 }
    ];

    // Scale constellation to fit screen
    const scaleX = p.width * 0.6 / 600;
    const scaleY = p.height * 0.5 / 400;
    const offsetX = p.width * 0.2;
    const offsetY = p.height * 0.3;

    constellationPattern.forEach((star) => {
      this.stars.push({
        x: star.x * scaleX + offsetX,
        y: star.y * scaleY + offsetY,
        size: star.size,
        name: star.name,
        page: star.page,
        brightness: p.random(0.8, 1),
        twinkle: p.random(p.TWO_PI),
        color: this.getStarColor(star.page)
      });
    });
  }

  private setupConnections(): void {
    // Connect all portal stars in a triangle
    if (this.stars.length === 3) {
      this.connections.push(
        { from: this.stars[0], to: this.stars[1], opacity: 0.6 },
        { from: this.stars[1], to: this.stars[2], opacity: 0.6 },
        { from: this.stars[2], to: this.stars[0], opacity: 0.6 }
      );
    }
  }

  private setupBackgroundStars(p: p5): void {
    for (let i = 0; i < 80; i++) {
      this.backgroundStars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(0.5, 2),
        brightness: p.random(0.3, 0.8),
        twinkle: p.random(p.TWO_PI)
      });
    }
  }

  private setupShootingStars(p: p5): void {
    for (let i = 0; i < 2; i++) {
      this.shootingStars.push({
        x: p.random(-100, -50),
        y: p.random(p.height * 0.3),
        vx: p.random(3, 6),
        vy: p.random(1, 3),
        life: 0,
        maxLife: p.random(60, 120)
      });
    }
  }

  private drawGradientBackground(p: p5): void {
    for (let i = 0; i <= p.height; i++) {
      let inter = p.map(i, 0, p.height, 0, 1);
      let c = p.lerpColor(p.color(15, 10, 31), p.color(9, 10, 15), inter);
      p.stroke(c);
      p.line(0, i, p.width, i);
    }
  }

  private drawBackgroundStars(p: p5): void {
    this.backgroundStars.forEach(star => {
      let brightness = star.brightness * (0.5 + 0.5 * p.sin(this.time * 2 + star.twinkle));
      p.fill(255, 255, 255, brightness * 255);
      p.noStroke();
      p.ellipse(star.x, star.y, star.size);
    });
  }

  private drawShootingStars(p: p5): void {
    this.shootingStars.forEach(star => {
      if (star.life < star.maxLife) {
        let alpha = p.map(star.life, 0, star.maxLife, 255, 0);
        
        // Draw tail
        p.stroke(255, 215, 0, alpha * 0.3);
        p.strokeWeight(2);
        p.line(star.x, star.y, star.x - star.vx * 10, star.y - star.vy * 10);
        
        // Draw head
        p.fill(255, 215, 0, alpha);
        p.noStroke();
        p.ellipse(star.x, star.y, 3);
        
        star.x += star.vx;
        star.y += star.vy;
        star.life++;
      } else {
        // Reset shooting star
        star.x = p.random(-100, -50);
        star.y = p.random(p.height * 0.3);
        star.life = 0;
        star.maxLife = p.random(60, 120);
      }
    });
  }

  private drawConnections(p: p5): void {
    this.connections.forEach(conn => {
      let opacity = conn.opacity * (0.7 + 0.3 * p.sin(this.time));
      p.stroke(255, 215, 0, opacity * 255);
      p.strokeWeight(2);
      p.line(conn.from.x, conn.from.y, conn.to.x, conn.to.y);
    });
  }

  private drawConstellationStars(p: p5): void {
    this.hoveredStar = null;
    
    this.stars.forEach(star => {
      let twinkle = 0.8 + 0.2 * p.sin(this.time * 3 + star.twinkle);
      let size = star.size * twinkle;
      
      // Check if mouse is over star
      let d = p.dist(p.mouseX, p.mouseY, star.x, star.y);
      let isHovered = d < star.size + 10;
      
      if (isHovered) {
        this.hoveredStar = star;
        size *= 1.4;
      }
      
      // Draw star glow
      p.fill(star.color.r, star.color.g, star.color.b, 30);
      p.noStroke();
      p.ellipse(star.x, star.y, size * 4);
      
      // Draw star
      p.fill(star.color.r, star.color.g, star.color.b, 255 * twinkle);
      p.ellipse(star.x, star.y, size);
      
      // Draw additional glow ring on hover
      if (isHovered) {
        p.stroke(star.color.r, star.color.g, star.color.b, 100);
        p.strokeWeight(2);
        p.noFill();
        p.ellipse(star.x, star.y, size * 2);
      }
      
      // Draw star name label below the star (avoiding pulsing area)
      p.fill(255, 215, 0, 180);
      p.textAlign(p.CENTER);
      p.textSize(16);
      p.textStyle(p.BOLD);
      // Position label below the star with extra spacing to avoid pulsing glow
      let labelY = star.y + star.size * 3 + 25;
      
      // Add subtle glow to text
      p.fill(255, 215, 0, 60);
      p.text(star.name.toUpperCase(), star.x, labelY + 1);
      p.text(star.name.toUpperCase(), star.x - 1, labelY);
      p.text(star.name.toUpperCase(), star.x + 1, labelY);
      
      // Draw main text
      p.fill(255, 215, 0, 200);
      p.text(star.name.toUpperCase(), star.x, labelY);
    });
  }

  private drawTitle(p: p5): void {
    p.fill(255, 215, 0, 200);
    p.textAlign(p.CENTER);
    p.textSize(42);
    p.textStyle(p.BOLD);
    p.text("MYSTIC NAVIGATION", p.width / 2, 80);
    
    p.textSize(18);
    p.fill(255, 255, 255, 150);
    p.text("Choose your mystical destination", p.width / 2, 110);
  }

  private drawInstructions(p: p5): void {
    p.fill(255, 255, 255, 120);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text("Hover over portals to see details • Click to enter ✨", p.width / 2, p.height - 40);
  }

  private drawClosingAnimation(p: p5): void {
    // Draw shrinking effect
    this.drawGradientBackground(p);
    
    // Scale and fade everything
    let scale = p.lerp(1, 0, this.time * 2);
    let alpha = p.lerp(255, 0, this.time * 2);
    
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.scale(scale);
    p.translate(-p.width / 2, -p.height / 2);
    
    // Draw fading stars
    this.stars.forEach(star => {
      p.fill(star.color.r, star.color.g, star.color.b, alpha);
      p.noStroke();
      p.ellipse(star.x, star.y, star.size);
    });
    
    p.pop();
    
    // End animation after a certain time
    if (this.time > 0.5) {
      this.close.emit();
    }
  }

  private handleMousePressed(p: p5): void {
    this.stars.forEach(star => {
      let d = p.dist(p.mouseX, p.mouseY, star.x, star.y);
      if (d < star.size + 10) {
        this.startClosingAnimation();
        // Delay navigation to allow animation
        setTimeout(() => {
          this.navigateTo.emit(star.page);
        }, 500);
      }
    });
  }

  private startClosingAnimation(): void {
    this.isClosing.set(true);
    this.time = 0;
  }

  private recalculateStarPositions(p: p5): void {
    const scaleX = p.width * 0.6 / 600;
    const scaleY = p.height * 0.5 / 400;
    const offsetX = p.width * 0.2;
    const offsetY = p.height * 0.3;
    
    const originalPattern = [
      { x: 250, y: 250 },
      { x: 400, y: 180 },
      { x: 550, y: 250 }
    ];
    this.stars.forEach((star, i) => {
      if (originalPattern[i]) {
        star.x = originalPattern[i].x * scaleX + offsetX;
        star.y = originalPattern[i].y * scaleY + offsetY;
      }
    });
  }

  private getStarColor(page: string): { r: number; g: number; b: number } {
    const colors = {
      'gems': { r: 255, g: 215, b: 0 },      // Gold for gems
      'altar': { r: 138, g: 43, b: 226 },    // Purple for altar
      'runes': { r: 0, g: 191, b: 255 }      // Deep sky blue for runes
    };
    return colors[page as keyof typeof colors] || { r: 255, g: 255, b: 255 };
  }

  getHoveredPageInfo(): NavigationPage | null {
    if (!this.hoveredStar) return null;
    return this.pages.find(page => page.name === this.hoveredStar!.page) || null;
  }
}
