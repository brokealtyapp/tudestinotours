import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { tours } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { ObjectStorageService } from '../objectStorage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo de imágenes a tours por nombre
const tourImageMapping = [
  {
    tourName: 'Cabo Reinga',
    imagePath: 'attached_assets/generated_images/Cape_Reinga_coastal_cliffs_5586a2c2.png',
  },
  {
    tourName: 'Castillo de Osaka',
    imagePath: 'attached_assets/generated_images/Osaka_Castle_traditional_architecture_bb72785e.png',
  },
  {
    tourName: 'Castillo de Sorrento',
    imagePath: 'attached_assets/generated_images/Sorrento_Amalfi_Coast_views_75b85b08.png',
  },
  {
    tourName: 'Isla Tropical Maldivas',
    imagePath: 'attached_assets/generated_images/Maldives_tropical_island_paradise_5029de19.png',
  },
  {
    tourName: 'Montañas Phi Phi',
    imagePath: 'attached_assets/generated_images/Phi_Phi_limestone_karsts_f919139d.png',
  },
  {
    tourName: 'Playa Escondida Tailandia',
    imagePath: 'attached_assets/generated_images/Krabi_hidden_beach_paradise_170e9763.png',
  },
];

async function uploadTourImages() {
  console.log('🚀 Iniciando carga de imágenes de tours...\n');

  const objectStorageService = new ObjectStorageService();
  let successCount = 0;
  let errorCount = 0;

  for (const mapping of tourImageMapping) {
    try {
      console.log(`📸 Procesando: ${mapping.tourName}`);

      // Buscar el tour en la base de datos
      const [tour] = await db
        .select()
        .from(tours)
        .where(eq(tours.title, mapping.tourName))
        .limit(1);

      if (!tour) {
        console.log(`   ⚠️  Tour "${mapping.tourName}" no encontrado en la base de datos`);
        errorCount++;
        continue;
      }

      // Verificar si el archivo existe
      const imagePath = path.join(process.cwd(), mapping.imagePath);
      if (!fs.existsSync(imagePath)) {
        console.log(`   ❌ Archivo de imagen no encontrado: ${mapping.imagePath}`);
        errorCount++;
        continue;
      }

      // Leer el archivo
      const imageBuffer = fs.readFileSync(imagePath);
      const fileName = path.basename(mapping.imagePath);

      // Subir a Object Storage
      console.log(`   ⬆️  Subiendo imagen a Object Storage...`);
      const publicURL = await objectStorageService.uploadTourImage(fileName, imageBuffer);
      console.log(`   ✅ Imagen subida: ${publicURL}`);

      // Actualizar el tour con la nueva imagen
      const currentImages = tour.images || [];
      const updatedImages = [publicURL, ...currentImages];

      await db
        .update(tours)
        .set({ images: updatedImages })
        .where(eq(tours.id, tour.id));

      console.log(`   ✅ Tour actualizado con la nueva imagen\n`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error procesando ${mapping.tourName}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Éxitos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📝 Total: ${tourImageMapping.length}`);
  
  if (successCount === tourImageMapping.length) {
    console.log('\n🎉 ¡Todas las imágenes fueron subidas exitosamente!');
  }

  process.exit(0);
}

// Ejecutar el script
uploadTourImages().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
