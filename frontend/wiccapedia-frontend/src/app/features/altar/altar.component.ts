import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PentagramElement {
  id: string;
  name: string;
  element: string;
  color: string;
  position: { x: number; y: number };
  description: string;
  properties: string[];
}

interface Ritual {
  id: string;
  name: string;
  type: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  elements: string[];
  description: string;
  instructions: string[];
  materials: string[];
  moonPhase?: string;
}

@Component({
  selector: 'app-altar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './altar.component.html',
  styleUrl: './altar.component.css'
})
export class AltarComponent implements OnInit {
  // Pentagram elements (5 points)
  pentagramElements = signal<PentagramElement[]>([
    {
      id: 'spirit',
      name: 'Spirit',
      element: 'Akasha',
      color: '#9d4edd',
      position: { x: 50, y: 10 }, // Top point
      description: 'The divine essence that connects all elements',
      properties: ['Unity', 'Divine Connection', 'Higher Consciousness', 'Transcendence']
    },
    {
      id: 'water',
      name: 'Water',
      element: 'Aqua',
      color: '#0077be',
      position: { x: 19, y: 35 }, // Top left
      description: 'The element of emotions, intuition, and healing',
      properties: ['Emotions', 'Intuition', 'Healing', 'Purification', 'Dreams']
    },
    {
      id: 'fire',
      name: 'Fire',
      element: 'Ignis',
      color: '#ff6b35',
      position: { x: 81, y: 35 }, // Top right
      description: 'The element of passion, energy, and transformation',
      properties: ['Passion', 'Energy', 'Transformation', 'Courage', 'Creativity']
    },
    {
      id: 'earth',
      name: 'Earth',
      element: 'Terra',
      color: '#2d5016',
      position: { x: 31, y: 90 }, // Bottom left
      description: 'The element of stability, grounding, and material manifestation',
      properties: ['Stability', 'Grounding', 'Manifestation', 'Abundance', 'Growth']
    },
    {
      id: 'air',
      name: 'Air',
      element: 'Aer',
      color: '#ffd23f',
      position: { x: 69, y: 90 }, // Bottom right
      description: 'The element of intellect, communication, and new beginnings',
      properties: ['Intellect', 'Communication', 'Freedom', 'New Beginnings', 'Wisdom']
    }
  ]);

  // Available rituals
  rituals = signal<Ritual[]>([
    {
      id: 'cleansing',
      name: 'Sacred Space Cleansing',
      type: 'Purification',
      difficulty: 'Beginner',
      elements: ['air', 'fire'],
      description: 'Cleanse and purify your sacred space before any ritual work',
      instructions: [
        'Light white sage or palo santo',
        'Walk clockwise around your space',
        'Focus on clearing negative energy',
        'Set positive intentions for your work'
      ],
      materials: ['White sage or Palo Santo', 'Matches or lighter', 'Fireproof bowl'],
      moonPhase: 'Any'
    },
    {
      id: 'protection',
      name: 'Circle of Protection',
      type: 'Protection',
      difficulty: 'Intermediate',
      elements: ['spirit', 'earth', 'air', 'fire', 'water'],
      description: 'Create a powerful protective circle using all five elements',
      instructions: [
        'Place elemental representations at each point',
        'Call upon each element in turn',
        'Visualize a protective white light surrounding you',
        'State your intention for protection'
      ],
      materials: ['Salt (Earth)', 'Incense (Air)', 'Candle (Fire)', 'Water bowl (Water)', 'Crystal (Spirit)'],
      moonPhase: 'Waxing or Full'
    },
    {
      id: 'manifestation',
      name: 'Manifestation Ritual',
      type: 'Manifestation',
      difficulty: 'Advanced',
      elements: ['earth', 'fire', 'spirit'],
      description: 'Manifest your deepest desires with elemental power',
      instructions: [
        'Write your intention on parchment',
        'Place herbs corresponding to your goal',
        'Light candles while focusing on your desire',
        'Burn the parchment to release your intention',
        'Meditate on successful manifestation'
      ],
      materials: ['Parchment paper', 'Green candles', 'Corresponding herbs', 'Matches', 'Fireproof cauldron'],
      moonPhase: 'New or Waxing'
    }
  ]);

  // State management
  selectedElement = signal<PentagramElement | null>(null);
  selectedRitual = signal<Ritual | null>(null);
  showElementDetails = signal(false);
  showRitualDetails = signal(false);

  ngOnInit(): void {
    // Any initialization logic
  }

  // Event handlers
  onElementClick(element: PentagramElement): void {
    this.selectedElement.set(element);
    this.showElementDetails.set(true);
  }

  onRitualClick(ritual: Ritual): void {
    this.selectedRitual.set(ritual);
    this.showRitualDetails.set(true);
  }

  onCloseElementDetails(): void {
    this.showElementDetails.set(false);
    this.selectedElement.set(null);
  }

  onCloseRitualDetails(): void {
    this.showRitualDetails.set(false);
    this.selectedRitual.set(null);
  }

  // Utility methods
  getDifficultyClass(difficulty: string): string {
    switch(difficulty.toLowerCase()) {
      case 'beginner': return 'difficulty-beginner';
      case 'intermediate': return 'difficulty-intermediate';
      case 'advanced': return 'difficulty-advanced';
      default: return '';
    }
  }

  getMoonPhaseIcon(phase: string): string {
    switch(phase.toLowerCase()) {
      case 'new': return '🌑';
      case 'waxing': return '🌒';
      case 'full': return '🌕';
      case 'waning': return '🌘';
      default: return '🌙';
    }
  }

  // Helper methods for template
  getElementById(id: string): PentagramElement | undefined {
    return this.pentagramElements().find(e => e.id === id);
  }

  getElementColor(id: string): string {
    return this.getElementById(id)?.color || '#666';
  }

  getElementName(id: string): string {
    return this.getElementById(id)?.name || id;
  }
}
