export type ProductId = string;

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  logo: string;
  dateRelease: Date;
  dateRevision: Date;
}
