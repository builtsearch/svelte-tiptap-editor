import type { SvelteComponent } from "svelte";
import type { Editor, JSONContent } from "@tiptap/core";

export type TiptapHandle = {
    getHTML(): string | { error: string };
    getJSON(): JSONContent | { error: string };
    setContent(newContent: string | JSONContent): string | JSONContent | { error: string };
    getEditor(): Editor | null;

    /**
    * Get images from the editor.
    * @param option 
    *  - `"base64"` → return only base64 encoded images  
    *  - `(src: string) => boolean` → custom filter function  
    *  - `undefined` → return all images
    */
    getImages(
        option?: "base64" | ((src: string) => boolean)
    ): Array<object> | { error: string };

    /**
    * Replace an image in the editor by its ID.
     * @param id ID of the image to replace
     * @param src New source URL
     */
    replaceImage(id: string, src: string): { success: true } | { error: string };


    /**
     * Replace multiple images in the editor. 
     * @param arr Array of objects with `id` and `src` properties
     */
    replaceImages(arr: Array<{ id: string; src: string }>): { success: true } | { error: string };

};

// Explicit component typing so `bind:this` has instance methods
export default class Tiptap extends SvelteComponent {
    getHTML: TiptapHandle["getHTML"];
    getJSON: TiptapHandle["getJSON"];
    setContent: TiptapHandle["setContent"];
    getEditor: TiptapHandle["getEditor"];
    getImages: TiptapHandle["getImages"];
    replaceImage: TiptapHandle["replaceImage"];
    replaceImages: TiptapHandle["replaceImages"];
}
