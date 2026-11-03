export type Rect = { x: number; y: number; width: number; height: number };

export interface Template {
    id: string;
    name: string;
    size: { width: number; height: number };
    slots: Rect[];
    textArea: Rect;
    background: {color: string};
    photo: { radius: number};
    text: {font: string; color: string; title: string}
}