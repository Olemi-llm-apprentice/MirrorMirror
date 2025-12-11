// App View Types
export type AppView =
  | "conversation"
  | "image-input"
  | "loading"
  | "genre-list"
  | "item-details"
  | "shop-map";

// Gender Type
export type Gender = "mens" | "ladies";

// Genre Types
export type GenreId = "casual" | "business" | "street" | "mode" | "elegant";

export interface GenrePreview {
  genre_id: GenreId;
  genre_name: string;
  coordinate_id: string;
  cover_image: string;
  preview_image_url: string;
  tagline: string;
  // For progressive image loading
  original_image_url?: string; // Original coordinate image (shown while generating)
  generated_image_url?: string; // AI-generated image (replaces original when ready)
  is_generating?: boolean; // Whether the image is currently being generated
}

// Coordinate Types
export interface Item {
  item_id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
}

export interface Coordinate {
  coordinate_id: string;
  name: string;
  genre_id: GenreId;
  image_url: string;
  items: Item[];
  description: string;
}

// Shop Types
export interface Shop {
  shop_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  walkingMinutes?: number;
  distance?: number;
  openingHours?: string;
}

// Location Type
export interface Location {
  lat: number;
  lng: number;
}

// Client Tool Return Types
export interface SetGenderResult {
  success: boolean;
  gender: Gender;
  message: string;
}

export interface ShowImageInputUIResult {
  success: boolean;
  image_id: string;
}

export interface GenerateCoordinatesResult {
  success: boolean;
  generated_count?: number;
  genre_previews?: GenrePreview[];
  error?: string;
}

export interface SelectGenreResult {
  success: boolean;
  count?: number;
  error?: string;
}

export interface SelectCoordinateResult {
  success: boolean;
  coordinate_name?: string;
  items_count?: number;
  total_price?: number;
  error?: string;
}

export interface ShowShopMapResult {
  displayed: boolean;
  shop_count?: number;
  nearest_shop?: string;
  distance?: string;
  error?: string;
}

export interface GoBackResult {
  success: boolean;
  current_view: AppView;
}

// API Request/Response Types
export interface GenerateCoordinatesRequest {
  gender: Gender;
  image_id: string;
  image_base64: string;
  mime_type: string;
}

export interface GenerateCoordinatesResponse {
  success: boolean;
  genre_previews: GenrePreview[];
}

export interface GenerateRemainingRequest {
  genre_id: GenreId;
  image_id: string;
  gender: Gender;
  image_base64?: string;
  mime_type?: string;
}

export interface GenerateRemainingResponse {
  success: boolean;
  coordinates: Coordinate[];
}

