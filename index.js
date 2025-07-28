
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  try {
    await page.goto('https://auth.afip.gob.ar/contribuyente_/login.xhtml', { waitUntil: 'networkidle2' });
    await page.type('input[name="F1:username"]', '2336985419');
    await page.type('input[name="F1:password"]', 'Jimena2810');
    await Promise.all([
      page.click('input[name="F1:btnSiguiente"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    await page.goto('https://ctacte.cloud.afip.gob.ar/contribuyente/externo', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#formConsulta\:dataTable');

    const deuda = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#formConsulta\\:dataTable tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          periodo: cells[0]?.innerText.trim(),
          impuesto: cells[1]?.innerText.trim(),
          concepto: cells[2]?.innerText.trim(),
          vencimiento: cells[3]?.innerText.trim(),
          monto: cells[4]?.innerText.trim(),
        };
      });
    });

    res.json(deuda);
  } catch (e) {
    res.status(500).send('Error al scrapear ARCA');
  } finally {
    await browser.close();
  }
});

app.listen(process.env.PORT || 3000);
