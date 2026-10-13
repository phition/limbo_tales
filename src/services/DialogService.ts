export type DialogTone = 'primary' | 'danger' | 'warning' | 'info';

export interface DialogOptions {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: DialogTone;
  isConfirm?: boolean;
}

type DialogListener = (dialog: (DialogOptions & { id: number; resolve: (result: boolean) => void }) | null) => void;

class DialogService {
  private static instance: DialogService;
  private listeners: Set<DialogListener> = new Set();
  private currentDialog: (DialogOptions & { id: number; resolve: (result: boolean) => void }) | null = null;
  private dialogCounter = 0;

  private constructor() {}

  public static getInstance(): DialogService {
    if (!DialogService.instance) {
      DialogService.instance = new DialogService();
    }
    return DialogService.instance;
  }

  public subscribe(listener: DialogListener): () => void {
    this.listeners.add(listener);
    listener(this.currentDialog);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentDialog);
    }
  }

  public alert(options: Omit<DialogOptions, 'isConfirm' | 'cancelText'>): Promise<void> {
    return new Promise((resolve) => {
      this.dialogCounter++;
      this.currentDialog = {
        ...options,
        isConfirm: false,
        confirmText: options.confirmText || '확인',
        id: this.dialogCounter,
        resolve: () => {
          this.currentDialog = null;
          this.notify();
          resolve();
        },
      };
      this.notify();
    });
  }

  public confirm(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogCounter++;
      this.currentDialog = {
        ...options,
        isConfirm: true,
        confirmText: options.confirmText || '확인',
        cancelText: options.cancelText || '취소',
        id: this.dialogCounter,
        resolve: (result: boolean) => {
          this.currentDialog = null;
          this.notify();
          resolve(result);
        },
      };
      this.notify();
    });
  }
}

export const gameDialog = DialogService.getInstance();

export const gameAlert = (options: { title?: string; message: string; icon?: string; confirmText?: string; tone?: DialogTone } | string): Promise<void> => {
  if (typeof options === 'string') {
    return gameDialog.alert({
      title: '안내',
      message: options,
      icon: '📜',
    });
  }
  return gameDialog.alert({
    title: options.title || '안내',
    message: options.message,
    icon: options.icon || '📜',
    confirmText: options.confirmText,
    tone: options.tone || 'primary',
  });
};

export const gameConfirm = (options: { title?: string; message: string; icon?: string; confirmText?: string; cancelText?: string; tone?: DialogTone } | string): Promise<boolean> => {
  if (typeof options === 'string') {
    return gameDialog.confirm({
      title: '확인',
      message: options,
      icon: '❓',
    });
  }
  return gameDialog.confirm({
    title: options.title || '확인',
    message: options.message,
    icon: options.icon || '❓',
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    tone: options.tone || 'primary',
  });
};
