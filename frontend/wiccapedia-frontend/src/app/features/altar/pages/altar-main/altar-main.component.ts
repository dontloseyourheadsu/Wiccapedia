import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AltarVisualizationComponent } from '../../components/altar-visualization/altar-visualization.component';

interface WiccanTool {
  name: string;
  meaning: string;
  use: string;
}

interface RitualFlow {
  step: number;
  action: string;
  description: string;
}

@Component({
  selector: 'app-altar-main',
  standalone: true,
  imports: [CommonModule, AltarVisualizationComponent],
  templateUrl: './altar-main.component.html',
  styleUrl: './altar-main.component.css'
})
export class AltarMainComponent implements OnInit {
  
  // Wiccan altar information
  wiccanTools = signal<WiccanTool[]>([
    {
      name: 'Chalice',
      meaning: 'Fertility, womb of the Goddess',
      use: 'Holds water or herbs; can be used in fertility spells'
    },
    {
      name: 'Cauldron',
      meaning: 'Transformation, brewing',
      use: 'For potions, burning herbs, or holding magical items'
    },
    {
      name: 'Bell',
      meaning: 'Clears energy',
      use: 'Ring to start a ritual or banish bad vibes'
    },
    {
      name: 'Athame',
      meaning: 'Willpower, direction of energy',
      use: 'For casting the circle, inscribing candles'
    },
    {
      name: 'Wand',
      meaning: 'Invocation, blessing',
      use: 'Made from wood; can be charged under full moon'
    },
    {
      name: 'Broom (Besom)',
      meaning: 'Fertility, cleansing',
      use: 'Sweeps away negativity; used in handfasting weddings'
    },
    {
      name: 'Crystals/Stones',
      meaning: 'Amplify magic',
      use: 'Chosen for specific energies (love, healing, protection)'
    },
    {
      name: 'Feathers',
      meaning: 'Angelic connection',
      use: 'Colors match ritual purpose or use white for purity'
    },
    {
      name: 'Book of Shadows',
      meaning: 'Record-keeping',
      use: 'Journal of spells, ingredients, moon phases, results'
    }
  ]);

  ritualFlow = signal<RitualFlow[]>([
    {
      step: 1,
      action: 'Cleanse space',
      description: '(sage, salt, or incense)'
    },
    {
      step: 2,
      action: 'Set the altar',
      description: 'Pentacle in center, candle at back, Earth & Water bowls at sides, incense in front'
    },
    {
      step: 3,
      action: 'Light the white candle',
      description: 'to neutralize energies'
    },
    {
      step: 4,
      action: 'Light incense',
      description: 'to raise vibration'
    },
    {
      step: 5,
      action: 'Cast the circle',
      description: 'with athame or wand'
    },
    {
      step: 6,
      action: 'Perform invocation',
      description: '(chants, prayers, or silent focus)'
    },
    {
      step: 7,
      action: 'Carry out the spell or ritual',
      description: 'Focus on your intention'
    },
    {
      step: 8,
      action: 'Close the circle',
      description: 'and thank spiritual allies'
    },
    {
      step: 9,
      action: 'Extinguish candles safely',
      description: 'Never blow out - use snuffer or pinch'
    }
  ]);

  // Modal states
  showItemDetails = signal(false);
  selectedItemDetails = signal<any>(null);

  ngOnInit(): void {
    // Any initialization logic
  }

  onItemClick(item: any): void {
    this.selectedItemDetails.set(item);
    this.showItemDetails.set(true);
  }

  onItemHover(item: any): void {
    // Handle hover events if needed
  }

  onCloseItemDetails(): void {
    this.showItemDetails.set(false);
    this.selectedItemDetails.set(null);
  }
}
