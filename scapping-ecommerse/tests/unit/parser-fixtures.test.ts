import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { extractDarazList } from '../../src/scrapers/daraz.js';
import { extractNextData } from '../../src/scrapers/pickaboo.js';
import { parseStartechProducts } from '../../src/scrapers/startech.js';
import { extractReactPacket, findOfferProducts } from '../../src/scrapers/chaldal.js';

const fixturesDir = path.resolve('tests/fixtures');

describe('parser fixtures', () => {
  it('parses daraz ajax payload fixture', () => {
    const payload = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'daraz-sample.json'), 'utf8')
    );
    const items = extractDarazList(payload);
    expect(items).toHaveLength(1);
    expect(items[0].name).toContain('Sample Smartphone');
  });

  it('parses pickaboo __NEXT_DATA__ fixture', () => {
    const nextData = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'pickaboo-next-data.json'), 'utf8')
    );
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script>`;
    const parsed = extractNextData(html);
    const products =
      parsed?.props?.pageProps?.initialState?.productReducer?.bottomCategoryListProducts || [];
    expect(products).toHaveLength(1);
    expect(products[0].slug).toBe('sample-earbuds');
  });

  it('parses startech html fixture', () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'startech-sample.html'), 'utf8');
    const deals = parseStartechProducts(html, 'startech', 'gadgets');
    expect(deals.length).toBeGreaterThan(0);
    expect(deals[0].title).toContain('Sample Laptop');
  });

  it('parses chaldal react packet fixture', () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'chaldal-packet.html'), 'utf8');
    const packet = extractReactPacket(html);
    const offers = findOfferProducts(packet);
    expect(offers.items).toHaveLength(1);
    expect(offers.items[0].Slug).toBe('sample-rice');
  });
});
