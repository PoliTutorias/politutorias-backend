export interface TutorInOfferResponse {
  id: string;
  name: string;
  photo: string;
}

export interface OfferResponseDto {
  id: string;
  title: string;
  price: number;
  modality: string;
  description: string;
  tags: string[];
  rating: number;
  reviewsCount: number;
  tutor: TutorInOfferResponse | null;
  createdAt: Date;
}

export interface PaginatedOffersResponse {
  offers: OfferResponseDto[];
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
