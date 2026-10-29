export const BUSINESS = {
  name: 'Motoyuna',
  legal: 'Inversiones del Yuna, SRL',
  phoneDisplay: '829-599-0726',
  phoneE164: '+18295990726',
  whatsapp: '18295990726',
  instagram: 'https://www.instagram.com/motoyunard/',
  instagramHandle: '@motoyunard',
  instagramFollowers: 9972,
  address: 'Calle 16 de Agosto esq. Calle Los Santos',
  city: 'Bonao, Monseñor Nouel',
  maps: 'https://www.google.com/maps/place/MotoYuna/@18.9429229,-70.4138457,1124m/data=!3m2!1e3!4b1!4m6!3m5!1s0x8eafdf9e28d9dec9:0xa70834ea206ff39b!8m2!3d18.9429229!4d-70.4112708!16s%2Fg%2F11w2brr1l9',
  mapsEmbed: 'https://maps.google.com/maps?q=18.9429229,-70.4112708&z=17&output=embed',
  timezone: 'America/Santo_Domingo',
  // [day 0=Sunday..6], each entry is a list of [openMinutes, closeMinutes]
  hours: {
    0: [],
    1: [[480, 720], [840, 1080]],
    2: [[480, 720], [840, 1080]],
    3: [[480, 720], [840, 1080]],
    4: [[480, 720], [840, 1080]],
    5: [[480, 720], [840, 1080]],
    6: [[480, 780]],
  },
};

