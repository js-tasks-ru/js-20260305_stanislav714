export default class Tooltip {
  static instance: Tooltip | null = null;

  element: HTMLElement | null = null;
  private activeAnchor: HTMLElement | null = null;
  private readonly offset = 10;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  initialize(): void {
    document.addEventListener('pointerover', this.onPointerOver);
    document.addEventListener('pointerout', this.onPointerOut);
  }

  render(html: string): void {
    this.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = html;

    this.element = tooltip;
    document.body.append(tooltip);
  }

  destroy(): void {
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
    document.removeEventListener('pointermove', this.onPointerMove);

    this.activeAnchor = null;
    this.remove();
    Tooltip.instance = null;
  }

  private onPointerOver = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest<HTMLElement>('[data-tooltip]');

    if (!anchor) {
      return;
    }

    this.activeAnchor = anchor;
    this.render(anchor.dataset.tooltip ?? '');
    document.addEventListener('pointermove', this.onPointerMove);
  };

  private onPointerMove = (event: Event): void => {
    if (!this.element) {
      return;
    }

    const { clientX, clientY } = event as PointerEvent;

    this.element.style.left = `${clientX + this.offset}px`;
    this.element.style.top = `${clientY + this.offset}px`;
  };

  private onPointerOut = (event: Event): void => {
    if (!this.activeAnchor) {
      this.remove();
      return;
    }

    const relatedTarget = (event as PointerEvent).relatedTarget as Node | null;

    if (relatedTarget && this.activeAnchor.contains(relatedTarget)) {
      return;
    }

    this.activeAnchor = null;
    this.remove();
  };

  private remove(): void {
    this.element?.remove();
    this.element = null;
    document.removeEventListener('pointermove', this.onPointerMove);
  }

}
