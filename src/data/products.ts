// data/products.ts
export type CategoryOnly = 'Willow & Wild' | '';

export interface Product {
  id: string;
  title: string;
  description: string;
  priceEUR: number;
  rating: number;
  image: string;
  vendor: string;
  locations: string[];
  category: CategoryOnly;
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Our Popular coffee',
    description: 'Cappuccino or Americano',
    priceEUR: 4.0,
    rating: 4.8,
    image: '/images/product-card-image1.png',
    vendor: 'Willow & Wild',
    locations: ['No. 2 Courthouse Square, Maynooth', '77 Oaklawn, Leixlip'],
    category: 'Willow & Wild',
  },
  {
    id: 'p2',
    title: 'Coffee + Cake',
    description: 'Gift a Cappuccino or an Americano with a cake',
    priceEUR: 8.0,
    rating: 4.8,
    image: '/images/product-card-image2.png',
    vendor: 'Willow & Wild',
    locations: ['No. 2 Courthouse Square, Maynooth', '77 Oaklawn, Leixlip'],
    category: 'Willow & Wild',
  },
  {
    id: 'p3',
    title: 'Two Coffee + One Cake',
    description: 'A gift for two. Have two coffee and one cake',
    priceEUR: 12.0,
    rating: 4.8,
    image: '/images/product-card-image3.png',
    vendor: 'Willow & Wild',
    locations: ['77 Oaklawn, Leixlip', 'No. 2 Courthouse Square, Maynooth'],
    category: 'Willow & Wild',
  },

  

];
