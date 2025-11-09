import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Gem,
  CreateGemRequest,
  GemFilters,
  PaginationParams,
  PaginatedResponse,
  SearchResponse,
  MetadataResponse,
  ApiError,
  HealthResponse
} from '../models/gem.models';

@Injectable({
  providedIn: 'root'
})
export class GemService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:8080';
  private readonly apiEndpoint = `${this.baseUrl}/api/gems`;
  
  // Caching subjects for metadata
  private colorsSubject = new BehaviorSubject<string[]>([]);
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  private formulasSubject = new BehaviorSubject<string[]>([]);

  public colors$ = this.colorsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public formulas$ = this.formulasSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMetadata();
  }

  /**
   * Get paginated list of gems with optional filters
   */
  getGems(filters: GemFilters = {}, pagination: PaginationParams = {}): Observable<PaginatedResponse<Gem>> {
    let params = new HttpParams();

    // Add pagination parameters
    if (pagination.limit) {
      params = params.set('limit', pagination.limit.toString());
    }
    if (pagination.cursor) {
      params = params.set('cursor', pagination.cursor);
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<Gem>>(this.apiEndpoint, { params })
      .pipe(
        map(response => ({
          ...response,
          data: response.data.map(gem => this.processGemImageUrl(gem))
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific gem by ID
   */
  getGemById(id: string): Observable<Gem> {
    return this.http.get<Gem>(`${this.apiEndpoint}/${id}`)
      .pipe(
        map(gem => this.processGemImageUrl(gem)),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new gem
   */
  createGem(gem: CreateGemRequest): Observable<Gem> {
    return this.http.post<Gem>(this.apiEndpoint, gem)
      .pipe(
        map(createdGem => this.processGemImageUrl(createdGem)),
        tap(() => this.loadMetadata()), // Refresh metadata after creation
        catchError(this.handleError)
      );
  }

  /**
   * Create a new gem with image upload
   */
  createGemWithImage(gem: CreateGemRequest, imageFile: File): Observable<Gem> {
    const formData = new FormData();
    formData.append('gem_data', JSON.stringify(gem));
    formData.append('image', imageFile);

    return this.http.post<Gem>(`${this.apiEndpoint}/upload`, formData)
      .pipe(
        map((createdGem: Gem) => this.processGemImageUrl(createdGem)),
        tap(() => this.loadMetadata()), // Refresh metadata after creation
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing gem
   */
  updateGem(id: string, gem: CreateGemRequest): Observable<Gem> {
    return this.http.put<Gem>(`${this.apiEndpoint}/${id}`, gem)
      .pipe(
        map((updatedGem: Gem) => this.processGemImageUrl(updatedGem)),
        tap(() => this.loadMetadata()), // Refresh metadata after update
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing gem with image upload
   */
  updateGemWithImage(id: string, gem: CreateGemRequest, imageFile?: File): Observable<Gem> {
    const formData = new FormData();
    formData.append('gem_data', JSON.stringify(gem));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<Gem>(`${this.apiEndpoint}/${id}/upload`, formData)
      .pipe(
        map((updatedGem: Gem) => this.processGemImageUrl(updatedGem)),
        tap(() => this.loadMetadata()), // Refresh metadata after update
        catchError(this.handleError)
      );
  }

  /**
   * Delete a gem
   */
  deleteGem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiEndpoint}/${id}`)
      .pipe(
        tap(() => this.loadMetadata()), // Refresh metadata after deletion
        catchError(this.handleError)
      );
  }

  /**
   * Search gems by term
   */
  searchGems(term: string): Observable<SearchResponse> {
    const params = new HttpParams().set('q', term);
    
    return this.http.get<SearchResponse>(`${this.apiEndpoint}/search`, { params })
      .pipe(
        map(response => ({
          ...response,
          results: response.results.map(gem => this.processGemImageUrl(gem))
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Get unique colors
   */
  getColors(): Observable<string[]> {
    return this.http.get<MetadataResponse>(`${this.apiEndpoint}/metadata/colors`)
      .pipe(
        map(response => response.colors || []),
        tap(colors => this.colorsSubject.next(colors)),
        catchError(this.handleError)
      );
  }

  /**
   * Get unique categories
   */
  getCategories(): Observable<string[]> {
    return this.http.get<MetadataResponse>(`${this.apiEndpoint}/metadata/categories`)
      .pipe(
        map(response => response.categories || []),
        tap(categories => this.categoriesSubject.next(categories)),
        catchError(this.handleError)
      );
  }

  /**
   * Get unique chemical formulas
   */
  getFormulas(): Observable<string[]> {
    return this.http.get<MetadataResponse>(`${this.apiEndpoint}/metadata/formulas`)
      .pipe(
        map(response => response.formulas || []),
        tap(formulas => this.formulasSubject.next(formulas)),
        catchError(this.handleError)
      );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get image URL for a gem
   */
  getImageUrl(gem: Gem): string {
    if (gem.image && gem.image.startsWith('http')) {
      return gem.image;
    }
    
    // Create image filename from gem name (matching backend logic)
    const imageFilename = this.createImageFilename(gem.name);
    return `${this.baseUrl}/images/${imageFilename}.jpg`;
  }

  /**
   * Create image filename from gem name (matching frontend and backend logic)
   */
  private createImageFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n');
  }

  /**
   * Process gem to ensure correct image URL
   */
  private processGemImageUrl(gem: Gem): Gem {
    return {
      ...gem,
      image: this.getImageUrl(gem)
    };
  }

  /**
   * Load all metadata (colors, categories, formulas)
   */
  private loadMetadata(): void {
    this.getColors().subscribe();
    this.getCategories().subscribe();
    this.getFormulas().subscribe();
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && typeof error.error === 'object' && 'error' in error.error) {
        const apiError = error.error as ApiError;
        errorMessage = apiError.message || apiError.error || errorMessage;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('GemService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Normalize text for searching (matching backend logic)
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n');
  }
}
