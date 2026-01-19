export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  logo: string;
  date_release: string;
  date_revision: string;
}

export interface ApiGetAllResponse {
  data: ApiProduct[];
}

export interface ApiMutationResponse {
  message: string;
  data: ApiProduct;
}
