import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GemListComponent } from '../features/gems/list/gem-list.component';
import { ConstellationComponent } from '../features/navigation/constellation/constellation.component';

interface PageConfig {
  name: string;
  title: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, GemListComponent, ConstellationComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  currentPage = signal<string>('gems');
  showConstellation = signal<boolean>(false);

  // Page configurations
  pageConfigs: Record<string, PageConfig> = {
    'gems': {
      name: 'gems',
      title: 'Mystic Gem Vault',
      subtitle: 'Descubre la magia de las gemas místicas',
      icon: 'fas fa-gem'
    },
    'altar': {
      name: 'altar',
      title: 'Pentagram Altar',
      subtitle: 'Invoca los poderes de la naturaleza',
      icon: 'fas fa-star'
    }
  };

  getCurrentPageConfig(): PageConfig {
    return this.pageConfigs[this.currentPage()] || this.pageConfigs['gems'];
  }

  openConstellation(): void {
    this.showConstellation.set(true);
  }

  closeConstellation(): void {
    this.showConstellation.set(false);
  }

  navigateToPage(page: string): void {
    this.currentPage.set(page);
    this.showConstellation.set(false);
  }
}
