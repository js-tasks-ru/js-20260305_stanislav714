import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

type SortType = 'string' | 'number' | 'custom';

type SubElements = Partial<Record<'header' | 'body' | 'arrow', HTMLElement>>;

export default class SortableTable {
  element: HTMLElement | null = null;
  private subElements: SubElements = {};
  private data: SortableTableData[] = [];
  private sorted: SortableTableSort | null = null;
  private isSortLocally = true;

  constructor(headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
    this.headersConfig = [...headersConfig];
    this.data = [...data];
    this.isSortLocally = isSortLocally;

    const firstSortableColumn = this.headersConfig.find(column => column.sortable);
    this.sorted = sorted ?? (firstSortableColumn
      ? { id: firstSortableColumn.id, order: 'asc' }
      : null);

    this.render();
  }

  private headersConfig: SortableTableHeader[] = [];

  private onHeaderPointerDown = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest<HTMLElement>('.sortable-table__cell');

    if (!headerCell || headerCell.dataset.sortable !== 'true') {
      return;
    }

    const field = headerCell.dataset.id;

    if (!field) {
      return;
    }

    const order: SortOrder = headerCell.dataset.order === 'asc' ? 'desc' : 'asc';
    this.sort(field, order);
  };

  private render(): void {
    this.element = createElement(this.template);
    this.subElements = this.getSubElements(this.element);
    this.addEventListeners();

    if (this.sorted) {
      this.sort(this.sorted.id, this.sorted.order);
    }
  }

  private get template(): string {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getTableHeaderTemplate()}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.getTableBodyTemplate(this.data)}
        </div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
          </div>
        </div>
      </div>
    `;
  }

  private getTableHeaderTemplate(): string {
    return this.headersConfig
      .map(({ id, title, sortable = false }) => {
        const isSortedColumn = this.sorted?.id === id;
        const arrow = isSortedColumn
          ? `
            <span data-element="arrow" class="sortable-table__sort-arrow">
              <span class="sort-arrow"></span>
            </span>
          `
          : '';

        return `
          <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="asc">
            <span>${title}</span>
            ${arrow}
          </div>
        `;
      })
      .join('');
  }

  private getTableBodyTemplate(data: SortableTableData[]): string {
    return data
      .map(item => {
        const cells = this.headersConfig
          .map(({ id, template }) => {
            const cellValue = item[id];

            if (template) {
              return template(cellValue);
            }

            return `<div class="sortable-table__cell">${cellValue ?? ''}</div>`;
          })
          .join('');

        return `
          <a href="/products/${item.id}" class="sortable-table__row">
            ${cells}
          </a>
        `;
      })
      .join('');
  }

  private getSubElements(element: HTMLElement): SubElements {
    const subElements: SubElements = {};
    const elements = element.querySelectorAll<HTMLElement>('[data-element]');

    for (const subElement of elements) {
      const key = subElement.dataset.element as keyof SubElements;
      subElements[key] = subElement;
    }

    return subElements;
  }

  private addEventListeners(): void {
    this.subElements.header?.addEventListener('pointerdown', this.onHeaderPointerDown);
  }

  private removeEventListeners(): void {
    this.subElements.header?.removeEventListener('pointerdown', this.onHeaderPointerDown);
  }

  private updateHeaderSortingState(field: string, order: SortOrder): void {
    const header = this.subElements.header;

    if (!header) {
      return;
    }

    const headerCells = header.querySelectorAll<HTMLElement>('.sortable-table__cell[data-id]');
    const arrow = this.getArrowElement();

    for (const headerCell of headerCells) {
      if (headerCell.dataset.id === field) {
        headerCell.dataset.order = order;
        headerCell.append(arrow);
      } else if (headerCell.dataset.sortable === 'true') {
        headerCell.dataset.order = 'asc';
      }
    }
  }

  private getArrowElement(): HTMLElement {
    const currentArrow = this.element?.querySelector<HTMLElement>('[data-element="arrow"]');

    if (currentArrow) {
      return currentArrow;
    }

    const arrow = createElement(`
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `);

    this.subElements.arrow = arrow;
    return arrow;
  }

  private compareValues(
    firstItem: SortableTableData,
    secondItem: SortableTableData,
    field: string,
    sortType: SortType,
    order: SortOrder,
    customSorting?: (a: SortableTableData, b: SortableTableData) => number
  ): number {
    const direction = order === 'asc' ? 1 : -1;

    if (sortType === 'custom' && customSorting) {
      return direction * customSorting(firstItem, secondItem);
    }

    if (sortType === 'number') {
      return direction * (Number(firstItem[field]) - Number(secondItem[field]));
    }

    return direction * String(firstItem[field]).localeCompare(
      String(secondItem[field]),
      ['ru', 'en'],
      { caseFirst: 'upper' }
    );
  }

  private sortOnClient(field: string, order: SortOrder): void {
    const sortingColumn = this.headersConfig.find(column => column.id === field);
    const body = this.subElements.body;

    if (!sortingColumn?.sortable || !body) {
      return;
    }

    const sortedData = [...this.data].sort((firstItem, secondItem) => {
      return this.compareValues(
        firstItem,
        secondItem,
        field,
        sortingColumn.sortType ?? 'string',
        order,
        sortingColumn.customSorting
      );
    });

    this.data = sortedData;
    this.updateHeaderSortingState(field, order);
    body.innerHTML = this.getTableBodyTemplate(sortedData);
  }

  private sortOnServer(field: string, order: SortOrder): void {
    this.sortOnClient(field, order);
  }

  sort(field: string, order: SortOrder = 'asc'): void {
    this.sorted = { id: field, order };

    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  remove(): void {
    this.element?.remove();
  }

  destroy(): void {
    this.removeEventListeners();
    this.remove();
    this.element = null;
    this.subElements = {};
    this.data = [];
    this.sorted = null;
    this.headersConfig = [];
  }
}
