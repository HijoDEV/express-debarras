/**
 * Photos libres de droits (licence Unsplash : usage commercial autorisé, sans attribution obligatoire).
 * Chargées depuis le CDN Unsplash, recadrées à la volée. Remplacer par nos photos de chantier au lancement.
 */
export const PHOTOS = {
  caveAvant: '1773125929765-99d4d67e831d', // cartons empilés dans un local de stockage
  caveApres: '1704461539031-e7c2145e5fc4', // pièce vide, murs béton
  grenierAvant: '1724166483767-1a42883ccde5', // pièce remplie de meubles en bois
  grenierApres: '1571568168521-b439c1162480', // grenier vide
  sejourAvant: '1646377365268-27dd70e88b47', // pièce défraîchie avec chaises et table
  sejourApres: '1646592474103-cfd22d1d9e34', // pièce vide, murs blancs, parquet
  garageAvant: '1766040923580-16ad32fae8b4', // gros tas de cartons
  garageApres: '1646592491741-e79ae5953486', // pièce vide avec escalier et parquet
  grenier: '1553969536-7abe08c6132d',
  garage: '1781177289350-f9aa33f0347d', // vélo dans un entrepôt encombré
  box: '1659729752087-98d8fef7b50c', // rangée de box
  appartement: '1633789638543-401909599051', // salon avec fauteuil et bibliothèque
  maison: '1645116064599-c59307701db8', // combles avec lit et commode
  bureaux: '1692133224682-42cc3283e4ea', // pièce avec bureau et étagères
  commerce: '1775880306542-57d598d773a0', // étagères remplies de cartons
  chantier: '1704461539031-e7c2145e5fc4',
  electromenager: '1646592474273-86049d4f3575', // pièce avec lave-linge
  meuble: '1769972557854-7eae6f95585b', // homme portant un matelas
  cartons: '1700165644892-3dd6b67b25bc', // cartons ouverts
} as const;

export type PhotoKey = keyof typeof PHOTOS;

export const photo = (key: PhotoKey, w = 600, h?: number) =>
  `https://images.unsplash.com/photo-${PHOTOS[key]}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=70`;