export const waLink = (text = '¡Hola Motoyuna! Quiero información.') =>
  `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;

// tipo: pasola | moto | utilitario · condicion: nueva | importada | agotado
// fotos: names from image-manifest.json (real Motoyuna photography), keyed by color when known
export const CATALOG = [
  { marca: 'Kymco', nombre: 'Agility RS 125cc', tipo: 'pasola', condicion: 'nueva', precio: 137000, colores: ['Azul', 'Gris', 'Blanco', 'Negro', 'Rojo'], fotos: { Gris: 'kymco-rs-gris', Rojo: 'kymco-rs-rojo', Azul: 'kymco-rs-azul' }, destacado: true },
  { marca: 'Kymco', nombre: 'Agility RS 150cc', tipo: 'pasola', condicion: 'nueva', precio: 149000, colores: ['Azul', 'Gris', 'Blanco', 'Negro', 'Rojo'], fotos: { Rojo: 'kymco-rs-rojo', Azul: 'kymco-rs-azul', Gris: 'kymco-rs-gris' } },
  { marca: 'Kymco', nombre: 'Agility RSX 125cc', tipo: 'pasola', condicion: 'nueva', precio: 137000, colores: ['Azul'], producto: 'kymco-agility-rsx-125' },
  { marca: 'Kymco', nombre: 'Agility 125cc', tipo: 'pasola', condicion: 'nueva', precio: 108000, colores: ['Azul', 'Gris', 'Blanco', 'Negro', 'Rojo'], producto: 'kymco-agility-125' },
  { marca: 'Yamaha', nombre: 'Gear 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, inicial: 10000, colores: ['Blanco'], fotos: { Blanco: 'yamaha-gear-showroom' }, destacado: true },
  { marca: 'Suzuki', nombre: "Let's 50cc", tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Rojo'], fotos: { Rojo: 'suzuki-lets' } },
  { marca: 'Daihatsu', nombre: 'Hijet', tipo: 'utilitario', condicion: 'importada', precio: 0, colores: ['Blanco'], fotos: { Blanco: 'hijet-cliente' }, destacado: true },
  { marca: 'Bajaj', nombre: 'Platina 125cc', tipo: 'moto', condicion: 'nueva', precio: 112000, colores: ['Rojo con Negro', 'Azul con Negro'], producto: 'bajaj-platina-125' },
  { marca: 'Bajaj', nombre: 'Boxer 150cc', tipo: 'moto', condicion: 'nueva', precio: 105000, colores: ['Verde con Negro'], producto: 'bajaj-boxer-150' },
  { marca: 'SYM', nombre: 'Jet 200cc', tipo: 'pasola', condicion: 'nueva', precio: 162000, colores: ['Gris con Verde'], producto: 'sym-jet-200' },
  { marca: 'SYM', nombre: 'GR 150cc', tipo: 'pasola', condicion: 'nueva', precio: 119000, colores: ['Negro', 'Gris', 'Blanco', 'Rojo', 'Azul Marino'], producto: 'sym-gr-150' },
  { marca: 'SYM', nombre: 'Lifetime', tipo: 'pasola', condicion: 'nueva', precio: 0, colores: ['Rojo con Gris'], producto: 'sym-lifetime' },
  { marca: 'X1000', nombre: 'CG200 Full', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Gris', 'Rojo', 'Azul'], producto: 'x1000-cg200-full' },
  { marca: 'X1000', nombre: 'CG150', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Gris', 'Rojo', 'Azul'], producto: 'x1000-cg150' },
  { marca: 'X1000', nombre: 'CG200', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Gris', 'Rojo', 'Azul'], producto: 'x1000-cg200' },
  { marca: 'X1000', nombre: 'Super Delivery', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Blanco con Negro'], producto: 'x1000-super-delivery' },
  { marca: 'Honda', nombre: 'Lead 100cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Gris', 'Negro'], producto: 'honda-lead-100' },
  { marca: 'Honda', nombre: 'Dio 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Negro'], producto: 'honda-dio-50' },
  { marca: 'Honda', nombre: 'Super Cub 50cc', tipo: 'moto', condicion: 'importada', precio: 0, colores: ['Verde'], producto: 'honda-supercub-50' },
  { marca: 'Kakakto', nombre: 'Batllo 200cc', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Azul', 'Rojo', 'Negro'], producto: 'kakakto-batllo-200' },
  { marca: 'Kakakto', nombre: 'KTF 250cc', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Rojo con Blanco'], producto: 'kakakto-ktf-250' },
  { marca: 'Kakakto', nombre: 'Tekken 250cc', tipo: 'moto', condicion: 'nueva', precio: 0, colores: ['Naranja con Negro', 'Verde con Negro'], producto: 'kakakto-tekken-250' },
  { marca: 'Kakakto', nombre: 'KM Sport 150cc', tipo: 'moto', condicion: 'agotado', precio: 0, colores: [], producto: 'kakakto-km-sport-150' },
  { marca: 'Yamaha', nombre: 'Cygnus 6G Monster Energy', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Verde con Negro y Azul'], producto: 'yamaha-cygnus-6g-monster' },
  { marca: 'Yamaha', nombre: 'Cygnus 6G 60 Aniversario', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Blanco con Amarillo y Rojo'], producto: 'yamaha-cygnus-6g-60th' },
  { marca: 'Yamaha', nombre: 'Evolution 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Gris', 'Negro', 'Blanco', 'Crema'], producto: 'yamaha-evolution-50' },
  { marca: 'Yamaha', nombre: 'Artistica 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Negro'], producto: 'yamaha-artistica-50' },
  { marca: 'Yamaha', nombre: 'JOG BJ 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Gris', 'Champagne', 'Negro'], producto: 'yamaha-jog-50' },
  { marca: 'Yamaha', nombre: 'Nextzone 50cc', tipo: 'pasola', condicion: 'importada', precio: 0, colores: ['Gris', 'Negro'], producto: 'yamaha-nextzone-50' },
];

// swatch colors for the color names used in the catalog
export const SWATCH = {
  Azul: '#1f5fd1', Gris: '#8d9096', Blanco: '#f4f4f2', Negro: '#151515', Rojo: '#e61b1f',
  Verde: '#2f7d4f', 'Azul Marino': '#1b2a4a', Champagne: '#d8c3a0', Crema: '#ece2cc', Naranja: '#f07a1a', Amarillo: '#f2c230',
};
