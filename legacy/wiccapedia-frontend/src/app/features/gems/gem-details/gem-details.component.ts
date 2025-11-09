import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Gem, CreateGemRequest } from '../../../core/models';
import { GemService } from '../../../core/services';

@Component({
  selector: 'app-gem-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gem-details.component.html',
  styleUrl: './gem-details.component.css'
})
export class GemDetailsComponent implements OnInit {
  private destroy$ = new Subject<void>();

  @Input({ required: true }) gem!: Gem;
  @Input() colors: string[] = [];
  @Input() categories: string[] = [];
  @Input() formulas: string[] = [];
  @Input() loading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() gemUpdated = new EventEmitter<Gem>();
  @Output() error = new EventEmitter<string>();

  // Modal state
  editMode = signal(false);
  showImageUploader = signal(false);

  // Edit gem form
  editGemForm = new FormGroup({
    name: new FormControl(''),
    magical_description: new FormControl(''),
    category: new FormControl(''),
    color: new FormControl(''),
    chemical_formula: new FormControl('')
  });

  // Edit image state
  editSelectedFile = signal<File | null>(null);
  editFilePreview = signal<string | null>(null);

  constructor(private gemService: GemService) {}

  ngOnInit(): void {
    // Initialize form with gem data
    this.editGemForm.patchValue({
      name: this.gem.name,
      magical_description: this.gem.magical_description,
      category: this.gem.category,
      color: this.gem.color,
      chemical_formula: this.gem.chemical_formula
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.close.emit();
  }

  onEnterEditMode(): void {
    this.editMode.set(true);
    this.showImageUploader.set(false);
    this.editGemForm.patchValue({
      name: this.gem.name,
      magical_description: this.gem.magical_description,
      category: this.gem.category,
      color: this.gem.color,
      chemical_formula: this.gem.chemical_formula
    });
  }

  onCancelEdit(): void {
    this.editMode.set(false);
    this.showImageUploader.set(false);
    this.editSelectedFile.set(null);
    this.editFilePreview.set(null);
  }

  onSaveEdit(): void {
    if (!this.editGemForm.valid) return;

    const form = this.editGemForm.value;
    const payload: CreateGemRequest = {
      name: form.name!,
      magical_description: form.magical_description!,
      category: form.category!,
      color: form.color!,
      chemical_formula: form.chemical_formula!
    };

    const file = this.editSelectedFile();
    const obs = file
      ? this.gemService.updateGemWithImage(this.gem.id, payload, file)
      : this.gemService.updateGem(this.gem.id, payload);

    obs.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        this.gem = updated;
        this.gemUpdated.emit(updated);
        this.editMode.set(false);
        this.showImageUploader.set(false);
        this.editSelectedFile.set(null);
        this.editFilePreview.set(null);
      },
      error: (err) => {
        console.error('Error updating gem:', err);
        this.error.emit(err.message || 'Failed to update gem');
      }
    });
  }

  onToggleImageUploader(): void {
    // Ensure edit mode for image changes
    if (!this.editMode()) {
      this.editMode.set(true);
    }
    this.showImageUploader.update(v => !v);
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error.emit('Seleccione una imagen válida.');
      return;
    }
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error.emit('La imagen debe ser menor a 10MB.');
      return;
    }
    this.editSelectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.editFilePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onEditDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer || !event.dataTransfer.files?.length) return;
    const file = event.dataTransfer.files[0];
    if (!file.type.startsWith('image/')) {
      this.error.emit('Seleccione una imagen válida.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.emit('La imagen debe ser menor a 10MB.');
      return;
    }
    this.editSelectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.editFilePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onEditDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onRemoveEditFile(): void {
    this.editSelectedFile.set(null);
    this.editFilePreview.set(null);
  }
}
