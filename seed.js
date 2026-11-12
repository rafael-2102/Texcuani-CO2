/* ============================================================
   Semilla de datos (idempotente).
   Se puede ejecutar muchas veces sin duplicar nada porque usa
   "upsert" (actualiza si ya existe, crea si no existe).

   Uso:  npm run seed
   ============================================================ */
const { conectarDB } = require('./db');
const config = require('./config');
const mongoose = require('mongoose');
const Plato = require('./models/Plato');
const Usuario = require('./models/Usuario');

/* ---------- Los 8 platos de la carta ---------- */
const PLATOS = [
  {
    slug: 'p1',
    nombre: 'Criollo Wrap',
    descripcion:
      'Una tortilla de maíz rellena de pollo a la plancha, fríjoles, aguacate, hogao colombiano, lechuga y queso campesino.',
    precio: 15500,
    emoji: '🌮',
    color: 'linear-gradient(135deg,#FFC23C,#FF8A5B)',
    badge: '🔥 Más pedido',
    categoria: 'plato',
    antes: 0,
    nutricion: { kcal: 435, proteina: 40, carbohidratos: 38, grasas: 14, azucar: 3 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico', 'deportista', 'estudiante'],
    destacado: true,
  },
  {
    slug: 'p2',
    nombre: 'Tacos con Sazón',
    descripcion: 'Tacos de maíz con carne magra, hogao, repollo, tomate, cilantro y guacamole.',
    precio: 12500,
    emoji: '🥙',
    color: 'linear-gradient(135deg,#FF8A5B,#E63946)',
    badge: '🔥 Más pedido',
    categoria: 'plato',
    antes: 0,
    nutricion: { kcal: 400, proteina: 30, carbohidratos: 34, grasas: 15, azucar: 3 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico', 'deportista', 'estudiante'],
    destacado: false,
  },
  {
    slug: 'p3',
    nombre: 'Mole Paisa Ligero',
    descripcion:
      'Fusión de mole mexicano con bandeja paisa saludable: lentejas, frijoles, chicharrón de yuca al horno.',
    precio: 21000,
    emoji: '🍲',
    color: 'linear-gradient(135deg,#F4A261,#8B5E3C)',
    badge: '',
    categoria: 'plato',
    antes: 0,
    nutricion: { kcal: 410, proteina: 31, carbohidratos: 42, grasas: 13, azucar: 4 },
    indiceGlicemico: 'bajo',
    perfiles: ['deportista'],
    destacado: false,
  },
  {
    slug: 'p4',
    nombre: 'Enfrijolada Costeña',
    descripcion:
      'Tortilla integral bañada en frijol cremoso estilo costeño, queso descremado y salsa verde al ají.',
    precio: 15500,
    emoji: '🥑',
    color: 'linear-gradient(135deg,#8AC926,#2A9D8F)',
    badge: '',
    categoria: 'plato',
    antes: 0,
    nutricion: { kcal: 320, proteina: 19, carbohidratos: 33, grasas: 9, azucar: 4 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico'],
    destacado: false,
  },
  {
    slug: 'p5',
    nombre: 'Chiles Rellenos & Plátano',
    descripcion:
      'Chiles poblanos rellenos de atún colombiano o frijol, acompañados de plátano asado y ensalada.',
    precio: 19800,
    emoji: '🍌',
    color: 'linear-gradient(135deg,#FFD166,#EF476F)',
    badge: '',
    categoria: 'plato',
    antes: 0,
    nutricion: { kcal: 360, proteina: 26, carbohidratos: 30, grasas: 12, azucar: 5 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico', 'deportista'],
    destacado: false,
  },
  {
    slug: 'p6',
    nombre: 'Agua Fresca de Lulo & Limón',
    descripcion: 'Bebida hidratante con lulo colombiano, endulzada con stevia. Sin azúcar, 100% natural.',
    precio: 6500,
    emoji: '🍹',
    color: 'linear-gradient(135deg,#06D6A0,#118AB2)',
    badge: '0g azúcar',
    categoria: 'bebida',
    antes: 0,
    nutricion: { kcal: 25, proteina: 0, carbohidratos: 6, grasas: 0, azucar: 0 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico', 'deportista', 'estudiante'],
    destacado: false,
  },
  {
    slug: 'p7',
    nombre: 'Combo Estudiante',
    descripcion:
      'Criollo Wrap + Agua Fresca de Lulo & Limón. Pensado para rendir en clase sin gastar de más.',
    precio: 17900,
    emoji: '🎒',
    color: 'linear-gradient(135deg,#FFB703,#FB8500)',
    badge: '🎒 Combo',
    categoria: 'combo',
    antes: 22000,
    nutricion: { kcal: 460, proteina: 42, carbohidratos: 44, grasas: 14, azucar: 3 },
    indiceGlicemico: 'bajo',
    perfiles: ['estudiante'],
    destacado: true,
  },
  {
    slug: 'p8',
    nombre: 'Bowl Arepa Azteca',
    descripcion:
      'Arepa asada, frijol negro, pollo grillé, maíz tierno, aguacate y salsa de ají suave. Energía real.',
    precio: 16900,
    emoji: '🥗',
    color: 'linear-gradient(135deg,#2A9D8F,#8AC926)',
    badge: '💪 Post-entreno',
    categoria: 'combo',
    antes: 0,
    nutricion: { kcal: 520, proteina: 35, carbohidratos: 52, grasas: 16, azucar: 4 },
    indiceGlicemico: 'bajo',
    perfiles: ['deportista', 'estudiante'],
    destacado: false,
  },
  {
    slug: 'p9',
    nombre: 'Combo Diabético Control Dulce',
    descripcion:
      'Enfrijolada Costeña + Agua Fresca de Lulo & Limón. Índice glicémico bajo, sin azúcar refinada y con la fibra del fríjol.',
    precio: 19500,
    emoji: '🫘',
    color: 'linear-gradient(135deg,#06D6A0,#2A9D8F)',
    badge: '🩸 Diabético',
    categoria: 'combo',
    antes: 22000,
    nutricion: { kcal: 345, proteina: 19, carbohidratos: 39, grasas: 9, azucar: 4 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico'],
    destacado: false,
  },
  {
    slug: 'p10',
    nombre: 'Combo Deportista Recarga Proteica',
    descripcion:
      'Mole Paisa Ligero + Agua Fresca de Lulo & Limón. 31 g de proteína y carbohidratos complejos para recuperar después del entrenamiento.',
    precio: 24500,
    emoji: '💪',
    color: 'linear-gradient(135deg,#118AB2,#2A9D8F)',
    badge: '💪 Deportista',
    categoria: 'combo',
    antes: 27500,
    nutricion: { kcal: 435, proteina: 31, carbohidratos: 48, grasas: 13, azucar: 4 },
    indiceGlicemico: 'bajo',
    perfiles: ['deportista'],
    destacado: false,
  },
  {
    slug: 'p11',
    nombre: 'Combo Estudiante Almuerzo Rendidor',
    descripcion:
      'Tacos con Sazón + Agua Fresca de Lulo & Limón. Abundante, económico y sin darte sueño para seguir en clase.',
    precio: 16500,
    emoji: '🎒',
    color: 'linear-gradient(135deg,#F4A261,#FFB703)',
    badge: '🎒 Estudiante',
    categoria: 'combo',
    antes: 19000,
    nutricion: { kcal: 425, proteina: 30, carbohidratos: 40, grasas: 15, azucar: 3 },
    indiceGlicemico: 'bajo',
    perfiles: ['estudiante'],
    destacado: false,
  },
  {
    slug: 'p12',
    nombre: 'Combo Bienestar Come Rico',
    descripcion:
      'Chiles Rellenos & Plátano + Agua Fresca de Lulo & Limón. Sabor mexicano-colombiano completo, liviano y sin culpa.',
    precio: 23500,
    emoji: '🍽️',
    color: 'linear-gradient(135deg,#8AC926,#FFC23C)',
    badge: '🥗 Para todos',
    categoria: 'combo',
    antes: 26300,
    nutricion: { kcal: 385, proteina: 26, carbohidratos: 36, grasas: 12, azucar: 5 },
    indiceGlicemico: 'bajo',
    perfiles: ['diabetico', 'deportista'],
    destacado: false,
  },
];

async function sembrar() {
  try {
    await conectarDB();

    /* 1) Los platos: upsert por slug */
    const operaciones = PLATOS.map((plato) => ({
      updateOne: {
        filter: { slug: plato.slug },
        update: { $set: plato },
        upsert: true,
      },
    }));
    const resultado = await Plato.bulkWrite(operaciones);

    /* 2) La cuenta administradora: solo se crea si no existe */
    let adminCreado = false;
    const adminExiste = await Usuario.findOne({ email: config.admin.email });
    if (!adminExiste) {
      await Usuario.create({
        nombre: config.admin.nombre,
        email: config.admin.email,
        password: config.admin.password,
        perfil: 'otro',
        rol: 'admin',
      });
      adminCreado = true;
    }

    console.log('\n✅ Semilla aplicada');
    console.log(`   • Platos nuevos:      ${resultado.upsertedCount}`);
    console.log(`   • Platos actualizados: ${resultado.modifiedCount}`);
    console.log(`   • Total en catálogo:   ${await Plato.countDocuments()}`);
    console.log(`   • Admin: ${config.admin.email} ${adminCreado ? '(creado)' : '(ya existía)'}\n`);
  } catch (error) {
    console.error('❌ Error al sembrar:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

sembrar();
