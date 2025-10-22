import fs from 'fs';
import path from 'path';
import { processPdf } from '../lib/pdfService';

interface SizeInfo {
  name: string;
  size: number;
}

interface TestResult {
  size: string;
  success: boolean;
  time?: number;
  fileSize?: number;
  error?: string;
}

describe('Pruebas de Carga y Rendimiento', () => {
  const loadTestDir = path.join(process.cwd(), 'tests', 'samples', 'load-test');
  const samplePdfPath = path.join(loadTestDir, 'sample.pdf');
  
  beforeAll(() => {
    if (!fs.existsSync(loadTestDir)) {
      fs.mkdirSync(loadTestDir, { recursive: true });
    }
    
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
    const promises: Promise<string>[] = [];
    
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
    
    const avgTimePerRequest = totalTime / concurrentRequests;
    console.log(`📊 Tiempo promedio por request: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).toBeLessThan(5000);
  });

  it('debe manejar PDFs de diferentes tamaños eficientemente', async () => {
    const sizes: SizeInfo[] = [
      { name: 'pequeño', size: 1024 },
      { name: 'mediano', size: 1024 * 100 },
      { name: 'grande', size: 1024 * 1024 }
    ];
    
    const results: TestResult[] = [];
    
    for (const sizeInfo of sizes) {
      const testPdfPath = path.join(loadTestDir, `test-${sizeInfo.name}.pdf`);
      
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
          error: (error as Error).message
        });
      }
      
      fs.unlinkSync(testPdfPath);
    }
    
    const successful = results.filter(r => r.success);
    expect(successful.length).toBe(sizes.length);
    
    if (successful.length > 1) {
      const smallTime = successful.find(r => r.size === 'pequeño')?.time;
      const largeTime = successful.find(r => r.size === 'grande')?.time;
      
      if (smallTime && largeTime) {
        expect(largeTime / smallTime).toBeLessThan(10);
      }
    }
  });

  it('debe mantener estabilidad bajo carga prolongada', async () => {
    const duration = 30000;
    const requestsPerSecond = 2;
    const totalRequests = Math.floor(duration / 1000) * requestsPerSecond;
    
    let completed = 0;
    let errors = 0;
    const startTime = Date.now();
    
    console.log(`🔄 Iniciando prueba de estabilidad: ${totalRequests} requests en ${duration}ms`);
    
    const executeRequest = async (): Promise<void> => {
      try {
        await processPdf(samplePdfPath);
        completed++;
      } catch (error) {
        errors++;
        console.error('Error en request:', (error as Error).message);
      }
    };
    
    const interval = setInterval(executeRequest, 1000 / requestsPerSecond);
    
    await new Promise<void>(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, duration);
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const totalTime = Date.now() - startTime;
    const successRate = (completed / (completed + errors)) * 100;
    
    console.log(`📊 Resultados estabilidad:`);
    console.log(`   ✅ Completados: ${completed}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📈 Tasa de éxito: ${successRate.toFixed(2)}%`);
    console.log(`   ⏱️  Tiempo total: ${totalTime}ms`);
    
    expect(successRate).toBeGreaterThan(95);
    expect(errors).toBeLessThan(totalRequests * 0.1);
  }, 40000);
});