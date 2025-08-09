import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, startWith, combineLatest } from 'rxjs';
import { GemService } from '../../../core/services/gem.service';
import { Gem, GemFilters, PaginationParams, PaginatedResponse } from '../../../core/models';

@Component({
  selector: 'app-gem-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gem-list.component.html',
  styleUrl: './gem-list.component.css'
})
export class GemListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals for reactive state management
  gems = signal<Gem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalCount = signal(0);
  hasNext = signal(false);
  hasPrevious = signal(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Filter options
  colors = signal<string[]>([]);
  categories = signal<string[]>([]);
  formulas = signal<string[]>([]);

  // Modal state
  showGemModal = signal(false);
  showAddGemModal = signal(false);
  selectedGem = signal<Gem | null>(null);
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

  // Filter form
  filterForm = new FormGroup({
    search: new FormControl(''),
    color: new FormControl(''),
    category: new FormControl(''),
    formula: new FormControl('')
  });

  // Add gem form
  addGemForm = new FormGroup({
    name: new FormControl(''),
    magical_description: new FormControl(''),
    category: new FormControl(''),
    color: new FormControl(''),
    chemical_formula: new FormControl('')
  });

  // File upload state
  selectedFile = signal<File | null>(null);
  filePreview = signal<string | null>(null);
  uploadProgress = signal<number>(0);

  // Pagination state
  private currentCursor: string | null = null;
  private pageSize = 20;

  // Computed values
  filteredGemsCount = computed(() => this.gems().length);
  noResults = computed(() => !this.loading() && this.gems().length === 0);

  constructor(private gemService: GemService) {
    // React to filter changes
    effect(() => {
      this.setupFilterSubscriptions();
    });
  }

  ngOnInit(): void {
    this.loadMetadata();
    this.loadGems();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetadata(): void {
    // Load filter options
    this.gemService.colors$.pipe(takeUntil(this.destroy$))
      .subscribe(colors => this.colors.set(colors));

    this.gemService.categories$.pipe(takeUntil(this.destroy$))
      .subscribe(categories => this.categories.set(categories));

    this.gemService.formulas$.pipe(takeUntil(this.destroy$))
      .subscribe(formulas => this.formulas.set(formulas));
  }

  private setupFilterSubscriptions(): void {
    // Debounce search input and react to filter changes
    combineLatest([
      this.filterForm.get('search')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.filterForm.get('color')!.valueChanges.pipe(startWith('')),
      this.filterForm.get('category')!.valueChanges.pipe(startWith('')),
      this.filterForm.get('formula')!.valueChanges.pipe(startWith(''))
    ]    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([search, color, category, formula]) => {
      this.currentCursor = null; // Reset pagination when filters change
      this.loadGemsWithFilters({
        $search: search || undefined,
        color: color || undefined,
        category: category || undefined,
        chemical_formula: formula || undefined
      });
    });
  }

  loadGems(cursor?: string): void {
    this.loadGemsWithFilters(this.getCurrentFilters(), cursor);
  }

  private loadGemsWithFilters(filters: GemFilters, cursor?: string): void {
    this.loading.set(true);
    this.error.set(null);

    const pagination: PaginationParams = {
      limit: this.pageSize,
      cursor: cursor || undefined
    };

    this.gemService.getGems(filters, pagination).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PaginatedResponse<Gem>) => {
        this.gems.set(response.data);
        this.totalCount.set(response.pagination.total_count);
        this.hasNext.set(response.pagination.has_next);
        this.hasPrevious.set(response.pagination.has_previous);
        this.nextCursor.set(response.pagination.next_cursor || null);
        this.previousCursor.set(response.pagination.previous_cursor || null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading gems:', error);
        this.error.set(error.message || 'Failed to load gems');
        this.loading.set(false);
      }
    });
  }

  private getCurrentFilters(): GemFilters {
    const formValue = this.filterForm.value;
    return {
      $search: formValue.search || undefined,
      color: formValue.color || undefined,
      category: formValue.category || undefined,
      chemical_formula: formValue.formula || undefined
    };
  }

  // Event handlers
  onClearFilters(): void {
    this.filterForm.reset();
    this.currentCursor = null;
  }

  onNextPage(): void {
    if (this.hasNext() && this.nextCursor()) {
      this.loadGems(this.nextCursor()!);
    }
  }

  onPreviousPage(): void {
    if (this.hasPrevious() && this.previousCursor()) {
      this.loadGems(this.previousCursor()!);
    }
  }

  onGemClick(gem: Gem): void {
    this.selectedGem.set(gem);
    this.showGemModal.set(true);
    this.editMode.set(false);
    this.showImageUploader.set(false);
    this.editSelectedFile.set(null);
    this.editFilePreview.set(null);
    // Lock background scroll
    try { document.body.style.overflow = 'hidden'; } catch {}
    // Seed edit form with current values
    this.editGemForm.patchValue({
      name: gem.name,
      magical_description: gem.magical_description,
      category: gem.category,
      color: gem.color,
      chemical_formula: gem.chemical_formula
    });
  }

  onCloseGemModal(): void {
    this.showGemModal.set(false);
    this.selectedGem.set(null);
    this.editMode.set(false);
    this.showImageUploader.set(false);
    this.editSelectedFile.set(null);
    this.editFilePreview.set(null);
    // Restore background scroll
    try { document.body.style.overflow = ''; } catch {}
  }

  onOpenAddGemModal(): void {
    this.addGemForm.reset();
    this.showAddGemModal.set(true);
  }

  onCloseAddGemModal(): void {
    this.showAddGemModal.set(false);
    this.addGemForm.reset();
    this.selectedFile.set(null);
    this.filePreview.set(null);
    this.error.set(null);
  }

  // Edit mode handlers
  onEnterEditMode(): void {
    const gem = this.selectedGem();
    if (!gem) return;
    this.editMode.set(true);
    this.showImageUploader.set(false);
    this.editGemForm.patchValue({
      name: gem.name,
      magical_description: gem.magical_description,
      category: gem.category,
      color: gem.color,
      chemical_formula: gem.chemical_formula
    });
  }

  onCancelEdit(): void {
    this.editMode.set(false);
    this.showImageUploader.set(false);
    this.editSelectedFile.set(null);
    this.editFilePreview.set(null);
  }

  onSaveEdit(): void {
    const gem = this.selectedGem();
    if (!gem || !this.editGemForm.valid) return;

    const form = this.editGemForm.value;
    const payload = {
      name: form.name!,
      magical_description: form.magical_description!,
      category: form.category!,
      color: form.color!,
      chemical_formula: form.chemical_formula!
    };

    this.loading.set(true);
    const file = this.editSelectedFile();
    const obs = file
      ? this.gemService.updateGemWithImage(gem.id, payload, file)
      : this.gemService.updateGem(gem.id, payload);

    obs.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        // Update selected gem and list
        this.selectedGem.set(updated);
        const list = this.gems().map(g => g.id === updated.id ? updated : g);
        this.gems.set(list);
        this.loading.set(false);
        this.editMode.set(false);
        this.showImageUploader.set(false);
        this.editSelectedFile.set(null);
        this.editFilePreview.set(null);
      },
      error: (err) => {
        console.error('Error updating gem:', err);
        this.error.set(err.message || 'Failed to update gem');
        this.loading.set(false);
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
      this.error.set('Seleccione una imagen válida.');
      return;
    }
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('La imagen debe ser menor a 10MB.');
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
      this.error.set('Seleccione una imagen válida.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('La imagen debe ser menor a 10MB.');
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

  onAddGem(): void {
    if (this.addGemForm.valid) {
      const formValue = this.addGemForm.value;
      const newGem = {
        name: formValue.name!,
        magical_description: formValue.magical_description!,
        category: formValue.category!,
        color: formValue.color!,
        chemical_formula: formValue.chemical_formula!
      };

      const selectedFile = this.selectedFile();
      const observable = selectedFile 
        ? this.gemService.createGemWithImage(newGem, selectedFile)
        : this.gemService.createGem(newGem);

      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (createdGem: Gem) => {
          console.log('Gem created successfully:', createdGem);
          this.onCloseAddGemModal();
          this.loadGems(); // Refresh the list
        },
        error: (error: any) => {
          console.error('Error creating gem:', error);
          this.error.set(error.message || 'Failed to create gem');
        }
      });
    }
  }

  // File upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select a valid image file.');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('File size must be less than 10MB.');
        return;
      }

      this.selectedFile.set(file);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onRemoveFile(): void {
    this.selectedFile.set(null);
    this.filePreview.set(null);
    
    // Clear the file input
    const fileInput = document.getElementById('gem-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Utility methods
  getImageError(event: any): void {
    // Handle broken images by setting a default/placeholder
    event.target.src = 'assets/images/default-gem.jpg';
  }

  normalizeText(text: string): string {
    return GemService.normalizeText(text);
  }

  trackByGemId(index: number, gem: Gem): string {
    return gem.id;
  }
}
