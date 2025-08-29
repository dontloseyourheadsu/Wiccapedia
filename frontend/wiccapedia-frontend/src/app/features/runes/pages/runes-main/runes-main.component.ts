import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-runes-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './runes-main.component.html',
  styleUrl: './runes-main.component.css'
})
export class RunesMainComponent {
  tab = signal<'elder' | 'younger' | 'anglo'>('elder');

  setTab(tab: 'elder' | 'younger' | 'anglo') {
    this.tab.set(tab);
  }
}
