import type { Product, TasteCard, User } from "@tanku/shared";

// Catalog text is data (Spanish, es-CO), not UI text: it does not go through i18n.
// The size array is shared by reference across products; createStore() deep-clones the seed, so it is safe.
const clothingSizes = [
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
];

const products: Product[] = [
  {
    id: "product-tshirt",
    name: "Camiseta básica de algodón",
    description: "Camiseta suave de algodón peinado, corte regular.",
    category: "fashion",
    priceCop: 59900,
    tags: ["style"],
    variants: clothingSizes,
  },
  {
    id: "product-hoodie",
    name: "Buso con capucha",
    description: "Buso afelpado con bolsillo canguro para el día a día.",
    category: "fashion",
    priceCop: 139900,
    tags: ["style", "outdoors"],
    variants: clothingSizes,
  },
  {
    id: "product-windbreaker",
    name: "Chaqueta cortavientos",
    description: "Chaqueta liviana e impermeable, ideal para salir a caminar.",
    category: "fashion",
    priceCop: 189900,
    tags: ["sport", "outdoors"],
    variants: clothingSizes,
  },
  {
    id: "product-headphones",
    name: "Audífonos inalámbricos",
    description: "Audífonos Bluetooth con 30 horas de batería.",
    category: "tech",
    priceCop: 249900,
    tags: ["music", "sport"],
    variants: [
      { id: "black", label: "Negro" },
      { id: "white", label: "Blanco" },
    ],
  },
  {
    id: "product-speaker",
    name: "Parlante portátil",
    description: "Parlante resistente al agua para llevar a cualquier plan.",
    category: "tech",
    priceCop: 179900,
    tags: ["music", "outdoors"],
    variants: [
      { id: "black", label: "Negro" },
      { id: "blue", label: "Azul" },
    ],
  },
  {
    id: "product-smartwatch",
    name: "Reloj inteligente",
    description: "Reloj con seguimiento de actividad, sueño y notificaciones.",
    category: "tech",
    priceCop: 399900,
    tags: ["sport", "wellness"],
    variants: [
      { id: "black", label: "Negro" },
      { id: "silver", label: "Plata" },
    ],
  },
  {
    id: "product-candles",
    name: "Set de velas aromáticas",
    description: "Tres velas de soya para ambientar la casa.",
    category: "home",
    priceCop: 69900,
    tags: ["decor", "wellness", "romantic"],
    variants: [
      { id: "vanilla", label: "Vainilla" },
      { id: "lavender", label: "Lavanda" },
    ],
  },
  {
    id: "product-blanket",
    name: "Manta de lana",
    description: "Manta tejida, cálida y liviana para el sofá.",
    category: "home",
    priceCop: 129900,
    tags: ["decor", "wellness"],
    variants: [
      { id: "gray", label: "Gris" },
      { id: "beige", label: "Beige" },
    ],
  },
  {
    id: "product-mugs",
    name: "Juego de tazas de cerámica",
    description: "Tazas hechas a mano, aptas para microondas.",
    category: "home",
    priceCop: 89900,
    tags: ["decor", "cooking"],
    variants: [
      { id: "set-2", label: "Set x2" },
      { id: "set-4", label: "Set x4" },
    ],
  },
  {
    id: "product-skincare",
    name: "Kit de cuidado facial",
    description: "Limpiador, hidratante y protector solar en formato de viaje.",
    category: "beauty",
    priceCop: 159900,
    tags: ["wellness"],
    variants: [
      { id: "dry", label: "Piel seca" },
      { id: "combination", label: "Piel mixta" },
    ],
  },
  {
    id: "product-perfume",
    name: "Perfume floral",
    description: "Fragancia floral de larga duración.",
    category: "beauty",
    priceCop: 219900,
    tags: ["romantic", "style"],
    variants: [
      { id: "ml-50", label: "50 ml" },
      { id: "ml-100", label: "100 ml" },
    ],
  },
  {
    id: "product-makeup",
    name: "Set de maquillaje",
    description: "Base, rubor y labial en una paleta práctica.",
    category: "beauty",
    priceCop: 119900,
    tags: ["style"],
    variants: [
      { id: "light", label: "Tono claro" },
      { id: "medium", label: "Tono medio" },
      { id: "dark", label: "Tono oscuro" },
    ],
  },
  {
    id: "product-dinner",
    name: "Cena para dos",
    description: "Menú de tres pasos en un restaurante aliado.",
    category: "experiences",
    priceCop: 280000,
    tags: ["romantic", "cooking"],
    variants: [
      { id: "classic", label: "Menú clásico" },
      { id: "vegetarian", label: "Menú vegetariano" },
    ],
  },
  {
    id: "product-spa",
    name: "Día de spa en pareja",
    description: "Masaje y circuito de aguas para dos personas.",
    category: "experiences",
    priceCop: 340000,
    tags: ["wellness", "romantic"],
    variants: [
      { id: "min-60", label: "60 minutos" },
      { id: "min-90", label: "90 minutos" },
    ],
  },
  {
    id: "product-cooking-class",
    name: "Taller de cocina",
    description: "Clase práctica de cocina colombiana con un chef.",
    category: "experiences",
    priceCop: 150000,
    tags: ["cooking"],
    variants: [
      { id: "saturday", label: "Sábado" },
      { id: "sunday", label: "Domingo" },
    ],
  },
];

const users: User[] = [
  { id: "user-valentina", name: "Valentina" },
  { id: "user-santiago", name: "Santiago" },
];

const tasteCards: Record<string, TasteCard> = {
  "user-valentina": {
    userId: "user-valentina",
    favoriteCategories: ["beauty", "home"],
    likedTags: ["wellness", "decor", "romantic"],
    avoidedTags: ["sport"],
    preferredSize: "m",
  },
  "user-santiago": {
    userId: "user-santiago",
    favoriteCategories: ["tech", "experiences"],
    likedTags: ["music", "cooking", "outdoors"],
    avoidedTags: ["decor"],
    preferredSize: "l",
  },
};

export const seed = { users, products, tasteCards };
