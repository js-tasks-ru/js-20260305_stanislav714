import { createElement } from "../../shared/utils/create-element";

interface MessageOptions {
  duration: number;
  type: 'success' | 'error';
}

type Options = Partial<MessageOptions>;
const DEFAULT_OPTIONS: MessageOptions = {
  duration: 2000,
  type: 'success',
};

export default class NotificationMessage {
  static activeNotification: NotificationMessage | null = null;

  element!: HTMLElement;
  private config: MessageOptions;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private message: string, options: Options = {}) {
    this.config = { ...DEFAULT_OPTIONS, ...options };
    this.render();
  }

  private render(): void {
    this.element = createElement(this.template);
  }

  private get template(): string {
    const { duration, type } = this.config;

    return `
      <div class="notification ${type}" style="--value:${duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;
  }

  private clearTimer(): void {
    if (!this.timeoutId) {
      return;
    }

    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  show(target: HTMLElement = document.body): void {
    if (NotificationMessage.activeNotification && NotificationMessage.activeNotification !== this) {
      NotificationMessage.activeNotification.destroy();
    }

    NotificationMessage.activeNotification = this;
    target.append(this.element);

    this.clearTimer();
    this.timeoutId = setTimeout(() => this.remove(), this.config.duration);
  }

  remove(): void {
    this.clearTimer();
    this.element.remove();

    if (NotificationMessage.activeNotification === this) {
      NotificationMessage.activeNotification = null;
    }
  }

  destroy(): void {
    this.remove();
  }
}
