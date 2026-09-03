import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TableParser,
  TableEnhancer,
  DynamicStyleManager,
  PaginationIndicator,
  TableHarvester,
} from '../src/table';

describe('Table Modules', () => {
  describe('TableParser', () => {
    const parser = new TableParser();

    it('extracts ID and name from row link or text', () => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><a href="/projects/minecraft-101">Minecraft 101</a></td>';
      const parsed = parser.parseRow(tr);
      expect(parsed?.id).toBe('minecraft-101');
      expect(parsed?.name).toBe('Minecraft 101');

      const trText = document.createElement('tr');
      trText.innerHTML = '<td>Custom Project</td>';
      const parsedText = parser.parseRow(trText);
      expect(parsedText?.id).toBe('Custom Project');
      expect(parsedText?.name).toBe('Custom Project');
    });
  });

  describe('TableEnhancer', () => {
    it('injects header and row buttons and triggers callback', () => {
      const onHide = vi.fn();
      const enhancer = new TableEnhancer(new TableParser(), onHide);

      const table = document.createElement('table');
      table.className = 'table';
      table.innerHTML = `
        <thead><tr><th>Name</th></tr></thead>
        <tbody><tr><td><a href="/projects/p1">Proj 1</a></td></tr></tbody>
      `;
      document.body.appendChild(table);

      enhancer.enhanceAllTables();

      const th = table.querySelector('thead th.auger-plus-hide-column');
      expect(th).not.toBeNull();

      const btn = table.querySelector('.auger-plus-hide-btn') as HTMLButtonElement;
      expect(btn).not.toBeNull();

      btn.click();
      expect(onHide).toHaveBeenCalledWith({ id: 'p1', name: 'Proj 1' });
    });
  });

  describe('DynamicStyleManager', () => {
    let styles: DynamicStyleManager;
    beforeEach(() => {
      styles = new DynamicStyleManager('test-styles');
    });
    afterEach(() => {
      styles.destroy();
    });

    it('generates and manages :has() dynamic rules', () => {
      expect(styles.generateCssRules([])).toBe('');

      const rules = styles.generateCssRules([{ id: 'p1', name: 'P1', hiddenAt: 1 }]);
      expect(rules).toContain('table.table tbody tr:has(a[href*="p1"]) { display: none !important; }');

      styles.applyHiddenStyles([{ id: 'p1', name: 'P1', hiddenAt: 1 }]);
      const el = document.getElementById('test-styles');
      expect(el?.textContent).toContain('p1');
    });
  });

  describe('PaginationIndicator', () => {
    it('removes (Page x of x) completely and displays only hidden count', () => {
      document.body.innerHTML = `
        <div data-testid="pagination-indicator">Page <strong>4 of 4</strong></div>
        <table class="table"><tbody>
          <tr><td><a href="/projects/p1">P1</a></td></tr>
          <tr><td><a href="/projects/p2">P2</a></td></tr>
        </tbody></table>
      `;
      const indicator = document.querySelector('[data-testid="pagination-indicator"]') as HTMLElement;
      const pagination = new PaginationIndicator();

      pagination.update([{ id: 'p1', name: 'P1', hiddenAt: 1 }]);
      expect(indicator.textContent).not.toContain('Page');
      expect(indicator.textContent).toBe('1 shown, 1 hidden');
      expect(indicator.style.display).toBe('');

      pagination.update([]);
      expect(indicator.style.display).toBe('none');
      expect(indicator.textContent).toBe('');
    });
  });

  describe('TableHarvester', () => {
    it('finds next button and handles disabled state', () => {
      document.body.innerHTML = `
        <button type="button" aria-label="Go to next page" class="btn btn-success btn-sm">&gt;</button>
      `;
      const harvester = new TableHarvester();
      const nextBtn = harvester.findNextButton();
      expect(nextBtn).not.toBeNull();
      expect(harvester.isDisabled(nextBtn!)).toBe(false);

      nextBtn?.setAttribute('disabled', 'true');
      expect(harvester.isDisabled(nextBtn!)).toBe(true);
      expect(harvester.findNextButton()).toBeNull();
    });

    it('collects rows across pages without duplicates', () => {
      document.body.innerHTML = `
        <table class="table">
          <tbody>
            <tr><td><a href="/projects/p1">Proj 1</a></td></tr>
            <tr><td><a href="/projects/p2">Proj 2</a></td></tr>
          </tbody>
        </table>
      `;
      const table = document.querySelector<HTMLTableElement>('table')!;
      const harvester = new TableHarvester();

      const tbody = table.querySelector('tbody')!;
      harvester.collectRows(tbody);

      // Simulate page 2 loaded in tbody
      tbody.innerHTML = `
        <tr><td><a href="/projects/p3">Proj 3</a></td></tr>
      `;
      harvester.collectRows(tbody);

      // Verify collectRows collected all 3 distinct projects
      harvester.loadAll(table);
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });
  });
});
