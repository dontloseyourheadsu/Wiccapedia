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
  }

  onCloseGemModal(): void {
    this.showGemModal.set(false);
    this.selectedGem.set(null);
  }

  onOpenAddGemModal(): void {
    this.addGemForm.reset();
    this.showAddGemModal.set(true);
  }

  onCloseAddGemModal(): void {
    this.showAddGemModal.set(false);
    this.addGemForm.reset();
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

      this.gemService.createGem(newGem).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (createdGem) => {
          console.log('Gem created successfully:', createdGem);
          this.onCloseAddGemModal();
          this.loadGems(); // Refresh the list
        },
        error: (error) => {
          console.error('Error creating gem:', error);
          this.error.set(error.message || 'Failed to create gem');
        }
      });
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
