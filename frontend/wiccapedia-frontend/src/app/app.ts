import { Component } from '@angular/core';
import { GemListComponent } from './features/gems/list/gem-list.component';

@Component({
  selector: 'app-root',
  imports: [GemListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'wiccapedia-frontend';
}
