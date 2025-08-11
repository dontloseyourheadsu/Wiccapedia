import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gem } from '../../../core/models';

@Component({
  selector: 'app-gem-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gem-card.component.html',
  styleUrl: './gem-card.component.css'
})
export class GemCardComponent {
  @Input({ required: true }) gem!: Gem;
  @Output() gemClick = new EventEmitter<Gem>();

  onGemClick(): void {
    this.gemClick.emit(this.gem);
  }

  onImageError(event: any): void {
    // Handle broken images by setting a default/placeholder
    event.target.src = 'assets/images/default-gem.jpg';
  }
}
