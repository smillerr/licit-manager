import fs from 'fs';
import path from 'path';
import { processPdf } from '../../lib/pdfService';

describe('Pruebas de Carga y Rendimiento', () => {
  const loadTestDir = path.join(process.cwd(), 'tests', 'samples', 'load-test');
  const samplePdfPath = path.join(loadTestDir, 'sample.pdf');
  
  beforeAll(() => {
    if (!fs.existsSync(loadTestDir)) {
      fs.mkdirSync(loadTestDir, { recursive: true });
    }
    
    // Crear PDF de muestra para pruebas de carga
    const pdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>\nendobj\n' +
      '4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Documento de Prueba de Carga) Tj ET\nendstream\nendobj\n' +
      'xref\ntrailer\n<< /Root 1 0 R >>\nstartxref\n100\n%%EOF'
    );
    
    fs.writeFileSync(samplePdfPath, pdfContent);
  });

  it('debe procesar múltiples PDFs concurrentemente', async () => {
    const concurrentRequests = 5;
    const promises = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(processPdf(samplePdfPath));
    }
    
    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️  Tiempo total para ${concurrentRequests} requests: ${totalTime}ms`);
    
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful.length).toBe(concurrentRequests);
    expect(failed.length).toBe(0);
    
    // Verificar que el tiempo por request es razonable
    const avgTimePerRequest = totalTime / concurrentRequests;
    console.log(`📊 Tiempo promedio por request: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).toBeLessThan(5000); // Menos de 5 segundos por request
  });

  it('debe manejar PDFs de diferentes tamaños eficientemente', async () => {
    const sizes = [
      { name: 'pequeño', size: 1024 },      // 1KB
      { name: 'mediano', size: 1024 * 100 }, // 100KB  
      { name: 'grande', size: 1024 * 1024 }  // 1MB
    ];
    
    const results = [];
    
    for (const sizeInfo of sizes) {
      const testPdfPath = path.join(loadTestDir, `test-${sizeInfo.name}.pdf`);
      
      // Crear PDF del tamaño especificado
      const content = Buffer.from('%PDF-1.4\n' + 'x'.repeat(sizeInfo.size));
      fs.writeFileSync(testPdfPath, content);
      
      const startTime = Date.now();
      try {
        await processPdf(testPdfPath);
        const processingTime = Date.now() - startTime;
        
        results.push({
          size: sizeInfo.name,
          success: true,
          time: processingTime,
          fileSize: sizeInfo.size
        });
        
        console.log(`✅ PDF ${sizeInfo.name} (${sizeInfo.size} bytes): ${processingTime}ms`);
      } catch (error) {
        results.push({
          size: sizeInfo.name,
          success: false,
          error: error.message
        });
      }
      
      // Limpiar
      fs.unlinkSync(testPdfPath);
    }
    
    // Validar que todos fueron exitosos
    const successful = results.filter(r => r.success);
    expect(successful.length).toBe(sizes.length);
    
    // Validar que el tiempo de procesamiento escala razonablemente
    if (successful.length > 1) {
      const smallTime = successful.find(r => r.size === 'pequeño').time;
      const largeTime = successful.find(r => r.size === 'grande').time;
      
      // El tiempo para PDF grande no debería ser órdenes de magnitud mayor
      expect(largeTime / smallTime).toBeLessThan(10); // Máximo 10x más lento
    }
  });

  it('debe mantener estabilidad bajo carga prolongada', async () => {
    const duration = 30000; // 30 segundos
    const requestsPerSecond = 2;
    const totalRequests = Math.floor(duration / 1000) * requestsPerSecond;
    
    let completed = 0;
    let errors = 0;
    const startTime = Date.now();
    
    console.log(`🔄 Iniciando prueba de estabilidad: ${totalRequests} requests en ${duration}ms`);
    
    const executeRequest = async () => {
      try {
        await processPdf(samplePdfPath);
        completed++;
      } catch (error) {
        errors++;
        console.error('Error en request:', error.message);
      }
    };
    
    // Ejecutar requests de forma distribuida
    const interval = setInterval(executeRequest, 1000 / requestsPerSecond);
    
    // Detener después de la duración especificada
    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, duration);
    });
    
    // Esperar a que terminen las requests pendientes
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const totalTime = Date.now() - startTime;
    const successRate = (completed / (completed + errors)) * 100;
    
    console.log(`📊 Resultados estabilidad:`);
    console.log(`   ✅ Completados: ${completed}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📈 Tasa de éxito: ${successRate.toFixed(2)}%`);
    console.log(`   ⏱️  Tiempo total: ${totalTime}ms`);
    
    expect(successRate).toBeGreaterThan(95); // 95% de éxito mínimo
    expect(errors).toBeLessThan(totalRequests * 0.1); // Menos del 10% de errores
  }, 40000); // Timeout extendido para prueba de estabilidad
});